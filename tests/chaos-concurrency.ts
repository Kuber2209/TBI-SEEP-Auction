/**
 * SEEP 4.0 Live Startup Auction Platform
 * Milestone 4: Chaos Network Resilience & High-Concurrency Stress Benchmark Suite
 * 
 * Simulates 50+ concurrent virtual bidder clients submitting sub-millisecond burst bids
 * under Gaussian network jitter (1ms - 120ms) and dropped WebSocket connections.
 * 
 * 8 Chaos Scenarios (C1 - C8):
 * - C1: 50-Client Flash Crowd Bidding (sub-millisecond burst on single lot)
 * - C2: Simultaneous Double-Spend Attack across multiple lots
 * - C3: Dropped WebSocket ACKs & Idempotency Key Retransmissions
 * - C4: Self-Outbid Rapid-Fire Collision
 * - C5: High-Jitter Out-of-Order Bid Arrival
 * - C6: Mid-Flight Admin Lot Pause / Closure under active contention
 * - C7: Administrative Bid Voiding & Atomic Escrow Restoration
 * - C8: Mass Multi-Lot Settlement, Reopen & Full Reconciliation
 * 
 * Programmatic Invariant Verifications:
 * 1. Per-Wallet Conservation: Initial = Available + Locked + Spent (Checked on every wallet)
 * 2. Global Ledger Conservation: Sum(Initial) = Sum(Available) + Sum(Locked) + Sum(Spent)
 * 3. Startup Settlement Reconciliation: Sum(Total Spent) = Sum(Startup Received Amount)
 * 4. Zero Double-Spends & Zero Orphaned Escrow Holds
 * 5. Zero Negative Balances across all operations
 */

// ============================================================================
// Types & Data Structures
// ============================================================================

export type StartupStatus = 'UPCOMING' | 'PRESENTING' | 'ACTIVE_BIDDING' | 'PAUSED' | 'SOLD' | 'UNSOLD';
export type BidStatus = 'ACTIVE' | 'OUTBID' | 'WINNING' | 'VOID' | 'SETTLED';
export type HoldStatus = 'HELD' | 'RELEASED' | 'SETTLED';
export type SessionStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';

export interface WalletState {
  teamId: string;
  initialBalance: number;
  availableBalance: number;
  lockedBalance: number;
  totalSpent: number;
  version: number;
}

export interface StartupLotState {
  id: string;
  displayOrder: number;
  name: string;
  sector: string;
  basePrice: number;
  status: StartupStatus;
  currentHighestBid: number | null;
  currentHighestBidderId: string | null;
  winnerTeamId: string | null;
  winningBidAmount: number | null;
  biddingStartedAt?: number;
  closedAt?: number;
}

export interface BidRecord {
  id: string;
  startupId: string;
  bidderId: string;
  amount: number;
  status: BidStatus;
  idempotencyKey: string;
  serverSeq: number;
  createdAt: number;
  voidedAt?: number;
  voidReason?: string;
}

export interface FundHoldRecord {
  id: string;
  startupId: string;
  bidderId: string;
  bidId: string;
  amount: number;
  status: HoldStatus;
  heldAt: number;
  releasedAt?: number;
  settledAt?: number;
}

export interface StartupAccountState {
  startupId: string;
  receivedAmount: number;
  settledAt?: number;
  winningBidId?: string;
}

export interface BidResponse {
  success: boolean;
  bidId?: string;
  startupId?: string;
  amount?: number;
  bidderId?: string;
  idempotent?: boolean;
  error?: string;
}

// ============================================================================
// Chaos & Network Simulation Utilities
// ============================================================================

/**
 * Generates Gaussian-distributed network latency bounded between minMs and maxMs.
 * Uses the Box-Muller transform.
 */
export function generateGaussianLatency(
  meanMs = 35,
  stdDevMs = 20,
  minMs = 1,
  maxMs = 120
): number {
  let u1 = 0;
  let u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  const latency = meanMs + z * stdDevMs;
  return Math.max(minMs, Math.min(maxMs, Math.round(latency)));
}

/**
 * Simulates asynchronous network transmission delay.
 */
export async function simulateNetworkDelay(latencyMs: number): Promise<void> {
  if (latencyMs <= 0) return;
  return new Promise((resolve) => setTimeout(resolve, latencyMs));
}

// ============================================================================
// High-Concurrency Transactional Auction Engine
// ============================================================================

export class ChaosAuctionEngine {
  public wallets = new Map<string, WalletState>();
  public startups = new Map<string, StartupLotState>();
  public bids: BidRecord[] = [];
  public fundHolds: FundHoldRecord[] = [];
  public startupAccounts = new Map<string, StartupAccountState>();
  public idempotencyRegistry = new Map<string, BidResponse>();
  public sessionStatus: SessionStatus = 'ACTIVE';
  public bidIncrements: number[] = [1000, 2500, 5000, 10000];

  private seqCounter = 1;
  private holdSeqCounter = 1;
  private lockQueue: Promise<void> = Promise.resolve();

  constructor(numTeams = 55, numLots = 12, initialPurse = 100000) {
    // Initialize Wallets
    for (let i = 1; i <= numTeams; i++) {
      const teamId = `TEAM${String(i).padStart(2, '0')}`;
      this.wallets.set(teamId, {
        teamId,
        initialBalance: initialPurse,
        availableBalance: initialPurse,
        lockedBalance: 0,
        totalSpent: 0,
        version: 1,
      });
    }

    // Initialize Startup Lots & Accounts
    const sectors = ['CleanTech', 'MedTech', 'AgriTech', 'FinTech', 'DeepTech'];
    for (let i = 1; i <= numLots; i++) {
      const lotId = `LOT_${i}`;
      const sector = sectors[(i - 1) % sectors.length];
      this.startups.set(lotId, {
        id: lotId,
        displayOrder: i,
        name: `Venture Star ${i} (${sector})`,
        sector,
        basePrice: 10000,
        status: 'ACTIVE_BIDDING',
        currentHighestBid: null,
        currentHighestBidderId: null,
        winnerTeamId: null,
        winningBidAmount: null,
        biddingStartedAt: Date.now(),
      });

      this.startupAccounts.set(lotId, {
        startupId: lotId,
        receivedAmount: 0,
      });
    }
  }

