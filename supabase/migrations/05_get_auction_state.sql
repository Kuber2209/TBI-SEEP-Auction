-- ==============================================================================
-- SEEP 4.0 Live Startup Auction Platform — 05_get_auction_state.sql
-- Single Sync RPC: Collapse 5 sequential queries into one atomic call
-- ==============================================================================

CREATE OR REPLACE FUNCTION get_auction_state(p_team_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_profile        profiles%ROWTYPE;
  v_session        auction_sessions%ROWTYPE;
  v_startups       JSONB := '[]'::JSONB;
  v_active_startup JSONB := 'null'::JSONB;
  v_recent_bids    JSONB := '[]'::JSONB;
  v_wallet         JSONB := 'null'::JSONB;
  v_won_startups   JSONB := '[]'::JSONB;
BEGIN
  -- 1. Fetch and validate profile
  SELECT * INTO v_profile FROM profiles WHERE id = p_team_id;
  IF NOT FOUND OR NOT v_profile.is_active THEN
    RAISE EXCEPTION 'ERR_UNAUTHORIZED: Account inactive or not found';
  END IF;

  -- 2. Fetch most recent session
  SELECT * INTO v_session FROM auction_sessions ORDER BY created_at DESC LIMIT 1;

  -- 3. Fetch all startups for session
  SELECT COALESCE(jsonb_agg(s ORDER BY s.display_order), '[]'::JSONB)
  INTO v_startups
  FROM startups s
  WHERE s.session_id = v_session.id;

  -- 4. Active startup
  IF v_session.active_startup_id IS NOT NULL THEN
    SELECT to_jsonb(s) INTO v_active_startup
    FROM startups s WHERE s.id = v_session.active_startup_id;
  END IF;

  -- 5. Recent bids with bidder profile join (only if active startup exists)
  IF v_session.active_startup_id IS NOT NULL THEN
    SELECT COALESCE(
      jsonb_agg(
        to_jsonb(b) || jsonb_build_object(
          'bidder_profile', jsonb_build_object(
            'display_user_id', p.display_user_id,
            'team_name', p.team_name
          )
        )
        ORDER BY b.server_seq DESC
      ),
      '[]'::JSONB
    )
    INTO v_recent_bids
    FROM (
      SELECT * FROM bids 
      WHERE startup_id = v_session.active_startup_id
      ORDER BY server_seq DESC
      LIMIT 30
    ) b
    JOIN profiles p ON p.id = b.bidder_id;
  END IF;

  -- 6. Wallet (bidder only)
  IF v_profile.role = 'bidder' THEN
    SELECT to_jsonb(w) INTO v_wallet
    FROM bidder_wallets w WHERE w.team_id = p_team_id;

    -- 7. Won startups (bidder only)
    SELECT COALESCE(jsonb_agg(s ORDER BY s.display_order), '[]'::JSONB)
    INTO v_won_startups
    FROM startups s
    WHERE s.winner_team_id = p_team_id AND s.status = 'SOLD'
      AND s.session_id = v_session.id;
  END IF;

  RETURN jsonb_build_object(
    'profile',        to_jsonb(v_profile),
    'session',        CASE WHEN v_session.id IS NOT NULL THEN to_jsonb(v_session) ELSE 'null'::JSONB END,
    'startups',       v_startups,
    'activeStartup',  COALESCE(v_active_startup, 'null'::JSONB),
    'recentBids',     v_recent_bids,
    'wallet',         v_wallet,
    'wonStartups',    v_won_startups,
    'serverTime',     NOW()::TEXT
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
