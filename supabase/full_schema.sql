-- ==============================================================================
-- SEEP 4.0 Live Startup Auction Platform — Consolidated Setup Script
-- Paste this entire file into Supabase SQL Editor to set up the full system.
-- ==============================================================================

-- 1. Schema & Extensions
\i supabase/migrations/01_schema.sql
\i supabase/migrations/02_rpcs.sql
\i supabase/migrations/03_rls.sql
\i supabase/migrations/04_seed_data.sql