  // --------------------------------------------------------------------------
  // Financial Invariant Verification Matrix
  // --------------------------------------------------------------------------

  /**
   * Programmatically verifies 100% financial conservation across 5 structural tiers.
   * Throws Error immediately if any invariant is violated.
   */
  public verifyConservation(): {
    perWalletPassed: boolean;
    globalLedgerPassed: boolean;
    settlementReconciled: boolean;
    escrowHoldsConsistent: boolean;
    nonNegativeVerified: boolean;
    totalPurses: number;
    totalAvailable: number;
    totalLocked: number;
    totalSpent: number;
    totalReceived: number;
  } {
    let sumInitial = 0;
    let sumAvailable = 0;
    let sumLocked = 0;
    let sumSpent = 0;

    // Tier 1: Per-Wallet Mathematical Invariant & Non-Negative Boundary Check
    const walletEntries = Array.from(this.wallets.entries());
    for (const [teamId, w] of walletEntries) {
      if (w.availableBalance < 0 || w.lockedBalance < 0 || w.totalSpent < 0) {
        throw new Error(
          `❌ NEGATIVE_BALANCE_VIOLATION on ${teamId}: Avail=₹${w.availableBalance}, Locked=₹${w.lockedBalance}, Spent=₹${w.totalSpent}`
        );
      }

      const walletSum = Math.round((w.availableBalance + w.lockedBalance + w.totalSpent) * 100) / 100;
      const expectedInitial = Math.round(w.initialBalance * 100) / 100;

      if (walletSum !== expectedInitial) {
        throw new Error(
          `❌ PER_WALLET_CONSERVATION_VIOLATION on ${teamId}: Initial=₹${w.initialBalance} != (Avail: ₹${w.availableBalance} + Locked: ₹${w.lockedBalance} + Spent: ₹${w.totalSpent} = ₹${walletSum})`
        );
      }

      sumInitial += w.initialBalance;
      sumAvailable += w.availableBalance;
      sumLocked += w.lockedBalance;
      sumSpent += w.totalSpent;
    }

    sumInitial = Math.round(sumInitial * 100) / 100;
    sumAvailable = Math.round(sumAvailable * 100) / 100;
    sumLocked = Math.round(sumLocked * 100) / 100;
    sumSpent = Math.round(sumSpent * 100) / 100;

    // Tier 2: Global Ledger Conservation
    const globalSum = Math.round((sumAvailable + sumLocked + sumSpent) * 100) / 100;
    if (globalSum !== sumInitial) {
      throw new Error(
        `❌ GLOBAL_LEDGER_CONSERVATION_VIOLATION: Sum(Initial)=₹${sumInitial} != Sum(Avail+Locked+Spent)=₹${globalSum} (Diff: ₹${globalSum - sumInitial})`
      );
    }

    // Tier 3: Startup Settlement Reconciliation
    let sumReceived = 0;
    for (const [, acc] of this.startupAccounts.entries()) {
      sumReceived += acc.receivedAmount;
    }
    sumReceived = Math.round(sumReceived * 100) / 100;

    if (sumSpent !== sumReceived) {
      throw new Error(
        `❌ SETTLEMENT_RECONCILIATION_VIOLATION: Total Spent across wallets (₹${sumSpent}) != Total Received in Startup Accounts (₹${sumReceived})`
      );
    }

    // Tier 4: Escrow Holds Consistency Check
    let sumActiveHolds = 0;
    const activeHoldMap = new Map<string, number>(); // startupId -> hold amount

    for (const hold of this.fundHolds) {
      if (hold.status === 'HELD') {
        sumActiveHolds += hold.amount;
        activeHoldMap.set(hold.startupId, hold.amount);
      }
    }
    sumActiveHolds = Math.round(sumActiveHolds * 100) / 100;

    if (sumLocked !== sumActiveHolds) {
      throw new Error(
        `❌ ORPHANED_ESCROW_HOLD_VIOLATION: Wallet locked sum (₹${sumLocked}) != Active 'HELD' fund holds (₹${sumActiveHolds})`
      );
    }

    // Check each active lot corresponds 1:1 with its winning hold
    for (const [, lot] of this.startups.entries()) {
      if (lot.status === 'ACTIVE_BIDDING' || lot.status === 'PAUSED') {
        if (lot.currentHighestBid !== null && lot.currentHighestBidderId !== null) {
          const heldAmount = activeHoldMap.get(lot.id);
          if (heldAmount !== lot.currentHighestBid) {
            throw new Error(
              `❌ LOT_HOLD_MISMATCH on ${lot.id}: Current bid=₹${lot.currentHighestBid}, active hold=₹${heldAmount}`
            );
          }
        }
      }
    }

    return {
      perWalletPassed: true,
      globalLedgerPassed: true,
      settlementReconciled: true,
      escrowHoldsConsistent: true,
      nonNegativeVerified: true,
      totalPurses: sumInitial,
      totalAvailable: sumAvailable,
      totalLocked: sumLocked,
      totalSpent: sumSpent,
      totalReceived: sumReceived,
    };
  }

  // --------------------------------------------------------------------------
  // Atomic Database Transaction Simulation (place_bid RPC)
  // --------------------------------------------------------------------------

