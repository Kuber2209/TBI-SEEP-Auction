# Handoff Report: SEEP 4.0 Auction Architecture, Financial Conservation & Engine Audit

## 1. Observation

### A. Core Architectural Stack & State Management
- **Framework & Runtime**: Next.js 14.2.10 (App Router, Server Actions, API Routes), TypeScript 5.6.2, Tailwind CSS (`package.json:11-21`).
- **Database & Persistence**: PostgreSQL 15+ hosted on Supabase (`supabase/migrations/01_schema.sql`, `02_rpcs.sql`, `03_rls.sql`, `04_seed_data.sql`).
- **Realtime / WebSocket Transport**: Multiplexed channels via Supabase Realtime client (`@supabase/supabase-js` & `@supabase/ssr`):
  - `public:startups`, `public:bids`, `public:bidder_wallets`, `public:auction_sessions` (`src/hooks/useAuctionSync.ts:107-157`).
  - `auction:presence` Presence channel tracking online attendance (`src/hooks/usePresence.ts:22-58`).
  - `private:user:<id>` User broadcast channel for administrative session kicks (`src/hooks/useAuctionSync.ts:177-188`).
- **Client Synchronization Loop**: `useAuctionSync` performs authoritative snapshot fetching from `/api/auction/sync` upon channel notifications with a 15-second safety polling fallback (`src/hooks/useAuctionSync.ts:41-98, 159-162`).

---

### B. Database Schema & Financial Conservation Model
1. **`bidder_wallets` Table (`supabase/migrations/01_schema.sql:48-62`)**:
   - `initial_balance` (default ₹50,000.00)
   - `available_balance` (funds uncommitted and available to bid)
   - `locked_balance` (escrow holds backing active winning bids)
   - `total_spent` (cumulative settled capital on won startup lots)
   - **Hard Invariant Constraints**:
     - `chk_non_negative_available`: `CHECK (available_balance >= 0)`
     - `chk_non_negative_locked`: `CHECK (locked_balance >= 0)`
     - `chk_non_negative_spent`: `CHECK (total_spent >= 0)`
     - `chk_wallet_conservation`: `CHECK (initial_balance = (available_balance + locked_balance + total_spent))`
2. **`bids` Table (`supabase/migrations/01_schema.sql:115-128`)**:
   - `idempotency_key TEXT UNIQUE NOT NULL`
   - `server_seq BIGSERIAL NOT NULL` (guarantees monotonic global ordering)
   - `status`: `ACTIVE`, `OUTBID`, `WINNING`, `VOID`, `SETTLED`
   - `CONSTRAINT chk_bid_positive CHECK (amount > 0)`
3. **`fund_holds` Table (`supabase/migrations/01_schema.sql:134-148`)**:
   - Explicit escrow table tracking `bid_id`, `startup_id`, `bidder_id`, `amount`, `status` (`HELD`, `RELEASED`, `SETTLED`), `held_at`, `released_at`, `settled_at`.
4. **`auction_events` Table (`supabase/migrations/01_schema.sql:159-174`)**:
   - Append-only event audit trail recording `event_type`, `session_id`, `startup_id`, `actor_id`, `target_id`, `payload`, `prev_state`, `new_state`, `created_at`.

---

