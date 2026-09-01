-- ==============================================================================
-- SEEP 4.0 Live Startup Auction Platform — 02_rpcs.sql
-- Database: PostgreSQL 15+ (Supabase)
-- ==============================================================================

-- Helper Function: Check if the calling user is an active admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
      AND role = 'admin' 
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 1. place_bid RPC: Atomic validation, row locking, wallet escrow, and event recording
CREATE OR REPLACE FUNCTION place_bid(
  p_startup_id      UUID,
  p_amount          NUMERIC(14,2),
  p_idempotency_key TEXT
) 
RETURNS JSONB AS $$
DECLARE
  v_bidder_id        UUID := auth.uid();
  v_session          auction_sessions%ROWTYPE;
  v_startup          startups%ROWTYPE;
  v_wallet           bidder_wallets%ROWTYPE;
  v_prev_bidder_id   UUID;
  v_prev_bid_amount  NUMERIC(14,2);
  v_new_bid_id       UUID;
  v_is_valid_inc     BOOLEAN := false;
  v_inc              NUMERIC(14,2);
  v_diff             NUMERIC(14,2);
BEGIN
  -- 1. Idempotency Check
  IF EXISTS (SELECT 1 FROM bids WHERE idempotency_key = p_idempotency_key) THEN
    SELECT id INTO v_new_bid_id FROM bids WHERE idempotency_key = p_idempotency_key;
    RETURN jsonb_build_object(
      'success', true, 
      'idempotent', true, 
      'bid_id', v_new_bid_id, 
      'message', 'Bid previously processed'
    );
  END IF;

  -- 2. Validate Caller
  IF v_bidder_id IS NULL THEN
    RAISE EXCEPTION 'ERR_UNAUTHORIZED: Authentication required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_bidder_id AND is_active = true) THEN
    RAISE EXCEPTION 'ERR_ACCOUNT_DISABLED: Account is inactive or revoked';
  END IF;

  -- 3. Lock Startup Row FOR UPDATE
  SELECT * INTO v_startup FROM startups WHERE id = p_startup_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ERR_STARTUP_NOT_FOUND: Invalid startup ID';
  END IF;

  IF v_startup.status <> 'ACTIVE_BIDDING' THEN
    RAISE EXCEPTION 'ERR_AUCTION_NOT_ACTIVE: Bidding is closed or paused for this startup';
  END IF;

  -- 4. Prevent self-outbidding
  IF v_startup.current_highest_bidder_id = v_bidder_id THEN
    RAISE EXCEPTION 'ERR_ALREADY_HIGHEST_BIDDER: You currently hold the highest bid';
  END IF;

  -- 5. Fetch Session Rules
  SELECT * INTO v_session FROM auction_sessions WHERE id = v_startup.session_id;
  IF v_session.status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'ERR_SESSION_NOT_ACTIVE: The event session is currently paused or inactive';
  END IF;

  -- 6. Bid Amount & Increment Validation
  IF v_startup.current_highest_bid IS NULL THEN
    -- Opening bid must be >= base_price
    IF p_amount < v_startup.base_price THEN
      RAISE EXCEPTION 'ERR_BELOW_BASE_PRICE: Opening bid must be at least ₹%', v_startup.base_price;
    END IF;
    -- Opening bid must equal base_price OR base_price + increment
    IF p_amount = v_startup.base_price THEN
      v_is_valid_inc := true;
    ELSE
      v_diff := p_amount - v_startup.base_price;
      FOREACH v_inc IN ARRAY v_session.bid_increments LOOP
        IF v_diff = v_inc THEN v_is_valid_inc := true; EXIT; END IF;
      END LOOP;
    END IF;
  ELSE
    -- Subsequent bids must strictly exceed highest bid by one of the configured increments
    IF p_amount <= v_startup.current_highest_bid THEN
      RAISE EXCEPTION 'ERR_BID_NOT_HIGHER: Bid must be strictly greater than current bid ₹%', v_startup.current_highest_bid;
    END IF;
    v_diff := p_amount - v_startup.current_highest_bid;
    FOREACH v_inc IN ARRAY v_session.bid_increments LOOP
      IF v_diff = v_inc THEN v_is_valid_inc := true; EXIT; END IF;
    END LOOP;
  END IF;

  IF NOT v_is_valid_inc THEN
    RAISE EXCEPTION 'ERR_INVALID_INCREMENT: Bid amount ₹% does not match valid increment rules', p_amount;
  END IF;

  -- 7. Lock Caller Wallet FOR UPDATE & Verify Balance
  SELECT * INTO v_wallet FROM bidder_wallets WHERE team_id = v_bidder_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ERR_WALLET_NOT_FOUND: Bidder wallet does not exist';
  END IF;

  IF v_wallet.available_balance < p_amount THEN
    RAISE EXCEPTION 'ERR_INSUFFICIENT_FUNDS: Available purse ₹% is insufficient for bid of ₹%', 
      v_wallet.available_balance, p_amount;
  END IF;

  -- 8. Atomic Outbid & Release Previous Leader's Escrow
  v_prev_bidder_id := v_startup.current_highest_bidder_id;
  v_prev_bid_amount := v_startup.current_highest_bid;

  IF v_prev_bidder_id IS NOT NULL THEN
    -- Mark previous highest bid as OUTBID
    UPDATE bids 
    SET status = 'OUTBID' 
    WHERE startup_id = p_startup_id AND status = 'WINNING';

    -- Release previous hold and refund available balance
    UPDATE fund_holds 
    SET status = 'RELEASED', released_at = NOW() 
    WHERE startup_id = p_startup_id AND bidder_id = v_prev_bidder_id AND status = 'HELD';

    UPDATE bidder_wallets 
    SET locked_balance = locked_balance - v_prev_bid_amount,
        available_balance = available_balance + v_prev_bid_amount,
        updated_at = NOW()
    WHERE team_id = v_prev_bidder_id;

    -- Record OUTBID event
    INSERT INTO auction_events (session_id, startup_id, event_type, actor_id, target_id, payload)
    VALUES (v_session.id, p_startup_id, 'BID_OUTBID', v_bidder_id, v_prev_bidder_id, 
      jsonb_build_object('outbid_amount', v_prev_bid_amount, 'new_amount', p_amount));
  END IF;

  -- 9. Insert New WINNING Bid
  INSERT INTO bids (startup_id, bidder_id, amount, status, idempotency_key)
  VALUES (p_startup_id, v_bidder_id, p_amount, 'WINNING', p_idempotency_key)
  RETURNING id INTO v_new_bid_id;

  -- 10. Escrow Hold on New Bidder's Wallet
  INSERT INTO fund_holds (startup_id, bidder_id, bid_id, amount, status)
  VALUES (p_startup_id, v_bidder_id, v_new_bid_id, p_amount, 'HELD');

  UPDATE bidder_wallets 
  SET available_balance = available_balance - p_amount,
      locked_balance = locked_balance + p_amount,
      updated_at = NOW()
  WHERE team_id = v_bidder_id;

  -- 11. Update Startup Highest Bid Details
  UPDATE startups 
  SET current_highest_bid = p_amount,
      current_highest_bidder_id = v_bidder_id,
      updated_at = NOW()
  WHERE id = p_startup_id;

  -- 12. Record BID_PLACED Audit Event
  INSERT INTO auction_events (session_id, startup_id, event_type, actor_id, target_id, payload)
  VALUES (v_session.id, p_startup_id, 'BID_PLACED', v_bidder_id, v_bidder_id, 
    jsonb_build_object('bid_id', v_new_bid_id, 'amount', p_amount, 'startup_id', p_startup_id));

  RETURN jsonb_build_object(
    'success', true,
    'bid_id', v_new_bid_id,
    'startup_id', p_startup_id,
    'amount', p_amount,
    'bidder_id', v_bidder_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. close_auction RPC: Authoritative Settlement & State Finalization
CREATE OR REPLACE FUNCTION close_auction(p_startup_id UUID) 
RETURNS JSONB AS $$
DECLARE
  v_admin_id       UUID := auth.uid();
  v_startup        startups%ROWTYPE;
  v_winning_bid    bids%ROWTYPE;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'ERR_FORBIDDEN: Admin privileges required';
  END IF;

  SELECT * INTO v_startup FROM startups WHERE id = p_startup_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ERR_STARTUP_NOT_FOUND: Invalid startup ID';
  END IF;

  IF v_startup.status NOT IN ('ACTIVE_BIDDING', 'PAUSED') THEN
    RAISE EXCEPTION 'ERR_INVALID_STATE: Auction is already %', v_startup.status;
  END IF;

  -- Check for winning bid
  SELECT * INTO v_winning_bid FROM bids 
  WHERE startup_id = p_startup_id AND status = 'WINNING'
  LIMIT 1;

  IF NOT FOUND THEN
    -- UNSOLD Scenario
    UPDATE startups 
    SET status = 'UNSOLD', 
        closed_at = NOW(), 
        updated_at = NOW()
    WHERE id = p_startup_id;

    INSERT INTO auction_events (session_id, startup_id, event_type, actor_id, payload)
    VALUES (v_startup.session_id, p_startup_id, 'AUCTION_CLOSED_UNSOLD', v_admin_id, '{}');

    RETURN jsonb_build_object('success', true, 'status', 'UNSOLD');
  ELSE
    -- SOLD Scenario
    -- 1. Settle Bid
    UPDATE bids SET status = 'SETTLED' WHERE id = v_winning_bid.id;

    -- 2. Settle Fund Hold
    UPDATE fund_holds 
    SET status = 'SETTLED', settled_at = NOW() 
    WHERE bid_id = v_winning_bid.id AND status = 'HELD';

    -- 3. Settle Wallet: locked -> total_spent
    UPDATE bidder_wallets 
    SET locked_balance = locked_balance - v_winning_bid.amount,
        total_spent = total_spent + v_winning_bid.amount,
        updated_at = NOW()
    WHERE team_id = v_winning_bid.bidder_id;

    -- 4. Mark Startup SOLD
    UPDATE startups 
    SET status = 'SOLD',
        winner_team_id = v_winning_bid.bidder_id,
        winning_bid_amount = v_winning_bid.amount,
        closed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_startup_id;

    -- 5. Credit Startup Account
    INSERT INTO startup_accounts (startup_id, received_amount, settled_at, winning_bid_id)
    VALUES (p_startup_id, v_winning_bid.amount, NOW(), v_winning_bid.id)
    ON CONFLICT (startup_id) DO UPDATE 
    SET received_amount = EXCLUDED.received_amount,
        settled_at = NOW(),
        winning_bid_id = EXCLUDED.winning_bid_id;

    -- 6. Record Settlement Events
    INSERT INTO auction_events (session_id, startup_id, event_type, actor_id, target_id, payload)
    VALUES (v_startup.session_id, p_startup_id, 'AUCTION_CLOSED_SOLD', v_admin_id, v_winning_bid.bidder_id,
      jsonb_build_object('amount', v_winning_bid.amount, 'winner_id', v_winning_bid.bidder_id));

    RETURN jsonb_build_object(
      'success', true, 
      'status', 'SOLD', 
      'winner_team_id', v_winning_bid.bidder_id, 
      'winning_amount', v_winning_bid.amount
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. void_bid RPC: Cancel a bid mid-auction and re-establish top bidder
CREATE OR REPLACE FUNCTION void_bid(p_bid_id UUID, p_reason TEXT)
RETURNS JSONB AS $$
DECLARE
  v_admin_id      UUID := auth.uid();
  v_target_bid    bids%ROWTYPE;
  v_startup       startups%ROWTYPE;
  v_next_bid      bids%ROWTYPE;
  v_next_wallet   bidder_wallets%ROWTYPE;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'ERR_FORBIDDEN: Admin privileges required';
  END IF;

  SELECT * INTO v_target_bid FROM bids WHERE id = p_bid_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ERR_BID_NOT_FOUND: Bid ID does not exist';
  END IF;

  IF v_target_bid.status IN ('SETTLED', 'VOID') THEN
    RAISE EXCEPTION 'ERR_CANNOT_VOID: Cannot void bid with status %', v_target_bid.status;
  END IF;

  SELECT * INTO v_startup FROM startups WHERE id = v_target_bid.startup_id FOR UPDATE;

  -- 1. Void Target Bid
  UPDATE bids 
  SET status = 'VOID', voided_at = NOW(), voided_by = v_admin_id, void_reason = p_reason 
  WHERE id = p_bid_id;

  -- 2. Release any active hold for this bidder on this lot
  UPDATE fund_holds 
  SET status = 'RELEASED', released_at = NOW() 
  WHERE bid_id = p_bid_id AND status = 'HELD';

  UPDATE bidder_wallets 
  SET locked_balance = locked_balance - v_target_bid.amount,
      available_balance = available_balance + v_target_bid.amount,
      updated_at = NOW()
  WHERE team_id = v_target_bid.bidder_id;

  -- 3. If target was the current WINNING bid, restore the previous highest valid bid
  IF v_target_bid.status = 'WINNING' THEN
    SELECT * INTO v_next_bid 
    FROM bids 
    WHERE startup_id = v_startup.id AND status = 'OUTBID' 
    ORDER BY amount DESC, server_seq DESC 
    LIMIT 1 
    FOR UPDATE;

    IF FOUND THEN
      -- Lock next bidder's funds back
      SELECT * INTO v_next_wallet FROM bidder_wallets WHERE team_id = v_next_bid.bidder_id FOR UPDATE;
      IF v_next_wallet.available_balance >= v_next_bid.amount THEN
        UPDATE bidder_wallets 
        SET available_balance = available_balance - v_next_bid.amount,
            locked_balance = locked_balance + v_next_bid.amount,
            updated_at = NOW()
        WHERE team_id = v_next_bid.bidder_id;

        INSERT INTO fund_holds (startup_id, bidder_id, bid_id, amount, status)
        VALUES (v_startup.id, v_next_bid.bidder_id, v_next_bid.id, v_next_bid.amount, 'HELD');

        UPDATE bids SET status = 'WINNING' WHERE id = v_next_bid.id;

        UPDATE startups 
        SET current_highest_bid = v_next_bid.amount,
            current_highest_bidder_id = v_next_bid.bidder_id,
            updated_at = NOW()
        WHERE id = v_startup.id;
      ELSE
        -- Fallback: next bidder lacks funds, reset to NULL
        UPDATE startups 
        SET current_highest_bid = NULL,
            current_highest_bidder_id = NULL,
            updated_at = NOW()
        WHERE id = v_startup.id;
      END IF;
    ELSE
      -- No bids remain
      UPDATE startups 
      SET current_highest_bid = NULL,
          current_highest_bidder_id = NULL,
          updated_at = NOW()
      WHERE id = v_startup.id;
    END IF;
  END IF;

  INSERT INTO auction_events (session_id, startup_id, event_type, actor_id, target_id, payload)
  VALUES (v_startup.session_id, v_startup.id, 'BID_VOIDED', v_admin_id, v_target_bid.bidder_id,
    jsonb_build_object('bid_id', p_bid_id, 'reason', p_reason, 'amount', v_target_bid.amount));

  RETURN jsonb_build_object('success', true, 'voided_bid_id', p_bid_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. reopen_auction RPC: Reverses settlement and returns startup to active bidding
CREATE OR REPLACE FUNCTION reopen_auction(p_startup_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_admin_id    UUID := auth.uid();
  v_startup     startups%ROWTYPE;
  v_winning_bid bids%ROWTYPE;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'ERR_FORBIDDEN: Admin privileges required';
  END IF;

  SELECT * INTO v_startup FROM startups WHERE id = p_startup_id FOR UPDATE;
  IF v_startup.status NOT IN ('SOLD', 'UNSOLD') THEN
    RAISE EXCEPTION 'ERR_CANNOT_REOPEN: Startup status is %', v_startup.status;
  END IF;

  IF v_startup.status = 'SOLD' THEN
    SELECT * INTO v_winning_bid FROM bids 
    WHERE startup_id = p_startup_id AND status = 'SETTLED' 
    ORDER BY server_seq DESC LIMIT 1 FOR UPDATE;

    IF FOUND THEN
      -- Reverse wallet settlement: total_spent -> locked_balance
      UPDATE bidder_wallets 
      SET total_spent = total_spent - v_winning_bid.amount,
          locked_balance = locked_balance + v_winning_bid.amount,
          updated_at = NOW()
      WHERE team_id = v_winning_bid.bidder_id;

      -- Re-hold fund hold
      UPDATE fund_holds 
      SET status = 'HELD', settled_at = NULL 
      WHERE bid_id = v_winning_bid.id;

      -- Revert bid status
      UPDATE bids SET status = 'WINNING' WHERE id = v_winning_bid.id;
    END IF;

    -- Reset startup account
    UPDATE startup_accounts 
    SET received_amount = 0, settled_at = NULL, winning_bid_id = NULL 
    WHERE startup_id = p_startup_id;
  END IF;

  -- Reopen startup to ACTIVE_BIDDING
  UPDATE startups 
  SET status = 'ACTIVE_BIDDING',
      winner_team_id = NULL,
      winning_bid_amount = NULL,
      closed_at = NULL,
      updated_at = NOW()
  WHERE id = p_startup_id;

  INSERT INTO auction_events (session_id, startup_id, event_type, actor_id, payload)
  VALUES (v_startup.session_id, p_startup_id, 'AUCTION_REOPENED', v_admin_id, '{}');

  RETURN jsonb_build_object('success', true, 'status', 'ACTIVE_BIDDING');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. set_startup_status RPC: Handles transitions (UPCOMING -> PRESENTING -> ACTIVE_BIDDING -> PAUSED)
CREATE OR REPLACE FUNCTION set_startup_status(
  p_startup_id UUID, 
  p_status     startup_status
)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_startup  startups%ROWTYPE;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'ERR_FORBIDDEN: Admin privileges required';
  END IF;

  SELECT * INTO v_startup FROM startups WHERE id = p_startup_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ERR_STARTUP_NOT_FOUND: Invalid startup ID';
  END IF;

  -- Update startup status and relevant timestamps
  UPDATE startups 
  SET status = p_status,
      started_presenting_at = CASE WHEN p_status = 'PRESENTING' AND started_presenting_at IS NULL THEN NOW() ELSE started_presenting_at END,
      bidding_started_at = CASE WHEN p_status = 'ACTIVE_BIDDING' AND bidding_started_at IS NULL THEN NOW() ELSE bidding_started_at END,
      paused_at = CASE WHEN p_status = 'PAUSED' THEN NOW() ELSE paused_at END,
      updated_at = NOW()
  WHERE id = p_startup_id;

  -- If presenting or active bidding, set as session active_startup_id
  IF p_status IN ('PRESENTING', 'ACTIVE_BIDDING', 'PAUSED') THEN
    UPDATE auction_sessions 
    SET active_startup_id = p_startup_id,
        status = 'ACTIVE'
    WHERE id = v_startup.session_id;
  END IF;

  INSERT INTO auction_events (session_id, startup_id, event_type, actor_id, payload)
  VALUES (v_startup.session_id, p_startup_id, 'STARTUP_STATUS_CHANGED', v_admin_id, 
    jsonb_build_object('old_status', v_startup.status, 'new_status', p_status));

  RETURN jsonb_build_object('success', true, 'status', p_status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. initialize_session_wallets RPC
CREATE OR REPLACE FUNCTION initialize_session_wallets(p_session_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_session  auction_sessions%ROWTYPE;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'ERR_FORBIDDEN: Admin privileges required';
  END IF;

  SELECT * INTO v_session FROM auction_sessions WHERE id = p_session_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ERR_SESSION_NOT_FOUND: Invalid session ID';
  END IF;

  -- Upsert wallets for all active bidders
  INSERT INTO bidder_wallets (team_id, initial_balance, available_balance, locked_balance, total_spent)
  SELECT id, v_session.initial_purse_amount, v_session.initial_purse_amount, 0, 0
  FROM profiles 
  WHERE role = 'bidder'
  ON CONFLICT (team_id) DO UPDATE 
  SET initial_balance = EXCLUDED.initial_balance,
      available_balance = EXCLUDED.available_balance,
      locked_balance = 0,
      total_spent = 0,
      updated_at = NOW();

  UPDATE auction_sessions SET wallets_initialized = true WHERE id = p_session_id;

  INSERT INTO auction_events (session_id, event_type, actor_id, payload)
  VALUES (p_session_id, 'WALLETS_INITIALIZED', v_admin_id, 
    jsonb_build_object('initial_purse', v_session.initial_purse_amount));

  RETURN jsonb_build_object('success', true, 'initialized_amount', v_session.initial_purse_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. force_logout_bidder RPC
CREATE OR REPLACE FUNCTION force_logout_bidder(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_new_version INTEGER;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'ERR_FORBIDDEN: Admin privileges required';
  END IF;

  UPDATE profiles 
  SET session_version = session_version + 1,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING session_version INTO v_new_version;

  INSERT INTO account_activity_logs (user_id, event_type, metadata)
  VALUES (p_user_id, 'FORCE_LOGOUT', jsonb_build_object('initiated_by', v_admin_id));

  RETURN jsonb_build_object('success', true, 'user_id', p_user_id, 'session_version', v_new_version);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. emergency_pause_session RPC
CREATE OR REPLACE FUNCTION emergency_pause_session(p_session_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'ERR_FORBIDDEN: Admin privileges required';
  END IF;

  UPDATE auction_sessions SET status = 'PAUSED' WHERE id = p_session_id;
  UPDATE startups SET status = 'PAUSED', paused_at = NOW() 
  WHERE session_id = p_session_id AND status = 'ACTIVE_BIDDING';

  INSERT INTO auction_events (session_id, event_type, actor_id, payload)
  VALUES (p_session_id, 'EMERGENCY_PAUSE', v_admin_id, '{}');

  RETURN jsonb_build_object('success', true, 'status', 'PAUSED');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. emergency_resume_session RPC
CREATE OR REPLACE FUNCTION emergency_resume_session(p_session_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'ERR_FORBIDDEN: Admin privileges required';
  END IF;

  UPDATE auction_sessions SET status = 'ACTIVE' WHERE id = p_session_id;
  UPDATE startups SET status = 'ACTIVE_BIDDING' 
  WHERE session_id = p_session_id AND status = 'PAUSED';

  INSERT INTO auction_events (session_id, event_type, actor_id, payload)
  VALUES (p_session_id, 'EMERGENCY_RESUME', v_admin_id, '{}');

  RETURN jsonb_build_object('success', true, 'status', 'ACTIVE');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. reset_rehearsal_session RPC
CREATE OR REPLACE FUNCTION reset_rehearsal_session(p_session_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_session  auction_sessions%ROWTYPE;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'ERR_FORBIDDEN: Admin privileges required';
  END IF;

  SELECT * INTO v_session FROM auction_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ERR_SESSION_NOT_FOUND: Invalid session ID';
  END IF;

  -- Wipe bids, holds, startup accounts, events for this session
  DELETE FROM bids WHERE startup_id IN (SELECT id FROM startups WHERE session_id = p_session_id);
  DELETE FROM fund_holds WHERE startup_id IN (SELECT id FROM startups WHERE session_id = p_session_id);
  DELETE FROM startup_accounts WHERE startup_id IN (SELECT id FROM startups WHERE session_id = p_session_id);
  DELETE FROM auction_events WHERE session_id = p_session_id;

  -- Reset startups
  UPDATE startups 
  SET status = 'UPCOMING',
      current_highest_bid = NULL,
      current_highest_bidder_id = NULL,
      winner_team_id = NULL,
      winning_bid_amount = NULL,
      started_presenting_at = NULL,
      bidding_started_at = NULL,
      paused_at = NULL,
      closed_at = NULL,
      updated_at = NOW()
  WHERE session_id = p_session_id;

  -- Reset wallets
  UPDATE bidder_wallets 
  SET available_balance = initial_balance,
      locked_balance = 0,
      total_spent = 0,
      updated_at = NOW();

  -- Reset session
  UPDATE auction_sessions 
  SET status = 'DRAFT', 
      active_startup_id = NULL 
  WHERE id = p_session_id;

  RETURN jsonb_build_object('success', true, 'message', 'Rehearsal session wiped clean');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