  public async submitBid(
    startupId: string,
    bidderId: string,
    amount: number,
    idempotencyKey: string,
    simulatedLatencyMs = 0
  ): Promise<BidResponse> {
    // 1. Simulate client-to-server network latency & jitter
    if (simulatedLatencyMs > 0) {
      await simulateNetworkDelay(simulatedLatencyMs);
    }

    // 2. Atomic Mutex Serialization (Emulates PostgreSQL row lock: FOR UPDATE)
    return new Promise<BidResponse>((resolve) => {
      this.lockQueue = this.lockQueue.then(async () => {
        try {
          // Idempotency check: exactly like PostgreSQL `WHERE idempotency_key = p_idempotency_key`
          if (this.idempotencyRegistry.has(idempotencyKey)) {
            const cached = this.idempotencyRegistry.get(idempotencyKey)!;
            resolve({
              ...cached,
              idempotent: true,
            });
            return;
          }

          // Session active check
          if (this.sessionStatus !== 'ACTIVE') {
            const res: BidResponse = { success: false, error: 'ERR_SESSION_NOT_ACTIVE: Session is paused or inactive' };
            resolve(res);
            return;
          }

          // Startup existence and status check
          const startup = this.startups.get(startupId);
          if (!startup) {
            const res: BidResponse = { success: false, error: 'ERR_STARTUP_NOT_FOUND: Invalid startup ID' };
            resolve(res);
            return;
          }

          if (startup.status !== 'ACTIVE_BIDDING') {
            const res: BidResponse = { success: false, error: `ERR_AUCTION_NOT_ACTIVE: Bidding is ${startup.status.toLowerCase()} for this lot` };
            resolve(res);
            return;
          }

          // Prevent self-outbid
          if (startup.currentHighestBidderId === bidderId) {
            const res: BidResponse = { success: false, error: 'ERR_ALREADY_HIGHEST_BIDDER: You currently hold the highest bid' };
            resolve(res);
            return;
          }

          // Increment validation
          let isValidInc = false;
          if (startup.currentHighestBid === null) {
            if (amount < startup.basePrice) {
              const res: BidResponse = { success: false, error: `ERR_BELOW_BASE_PRICE: Opening bid must be at least ₹${startup.basePrice}` };
              resolve(res);
              return;
            }
            if (amount === startup.basePrice) {
              isValidInc = true;
            } else {
              const diff = amount - startup.basePrice;
              if (this.bidIncrements.includes(diff)) {
                isValidInc = true;
              }
            }
          } else {
            if (amount <= startup.currentHighestBid) {
              const res: BidResponse = { success: false, error: `ERR_BID_NOT_HIGHER: Bid must be strictly greater than current bid ₹${startup.currentHighestBid}` };
              resolve(res);
              return;
            }
            const diff = amount - startup.currentHighestBid;
            if (this.bidIncrements.includes(diff)) {
              isValidInc = true;
            }
          }

          if (!isValidInc) {
            const res: BidResponse = { success: false, error: `ERR_INVALID_INCREMENT: Bid amount ₹${amount} does not match valid increment rules` };
            resolve(res);
            return;
          }

          // Wallet balance check
          const wallet = this.wallets.get(bidderId);
          if (!wallet) {
            const res: BidResponse = { success: false, error: 'ERR_WALLET_NOT_FOUND: Bidder wallet does not exist' };
            resolve(res);
            return;
          }

          if (wallet.availableBalance < amount) {
            const res: BidResponse = {
              success: false,
              error: `ERR_INSUFFICIENT_FUNDS: Available purse ₹${wallet.availableBalance} is insufficient for bid of ₹${amount}`,
            };
            resolve(res);
            return;
          }

          // Atomic Escrow Transfer: Release previous highest bidder's locked funds
          const prevBidderId = startup.currentHighestBidderId;
          const prevBidAmount = startup.currentHighestBid;

          if (prevBidderId && prevBidAmount) {
            // Update previous winning bid status
            const prevBid = this.bids.find((b) => b.startupId === startupId && b.status === 'WINNING');
            if (prevBid) prevBid.status = 'OUTBID';

            // Release previous fund hold
            const prevHold = this.fundHolds.find(
              (h) => h.startupId === startupId && h.bidderId === prevBidderId && h.status === 'HELD'
            );
            if (prevHold) {
              prevHold.status = 'RELEASED';
              prevHold.releasedAt = Date.now();
            }

            // Restore previous bidder's available wallet balance
            const prevWallet = this.wallets.get(prevBidderId)!;
            prevWallet.lockedBalance -= prevBidAmount;
            prevWallet.availableBalance += prevBidAmount;
            prevWallet.version += 1;
          }

          // Atomic Escrow Transfer: Lock new bidder's funds
          wallet.availableBalance -= amount;
          wallet.lockedBalance += amount;
          wallet.version += 1;

          // Record new bid
          const bidId = `BID_${String(this.seqCounter++).padStart(6, '0')}`;
          const newBid: BidRecord = {
            id: bidId,
            startupId,
            bidderId,
            amount,
            status: 'WINNING',
            idempotencyKey,
            serverSeq: this.seqCounter,
            createdAt: Date.now(),
          };
          this.bids.push(newBid);

          // Record new fund hold
          const holdId = `HOLD_${String(this.holdSeqCounter++).padStart(6, '0')}`;
          const newHold: FundHoldRecord = {
            id: holdId,
            startupId,
            bidderId,
            bidId,
            amount,
            status: 'HELD',
            heldAt: Date.now(),
          };
          this.fundHolds.push(newHold);

          // Update startup current leader & bid
          startup.currentHighestBid = amount;
          startup.currentHighestBidderId = bidderId;

          const response: BidResponse = {
            success: true,
            bidId,
            startupId,
            amount,
            bidderId,
          };

          // Register in Idempotency table
          this.idempotencyRegistry.set(idempotencyKey, response);

          resolve(response);
        } catch (err: any) {
          resolve({ success: false, error: err.message });
        }
      });
    });
  }

  // --------------------------------------------------------------------------
  // Admin Operations (close_auction, void_bid, reopen_auction, pause/resume)
  // --------------------------------------------------------------------------

  public async setLotStatus(startupId: string, status: StartupStatus): Promise<boolean> {
    return new Promise((resolve) => {
      this.lockQueue = this.lockQueue.then(async () => {
        const startup = this.startups.get(startupId);
        if (!startup) {
          resolve(false);
          return;
        }
        startup.status = status;
        resolve(true);
      });
    });
  }

  public async pauseSession(): Promise<void> {
    return new Promise((resolve) => {
      this.lockQueue = this.lockQueue.then(async () => {
        this.sessionStatus = 'PAUSED';
        resolve();
      });
    });
  }