### C. Atomic Bidding & Settlement RPC Mechanics
1. **`place_bid` RPC (`supabase/migrations/02_rpcs.sql:19-181`)**:
   - **Step 1 (Idempotency)**: `IF EXISTS (SELECT 1 FROM bids WHERE idempotency_key = p_idempotency_key)` returns previous bid (`lines 38-46`).
   - **Step 2 (Auth)**: Validates `auth.uid()` and active profile (`lines 49-55`).
   - **Step 3 (Lot Row Lock)**: `SELECT * INTO v_startup FROM startups WHERE id = p_startup_id FOR UPDATE;` (`line 58`). Fails if `status <> 'ACTIVE_BIDDING'`.
   - **Step 4 (Anti-Self-Outbid)**: Fails if `v_startup.current_highest_bidder_id = v_bidder_id` (`lines 68-70`).
   - **Step 5 (Increments)**: Validates opening bid `>= base_price` (and `= base_price` or `= base_price + increment`) and subsequent bids strictly exceed current highest bid by an allowed increment from `session.bid_increments` (`lines 78-106`).
   - **Step 6 (Wallet Row Lock)**: `SELECT * INTO v_wallet FROM bidder_wallets WHERE team_id = v_bidder_id FOR UPDATE;` (`line 109`). Verifies `available_balance >= p_amount`.
   - **Step 7 (Atomic Outbid Refund)**: If a previous leader exists:
     - Sets previous winning bid to `OUTBID` (`lines 125-127`).
     - Releases previous `fund_holds` to `RELEASED` (`lines 130-132`).
     - Refunds previous leader's wallet: `locked_balance -= v_prev_bid_amount`, `available_balance += v_prev_bid_amount` (`lines 134-138`).
     - Logs `BID_OUTBID` event (`lines 141-144`).
   - **Step 8 (New Escrow & Hold)**:
     - Inserts new bid with status `WINNING` (`lines 147-149`).
     - Inserts new `fund_holds` with status `HELD` (`lines 152-154`).
     - Deducts new bidder purse: `available_balance -= p_amount`, `locked_balance += p_amount` (`lines 155-159`).
     - Updates `startups.current_highest_bid = p_amount` and `startups.current_highest_bidder_id = v_bidder_id` (`lines 162-166`).
     - Logs `BID_PLACED` event (`lines 169-172`).
2. **`close_auction` RPC (`supabase/migrations/02_rpcs.sql:184-268`)**:
   - Authoritative settlement under admin authorization (`is_admin()`).
   - Locks startup row `FOR UPDATE`.
   - If no winning bid: sets startup `UNSOLD`, emits `AUCTION_CLOSED_UNSOLD`.
   - If winning bid:
     - Bid -> `SETTLED`.
     - Fund hold -> `SETTLED`.
     - Winner wallet: `locked_balance -= amount`, `total_spent += amount` (`lines 232-236`).
     - Startup -> `status = 'SOLD'`, `winner_team_id`, `winning_bid_amount`.
     - Credits `startup_accounts.received_amount = amount`.
3. **`void_bid` RPC (`supabase/migrations/02_rpcs.sql:271-364`)**:
   - Voids a specific bid (`status = 'VOID'`), releases active fund hold (`locked_balance -= amount, available_balance += amount`), and if voided bid was `WINNING`, searches for the highest remaining `OUTBID` bid, checks if that bidder has sufficient funds, and re-locks their funds into `WINNING` state.
4. **`reopen_auction` RPC (`supabase/migrations/02_rpcs.sql:367-426`)**:
   - Reverses wallet settlement from `total_spent` back to `locked_balance`, resets startup account, and switches startup back to `ACTIVE_BIDDING`.

---

### D. Detailed Audit of the 4 Focus Requirements & Gap Analysis

#### 1) Active Bidder Capital Distribution and 15 Investor Teams
- **Observed Code**:
  - `src/app/api/admin/seed-accounts/route.ts:29-83`: Seeds 15 named investor teams (`TEAM01` to `TEAM15`) with initial balances of ₹50,000 each.
  - `src/app/api/admin/overview/route.ts:23-34`: Queries profiles joined with wallets (`.from('profiles').select('*, wallet:bidder_wallets!team_id(*)')`).
  - `src/components/admin/RoomTelemetryDashboard.tsx:148-200`: Renders a 15-team grid displaying Available vs Spent with visual progress bars.
  - `src/components/admin/BidderRosterTable.tsx:150-239`: Renders an interactive table of all 15 teams showing Available, In Escrow, Total Invested, online status, and admin controls (force kick, password reset, account enable/disable).
- **Identified Gaps**:
  - *Polling Latency*: `AdminPage` fetches `/api/admin/overview` via `setInterval(fetchAdminData, 8000)` (`src/app/admin/page.tsx:77`). It does not subscribe to realtime wallet table broadcasts in this component, causing an up to 8-second delay before the operator sees capital shift.
  - *Lack of Risk Heatmap Sorting*: Teams are displayed in static order (`TEAM01`..`TEAM15`) without quick-sort filters by Remaining Runway / Burn Risk / High Escrow Exposure.

