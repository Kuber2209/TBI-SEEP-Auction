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