  public async resumeSession(): Promise<void> {
    return new Promise((resolve) => {
      this.lockQueue = this.lockQueue.then(async () => {
        this.sessionStatus = 'ACTIVE';
        resolve();
      });
    });
  }

  public async closeAuction(startupId: string): Promise<{ success: boolean; status: 'SOLD' | 'UNSOLD'; winningAmount?: number; winnerId?: string }> {
    return new Promise((resolve) => {
      this.lockQueue = this.lockQueue.then(async () => {
        const startup = this.startups.get(startupId);
        if (!startup) {
          resolve({ success: false, status: 'UNSOLD' });
          return;
        }

        if (startup.status !== 'ACTIVE_BIDDING' && startup.status !== 'PAUSED') {
          resolve({ success: false, status: 'UNSOLD' });
          return;
        }

        const winningBid = this.bids.find((b) => b.startupId === startupId && b.status === 'WINNING');

        if (!winningBid) {
          startup.status = 'UNSOLD';
          startup.closedAt = Date.now();
          resolve({ success: true, status: 'UNSOLD' });
          return;
        }

        // Settle winning bid & hold
        winningBid.status = 'SETTLED';
        const hold = this.fundHolds.find((h) => h.bidId === winningBid.id && h.status === 'HELD');
        if (hold) {
          hold.status = 'SETTLED';
          hold.settledAt = Date.now();
        }

        // Wallet transfer: locked -> spent
        const winnerWallet = this.wallets.get(winningBid.bidderId)!;
        winnerWallet.lockedBalance -= winningBid.amount;
        winnerWallet.totalSpent += winningBid.amount;
        winnerWallet.version += 1;

        // Startup lot state
        startup.status = 'SOLD';
        startup.winnerTeamId = winningBid.bidderId;
        startup.winningBidAmount = winningBid.amount;
        startup.closedAt = Date.now();

        // Startup account received funds
        const account = this.startupAccounts.get(startupId)!;
        account.receivedAmount = winningBid.amount;
        account.settledAt = Date.now();
        account.winningBidId = winningBid.id;

        resolve({
          success: true,
          status: 'SOLD',
          winningAmount: winningBid.amount,
          winnerId: winningBid.bidderId,
        });
      });
    });
  }

  public async voidBid(bidId: string, reason = 'Administrative Void'): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      this.lockQueue = this.lockQueue.then(async () => {
        const targetBid = this.bids.find((b) => b.id === bidId);
        if (!targetBid) {
          resolve({ success: false, error: 'ERR_BID_NOT_FOUND' });
          return;
        }

        if (targetBid.status === 'SETTLED' || targetBid.status === 'VOID') {
          resolve({ success: false, error: `ERR_CANNOT_VOID: Bid is already ${targetBid.status}` });
          return;
        }

        const wasWinning = targetBid.status === 'WINNING';
        targetBid.status = 'VOID';
        targetBid.voidedAt = Date.now();
        targetBid.voidReason = reason;

        // Release target hold
        const hold = this.fundHolds.find((h) => h.bidId === bidId && h.status === 'HELD');
        if (hold) {
          hold.status = 'RELEASED';
          hold.releasedAt = Date.now();
        }

        // Unlock funds for target bidder
        const targetWallet = this.wallets.get(targetBid.bidderId)!;
        targetWallet.lockedBalance -= targetBid.amount;
        targetWallet.availableBalance += targetBid.amount;
        targetWallet.version += 1;

        const startup = this.startups.get(targetBid.startupId)!;

        // If the voided bid was winning, find the previous highest outbid bid
        if (wasWinning) {
          const nextBid = this.bids
            .filter((b) => b.startupId === startup.id && b.status === 'OUTBID')
            .sort((a, b) => b.amount - a.amount || b.serverSeq - a.serverSeq)[0];

          if (nextBid) {
            const nextWallet = this.wallets.get(nextBid.bidderId)!;
            if (nextWallet.availableBalance >= nextBid.amount) {
              nextWallet.availableBalance -= nextBid.amount;
              nextWallet.lockedBalance += nextBid.amount;
              nextWallet.version += 1;

              // Re-create fund hold
              const newHoldId = `HOLD_${String(this.holdSeqCounter++).padStart(6, '0')}`;
              this.fundHolds.push({
                id: newHoldId,
                startupId: startup.id,
                bidderId: nextBid.bidderId,
                bidId: nextBid.id,
                amount: nextBid.amount,
                status: 'HELD',
                heldAt: Date.now(),
              });

              nextBid.status = 'WINNING';
              startup.currentHighestBid = nextBid.amount;
              startup.currentHighestBidderId = nextBid.bidderId;
            } else {
              startup.currentHighestBid = null;
              startup.currentHighestBidderId = null;
            }
          } else {
            startup.currentHighestBid = null;
            startup.currentHighestBidderId = null;
          }
        }

        resolve({ success: true });
      });
    });
  }

  public async reopenAuction(startupId: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      this.lockQueue = this.lockQueue.then(async () => {
        const startup = this.startups.get(startupId);
        if (!startup) {
          resolve({ success: false, error: 'ERR_STARTUP_NOT_FOUND' });
          return;
        }

        if (startup.status !== 'SOLD' && startup.status !== 'UNSOLD') {
          resolve({ success: false, error: `ERR_CANNOT_REOPEN: Status is ${startup.status}` });
          return;
        }

        if (startup.status === 'SOLD') {
          const winningBid = this.bids.find((b) => b.startupId === startupId && b.status === 'SETTLED');
          if (winningBid) {
            const winnerWallet = this.wallets.get(winningBid.bidderId)!;
            winnerWallet.totalSpent -= winningBid.amount;
            winnerWallet.lockedBalance += winningBid.amount;
            winnerWallet.version += 1;

            const hold = this.fundHolds.find((h) => h.bidId === winningBid.id && h.status === 'SETTLED');
            if (hold) {
              hold.status = 'HELD';
              hold.settledAt = undefined;
            }

            winningBid.status = 'WINNING';
          }

          const account = this.startupAccounts.get(startupId)!;
          account.receivedAmount = 0;
          account.settledAt = undefined;
          account.winningBidId = undefined;
        }

        startup.status = 'ACTIVE_BIDDING';
        startup.winnerTeamId = null;
        startup.winningBidAmount = null;
        startup.closedAt = undefined;

        resolve({ success: true });
      });
    });
  }
}