#### 2) Real-Time Ping/Latency/Packet Telemetry & WebSocket Health Tracking
- **Observed Code**:
  - `src/components/admin/RoomTelemetryDashboard.tsx:23-39`: Measures latency by pinging Next.js API `/api/auction/sync` using `fetch(..., { method: 'HEAD' })` every 8 seconds.
  - `src/hooks/usePresence.ts:15-73`: Tracks connected users using Supabase Presence channel `auction:presence`.
- **Identified Gaps**:
  - *Operator-Only HTTP Ping*: The ping metric measures the admin operator's local HTTP latency to the Next.js server, **NOT** the WebSocket transport latency, and **NOT** the individual latencies of the 15 bidder clients.
  - *No Bidder Network Telemetry*: There is no mechanism for bidder client browsers to send heartbeat ping/jitter/packet drop statistics back to the admin telemetry hub.
  - *Zero Packet & Dropped Event Metrics*: No tracking of dropped WebSocket messages, reconnect attempts, or packet jitter.

#### 3) Cryptographic Audit Snapshot Generator
- **Observed Code**:
  - `src/app/api/admin/snapshot/route.ts:4-61`: Admin endpoint that aggregates session, startups, wallets, bids, and recent events into a downloadable JSON file.
- **Identified Gaps**:
  - *No Cryptographic Hashing / Digital Signatures*: The snapshot is raw JSON. It lacks SHA-256 state hashes, HMAC signatures, or Merkle tree root digests to guarantee cryptographic tamper-evidence.
  - *Truncated Audit Log*: `supabase.from('auction_events').select('*').limit(200)` (`src/app/api/admin/snapshot/route.ts:37`) truncates historical event logs at 200 rows.
  - *No Hash-Chained Ledgers*: Bids and events are ordered by sequence numbers, but lack cryptographic parent-hash chaining (`prev_hash`).

#### 4) Financial Conservation & High-Concurrency Chaos Stress Suite
- **Observed Code**:
  - `supabase/migrations/01_schema.sql:59-61`: Database constraint `chk_wallet_conservation` enforces `initial_balance = (available_balance + locked_balance + total_spent)` at the database engine level.
  - `tests/simulation.ts:1-203`: Unit simulation asserting invariant holding across single-lot sequential bidding and settlement.
  - `tests/chaos-concurrency.ts:1-217`: In-memory concurrency benchmark simulating 50 concurrent workers submitting bids with simulated jitter.
- **Identified Concurrency Considerations & Gaps**:
  - *Lock Order in `place_bid`*: In `place_bid` (`02_rpcs.sql:109, 134`), the current bidder's wallet is locked with `FOR UPDATE` (`team_id = v_bidder_id`), and the previous bidder's wallet is updated (`team_id = v_prev_bidder_id`) without acquiring a deterministic lock order (e.g. sorting UUIDs). While PostgreSQL row locks on `startups` serialize all bids on a single startup, cross-lot bidding (where Bidder A outbids Bidder B on Lot 1 while Bidder B outbids Bidder A on Lot 2 simultaneously) could theoretically create lock contention if wallet locks are acquired out of order.
  - *Simulation vs Real Database*: `tests/chaos-concurrency.ts` executes an in-memory Promise queue rather than dispatching 50+ concurrent real HTTP/Postgres connections against Supabase.

---

## 2. Logic Chain

