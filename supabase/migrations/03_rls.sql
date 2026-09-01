-- ==============================================================================
-- SEEP 4.0 Live Startup Auction Platform — 03_rls.sql
-- Database: PostgreSQL 15+ (Supabase)
-- ==============================================================================

-- Enable Row Level Security on all application tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bidder_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE startup_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_activity_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles RLS
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON profiles;
CREATE POLICY "profiles_select_own_or_admin" ON profiles FOR SELECT
  USING (auth.uid() = id OR is_admin());

DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- 2. Bidder Wallets RLS
DROP POLICY IF EXISTS "wallets_select_own_or_admin" ON bidder_wallets;
CREATE POLICY "wallets_select_own_or_admin" ON bidder_wallets FOR SELECT
  USING (auth.uid() = team_id OR is_admin());

DROP POLICY IF EXISTS "wallets_admin_all" ON bidder_wallets;
CREATE POLICY "wallets_admin_all" ON bidder_wallets FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- 3. Auction Sessions RLS
DROP POLICY IF EXISTS "sessions_select_auth" ON auction_sessions;
CREATE POLICY "sessions_select_auth" ON auction_sessions FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "sessions_admin_all" ON auction_sessions;
CREATE POLICY "sessions_admin_all" ON auction_sessions FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- 4. Startups RLS
DROP POLICY IF EXISTS "startups_select_auth" ON startups;
CREATE POLICY "startups_select_auth" ON startups FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "startups_admin_all" ON startups;
CREATE POLICY "startups_admin_all" ON startups FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- 5. Bids RLS (Read allowed to authenticated, writes strictly via place_bid RPC)
DROP POLICY IF EXISTS "bids_select_auth" ON bids;
CREATE POLICY "bids_select_auth" ON bids FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "bids_admin_all" ON bids;
CREATE POLICY "bids_admin_all" ON bids FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- 6. Fund Holds RLS
DROP POLICY IF EXISTS "holds_select_own_or_admin" ON fund_holds;
CREATE POLICY "holds_select_own_or_admin" ON fund_holds FOR SELECT
  USING (auth.uid() = bidder_id OR is_admin());

DROP POLICY IF EXISTS "holds_admin_all" ON fund_holds;
CREATE POLICY "holds_admin_all" ON fund_holds FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- 7. Startup Accounts RLS
DROP POLICY IF EXISTS "sa_select_auth" ON startup_accounts;
CREATE POLICY "sa_select_auth" ON startup_accounts FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "sa_admin_all" ON startup_accounts;
CREATE POLICY "sa_admin_all" ON startup_accounts FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- 8. Auction Events RLS (Admin only)
DROP POLICY IF EXISTS "events_admin_select" ON auction_events;
CREATE POLICY "events_admin_select" ON auction_events FOR SELECT
  USING (is_admin());

-- 9. Account Activity Logs RLS (Admin only)
DROP POLICY IF EXISTS "logs_admin_select" ON account_activity_logs;
CREATE POLICY "logs_admin_select" ON account_activity_logs FOR SELECT
  USING (is_admin());

-- ==============================================================================
-- Supabase Realtime Publication Settings
-- ==============================================================================
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
