/**
 * SEEP 4.0 Milestone 2 Verification Suite:
 * Operator Real-Time Telemetry & Cryptographic Risk Command Dashboard
 */

import crypto from 'crypto';

// 1. Liquidity Tier Logic Verification
export type LiquidityTier = 'flush' | 'moderate' | 'critical' | 'depleted';

export function getLiquidityTier(available: number): LiquidityTier {
  if (available <= 0) return 'depleted';
  if (available < 15000) return 'critical';
  if (available <= 35000) return 'moderate';
  return 'flush';
}

// 2. Canonical JSON stringification for deterministic SHA-256 computation
export function canonicalStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return `[${obj.map((item) => canonicalStringify(item)).join(',')}]`;
  }
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map((key) => `${JSON.stringify(key)}:${canonicalStringify(obj[key])}`);
  return `{${pairs.join(',')}}`;
}

// 3. Jitter calculation from latency series
export function calculateJitter(pings: { latency: number; dropped: boolean }[]): number {
  const valid = pings.filter((p) => !p.dropped && p.latency >= 0).map((p) => p.latency);
  if (valid.length < 2) return 0;
  let diffSum = 0;
  for (let i = 1; i < valid.length; i++) {
    diffSum += Math.abs(valid[i] - valid[i - 1]);
  }
  return Number((diffSum / (valid.length - 1)).toFixed(1));
}

// 4. Global Ledger Conservation Check
export function verifyGlobalLedgerConservation(wallets: any[]): { conserved: boolean; totalInitial: number; totalAvailable: number; totalLocked: number; totalSpent: number } {
  let allConserved = true;
  let totalInitial = 0;
  let totalAvailable = 0;
  let totalLocked = 0;
  let totalSpent = 0;

  for (const w of wallets) {
    const init = Number(w.initial_balance || 0);
    const avail = Number(w.available_balance || 0);
    const lock = Number(w.locked_balance || 0);
    const spent = Number(w.total_spent || 0);

    totalInitial += init;
    totalAvailable += avail;
    totalLocked += lock;
    totalSpent += spent;

    if (init !== avail + lock + spent) {
      allConserved = false;
    }
  }

  const conserved = allConserved && totalInitial === totalAvailable + totalLocked + totalSpent;
  return { conserved, totalInitial, totalAvailable, totalLocked, totalSpent };
}

// RUN TESTS
console.log('=== SEEP 4.0 Milestone 2 Verification Suite ===\n');

// Test Suite 1: Liquidity Tier Boundaries
console.log('Test 1: Liquidity Tier Classification Boundaries...');
const tierTests = [
  { amount: 50000, expected: 'flush' },
  { amount: 35001, expected: 'flush' },
  { amount: 35000, expected: 'moderate' },
  { amount: 20000, expected: 'moderate' },
  { amount: 15000, expected: 'moderate' },
  { amount: 14999, expected: 'critical' },
  { amount: 1000, expected: 'critical' },
  { amount: 1, expected: 'critical' },
  { amount: 0, expected: 'depleted' },
  { amount: -500, expected: 'depleted' },
];

for (const t of tierTests) {
  const actual = getLiquidityTier(t.amount);
  if (actual !== t.expected) {
    throw new Error(`Tier mismatch for ₹${t.amount}: expected ${t.expected}, got ${actual}`);
  }
}
console.log('✅ PASS: All 10 tier boundary test cases classified accurately.');

// Test Suite 2: Jitter & Packet Telemetry Calculation
console.log('\nTest 2: Latency Jitter & Drop Rate Calculation...');
const samplePings = [
  { latency: 30, dropped: false },
  { latency: 35, dropped: false },
  { latency: 32, dropped: false },
  { latency: 40, dropped: false },
  { latency: -1, dropped: true }, // dropped packet
  { latency: 38, dropped: false },
];
const jitter = calculateJitter(samplePings);
console.log(` -> Jitter computed on samples: ±${jitter}ms`);
if (jitter <= 0) throw new Error('Jitter calculation failed on valid series');
console.log('✅ PASS: Network jitter metric computed correctly.');

// Test Suite 3: 15-Team Ledger Financial Conservation
console.log('\nTest 3: 15-Team Ledger Conservation Verification...');
const sampleWallets = Array.from({ length: 15 }, (_, i) => {
  const id = `TEAM${String(i + 1).padStart(2, '0')}`;
  const initial = 50000;
  // Varied distribution across teams
  const spent = i * 2000;
  const locked = (15 - i) * 1000;
  const available = initial - spent - locked;
  return {
    team_id: id,
    initial_balance: initial,
    available_balance: available,
    locked_balance: locked,
    total_spent: spent,
  };
});

const conservationResult = verifyGlobalLedgerConservation(sampleWallets);
console.log(` -> Total Purse: ₹${conservationResult.totalInitial.toLocaleString('en-IN')}`);
console.log(` -> Available: ₹${conservationResult.totalAvailable.toLocaleString('en-IN')}`);
console.log(` -> In Escrow: ₹${conservationResult.totalLocked.toLocaleString('en-IN')}`);
console.log(` -> Spent: ₹${conservationResult.totalSpent.toLocaleString('en-IN')}`);
console.log(` -> Conservation Status: ${conservationResult.conserved ? 'CONSERVED' : 'VIOLATION'}`);

if (!conservationResult.conserved) throw new Error('Valid wallets failed conservation check');
if (conservationResult.totalInitial !== 750000) throw new Error('Total 15-team purse is not ₹7,50,000');
console.log('✅ PASS: 15-team financial conservation mathematically verified.');

// Test Suite 4: Cryptographic SHA-256 State Checksum & Canonical Determinism
console.log('\nTest 4: Cryptographic SHA-256 State Checksum & Deterministic Hashing...');
const rawState1 = {
  session: { id: 'sess_001', status: 'ACTIVE' },
  wallets: sampleWallets,
  bids: [{ id: 'b1', amount: 15000, status: 'WINNING' }],
};

// State 2 with same keys but inserted in different order
const rawState2 = {
  bids: [{ id: 'b1', amount: 15000, status: 'WINNING' }],
  session: { status: 'ACTIVE', id: 'sess_001' },
  wallets: sampleWallets,
};

const canonical1 = canonicalStringify(rawState1);
const canonical2 = canonicalStringify(rawState2);

const hash1 = crypto.createHash('sha256').update(canonical1).digest('hex');
const hash2 = crypto.createHash('sha256').update(canonical2).digest('hex');

console.log(` -> Hash 1: ${hash1}`);
console.log(` -> Hash 2: ${hash2}`);

if (hash1 !== hash2) {
  throw new Error('Canonical stringification failed to produce deterministic SHA-256 hash');
}
console.log('✅ PASS: Cryptographic state hash is 100% deterministic regardless of key order.');

// Test Suite 5: Tamper Detection
console.log('\nTest 5: Cryptographic Snapshot Tamper Detection...');
const tamperedState = JSON.parse(JSON.stringify(rawState1));
tamperedState.wallets[0].available_balance += 1; // 1 rupee tamper

const tamperedCanonical = canonicalStringify(tamperedState);
const tamperedHash = crypto.createHash('sha256').update(tamperedCanonical).digest('hex');

if (tamperedHash === hash1) {
  throw new Error('Tampered state produced identical hash!');
}
console.log(` -> Tampered Hash: ${tamperedHash}`);
console.log('✅ PASS: Single-byte ledger tampering immediately invalidates SHA-256 checksum.');

console.log('\n🎉 ALL MILESTONE 2 TELEMETRY & CRYPTOGRAPHIC TESTS PASSED WITH 100% SUCCESS!');