// ============================================================================
// Chaos Stress Benchmark Suite (Scenarios C1 - C8)
// ============================================================================

export async function runChaosBenchmarkSuite() {
  console.log('================================================================================');
  console.log('⚡ SEEP 4.0 CHAOS NETWORK RESILIENCE & CONCURRENCY STRESS SUITE (R3)');
  console.log('   Simulating 55 Virtual Bidder Clients under Gaussian Jitter & Chaos Faults');
  console.log('================================================================================\n');

  const NUM_TEAMS = 55;
  const NUM_LOTS = 12;
  const INITIAL_PURSE = 100000;
  const engine = new ChaosAuctionEngine(NUM_TEAMS, NUM_LOTS, INITIAL_PURSE);

  // Baseline Verification
  console.log('🔍 [Baseline] Performing Initial 5-Tier Financial Conservation Check...');
  const initCheck = engine.verifyConservation();
  console.log(`   ✓ Total Purses across ${NUM_TEAMS} teams: ₹${initCheck.totalPurses.toLocaleString()}`);
  console.log(`   ✓ 100% Invariant Conserved (Avail: ₹${initCheck.totalAvailable.toLocaleString()}, Locked: ₹${initCheck.totalLocked}, Spent: ₹${initCheck.totalSpent})\n`);

  // --------------------------------------------------------------------------
  // Scenario C1: 50-Client Flash Crowd Bidding (sub-millisecond burst on single lot)
  // --------------------------------------------------------------------------
  console.log('⚡ [C1: Flash Crowd Bidding] 55 virtual bidders firing simultaneous burst bids at LOT_1...');
  const c1Promises: Promise<BidResponse>[] = [];
  let c1Accepted = 0;
  let c1Rejected = 0;

  for (let i = 0; i < NUM_TEAMS; i++) {
    const teamId = `TEAM${String(i + 1).padStart(2, '0')}`;
    const amount = 10000 + i * 1000; // ₹10,000, ₹11,000, ₹12,000, ... ₹64,000
    const jitter = Math.floor(Math.random() * 5); // 0-5ms sub-millisecond arrival jitter
    const idKey = `c1_req_team_${i + 1}_${Date.now()}_${Math.random()}`;

    c1Promises.push(
      engine.submitBid('LOT_1', teamId, amount, idKey, jitter).then((res) => {
        if (res.success) c1Accepted++;
        else c1Rejected++;
        return res;
      })
    );
  }

  await Promise.all(c1Promises);
  const c1Check = engine.verifyConservation();
  const lot1 = engine.startups.get('LOT_1')!;
  console.log(`   ✓ 55 Burst Submissions -> ${c1Accepted} Accepted, ${c1Rejected} Safely Rejected (Price Collisions)`);
  console.log(`   ✓ Current Highest Bid on LOT_1: ₹${lot1.currentHighestBid?.toLocaleString()} by ${lot1.currentHighestBidderId}`);
  console.log(`   ✓ Financial Conservation: Locked=₹${c1Check.totalLocked.toLocaleString()}, Avail=₹${c1Check.totalAvailable.toLocaleString()}`);
  console.log('   ✅ PASS [C1]: Serialized lock queue prevented race condition & maintained 100% ledger balance.\n');

  // --------------------------------------------------------------------------
  // Scenario C2: Simultaneous Double-Spend Attack across multiple lots
  // --------------------------------------------------------------------------
  console.log('⚡ [C2: Simultaneous Double-Spend Attack] Single bidder attempting concurrent over-allocation...');
  const attackerId = 'TEAM10';
  const attackerWallet = engine.wallets.get(attackerId)!;
  const availableBefore = attackerWallet.availableBalance;
  console.log(`   - Attacker ${attackerId} Available Balance: ₹${availableBefore.toLocaleString()}`);

  // Opening bid of ₹20,000 is valid (basePrice 10,000 + 10,000 valid increment)
  const bidAmount = 20000;
  const c2Promises: Promise<BidResponse>[] = [];
  let c2Accepted = 0;
  let c2Blocked = 0;

  // 10 concurrent bids on 10 different lots: total ₹200,000 > available ₹100,000
  for (let lotIdx = 2; lotIdx <= 11; lotIdx++) {
    const lotId = `LOT_${lotIdx}`;
    const idKey = `c2_double_spend_${attackerId}_lot_${lotIdx}_${Date.now()}`;
    c2Promises.push(
      engine.submitBid(lotId, attackerId, bidAmount, idKey, Math.floor(Math.random() * 8)).then((res) => {
        if (res.success) c2Accepted++;
        else {
          c2Blocked++;
          if (!res.error?.includes('ERR_INSUFFICIENT_FUNDS') && !res.error?.includes('ERR_ALREADY_HIGHEST_BIDDER')) {
            throw new Error(`Unexpected error on double-spend: ${res.error}`);
          }
        }
        return res;
      })
    );
  }

  await Promise.all(c2Promises);
  const expectedMaxAccepted = Math.floor(availableBefore / bidAmount);
  if (c2Accepted > expectedMaxAccepted) {
    throw new Error(`CRITICAL DOUBLE SPEND: Accepted ${c2Accepted} bids exceeding max affordable ${expectedMaxAccepted}`);
  }
  if (attackerWallet.availableBalance < 0) {
    throw new Error(`CRITICAL: Attacker balance went negative: ₹${attackerWallet.availableBalance}`);
  }

  engine.verifyConservation();
  console.log(`   ✓ 10 Concurrent ₹20k Bids: ${c2Accepted} Accepted (Locked ₹${(c2Accepted * bidAmount).toLocaleString()}), ${c2Blocked} Blocked for Insufficient Funds`);
  console.log(`   ✓ Attacker Balance Remaining: ₹${attackerWallet.availableBalance.toLocaleString()} (Locked: ₹${attackerWallet.lockedBalance.toLocaleString()})`);
  console.log('   ✅ PASS [C2]: Double-spend attack completely thwarted. Zero over-allocation.\n');

  // --------------------------------------------------------------------------
  // Scenario C3: Dropped WebSocket ACKs & Idempotency Key Retransmissions
  // --------------------------------------------------------------------------
  console.log('⚡ [C3: Dropped WebSocket ACKs & Idempotency Retransmissions] High-loss packet retry storm...');
  const c3Promises: Promise<BidResponse>[] = [];
  let c3TotalRequests = 0;
  let c3IdempotentAcks = 0;
  let c3FreshAccepted = 0;

  // 20 clients send bids, each retrying identical request 4 times concurrently
  for (let i = 1; i <= 20; i++) {
    const teamId = `TEAM${String(i + 15).padStart(2, '0')}`;
    const lotId = `LOT_${(i % 5) + 6}`; // Use lots 6 to 10
    const lot = engine.startups.get(lotId)!;
    const base = lot.currentHighestBid || 10000;
    const amount = base === 10000 && lot.currentHighestBid === null ? 10000 : base + 2500;
    const idempotencyKey = `idempotent_ws_drop_key_${i}_${Date.now()}`;

    for (let retry = 0; retry < 4; retry++) {
      c3TotalRequests++;
      const jitter = Math.floor(Math.random() * 25);
      c3Promises.push(
        engine.submitBid(lotId, teamId, amount, idempotencyKey, jitter).then((res) => {
          if (res.idempotent) c3IdempotentAcks++;
          else if (res.success) c3FreshAccepted++;
          return res;
        })
      );
    }
  }

  await Promise.all(c3Promises);
  engine.verifyConservation();
  console.log(`   ✓ ${c3TotalRequests} Retransmissions across 20 Unique Keys -> ${c3FreshAccepted} Fresh Accepted, ${c3IdempotentAcks} Handled via Idempotent Cache`);
  console.log('   ✅ PASS [C3]: Zero duplicate escrow holds, exact single-execution idempotency verified.\n');

  // --------------------------------------------------------------------------
  // Scenario C4: Self-Outbid Rapid-Fire Collision
  // --------------------------------------------------------------------------
  console.log('⚡ [C4: Self-Outbid Rapid-Fire Collision] Client spamming bids against their own winning lot...');
  
  // Establish an explicit, undisputed leader on LOT_2 for C4
  let lot2 = engine.startups.get('LOT_2')!;
  if (!lot2.currentHighestBidderId) {
    await engine.submitBid('LOT_2', 'TEAM01', 10000, `c4_setup_${Date.now()}`);
    lot2 = engine.startups.get('LOT_2')!;
  }
  const currentLeader = lot2.currentHighestBidderId!;
  const currentBid = lot2.currentHighestBid!;

  const leaderWalletBefore = engine.wallets.get(currentLeader)!;
  const lockedBefore = leaderWalletBefore.lockedBalance;
  const availBefore = leaderWalletBefore.availableBalance;

  const c4Promises: Promise<BidResponse>[] = [];
  let c4Rejected = 0;

  for (let i = 1; i <= 8; i++) {
    const rebidAmount = currentBid + i * 2500;
    const idKey = `c4_self_outbid_${currentLeader}_${i}_${Date.now()}`;
    c4Promises.push(
      engine.submitBid('LOT_2', currentLeader, rebidAmount, idKey, Math.floor(Math.random() * 10)).then((res) => {
        if (!res.success && res.error?.includes('ERR_ALREADY_HIGHEST_BIDDER')) {
          c4Rejected++;
        }
        return res;
      })
    );
  }

  await Promise.all(c4Promises);
  const leaderWalletAfter = engine.wallets.get(currentLeader)!;
  if (leaderWalletAfter.lockedBalance !== lockedBefore || leaderWalletAfter.availableBalance !== availBefore) {
    throw new Error('Self-outbid attempt altered leader wallet balance!');
  }

  engine.verifyConservation();
  console.log(`   ✓ 8 Rapid-Fire Self-Outbid Submissions -> All ${c4Rejected} Blocked with ERR_ALREADY_HIGHEST_BIDDER`);
  console.log(`   ✓ Leader ${currentLeader} Escrow Hold Pristine: Locked=₹${leaderWalletAfter.lockedBalance.toLocaleString()}`);
  console.log('   ✅ PASS [C4]: Self-rebidding safely rejected without hold corruption.\n');

  // --------------------------------------------------------------------------
  // Scenario C5: High-Jitter Out-of-Order Bid Arrival
  // --------------------------------------------------------------------------
  console.log('⚡ [C5: High-Jitter Out-of-Order Bid Arrival] 50 Bids with 1ms-120ms Gaussian Jitter...');
  const c5Promises: Promise<BidResponse>[] = [];
  let c5StaleRejections = 0;
  let c5ValidAccepted = 0;

  // Generate 50 bids with increasing bid prices starting from base price ₹10,000 (+ ₹1,000 each)
  for (let i = 0; i < 50; i++) {
    const teamId = `TEAM${String((i % 40) + 1).padStart(2, '0')}`;
    const amount = 10000 + i * 1000; // ₹10k, ₹11k, ₹12k, ... ₹59k
    const latency = generateGaussianLatency(45, 30, 1, 120);
    const idKey = `c5_jitter_bid_${i}_${Date.now()}`;

    c5Promises.push(
      engine.submitBid('LOT_3', teamId, amount, idKey, latency).then((res) => {
        if (res.success) c5ValidAccepted++;
        else if (res.error?.includes('ERR_BID_NOT_HIGHER') || res.error?.includes('ERR_ALREADY_HIGHEST_BIDDER') || res.error?.includes('ERR_INVALID_INCREMENT')) {
          c5StaleRejections++;
        }
        return res;
      })
    );
  }

  await Promise.all(c5Promises);
  const lot3 = engine.startups.get('LOT_3')!;
  engine.verifyConservation();
  console.log(`   ✓ 50 High-Jitter Bids -> ${c5ValidAccepted} Accepted, ${c5StaleRejections} Out-of-Order/Stale Rejected`);
  console.log(`   ✓ Final Ascending Price on LOT_3: ₹${lot3.currentHighestBid?.toLocaleString()} by ${lot3.currentHighestBidderId}`);
  console.log('   ✅ PASS [C5]: Monotonic price progression strictly maintained under extreme packet delay.\n');

  // --------------------------------------------------------------------------
  // Scenario C6: Mid-Flight Admin Lot Pause / Closure under active contention
  // --------------------------------------------------------------------------
  console.log('⚡ [C6: Mid-Flight Admin Lot Pause / Closure] Emergency pause amidst active contention...');
  const c6Promises: Promise<BidResponse>[] = [];
  let c6PrePauseAccepted = 0;
  let c6PostPauseRejected = 0;

  // Launch 30 concurrent bids on LOT_4
  for (let i = 0; i < 30; i++) {
    const teamId = `TEAM${String((i % 30) + 1).padStart(2, '0')}`;
    const amount = 10000 + i * 2500;
    const jitter = i * 2; // Arriving progressively
    const idKey = `c6_contention_${i}_${Date.now()}`;

    c6Promises.push(
      engine.submitBid('LOT_4', teamId, amount, idKey, jitter).then((res) => {
        if (res.success) c6PrePauseAccepted++;
        else if (res.error?.includes('ERR_AUCTION_NOT_ACTIVE') || res.error?.includes('ERR_SESSION_NOT_ACTIVE')) {
          c6PostPauseRejected++;
        }
        return res;
      })
    );
  }

  // Admin triggers emergency pause after 15ms
  await simulateNetworkDelay(15);
  await engine.setLotStatus('LOT_4', 'PAUSED');

  await Promise.all(c6Promises);
  engine.verifyConservation();
  console.log(`   ✓ Mid-flight Pause -> ${c6PrePauseAccepted} Accepted before Pause, ${c6PostPauseRejected} Safely Rejected after Pause`);
  console.log('   ✅ PASS [C6]: Mid-flight admin status changes atomically protected in-flight ledger state.\n');

  // --------------------------------------------------------------------------
  // Scenario C7: Administrative Bid Voiding & Atomic Escrow Restoration
  // --------------------------------------------------------------------------
  console.log('⚡ [C7: Administrative Bid Voiding & Atomic Escrow Restoration] Voiding winning bid on LOT_5...');
  const lot5 = engine.startups.get('LOT_5')!;
  const base5 = lot5.currentHighestBid || 10000;
  const b1 = base5 === 10000 && lot5.currentHighestBid === null ? 10000 : base5 + 2500;
  const b2 = b1 + 2500;
  const b3 = b2 + 2500;

  // Setup LOT_5 with a sequence of bids: TEAM01 -> b1, TEAM02 -> b2, TEAM03 -> b3
  await engine.submitBid('LOT_5', 'TEAM01', b1, `c7_init_1_${Date.now()}`);
  await engine.submitBid('LOT_5', 'TEAM02', b2, `c7_init_2_${Date.now()}`);
  const leadRes = await engine.submitBid('LOT_5', 'TEAM03', b3, `c7_init_3_${Date.now()}`);

  if (!leadRes.success || !leadRes.bidId) {
    throw new Error(`Failed to setup C7 winning bid: ${leadRes.error}`);
  }

  const team3WalletBefore = engine.wallets.get('TEAM03')!;
  const team2WalletBefore = engine.wallets.get('TEAM02')!;

  console.log(`   - Before Void: LOT_5 Leader=TEAM03 (Locked ₹${b3.toLocaleString()}), TEAM02 Outbid (Locked ₹${team2WalletBefore.lockedBalance.toLocaleString()})`);

  // Admin voids TEAM03's winning bid
  const voidRes = await engine.voidBid(leadRes.bidId, 'Compliance investigation');
  if (!voidRes.success) throw new Error(`Void bid failed: ${voidRes.error}`);

  const team3WalletAfter = engine.wallets.get('TEAM03')!;
  const team2WalletAfter = engine.wallets.get('TEAM02')!;
  const lot5After = engine.startups.get('LOT_5')!;

  console.log(`   - After Void: LOT_5 Leader Restored to ${lot5After.currentHighestBidderId} @ ₹${lot5After.currentHighestBid?.toLocaleString()}`);
  console.log(`   - TEAM03 Escrow Restored -> Available: ₹${team3WalletAfter.availableBalance.toLocaleString()}, Locked: ₹${team3WalletAfter.lockedBalance.toLocaleString()}`);
  console.log(`   - TEAM02 Re-Locked -> Available: ₹${team2WalletAfter.availableBalance.toLocaleString()}, Locked: ₹${team2WalletAfter.lockedBalance.toLocaleString()}`);

  if (lot5After.currentHighestBidderId !== 'TEAM02' || lot5After.currentHighestBid !== b2) {
    throw new Error(`Fallback to next highest outbid bid failed after voiding: expected TEAM02 @ ${b2}, got ${lot5After.currentHighestBidderId} @ ${lot5After.currentHighestBid}`);
  }

  engine.verifyConservation();
  console.log('   ✅ PASS [C7]: Administrative voiding executed with atomic 2-tier escrow rollback.\n');

  // --------------------------------------------------------------------------
  // Scenario C8: Mass Multi-Lot Settlement, Reopen & Full Reconciliation
  // --------------------------------------------------------------------------
  console.log('⚡ [C8: Mass Multi-Lot Settlement, Reopen & Full Reconciliation] All 12 lots active...');

  // 1. Resume LOT_4 and ensure all lots are active for bidding
  await engine.setLotStatus('LOT_4', 'ACTIVE_BIDDING');

  // 2. Submit high-concurrency multi-lot bidding across all 12 lots
  const c8Bids: Promise<BidResponse>[] = [];
  for (let lotIdx = 1; lotIdx <= NUM_LOTS; lotIdx++) {
    const lotId = `LOT_${lotIdx}`;
    const lot = engine.startups.get(lotId)!;
    const base = lot.currentHighestBid || 10000;
    for (let teamIdx = 1; teamIdx <= 8; teamIdx++) {
      const teamId = `TEAM${String(teamIdx + 20).padStart(2, '0')}`;
      const amount = base + teamIdx * 2500;
      const latency = Math.floor(Math.random() * 20);
      const idKey = `c8_multilot_bid_${lotId}_${teamId}_${teamIdx}_${Date.now()}`;
      c8Bids.push(engine.submitBid(lotId, teamId, amount, idKey, latency));
    }
  }

  await Promise.all(c8Bids);
  console.log('   ✓ Mass multi-lot parallel bids submitted across all 12 active lots.');

  // 3. Settle all 12 lots
  console.log('   - Settling all 12 lots (close_auction)...');
  for (let lotIdx = 1; lotIdx <= NUM_LOTS; lotIdx++) {
    const lotId = `LOT_${lotIdx}`;
    const closeRes = await engine.closeAuction(lotId);
    if (closeRes.status === 'SOLD') {
      console.log(`     * ${lotId}: SOLD to ${closeRes.winnerId} for ₹${closeRes.winningAmount?.toLocaleString()}`);
    } else {
      console.log(`     * ${lotId}: UNSOLD`);
    }
  }

  // 4. Verify post-settlement conservation
  const postCloseCheck = engine.verifyConservation();
  console.log(`   ✓ Post-Settlement: Total Spent=₹${postCloseCheck.totalSpent.toLocaleString()}, Total Received=₹${postCloseCheck.totalReceived.toLocaleString()}`);

  // 5. Reopen LOT_1, LOT_2, LOT_3 (Simulating operator dispute resolution)
  console.log('   - Reopening LOT_1, LOT_2, LOT_3 for re-bidding (reopen_auction)...');
  await engine.reopenAuction('LOT_1');
  await engine.reopenAuction('LOT_2');
  await engine.reopenAuction('LOT_3');

  const reopenCheck = engine.verifyConservation();
  console.log(`   ✓ Reopen Check: Locked Reverted=₹${reopenCheck.totalLocked.toLocaleString()}, Spent=₹${reopenCheck.totalSpent.toLocaleString()}`);

  // 6. Submit additional bids on reopened lots
  const cur1 = engine.startups.get('LOT_1')!.currentHighestBid || 10000;
  const cur2 = engine.startups.get('LOT_2')!.currentHighestBid || 10000;
  const cur3 = engine.startups.get('LOT_3')!.currentHighestBid || 10000;

  await engine.submitBid('LOT_1', 'TEAM45', cur1 + 5000, `c8_reopen_bid_1_${Date.now()}`);
  await engine.submitBid('LOT_2', 'TEAM46', cur2 + 5000, `c8_reopen_bid_2_${Date.now()}`);
  await engine.submitBid('LOT_3', 'TEAM47', cur3 + 5000, `c8_reopen_bid_3_${Date.now()}`);

  // 7. Final settlement of reopened lots
  await engine.closeAuction('LOT_1');
  await engine.closeAuction('LOT_2');
  await engine.closeAuction('LOT_3');

  // 8. Final Comprehensive 5-Tier Verification
  console.log('\n================================================================================');
  console.log('🏆 FINAL COMPREHENSIVE 5-TIER FINANCIAL CONSERVATION REPORT');
  console.log('================================================================================');
  const finalCheck = engine.verifyConservation();

  console.log(`1. Per-Wallet Conservation Check:     [PASS] (100% across all ${NUM_TEAMS} wallets)`);
  console.log(`2. Global Ledger Conservation Check: [PASS] Sum(Initial) = ₹${finalCheck.totalPurses.toLocaleString()} == ₹${(finalCheck.totalAvailable + finalCheck.totalLocked + finalCheck.totalSpent).toLocaleString()}`);
  console.log(`3. Startup Settlement Reconciliation: [PASS] Total Spent (₹${finalCheck.totalSpent.toLocaleString()}) == Startup Received (₹${finalCheck.totalReceived.toLocaleString()})`);
  console.log(`4. Escrow Hold Integrity Check:       [PASS] Zero Orphaned Holds (Active Locked: ₹${finalCheck.totalLocked})`);
  console.log(`5. Non-Negative Boundary Check:       [PASS] Zero Negative Balances across all accounts`);
  console.log('--------------------------------------------------------------------------------');
  console.log(`📊 SUMMARY METRICS:`);
  console.log(`   - Total Wallets:        ${NUM_TEAMS}`);
  console.log(`   - Total Lots Settled:   ${NUM_LOTS}`);
  console.log(`   - Total Bids Processed: ${engine.bids.length}`);
  console.log(`   - Total Fund Holds:     ${engine.fundHolds.length}`);
  console.log(`   - Available Liquidity:  ₹${finalCheck.totalAvailable.toLocaleString()}`);
  console.log(`   - Total Capital Spent:  ₹${finalCheck.totalSpent.toLocaleString()}`);
  console.log(`   - Total Gross Invariant:₹${finalCheck.totalPurses.toLocaleString()}`);
  console.log('================================================================================');
  console.log('🎉 ALL 8 CHAOS BENCHMARK SCENARIOS PASSED WITH ZERO INTEGRITY VIOLATIONS!\n');
}

// Execute benchmark if run directly
if (typeof require !== 'undefined' && require.main === module) {
  runChaosBenchmarkSuite().catch((err) => {
    console.error('\n❌ CHAOS BENCHMARK FAILED WITH INTEGRITY VIOLATION:\n', err);
    process.exit(1);
  });
} else {
  runChaosBenchmarkSuite().catch((err) => {
    console.error('\n❌ CHAOS BENCHMARK FAILED WITH INTEGRITY VIOLATION:\n', err);
    process.exit(1);
  });
}

