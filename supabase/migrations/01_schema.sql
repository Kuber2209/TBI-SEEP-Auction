-- ==============================================================================
-- SEEP 4.0 Live Startup Auction Platform — 01_schema.sql
-- Database: PostgreSQL 15+ (Supabase)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing types if recreating
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

-- 1. Profiles (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_user_id   TEXT UNIQUE NOT NULL,       -- e.g. "TEAM01", "ADMIN01"
  team_name         TEXT NOT NULL,              -- e.g. "Team Alpha", "Chief Operator"
  role              user_role NOT NULL DEFAULT 'bidder',
  is_active         BOOLEAN NOT NULL DEFAULT true,
  session_version   INTEGER NOT NULL DEFAULT 1, -- Incremented to kick old sessions
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

-- 4. Startups (Lots)
CREATE TABLE IF NOT EXISTS startups (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id                UUID NOT NULL REFERENCES auction_sessions(id) ON DELETE CASCADE,
  display_order             INTEGER NOT NULL,        -- Fixed sequence 1..N
  name                      TEXT NOT NULL,
  founder_names             TEXT[] NOT NULL DEFAULT '{}',
  sector                    TEXT NOT NULL,           -- e.g. "FinTech", "HealthTech", "CleanTech"
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

-- Add active_startup_id foreign key constraint
DO $$ BEGIN
  ALTER TABLE auction_sessions 
    ADD CONSTRAINT fk_active_startup FOREIGN KEY (active_startup_id) 
    REFERENCES startups(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. Bids (Immutable ledger)
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

-- 6. Fund Holds (Escrow tracking)
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

-- 7. Startup Accounts (Settlement destination)
CREATE TABLE IF NOT EXISTS startup_accounts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id       UUID UNIQUE NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  received_amount  NUMERIC(14,2) NOT NULL DEFAULT 0,
  settled_at       TIMESTAMPTZ,
  winning_bid_id   UUID REFERENCES bids(id)
);

-- 8. Auction Events (Append-Only Audit Log)
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
