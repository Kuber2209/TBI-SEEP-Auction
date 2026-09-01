-- ==============================================================================
-- SEEP 4.0 Live Startup Auction Platform — Standalone Full Database Script
-- Copy and paste this directly into Supabase Dashboard -> SQL Editor -> Run
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'bidder');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE session_status AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE startup_status AS ENUM ('UPCOMING', 'PRESENTING', 'ACTIVE_BIDDING', 'PAUSED', 'SOLD', 'UNSOLD');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE bid_status AS ENUM ('ACTIVE', 'OUTBID', 'WINNING', 'VOID', 'SETTLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE hold_status AS ENUM ('HELD', 'RELEASED', 'SETTLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 1. Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_user_id   TEXT UNIQUE NOT NULL,
  team_name         TEXT NOT NULL,
  role              user_role NOT NULL DEFAULT 'bidder',
  is_active         BOOLEAN NOT NULL DEFAULT true,
  session_version   INTEGER NOT NULL DEFAULT 1,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Bidder Wallets
CREATE TABLE IF NOT EXISTS bidder_wallets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id           UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  initial_balance   NUMERIC(14,2) NOT NULL DEFAULT 0,
  available_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  locked_balance    NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_spent       NUMERIC(14,2) NOT NULL DEFAULT 0,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_non_negative_available CHECK (available_balance >= 0),
  CONSTRAINT chk_non_negative_locked CHECK (locked_balance >= 0),
  CONSTRAINT chk_non_negative_spent CHECK (total_spent >= 0),
  CONSTRAINT chk_wallet_conservation CHECK (
    initial_balance = (available_balance + locked_balance + total_spent)
  )
);

-- 3. Auction Sessions
CREATE TABLE IF NOT EXISTS auction_sessions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL DEFAULT 'SEEP 4.0 Grand Finale',
  is_rehearsal          BOOLEAN NOT NULL DEFAULT false,
  status                session_status NOT NULL DEFAULT 'DRAFT',
  initial_purse_amount  NUMERIC(14,2) NOT NULL DEFAULT 50000.00,
  bid_increments        NUMERIC(14,2)[] NOT NULL DEFAULT '{1000, 2500, 5000, 10000}',
  wallets_initialized   BOOLEAN NOT NULL DEFAULT false,
  active_startup_id     UUID,
  created_by            UUID REFERENCES profiles(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at            TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ
);

-- 4. Startups
CREATE TABLE IF NOT EXISTS startups (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id                UUID NOT NULL REFERENCES auction_sessions(id) ON DELETE CASCADE,
  display_order             INTEGER NOT NULL,
  name                      TEXT NOT NULL,
  founder_names             TEXT[] NOT NULL DEFAULT '{}',
  sector                    TEXT NOT NULL,
  tagline                   TEXT NOT NULL,
  description               TEXT,
  logo_url                  TEXT,
  base_price                NUMERIC(14,2) NOT NULL DEFAULT 10000.00,
  status                    startup_status NOT NULL DEFAULT 'UPCOMING',
  current_highest_bid       NUMERIC(14,2),
  current_highest_bidder_id UUID REFERENCES profiles(id),
  winner_team_id            UUID REFERENCES profiles(id),
  winning_bid_amount        NUMERIC(14,2),
  started_presenting_at     TIMESTAMPTZ,
  bidding_started_at        TIMESTAMPTZ,
  paused_at                 TIMESTAMPTZ,
  closed_at                 TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_session_display_order UNIQUE (session_id, display_order)
);

