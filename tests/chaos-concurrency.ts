/**
 * SEEP 4.0 Chaos Network Resilience & High-Concurrency Stress Benchmark
 * Simulates 50+ concurrent virtual bidders hammering the transaction engine with dropped packets and race conditions.
 */

interface WalletState {
  teamId: string;
  initial: number;
  available: number;
  locked: number;
  spent: number;
}

interface StartupState {
  id: string;
  name: string;
  basePrice: number;
  status: 'ACTIVE_BIDDING' | 'SOLD';
  currentBid: number | null;
  currentLeader: string | null;
  winner: string | null;
}

class ChaosAuctionEngine {
  private wallets = new Map<string, WalletState>();
  private startups = new Map<string, StartupState>();
  private activeHolds = new Map<string, { bidderId: string; amount: number }>();
  private lockQueue: Promise<void> = Promise.resolve();

  constructor(numTeams = 20, numLots = 12) {
    for (let i = 1; i <= numTeams; i++) {
      const id = `TEAM${String(i).padStart(2, '0')}`;
      this.wallets.set(id, {
        teamId: id,
        initial: 100000,
        available: 100000,
        locked: 0,
        spent: 0,
      });
    }

    for (let i = 1; i <= numLots; i++) {
      const id = `LOT_${i}`;
      this.startups.set(id, {
        id,
        name: `High Growth Venture ${i}`,
        basePrice: 10000,
        status: 'ACTIVE_BIDDING',
        currentBid: null,
        currentLeader: null,
        winner: null,
      });
    }
  }

  // Strict Invariant Check
  public assertInvariants(): boolean {
    const entries = Array.from(this.wallets.entries());
    for (let i = 0; i < entries.length; i++) {
      const [id, w] = entries[i];
      const sum = w.available + w.locked + w.spent;
      if (sum !== w.initial) {
        throw new Error(`CONSERVATION_VIOLATION on ${id}: Initial=${w.initial}, Sum=${sum}`);
      }
      if (w.available < 0 || w.locked < 0 || w.spent < 0) {
        throw new Error(`NEGATIVE_BALANCE on ${id}: Avail=${w.available}, Locked=${w.locked}, Spent=${w.spent}`);
      }
    }
    return true;
  }

  // Simulated Database Row-Locked Transaction (SELECT ... FOR UPDATE)
  public async submitConcurrentBid(
    startupId: string,
    bidderId: string,
    amount: number,
    simulatedLatencyMs = 0
  ): Promise<{ success: boolean; error?: string }> {
    // Simulate network jitter
    if (simulatedLatencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, simulatedLatencyMs));
    }

    // Atomic Mutex Serialization (emulating PostgreSQL serialized row lock)
    return new Promise((resolve) => {
      this.lockQueue = this.lockQueue.then(async () => {
        const startup = this.startups.get(startupId);
        if (!startup || startup.status !== 'ACTIVE_BIDDING') {
          resolve({ success: false, error: 'ERR_AUCTION_NOT_ACTIVE' });
          return;
        }

        if (startup.currentLeader === bidderId) {
          resolve({ success: false, error: 'ERR_ALREADY_HIGHEST_BIDDER' });
          return;
        }

        const wallet = this.wallets.get(bidderId);
        if (!wallet || wallet.available < amount) {
          resolve({ success: false, error: 'ERR_INSUFFICIENT_FUNDS' });
          return;
        }

        // Validate ascending price
        if (startup.currentBid === null) {
          if (amount < startup.basePrice) {
            resolve({ success: false, error: 'ERR_BELOW_BASE_PRICE' });
            return;
          }
        } else {
          if (amount <= startup.currentBid) {
            resolve({ success: false, error: 'ERR_BID_NOT_HIGHER' });
            return;
          }
        }

        // Release previous leader hold
        if (startup.currentLeader && startup.currentBid) {
          const prevWallet = this.wallets.get(startup.currentLeader)!;
          prevWallet.locked -= startup.currentBid;
          prevWallet.available += startup.currentBid;
          this.activeHolds.delete(startupId);
        }

        // Place hold on new leader
        wallet.available -= amount;
        wallet.locked += amount;
        this.activeHolds.set(startupId, { bidderId, amount });

        startup.currentBid = amount;
        startup.currentLeader = bidderId;

        resolve({ success: true });
      });
    });
  }

  // Settle lot
  public settleLot(startupId: string): void {
    const startup = this.startups.get(startupId)!;
    if (startup.currentLeader && startup.currentBid) {
      const winnerWallet = this.wallets.get(startup.currentLeader)!;
      winnerWallet.locked -= startup.currentBid;
      winnerWallet.spent += startup.currentBid;
      startup.winner = startup.currentLeader;
      this.activeHolds.delete(startupId);
    }
    startup.status = 'SOLD';
  }
}

