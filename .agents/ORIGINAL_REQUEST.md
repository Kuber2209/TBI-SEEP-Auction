# Original User Request

## 2026-09-01T14:04:35Z

<USER_REQUEST>
Perform a comprehensive, deep-tier overhaul and production hardening across the entire SEEP 4.0 Live Startup Auction Platform, adding advanced Investor Intelligence & Analytics, an Operator Live Risk Command Center, and a Chaos & Latency Stress Test Matrix.

Working directory: /Users/kuberbhatt/Downloads/Clubs/TBI
Integrity mode: benchmark

## Requirements

### R1. Deep Investor Intelligence & Financial Analytics
- Implement an interactive **Valuation & Equity Calculator** directly on the bidder console allowing teams to model implied post-money valuations and target ownership percentages at various bid increments.
- Add an interactive **Portfolio Analytics & Capital Efficiency Drawer** visualizing sector diversification (CleanTech, MedTech, AgriTech, FinTech, DeepTech), average acquisition cost, and remaining investment runway.
- Provide live purse burn-rate visualizations and capital allocation risk indicators.

### R2. Operator Real-Time Telemetry & Risk Command Dashboard
- Implement an **Active Bidder Capital Distribution Map** on the admin panel showing live liquidity across all 15 investor teams.
- Add a **Live Room Latency & Packet Monitor** tracking client ping times, WebSocket health, and active connection drops.
- Provide an integrated **Audit Snapshot Generator** allowing operators to capture timestamped cryptographic event state checkpoints during live operations.

### R3. Chaos Network Resilience & High-Concurrency Stress Suite
- Build and execute an automated **Chaos Bidding Stress Benchmark** in `tests/chaos-concurrency.ts` simulating 50+ concurrent bidder clients submitting simultaneous bids at sub-millisecond intervals under simulated network jitter and dropped WebSocket connections.
- Programmatically verify 100% financial conservation under maximum concurrency:
  $$\text{Initial Purse} = \text{Available Balance} + \text{In Escrow (Locked)} + \text{Total Spent}$$
- Assert zero double-spends, zero orphaned escrow holds, and zero negative wallet balances under deliberate edge-case failures.

### R4. Full-Stack Error Boundaries, Performance & Keyboard Accessibility
- Implement robust React Error Boundaries across all consoles (`/bidder`, `/admin`, `/login`) preventing unhandled runtime crashes from terminating active sessions.
- Add full keyboard navigation and hotkey support for rapid bid placement (`1` for Increment 1, `2` for Increment 2, `Space` for Pass).
- Ensure 100% type safety and zero Next.js production build errors.

## Acceptance Criteria

### Investor Intelligence & Analytics
- [ ] Valuation calculator dynamically updates implied startup valuation and equity share in real time as bids advance.
- [ ] Portfolio analytics visualizes sector allocation breakdown and average cost per won lot.

### Operator Command & Telemetry
- [ ] Admin panel displays real-time capital distribution across all 15 bidder teams.
- [ ] Audit snapshot tool exports instantaneous JSON state checkpoints with zero database lock delays.

### Chaos Testing & Concurrency Integrity
- [ ] Automated stress script `tests/chaos-concurrency.ts` runs 50+ concurrent requests across multiple lots with 0 financial invariant failures.
- [ ] All outbid escrows are released atomically with zero orphaned locked balances.
- [ ] Single-session enforcement instantly terminates older sessions when duplicate credentials log in.

### Code Quality & Build Verification
- [ ] `npm run build` succeeds with 0 TypeScript errors and 0 build warnings.
- [ ] 100% test pass rate across unit, integration, and chaos simulation suites.
</USER_REQUEST>

## 2026-09-18T10:12:42Z

<USER_REQUEST>
This is a single self-contained fix; keep it small and focused.

Add administrative management capabilities for bidder teams in the TBI SEEP Auction platform, allowing admins to create new teams (with initial purse allocation and credentials) and edit existing teams (updating User ID, team name, password, and active status) with automated session and auth synchronization.

Working directory: /Users/kuberbhatt/Downloads/Clubs/TBI
Integrity mode: development

## Requirements

### R1. Administrative Backend Actions for Bidder Management
Implement secure server actions for creating and updating bidder teams, enforcing admin RBAC:
- **Creation (`createBidderTeamAction`)**: Authenticate caller as admin. Validate inputs (`displayUserId`, `teamName`, `password`). Check for duplicate `display_user_id`. Create Supabase Auth user via admin client, insert `profiles` record (`role: 'bidder'`, `is_active: true`, `session_version: 1`), initialize wallet in `bidder_wallets` (`locked_balance: 0`, `total_spent: 0`), log audit event in `account_activity_logs`, and revalidate `/admin` cache.
- **Update (`updateBidderTeamAction`)**: Authenticate caller as admin. Guard against modifying non-bidder accounts. Update `display_user_id` and Supabase Auth email if changed (checking duplicates). Update `team_name`. Update password if provided, and toggle `is_active`. Immediately invalidate active sessions on password change or deactivation.

### R2. Admin Roster Interface & Modals
Update the admin bidder roster interface in `src/components/admin/BidderRosterTable.tsx`:
- Add a "+ Add Bidder Team" header button with creation modal (Team Name, User ID with auto-suggestion, Password generator shortcut, Initial Purse).
- Add row-level Edit action with modal (User ID, Team Name, Password update, Active/Deactivated toggle).
- Replace hardcoded team count with dynamic `{bidders.length} Teams` and align UI styling with the eye-comfort matte sage palette.

## Verification Resources
- Build check: `npm run build`
- Security test suite: `npx tsx tests/security-remediation.ts`
- Financial simulation check: `npx tsx tests/simulation.ts`

## Acceptance Criteria

### Build & Integrity
- [ ] `npm run build` completes successfully with zero TypeScript or lint errors.
- [ ] `npx tsx tests/security-remediation.ts` passes, confirming RBAC and unauthenticated route protections.
- [ ] `npx tsx tests/simulation.ts` passes, verifying purse initialization adheres to the financial conservation invariant.

### Core Flows
- [ ] Creating a new bidder team assigns credentials, initializes wallet, and displays properly in the admin roster.
- [ ] Editing a team's User ID or password synchronizes with Supabase Auth and forces re-authentication where appropriate.
- [ ] Deactivating a team prevents further bidding and terminates active sessions.
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-09-18T15:42:42+05:30.
</ADDITIONAL_METADATA>