```
Observation 1 (Database Constraints):
`chk_wallet_conservation` enforces `initial_balance = available_balance + locked_balance + total_spent` on `bidder_wallets`.
Non-negative constraints enforce `available_balance >= 0`, `locked_balance >= 0`, `total_spent >= 0`.
      ↓
Observation 2 (Atomic RPC Transactions):
`place_bid`, `close_auction`, `void_bid`, `reopen_auction` execute all balance shifts inside PostgreSQL transactional RPCs with row-level locks (`SELECT ... FOR UPDATE`).
      ↓
Observation 3 (Escrow Lifecycle):
When a bid is placed:
  - New leader: `available_balance -= amount`, `locked_balance += amount` (Sum invariant: 0 change).
  - Outbid leader: `locked_balance -= prev_amount`, `available_balance += prev_amount` (Sum invariant: 0 change).
When lot closes:
  - Winner: `locked_balance -= amount`, `total_spent += amount` (Sum invariant: 0 change).
      ↓
Inference (Financial Conservation):
Every balance transition preserves the invariant `Initial = Available + Locked + Spent`. Any transaction violating non-negativity or conservation is immediately aborted and rolled back by PostgreSQL.
      ↓
Observation 4 (Telemetry & Snapshot Gaps):
- Admin ping is a simple client HTTP HEAD fetch to Next.js (`performance.now()`).
- Bidders do not stream packet/latency heartbeats.
- Snapshot generator in `src/app/api/admin/snapshot/route.ts` creates unhashed JSON with a 200-item event limit.
      ↓
Conclusion:
The core financial ledger and transaction model are mathematically sound and database-enforced. The primary enhancements required for production hardening lie in:
(1) WebSocket client-level telemetry & jitter monitoring;
(2) Cryptographic hashing & Merkle/SHA-256 state checkpointing for the snapshot generator;
(3) Real-time subscription push for operator capital distribution views;
(4) Comprehensive multi-worker chaos concurrency suite.
```

---

## 3. Caveats
1. **Network Sandbox Mode**: Verification was performed via static codebase inspection, AST analysis, and schema tracing. Live database interaction requires active Supabase credentials (`.env.local` currently contains placeholder values).
2. **Supabase Realtime Cloud Scaling**: In high-throughput production (50+ simultaneous bidders), Supabase Realtime broadcast channels should be configured with adequate rate limits and RLS publication channels.
3. No other caveats.

---

## 4. Conclusion
1. **Financial Conservation & Escrow**: The platform possesses strong database-level financial integrity. The combination of `chk_wallet_conservation`, `place_bid` row-locking, and explicit `fund_holds` status tracking prevents double-spends and orphaned escrow holds.
2. **15-Team Capital Distribution**: The schema and UI support all 15 investor teams. Enhancing `/admin` with real-time push subscriptions and risk-sorted heatmaps will eliminate the 8-second polling delay.
3. **Telemetry & WebSocket Health**: Latency monitoring currently measures operator HTTP latency. Implementing a distributed WebSocket heartbeat channel will allow operators to observe true round-trip ping, jitter, and packet health across all 15 bidder clients.
4. **Cryptographic Snapshots**: The snapshot endpoint can be upgraded with SHA-256 state hashing, HMAC signatures, and full event log inclusion to provide an immutable audit ledger.

---

## 5. Verification Method

### A. Independent Inspection Checklist
1. **Schema & Constraints**: Inspect `supabase/migrations/01_schema.sql` lines 48–62 (`bidder_wallets` constraints) and lines 115–148 (`bids` & `fund_holds`).
2. **Bidding RPC**: Inspect `supabase/migrations/02_rpcs.sql` lines 19–181 (`place_bid` row locking, balance checks, escrow transfer, idempotency).
3. **Settlement RPC**: Inspect `supabase/migrations/02_rpcs.sql` lines 184–268 (`close_auction` wallet settlement: locked to total_spent).
4. **Snapshot Route**: Inspect `src/app/api/admin/snapshot/route.ts` lines 26–53 (unhashed JSON output & 200-event limit).
5. **Telemetry Component**: Inspect `src/components/admin/RoomTelemetryDashboard.tsx` lines 23–39 (HTTP ping implementation).

### B. Verification Test Commands
- Simulation test: `node -r ts-node/register tests/simulation.ts` or `ts-node tests/simulation.ts`
- Chaos concurrency test: `node -r ts-node/register tests/chaos-concurrency.ts` or `ts-node tests/chaos-concurrency.ts`

### C. Invalidation Conditions
- Any occurrence of `chk_wallet_conservation` database constraint failure during concurrent bid submission.
- Any situation where `available_balance < 0`, `locked_balance < 0`, or `total_spent < 0`.