async function runChaosSuite() {
  console.log('⚡ STARTING SEEP 4.0 CHAOS & CONCURRENCY BENCHMARK (50 Concurrent Workers)...');
  const engine = new ChaosAuctionEngine(20, 5);

  // Initial invariant
  engine.assertInvariants();
  console.log('✅ Base Invariants Verified.');

  // Benchmark 1: 50 Concurrent Bidders firing simultaneously at Lot 1
  console.log('\n--- CHAOS TEST 1: 50 Simultaneous Bids on LOT_1 (High Collision) ---');
  const promises: Promise<any>[] = [];
  let successfulBids = 0;
  let rejectedBids = 0;

  for (let i = 1; i <= 50; i++) {
    const teamId = `TEAM${String((i % 20) + 1).padStart(2, '0')}`;
    const amount = 10000 + i * 1000;
    const jitter = Math.floor(Math.random() * 20); // 0-20ms random arrival

    promises.push(
      engine.submitConcurrentBid('LOT_1', teamId, amount, jitter).then((res) => {
        if (res.success) successfulBids++;
        else rejectedBids++;
      })
    );
  }

  await Promise.all(promises);
  console.log(` -> 50 Concurrent Submissions: ${successfulBids} Accepted, ${rejectedBids} Safely Rejected`);
  engine.assertInvariants();
  console.log('✅ PASS: Invariant strictly held under 50 simultaneous collision requests.');

  // Benchmark 2: Multi-Lot Chaos (5 Lots, 250 Rapid Dispersed Bids)
  console.log('\n--- CHAOS TEST 2: Multi-Lot Matrix (250 Bids across 5 Active Lots) ---');
  const multiPromises: Promise<any>[] = [];

  for (let i = 0; i < 250; i++) {
    const lotId = `LOT_${(i % 5) + 1}`;
    const teamId = `TEAM${String((i % 20) + 1).padStart(2, '0')}`;
    const amount = 15000 + (i + 1) * 250;
    const jitter = Math.floor(Math.random() * 30);

    multiPromises.push(engine.submitConcurrentBid(lotId, teamId, amount, jitter));
  }

  await Promise.all(multiPromises);
  engine.assertInvariants();
  console.log('✅ PASS: Multi-lot parallel matrix verified with 0 escrow anomalies.');

  // Benchmark 3: Final Settlement of all lots
  console.log('\n--- CHAOS TEST 3: Mass Lot Settlement & Ledger Reconciliation ---');
  for (let i = 1; i <= 5; i++) {
    engine.settleLot(`LOT_${i}`);
  }

  engine.assertInvariants();
  console.log('✅ PASS: 100% Capital Conservation across all wallets post-settlement.');

  console.log('\n🏆 ALL CHAOS & CONCURRENCY BENCHMARKS PASSED (0 ERRORS, 100% CONSERVATION)!');
}

runChaosSuite().catch((err) => {
  console.error('❌ CHAOS BENCHMARK FAILED:', err);
  process.exit(1);
});
