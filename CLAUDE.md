# SEEP 4.0 Live Startup Auction Platform — Project Guide

## Project Overview

This is the **SEEP 4.0 Grand Finale Live Auction Platform** for BITS Pilani Hyderabad TBI (Technology Business Incubator). It is a real-time investor auction system where 15 investor teams bid on 6 startups using an ascending English auction format.

- **Production URL**: https://tbi-seep-auction.vercel.app
- **Supabase Project**: https://iydynibzngnbughjilnu.supabase.co
- **Deployment**: Vercel Mumbai region (`bom1`)
- **Repository**: https://github.com/Kuber2209/TBI-SEEP-Auction

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL (with RLS + RPCs) |
| Real-time | Supabase Realtime WebSockets |
| Hosting | Vercel (Mumbai bom1) |
| Analytics | Vercel Analytics |

---

## Architecture

### Directory Structure

```
src/
├── app/
│   ├── page.tsx              # Root redirect (→ /login or role-based dashboard)
│   ├── layout.tsx            # Root layout with Vercel Analytics
│   ├── globals.css           # Global styles + custom animations
│   ├── error.tsx             # Global error boundary
│   ├── login/                # Login page
│   ├── admin/                # Admin operator panel
│   ├── bidder/               # Bidder investor console
│   └── api/
│       ├── admin/            # Admin-only API routes (overview, export, snapshot, seed-accounts)
│       └── auction/          # Shared auction API routes (sync)
├── components/
│   ├── admin/                # Admin-specific components
│   ├── bidder/               # Bidder-specific components
│   ├── common/               # Shared components (ErrorBoundary)
│   └── layout/               # Shared layout (Header, ConnectionBanner)
├── hooks/
│   ├── useAuctionSync.ts     # Core real-time state sync hook (all roles)
│   └── usePresence.ts        # Online presence tracking hook
├── lib/
│   ├── auction/
│   │   └── actions.ts        # All Next.js Server Actions
│   ├── auth/                 # Auth utilities
│   ├── supabase/
│   │   ├── client.ts         # Browser client singleton
│   │   ├── server.ts         # Server-side Supabase client
│   │   └── types.ts          # All TypeScript types
│   └── theme/                # Theme/design tokens
├── middleware.ts             # Auth + RBAC enforcement (Supabase SSR)
tests/
├── simulation.ts             # Financial invariant + escrow tests
├── security-remediation.ts   # Security boundary verification tests
├── chaos-concurrency.ts      # 50+ concurrent bid stress test
├── adversarial-stress-matrix.ts
├── empirical-challenger-suite.ts
├── financial-analytics.ts
├── error-boundaries-accessibility.ts
└── telemetry-snapshot.ts
supabase/
└── migrations/               # Database migrations
```

---

## User Roles & Routing

| Role | Route | Access |
|------|-------|--------|
| Unauthenticated | `/login` | Login page only |
| `bidder` | `/bidder` | Investor console (bids, wallet, portfolio) |
| `admin` | `/admin` | Operator command center (stage controls, bidder management, telemetry) |

Middleware (`src/middleware.ts`) enforces:
- Unauthenticated users are redirected to `/login`
- Authenticated users on `/login` or `/` are redirected to their role's panel
- Bidders cannot access `/admin/*`
- Admins cannot access `/bidder/*`
- All `/api/admin/*` routes require an active admin profile
- All `/api/*` routes (except `/api/health`, `/api/public/*`) require authentication

---

## Database Schema (Key Tables)

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles with `role`, `is_active`, `session_version`, `display_user_id`, `team_name` |
| `auction_sessions` | Single auction session with `status`, `active_startup_id`, `bid_increments`, `wallets_initialized` |
| `startups` | The 6 startup lots with `status`, `current_highest_bid`, `winner_team_id` |
| `bids` | All bid submissions with escrow lifecycle (`ACTIVE` → `OUTBID` / `WINNING` → `SETTLED` / `VOID`) |
| `bidder_wallets` | Per-team wallet: `available_balance`, `locked_balance`, `total_spent` |
| `fund_holds` | Escrow holds per bid (`HELD` → `RELEASED` / `SETTLED`) |
| `startup_accounts` | Settlement records when a startup is sold |
| `auction_events` | Audit log of all auction events (stage transitions, bids, voids, etc.) |
| `account_activity_logs` | Per-user activity log (login, logout, session changes) |

### Key Financial Invariant

```
initial_balance = available_balance + locked_balance + total_spent
```

This must hold true for every bidder at all times. Verified by `tests/simulation.ts`.

### Startup Status Lifecycle

```
UPCOMING → PRESENTING → ACTIVE_BIDDING ⇌ PAUSED → SOLD | UNSOLD
```

### Session Status Lifecycle

```
DRAFT → ACTIVE ⇌ PAUSED → COMPLETED
```

### Bid Status Lifecycle

```
ACTIVE → OUTBID (when outbid) → WINNING (when highest) → SETTLED (when auction closes) | VOID (admin action)
```

---

## Database RPCs (PostgreSQL Functions)