DO $$ BEGIN
  ALTER TABLE auction_sessions 
    ADD CONSTRAINT fk_active_startup FOREIGN KEY (active_startup_id) 
    REFERENCES startups(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. Bids
CREATE TABLE IF NOT EXISTS bids (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id       UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  bidder_id        UUID NOT NULL REFERENCES profiles(id),
  amount           NUMERIC(14,2) NOT NULL,
  status           bid_status NOT NULL DEFAULT 'ACTIVE',
  idempotency_key  TEXT UNIQUE NOT NULL,
  server_seq       BIGSERIAL NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  voided_at        TIMESTAMPTZ,
  voided_by        UUID REFERENCES profiles(id),
  void_reason      TEXT,
  CONSTRAINT chk_bid_positive CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_bids_startup_seq ON bids(startup_id, server_seq DESC);
CREATE INDEX IF NOT EXISTS idx_bids_bidder ON bids(bidder_id);

-- 6. Fund Holds
CREATE TABLE IF NOT EXISTS fund_holds (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id  UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  bidder_id   UUID NOT NULL REFERENCES profiles(id),
  bid_id      UUID NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
  amount      NUMERIC(14,2) NOT NULL,
  status      hold_status NOT NULL DEFAULT 'HELD',
  held_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  settled_at  TIMESTAMPTZ,
  CONSTRAINT chk_hold_positive CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_fund_holds_active ON fund_holds(startup_id, bidder_id) WHERE status = 'HELD';

-- 7. Startup Accounts
CREATE TABLE IF NOT EXISTS startup_accounts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id       UUID UNIQUE NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  received_amount  NUMERIC(14,2) NOT NULL DEFAULT 0,
  settled_at       TIMESTAMPTZ,
  winning_bid_id   UUID REFERENCES bids(id)
);

-- 8. Auction Events
CREATE TABLE IF NOT EXISTS auction_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     UUID REFERENCES auction_sessions(id),
  startup_id     UUID REFERENCES startups(id),
  event_type     TEXT NOT NULL,
  actor_id       UUID REFERENCES profiles(id),
  target_id      UUID REFERENCES profiles(id),
  payload        JSONB NOT NULL DEFAULT '{}',
  prev_state     JSONB,
  new_state      JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ae_session_time ON auction_events(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ae_startup_time ON auction_events(startup_id, created_at DESC);

-- 9. Account Activity Logs
CREATE TABLE IF NOT EXISTS account_activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  ip_address  TEXT,
  user_agent  TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aal_user_time ON account_activity_logs(user_id, created_at DESC);

-- ==============================================================================
-- RPC Functions
-- ==============================================================================

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
  IF EXISTS (SELECT 1 FROM bids WHERE idempotency_key = p_idempotency_key) THEN
    SELECT id INTO v_new_bid_id FROM bids WHERE idempotency_key = p_idempotency_key;
    RETURN jsonb_build_object(
      'success', true, 
      'idempotent', true, 
      'bid_id', v_new_bid_id, 
      'message', 'Bid previously processed'
    );
  END IF;

  IF v_bidder_id IS NULL THEN
    RAISE EXCEPTION 'ERR_UNAUTHORIZED: Authentication required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_bidder_id AND is_active = true) THEN
    RAISE EXCEPTION 'ERR_ACCOUNT_DISABLED: Account is inactive or revoked';
  END IF;

  SELECT * INTO v_startup FROM startups WHERE id = p_startup_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ERR_STARTUP_NOT_FOUND: Invalid startup ID';
  END IF;

  IF v_startup.status <> 'ACTIVE_BIDDING' THEN
    RAISE EXCEPTION 'ERR_AUCTION_NOT_ACTIVE: Bidding is closed or paused for this startup';
  END IF;

  IF v_startup.current_highest_bidder_id = v_bidder_id THEN
    RAISE EXCEPTION 'ERR_ALREADY_HIGHEST_BIDDER: You currently hold the highest bid';
  END IF;

  SELECT * INTO v_session FROM auction_sessions WHERE id = v_startup.session_id;
  IF v_session.status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'ERR_SESSION_NOT_ACTIVE: The event session is currently paused or inactive';
  END IF;

  IF v_startup.current_highest_bid IS NULL THEN
    IF p_amount < v_startup.base_price THEN
      RAISE EXCEPTION 'ERR_BELOW_BASE_PRICE: Opening bid must be at least ₹%', v_startup.base_price;
    END IF;
    IF p_amount = v_startup.base_price THEN
      v_is_valid_inc := true;
    ELSE
      v_diff := p_amount - v_startup.base_price;
      FOREACH v_inc IN ARRAY v_session.bid_increments LOOP
        IF v_diff = v_inc THEN v_is_valid_inc := true; EXIT; END IF;
      END LOOP;
    END IF;
  ELSE
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

  SELECT * INTO v_wallet FROM bidder_wallets WHERE team_id = v_bidder_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ERR_WALLET_NOT_FOUND: Bidder wallet does not exist';
  END IF;

  IF v_wallet.available_balance < p_amount THEN
    RAISE EXCEPTION 'ERR_INSUFFICIENT_FUNDS: Available purse ₹% is insufficient for bid of ₹%', 
      v_wallet.available_balance, p_amount;
  END IF;

  v_prev_bidder_id := v_startup.current_highest_bidder_id;
  v_prev_bid_amount := v_startup.current_highest_bid;

  IF v_prev_bidder_id IS NOT NULL THEN
    UPDATE bids 
    SET status = 'OUTBID' 
    WHERE startup_id = p_startup_id AND status = 'WINNING';

    UPDATE fund_holds 
    SET status = 'RELEASED', released_at = NOW() 
    WHERE startup_id = p_startup_id AND bidder_id = v_prev_bidder_id AND status = 'HELD';

    UPDATE bidder_wallets 
    SET locked_balance = locked_balance - v_prev_bid_amount,
        available_balance = available_balance + v_prev_bid_amount,
        updated_at = NOW()
    WHERE team_id = v_prev_bidder_id;

    INSERT INTO auction_events (session_id, startup_id, event_type, actor_id, target_id, payload)
    VALUES (v_session.id, p_startup_id, 'BID_OUTBID', v_bidder_id, v_prev_bidder_id, 
      jsonb_build_object('outbid_amount', v_prev_bid_amount, 'new_amount', p_amount));
  END IF;

  INSERT INTO bids (startup_id, bidder_id, amount, status, idempotency_key)
  VALUES (p_startup_id, v_bidder_id, p_amount, 'WINNING', p_idempotency_key)
  RETURNING id INTO v_new_bid_id;

  INSERT INTO fund_holds (startup_id, bidder_id, bid_id, amount, status)
  VALUES (p_startup_id, v_bidder_id, v_new_bid_id, p_amount, 'HELD');

  UPDATE bidder_wallets 
  SET available_balance = available_balance - p_amount,
      locked_balance = locked_balance + p_amount,
      updated_at = NOW()
  WHERE team_id = v_bidder_id;

  UPDATE startups 
  SET current_highest_bid = p_amount,
      current_highest_bidder_id = v_bidder_id,
      updated_at = NOW()
  WHERE id = p_startup_id;

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

  SELECT * INTO v_winning_bid FROM bids 
  WHERE startup_id = p_startup_id AND status = 'WINNING'
  LIMIT 1;

  IF NOT FOUND THEN
    UPDATE startups 
    SET status = 'UNSOLD', 
        closed_at = NOW(), 
        updated_at = NOW()
    WHERE id = p_startup_id;

    INSERT INTO auction_events (session_id, startup_id, event_type, actor_id, payload)
    VALUES (v_startup.session_id, p_startup_id, 'AUCTION_CLOSED_UNSOLD', v_admin_id, '{}');

    RETURN jsonb_build_object('success', true, 'status', 'UNSOLD');
  ELSE
    UPDATE bids SET status = 'SETTLED' WHERE id = v_winning_bid.id;

    UPDATE fund_holds 
    SET status = 'SETTLED', settled_at = NOW() 
    WHERE bid_id = v_winning_bid.id AND status = 'HELD';

    UPDATE bidder_wallets 
    SET locked_balance = locked_balance - v_winning_bid.amount,
        total_spent = total_spent + v_winning_bid.amount,
        updated_at = NOW()
    WHERE team_id = v_winning_bid.bidder_id;

    UPDATE startups 
    SET status = 'SOLD',
        winner_team_id = v_winning_bid.bidder_id,
        winning_bid_amount = v_winning_bid.amount,
        closed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_startup_id;

    INSERT INTO startup_accounts (startup_id, received_amount, settled_at, winning_bid_id)
    VALUES (p_startup_id, v_winning_bid.amount, NOW(), v_winning_bid.id)
    ON CONFLICT (startup_id) DO UPDATE 
    SET received_amount = EXCLUDED.received_amount,
        settled_at = NOW(),
        winning_bid_id = EXCLUDED.winning_bid_id;

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

  UPDATE bids 
  SET status = 'VOID', voided_at = NOW(), voided_by = v_admin_id, void_reason = p_reason 
  WHERE id = p_bid_id;

  UPDATE fund_holds 
  SET status = 'RELEASED', released_at = NOW() 
  WHERE bid_id = p_bid_id AND status = 'HELD';

  UPDATE bidder_wallets 
  SET locked_balance = locked_balance - v_target_bid.amount,
      available_balance = available_balance + v_target_bid.amount,
      updated_at = NOW()
  WHERE team_id = v_target_bid.bidder_id;

  IF v_target_bid.status = 'WINNING' THEN
    SELECT * INTO v_next_bid 
    FROM bids 
    WHERE startup_id = v_startup.id AND status = 'OUTBID' 
    ORDER BY amount DESC, server_seq DESC 
    LIMIT 1 
    FOR UPDATE;

    IF FOUND THEN
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
        UPDATE startups 
        SET current_highest_bid = NULL,
            current_highest_bidder_id = NULL,
            updated_at = NOW()
        WHERE id = v_startup.id;
      END IF;
    ELSE
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
      UPDATE bidder_wallets 
      SET total_spent = total_spent - v_winning_bid.amount,
          locked_balance = locked_balance + v_winning_bid.amount,
          updated_at = NOW()
      WHERE team_id = v_winning_bid.bidder_id;

      UPDATE fund_holds 
      SET status = 'HELD', settled_at = NULL 
      WHERE bid_id = v_winning_bid.id;

      UPDATE bids SET status = 'WINNING' WHERE id = v_winning_bid.id;
    END IF;

    UPDATE startup_accounts 
    SET received_amount = 0, settled_at = NULL, winning_bid_id = NULL 
    WHERE startup_id = p_startup_id;
  END IF;

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

  UPDATE startups 
  SET status = p_status,
      started_presenting_at = CASE WHEN p_status = 'PRESENTING' AND started_presenting_at IS NULL THEN NOW() ELSE started_presenting_at END,
      bidding_started_at = CASE WHEN p_status = 'ACTIVE_BIDDING' AND bidding_started_at IS NULL THEN NOW() ELSE bidding_started_at END,
      paused_at = CASE WHEN p_status = 'PAUSED' THEN NOW() ELSE paused_at END,
      updated_at = NOW()
  WHERE id = p_startup_id;

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

  DELETE FROM bids WHERE startup_id IN (SELECT id FROM startups WHERE session_id = p_session_id);
  DELETE FROM fund_holds WHERE startup_id IN (SELECT id FROM startups WHERE session_id = p_session_id);
  DELETE FROM startup_accounts WHERE startup_id IN (SELECT id FROM startups WHERE session_id = p_session_id);
  DELETE FROM auction_events WHERE session_id = p_session_id;

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

  UPDATE bidder_wallets 
  SET available_balance = initial_balance,
      locked_balance = 0,
      total_spent = 0,
      updated_at = NOW();

  UPDATE auction_sessions 
  SET status = 'DRAFT', 
      active_startup_id = NULL 
  WHERE id = p_session_id;

  RETURN jsonb_build_object('success', true, 'message', 'Rehearsal session wiped clean');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- Row Level Security
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bidder_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE startup_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON profiles;
CREATE POLICY "profiles_select_own_or_admin" ON profiles FOR SELECT
  USING (auth.uid() = id OR is_admin());

DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "wallets_select_own_or_admin" ON bidder_wallets;
CREATE POLICY "wallets_select_own_or_admin" ON bidder_wallets FOR SELECT
  USING (auth.uid() = team_id OR is_admin());

DROP POLICY IF EXISTS "wallets_admin_all" ON bidder_wallets;
CREATE POLICY "wallets_admin_all" ON bidder_wallets FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "sessions_select_auth" ON auction_sessions;
CREATE POLICY "sessions_select_auth" ON auction_sessions FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "sessions_admin_all" ON auction_sessions;
CREATE POLICY "sessions_admin_all" ON auction_sessions FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "startups_select_auth" ON startups;
CREATE POLICY "startups_select_auth" ON startups FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "startups_admin_all" ON startups;
CREATE POLICY "startups_admin_all" ON startups FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "bids_select_auth" ON bids;
CREATE POLICY "bids_select_auth" ON bids FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "bids_admin_all" ON bids;
CREATE POLICY "bids_admin_all" ON bids FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "holds_select_own_or_admin" ON fund_holds;
CREATE POLICY "holds_select_own_or_admin" ON fund_holds FOR SELECT
  USING (auth.uid() = bidder_id OR is_admin());

DROP POLICY IF EXISTS "holds_admin_all" ON fund_holds;
CREATE POLICY "holds_admin_all" ON fund_holds FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "sa_select_auth" ON startup_accounts;
CREATE POLICY "sa_select_auth" ON startup_accounts FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "sa_admin_all" ON startup_accounts;
CREATE POLICY "sa_admin_all" ON startup_accounts FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "events_admin_select" ON auction_events;
CREATE POLICY "events_admin_select" ON auction_events FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "logs_admin_select" ON account_activity_logs;
CREATE POLICY "logs_admin_select" ON account_activity_logs FOR SELECT
  USING (is_admin());

-- Realtime publication
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE startups;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE bids;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE bidder_wallets;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE auction_sessions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ==============================================================================
-- Seed Data
-- ==============================================================================
INSERT INTO auction_sessions (
  id, name, is_rehearsal, status, initial_purse_amount, bid_increments, wallets_initialized
)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'SEEP 4.0 Grand Finale',
  true,
  'DRAFT',
  50000.00,
  ARRAY[1000, 2500, 5000, 10000],
  false
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO startups (
  id, session_id, display_order, name, founder_names, sector, tagline, description, base_price, status
)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 1, 'AeroVolt Dynamics', ARRAY['Aarav Sharma', 'Rohan Verma'], 'CleanTech & EV', 'Solid-state battery thermal management for commercial drones & electric aerial vehicles.', 'AeroVolt has engineered an ultra-lightweight phase-change cooling composite that extends drone flight duration by 38% and cycle life by 2.4x.', 10000.00, 'UPCOMING'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 2, 'NeuroPulse AI', ARRAY['Sneha Reddy', 'Aditya Iyer'], 'MedTech / AI', 'Non-invasive EEG neural headband for early epileptic seizure prediction.', 'Clinical-grade wearable with embedded edge-AI inference predicting focal onset seizures up to 25 minutes prior to occurrence.', 12000.00, 'UPCOMING'),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 3, 'KisanSutra', ARRAY['Vikram Patel', 'Ananya Deshmukh'], 'AgriTech & IoT', 'Hyperlocal soil microbiome sensing & precision automated micro-irrigation.', 'Solar-powered subterranean telemetry pods delivering real-time soil data directly to farmers.', 8000.00, 'UPCOMING'),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 4, 'HyperLoom Logistics', ARRAY['Kabir Mehta', 'Tanvi Joshi'], 'Supply Chain', 'Autonomous warehouse robotic orchestration with sub-millimeter swarm positioning.', 'Modular pallet-rover fleet software cutting pick-and-pack turnaround times by 65%.', 15000.00, 'UPCOMING'),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 5, 'ZetaTrust Security', ARRAY['Devansh Nair'], 'Cybersecurity', 'Zero-knowledge quantum-resistant hardware enclave for edge devices.', 'Silicon-proven RISC-V coprocessor that protects smart grid infrastructure and IoT gateways.', 10000.00, 'UPCOMING'),
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 6, 'OptiFlow Hydro', ARRAY['Pooja Rao', 'Manish Gupta'], 'Water & Sustainability', 'Smart acoustic AI pipeline leak detection and automated pressure modulating valves.', 'Reduces municipal water transmission losses via non-intrusive ultrasonic clamp-on nodes.', 9000.00, 'UPCOMING'),
  ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 7, 'CogniCraft Labs', ARRAY['Rishi Kulkarni', 'Meera Swaminathan'], 'EdTech & VR', 'Spatial computing simulators for high-hazard industrial vocational training.', 'Photorealistic haptic VR simulations for petrochemical plant maintenance.', 11000.00, 'UPCOMING'),
  ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 8, 'BioSynthetix', ARRAY['Dr. Siddharth Sen', 'Neha Bhatt'], 'BioTech / Materials', 'Mycelium-derived biodegradable flame-retardant structural foam packaging.', 'Drop-in replacement for EPS styrofoam with zero petroleum inputs, 100% soil compostability.', 14000.00, 'UPCOMING'),
  ('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 9, 'PayGrid Protocol', ARRAY['Varun Aggarwal', 'Divya Krishnan'], 'FinTech & Web3', 'Sub-second offline soundwave & NFC micro-settlement for rural transit networks.', 'Sound modulation protocol processing offline transit transactions with zero cellular requirement.', 12000.00, 'UPCOMING'),
  ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 10, 'Chronos Nanotech', ARRAY['Karthik Sundaram'], 'DeepTech / Space', 'Atomic clock miniaturization on chip scale for satellite constellation synchrony.', 'Ultra-stable rubidium vapor cell miniaturized to 1.2 cm³ for GPS-denied autonomous navigation.', 16000.00, 'UPCOMING'),
  ('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 11, 'SentientRobotics', ARRAY['Harish Murthy', 'Shruti Paul'], 'Robotics & Defense', 'Quadruped robotic scout with autonomous terrain mapping in subterranean tunnels.', 'All-weather terrain rover with LIDAR SLAM and thermal imaging for search-and-rescue.', 13000.00, 'UPCOMING'),
  ('b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 12, 'Zenith Propulsion', ARRAY['Pranav Nambiar', 'Ishita Ghosh'], 'Aerospace', 'Non-toxic green hypergolic thrusters for commercial satellite orbital repositioning.', 'Hydrogen peroxide based propulsion modules replacing carcinogenic hydrazine.', 18000.00, 'UPCOMING')
ON CONFLICT (id) DO NOTHING;
