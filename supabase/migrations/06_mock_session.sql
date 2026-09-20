-- ==============================================================================
-- SEEP 4.0 Live Startup Auction Platform — 06_mock_session.sql
-- Mock Round: Second session, demo startups, and session management RPCs
-- ==============================================================================

-- 1. Create Mock/Rehearsal Session
INSERT INTO auction_sessions (
  id,
  name,
  is_rehearsal,
  status,
  initial_purse_amount,
  bid_increments,
  wallets_initialized
)
VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'SEEP 4.0 Mock Round',
  true,
  'DRAFT',
  100000.00,
  ARRAY[1000, 2500, 5000, 10000],
  false
)
ON CONFLICT (id) DO NOTHING;

-- Ensure the real Grand Finale session is correctly marked as NOT a rehearsal.
-- (The original seed set is_rehearsal=true as a placeholder; correct it here.)
UPDATE auction_sessions
SET is_rehearsal = false
WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- 2. Seed Two Demo Startups for Mock Round Practice
INSERT INTO startups (
  id,
  session_id,
  display_order,
  name,
  founder_names,
  sector,
  tagline,
  base_price,
  status
)
VALUES
  (
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    1,
    'Demo Startup Alpha',
    '{}',
    'Technology',
    'Practice bidding on this demo lot — no real money involved.',
    10000.00,
    'UPCOMING'
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    2,
    'Demo Startup Beta',
    '{}',
    'Innovation',
    'Second practice lot to simulate competitive bidding dynamics.',
    15000.00,
    'UPCOMING'
  )
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 3. switch_active_session(p_session_id UUID)
--    Makes the given session ACTIVE and demotes all others to DRAFT.
-- ==============================================================================
CREATE OR REPLACE FUNCTION switch_active_session(
  p_session_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_target auction_sessions%ROWTYPE;
BEGIN
  -- Validate caller is an active admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'ERR_FORBIDDEN: Admin access required';
  END IF;

  -- Fetch and validate the target session
  SELECT * INTO v_target FROM auction_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ERR_NOT_FOUND: Session not found';
  END IF;

  -- Cannot switch to a COMPLETED session
  IF v_target.status = 'COMPLETED' THEN
    RAISE EXCEPTION 'ERR_INVALID: Cannot switch to a completed session';
  END IF;

  -- Demote only currently-ACTIVE sessions (preserve PAUSED and COMPLETED state)
  UPDATE auction_sessions
  SET status = 'DRAFT'
  WHERE id <> p_session_id
    AND status = 'ACTIVE';

  -- Activate the target session (only if DRAFT; do not overwrite PAUSED)
  UPDATE auction_sessions
  SET status = 'ACTIVE'
  WHERE id = p_session_id
    AND status IN ('DRAFT', 'ACTIVE');

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Session switched successfully',
    'session_id', p_session_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 4. reset_mock_session(p_session_id UUID)
--    Full wipe-and-reset for a rehearsal session. Clears all bids, holds,
--    accounts, events; resets startups and all bidder wallets to initial state.
-- ==============================================================================
CREATE OR REPLACE FUNCTION reset_mock_session(
  p_session_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_session   auction_sessions%ROWTYPE;
  v_startup   RECORD;
BEGIN
  -- Validate caller is an active admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'ERR_FORBIDDEN: Admin access required';
  END IF;

  -- Fetch and validate session
  SELECT * INTO v_session FROM auction_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ERR_NOT_FOUND: Session not found';
  END IF;

  IF v_session.is_rehearsal = false THEN
    RAISE EXCEPTION 'ERR_INVALID: Only rehearsal/mock sessions can be reset via this function';
  END IF;

  -- Wipe dependent data for all startups in this session, in FK order:
  -- A. startup_accounts (references bids via winning_bid_id)
  DELETE FROM startup_accounts
  WHERE startup_id IN (
    SELECT id FROM startups WHERE session_id = p_session_id
  );

  -- B. fund_holds (references bids via bid_id)
  DELETE FROM fund_holds
  WHERE startup_id IN (
    SELECT id FROM startups WHERE session_id = p_session_id
  );

  -- C. bids
  DELETE FROM bids
  WHERE startup_id IN (
    SELECT id FROM startups WHERE session_id = p_session_id
  );

  -- D. auction_events for this session
  DELETE FROM auction_events
  WHERE session_id = p_session_id;

  -- E. Reset startups back to UPCOMING, clear all bid/winner state
  UPDATE startups SET
    status                    = 'UPCOMING',
    current_highest_bid       = NULL,
    current_highest_bidder_id = NULL,
    winner_team_id            = NULL,
    winning_bid_amount        = NULL,
    started_presenting_at     = NULL,
    bidding_started_at        = NULL,
    paused_at                 = NULL,
    closed_at                 = NULL,
    updated_at                = NOW()
  WHERE session_id = p_session_id;

  -- F. Reset bidder wallets ONLY if the real (non-mock) session has not yet initialized
  --    real wallets. If it has, resetting wallets here would destroy real purse balances.
  IF NOT EXISTS (
    SELECT 1 FROM auction_sessions
    WHERE id <> p_session_id
      AND is_rehearsal = false
      AND wallets_initialized = true
  ) THEN
    UPDATE bidder_wallets SET
      available_balance = initial_balance,
      locked_balance    = 0,
      total_spent       = 0,
      updated_at        = NOW()
    WHERE team_id IN (
      SELECT id FROM profiles WHERE role = 'bidder'
    );
  END IF;

  -- G. Reset the session itself
  UPDATE auction_sessions SET
    status              = 'ACTIVE',
    wallets_initialized = false,
    active_startup_id   = NULL
  WHERE id = p_session_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Mock session reset successfully',
    'session_id', p_session_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