All business-critical operations go through atomic RPCs, not direct table writes:

| RPC | Purpose |
|-----|---------|
| `place_bid(p_startup_id, p_amount, p_idempotency_key)` | Place a bid with escrow management |
| `close_auction(p_startup_id)` | Close bidding, settle winner, release losers' escrow |
| `void_bid(p_bid_id, p_reason)` | Admin void a bid and release its escrow |
| `reopen_auction(p_startup_id)` | Reopen a closed lot for re-bidding |
| `set_startup_status(p_startup_id, p_status)` | Change a startup's stage status |
| `initialize_session_wallets(p_session_id)` | Fund all 15 bidder wallets |
| `force_logout_bidder(p_user_id)` | Increment session_version to invalidate session |
| `emergency_pause_session(p_session_id)` | Pause entire auction session |
| `emergency_resume_session(p_session_id)` | Resume paused auction session |
| `reset_rehearsal_session(p_session_id)` | Reset all rehearsal data |

---

## Server Actions (`src/lib/auction/actions.ts`)

All Server Actions authenticate the caller server-side before executing:

- `setStartupStatusAction(startupId, status)` — Admin: change lot stage status
- `closeAuctionAction(startupId)` — Admin: close and settle a lot
- `voidBidAction(bidId, reason)` — Admin: void a specific bid
- `reopenAuctionAction(startupId)` — Admin: reopen a closed lot
- `emergencyPauseAction(sessionId)` — Admin: emergency pause
- `emergencyResumeAction(sessionId)` — Admin: emergency resume
- `initializeSessionWalletsAction(sessionId)` — Admin: fund all wallets
- `resetRehearsalSessionAction(sessionId)` — Admin: reset rehearsal
- `reorderStartupsAction(orderedIds)` — Admin: drag-to-reorder lots
- `setStageToWelcomeLobbyAction(sessionId)` — Admin: broadcast Welcome Screen to bidders (sets `active_startup_id = null`)
- `forceLogoutBidderAction(targetUserId)` — Admin: force-logout a bidder
- `placeBidAction(startupId, amount)` — Bidder: place a bid

---

## API Routes

### Admin-Only (`/api/admin/*`)
All protected by middleware (requires active admin profile):

| Route | Purpose |
|-------|---------|
| `GET /api/admin/overview` | Bidder roster + wallet balances + recent events |
| `GET /api/admin/export` | CSV export of all bids |
| `GET /api/admin/snapshot` | Cryptographic JSON state checkpoint |
| `POST /api/admin/seed-accounts` | Create test bidder accounts (admin only, no credential disclosure) |

### Shared Auction (`/api/auction/*`)
Requires authentication (any role):

| Route | Purpose |
|-------|---------|
| `GET /api/auction/sync` | Authoritative state fetch for `useAuctionSync` hook |

---

## Real-Time Architecture

### `useAuctionSync` Hook (`src/hooks/useAuctionSync.ts`)

- **Single multiplexed Realtime channel** (`realtime:auction_feed`) subscribes to `postgres_changes` on `startups`, `bids`, `bidder_wallets`, `auction_sessions`
- **Optimistic updates**: incoming `payload.new` is applied directly to React state for <100ms latency
- **Queued refetch**: if a DB event arrives while an HTTP fetch is in-flight, `queuedRefetch.current = true` triggers a follow-up fetch
- **Backup polling**: every 1500ms as a safety net
- **Browser client singleton**: `createClient()` in `src/lib/supabase/client.ts` returns a cached instance to prevent WebSocket churn

### `usePresence` Hook (`src/hooks/usePresence.ts`)

- Tracks online bidders via Supabase Presence (`auction:presence` channel)
- Tracks: `userId`, `displayUserId`, `teamName`, `role`, `onlineAt`

### Session Invalidation

When admin force-logouts a bidder:
1. `force_logout_bidder` RPC increments `profiles.session_version`
2. Each client's next `/api/auction/sync` call detects the version mismatch
3. Client is redirected to `/login?reason=session_kicked`
4. Bidder-specific broadcast via `private:user:{id}` channel for instant logout

---

## Design System

### Color Palette (Matte Sage / Eye-Comfort)

| Token | Value | Usage |
|-------|-------|-------|
| Canvas | `#dfe7e0` | Page backgrounds |
| Card | `#eff4f0` | Card/panel backgrounds |
| Sub-surface | `#e5ece6` | Secondary surfaces, buttons |
| Border | `#cad7cc` | All borders |
| Text Primary | `#203126` | Headings, body text |
| Text Secondary | `#56695e` | Labels, muted text |
| Brand Green | `#1a5c3e` | Primary actions, CTAs, active states |
| Brand Hover | `#144931` | Hover state for brand green |

**Never use stark white (`#ffffff`) or near-black (`#0a0a0a`) backgrounds.**

### Logo

The official TBI BITS Pilani Hyderabad logo is at `/public/images/tbi-bits-logo.png`. It appears on:
- Login page
- Header (all pages)
- Welcome Lobby screen

---

## Admin Panel Tabs

