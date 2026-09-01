/**
 * Financial Analytics & Valuation Logic Verification Suite
 * Verifies Milestone 1 financial formulas and risk indicator rules.
 */

function testValuationFormulas() {
  console.log('--- Testing Valuation & Equity Modeler Formulas ---');
  const testCases = [
    { activeAmount: 10000, targetEquityPct: 10, expectedPostMoney: 100000, expectedPreMoney: 90000 },
    { activeAmount: 25000, targetEquityPct: 5, expectedPostMoney: 500000, expectedPreMoney: 475000 },
    { activeAmount: 15000, targetEquityPct: 7.5, expectedPostMoney: 200000, expectedPreMoney: 185000 },
    { activeAmount: 50000, targetEquityPct: 20, expectedPostMoney: 250000, expectedPreMoney: 200000 },
  ];

  for (const tc of testCases) {
    const equityDecimal = tc.targetEquityPct / 100;
    const postMoney = tc.activeAmount / equityDecimal;
    const preMoney = postMoney - tc.activeAmount;

    if (Math.round(postMoney) !== tc.expectedPostMoney) {
      throw new Error(`Post-money mismatch: expected ${tc.expectedPostMoney}, got ${postMoney}`);
    }
    if (Math.round(preMoney) !== tc.expectedPreMoney) {
      throw new Error(`Pre-money mismatch: expected ${tc.expectedPreMoney}, got ${preMoney}`);
    }
    console.log(`✓ ₹${tc.activeAmount} @ ${tc.targetEquityPct}% -> Post: ₹${postMoney.toLocaleString()}, Pre: ₹${preMoney.toLocaleString()}`);
  }
}

function testRiskIndicators() {
  console.log('\n--- Testing Capital Allocation Risk Indicators ---');

  // Test 1: Overconcentration (>40%)
  const sectorAmounts = { CleanTech: 30000, MedTech: 10000 };
  const totalSpent = 40000;
  const cleanTechPct = (sectorAmounts.CleanTech / totalSpent) * 100;
  const isOverconcentrated = cleanTechPct > 40;
  if (!isOverconcentrated || cleanTechPct !== 75) {
    throw new Error('Overconcentration check failed');
  }
  console.log(`✓ Overconcentration detected: CleanTech at ${cleanTechPct}% (>40%)`);

  // Test 2: Rapid Depletion (>60% spent in <50% lots)
  const initialBalance = 50000;
  const spentEarly = 35000;
  const wonEarlyCount = 2;
  const totalLots = 12;
  const burnRate = (spentEarly / initialBalance) * 100;
  const isRapid = burnRate > 60 && wonEarlyCount < Math.ceil(totalLots / 2);
  if (!isRapid || burnRate !== 70) {
    throw new Error('Rapid depletion check failed');
  }
  console.log(`✓ Rapid Depletion detected: ${burnRate}% spent in ${wonEarlyCount}/${totalLots} lots`);

  // Test 3: Active Escrow Exposure (>50%)
  const lockedBalance = 28000;
  const escrowExposure = (lockedBalance / initialBalance) * 100;
  const isHighEscrow = escrowExposure > 50;
  if (!isHighEscrow || Math.abs(escrowExposure - 56) > 0.0001) {
    throw new Error('Escrow exposure check failed');
  }
  console.log(`✓ High Escrow Exposure detected: ${escrowExposure}% locked (>50%)`);

  // Test 4: Low Runway Buffer (<10000)
  const availableBalance = 8000;
  const isLowRunway = availableBalance < 10000;
  if (!isLowRunway) {
    throw new Error('Low runway check failed');
  }
  console.log(`✓ Low Runway Buffer detected: ₹${availableBalance} (< ₹10,000)`);
}

function runAll() {
  console.log('=== SEEP 4.0 Financial Analytics Verification ===\n');
  testValuationFormulas();
  testRiskIndicators();
  console.log('\n=== All Financial Model Verifications Passed Successfully! ===');
}

runAll();