1. **Live Stage Driver** — Startup queue + Stage workflow controls
2. **Welcome Screen** — Preview + broadcast the Welcome Lobby to all bidders
3. **Investor Teams** — Bidder roster with wallet balances and online status
4. **Room Telemetry** — Live capital distribution, bid velocity, session health
5. **Audit Trail** — Timestamped auction event log

### Stage Workflow (per lot)

The Stage Control Panel has a 6-button workflow. Buttons dynamically highlight based on `activeStartup.status`:

```
[1. Set Presenting] → [2. Open Bidding] → [Pause/Resume] → [3. Close (Settle)] → [Reopen Round] → [4. Next Lot]
```

The active next-action button is always highlighted in brand green (`#1a5c3e`).

---

## Bidder Console Features

- **Welcome Lobby** (default on login) — Rules briefing, deal sheet, team info
- **Live Bidding Arena** — Real-time bid pad, startup hero card, bid history
- **Portfolio Analytics** — Won startups, capital spent, sector breakdown
- **Valuation Calculator** — Implied post-money valuation model
- **Switcher bar** — Always visible; shows live stage status and auto-advances to arena when bidding goes live

---

## Common Commands

```bash
# Development
npm run dev

# Production build (ALWAYS run before merging)
npm run build

# Lint
npm run lint

# Tests
npm run test:simulation         # Financial invariants + escrow settlement
npx tsx tests/security-remediation.ts  # Security boundary matrix
npm run test:chaos              # 50-bidder concurrency stress test

# Supabase
npm run supabase:db:push        # Push local migrations to Supabase
npm run supabase:db:pull        # Pull latest schema from Supabase

# Deployment
git push origin main            # Auto-deploys to Vercel via GitHub CI
npm run deploy:prod             # Manual Vercel prod deploy
```

---

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY=      # Supabase service role key (server-side only, NEVER expose to client)
NEXT_PUBLIC_APP_URL=            # App base URL (https://tbi-seep-auction.vercel.app in prod)
```

**Critical**: `SUPABASE_SERVICE_ROLE_KEY` must never appear in client-side code or be returned in API responses.

---

## Security Principles

1. **Middleware-first RBAC**: All route protection happens in `middleware.ts` — never rely solely on client-side guards
2. **Server Action auth**: Every Server Action re-authenticates the caller with `supabase.auth.getUser()`
3. **RPC-only financial operations**: `place_bid`, `close_auction`, etc. run in atomic PostgreSQL transactions
4. **No client-trusted values**: Bid amounts, user IDs, and wallet balances are never taken from request body without server verification
5. **Session versioning**: Force-logout works by incrementing `session_version`, detected on next sync
6. **Credential-free responses**: `/api/admin/seed-accounts` never returns plaintext passwords

---

## Testing Philosophy

- **`tests/simulation.ts`**: Verifies the financial conservation invariant holds end-to-end across escrow, bidding, and settlement workflows
- **`tests/security-remediation.ts`**: Verifies all 3 critical security boundaries (unauthenticated access, bidder privilege escalation, admin-only API enforcement)
- **`tests/chaos-concurrency.ts`**: Simulates 50+ concurrent bidders with network jitter to verify zero double-spends and zero orphaned escrow holds
- Always run `npm run build` and both primary test suites before pushing to `main`

---

## Known Constraints & Edge Cases

- **`session.active_startup_id = null`**: Means the Welcome Lobby is active. Bidder pages must handle `activeStartup === null` gracefully (BiddingPad shows empty state, StartupHero shows placeholder)
- **Rehearsal vs. Live mode**: `session.is_rehearsal = true` shows a "DRY RUN" banner and unlocks the "Reset Dry Run" button
- **Wallet initialization**: Admin must click "Fund All Wallets" before bidding can begin. `session.wallets_initialized` controls this gate
- **Idempotency keys**: Each bid submission generates a unique key client-side to prevent duplicate bids from network retries
- **Self-outbid prevention**: The `place_bid` RPC returns `ERR_ALREADY_HIGHEST_BIDDER` if the bidder already holds the winning position

---

## AI Agent Guidelines

When making changes to this codebase:

1. **Always run `npm run build` after changes** — TypeScript errors will block Vercel deployment
2. **Run `npx tsx tests/security-remediation.ts`** after any auth/middleware/API changes
3. **Run `npx tsx tests/simulation.ts`** after any financial/bid/wallet/settlement changes
4. **Preserve the design palette** — Do not introduce white (`#fff`), black (`#000`), or dark navy backgrounds
5. **Do not bypass RPCs** — Financial operations must go through the PostgreSQL RPC functions, not direct table writes
6. **Keep the Supabase client singleton** — `createClient()` in `src/lib/supabase/client.ts` returns a memoized instance; do not call `createBrowserClient` directly elsewhere
7. **Commit and push after completing a task** — `git add . && git commit -m "..." && git push origin main` triggers the Vercel deployment
8. **Session actions require server-side auth** — Always call `supabase.auth.getUser()` inside Server Actions, never trust client-supplied user IDs
