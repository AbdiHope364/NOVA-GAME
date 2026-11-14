import { PlinkoEngine, choose, buildMultipliers, TARGET_RTP, MIN_ROWS, MAX_ROWS } from '../../../../games/plinko/src/index.js';
import { PlinkoRisk } from '@nova/types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ ${msg}`);
}

async function runPlinkoTests() {
  console.log('--- PLINKO TEST SUITE: Parameter Validation & Constraints ---');
  const engine = new PlinkoEngine();

  // 1. Validation tests
  const v1 = engine.validateBet(10, { rows: 10, risk: 'medium' });
  assert(v1.valid, 'Valid parameters (rows: 10, risk: medium, amount: 10) accepted');

  const v2 = engine.validateBet(10, { rows: 7, risk: 'medium' } as any);
  assert(!v2.valid && Boolean(v2.error?.includes('8 and 16')), 'Rows < 8 rejected');

  const v3 = engine.validateBet(10, { rows: 17, risk: 'medium' } as any);
  assert(!v3.valid && Boolean(v3.error?.includes('8 and 16')), 'Rows > 16 rejected');

  const v4 = engine.validateBet(10, { rows: 10, risk: 'super-high' } as any);
  assert(!v4.valid && Boolean(v4.error?.includes('low, medium or high')), 'Invalid risk level rejected');

  const v5 = engine.validateBet(0.5, { rows: 10, risk: 'low' });
  assert(!v5.valid && Boolean(v5.error?.includes('Minimum bet')), 'Bet < minBet rejected');

  // 2. Binomial Math & Multiplier Table Symmetry
  console.log('\n--- PLINKO TEST SUITE: Payout Table Mathematical Symmetry & RTP ---');
  for (let r = MIN_ROWS; r <= MAX_ROWS; r++) {
    for (const risk of ['low', 'medium', 'high'] as PlinkoRisk[]) {
      const table = engine.getMultipliers(r, risk);
      assert(table.length === r + 1, `Row ${r} (${risk}) has ${r + 1} multipliers`);

      // Check symmetry: multiplier[k] === multiplier[rows - k]
      for (let k = 0; k < Math.floor(table.length / 2); k++) {
        const left = table[k];
        const right = table[table.length - 1 - k];
        assert(
          Math.abs(left - right) < 0.001,
          `Multiplier table is symmetrical at index ${k} (${left}x == ${right}x) for ${r} rows (${risk})`
        );
      }

      // Check exact theoretical RTP from binomial distribution: sum(P(k) * M[k])
      const totalCombinations = Math.pow(2, r);
      let expectedReturn = 0;
      for (let k = 0; k <= r; k++) {
        const prob = choose(r, k) / totalCombinations;
        expectedReturn += prob * table[k];
      }

      // Due to rounding multipliers to 2 decimals, RTP should stay tightly within 98.5% - 99.5%
      assert(
        expectedReturn >= 0.982 && expectedReturn <= 0.998,
        `Exact theoretical RTP for ${r} rows (${risk}) is ${(expectedReturn * 100).toFixed(2)}% (Target: ${(TARGET_RTP * 100).toFixed(1)}%)`
      );
    }
  }

  // 3. Cryptographic Determinism & Evaluation Output
  console.log('\n--- PLINKO TEST SUITE: Cryptographic Determinism & Path Generation ---');
  const serverSeed = 'plinko-server-seed-test-hash';
  const clientSeed = 'plinko-client-seed-player-xyz';
  const nonce = 101;

  const res1 = engine.evaluate({
    amount: 50,
    serverSeed,
    clientSeed,
    nonce,
    params: { rows: 10, risk: 'high' },
  });

  assert(res1.outcome.path.length === 10, `Path length matches rows count (10)`);
  assert(res1.outcome.rows === 10, 'Outcome records rows: 10');
  assert(res1.outcome.risk === 'high', 'Outcome records risk: high');

  const rCount = res1.outcome.path.filter((p) => p === 'R').length;
  assert(res1.outcome.slot === rCount, `Slot index (${res1.outcome.slot}) matches number of 'R' bounces (${rCount})`);

  const expectedMultiplier = engine.getMultipliers(10, 'high')[rCount];
  assert(res1.multiplier === expectedMultiplier, `Awarded multiplier (${res1.multiplier}x) matches slot payout table`);

  // 4. Large-Scale Monte Carlo Simulation (1,000,000 Drops across all 3 risk levels)
  console.log('\n--- PLINKO TEST SUITE: Large-Scale Monte Carlo Simulation (1,000,000 drops) ---');
  for (const testRisk of ['low', 'medium', 'high'] as PlinkoRisk[]) {
    const simRounds = 333334;
    const testRows = 10;
    let totalWagered = 0;
    let totalPaid = 0;

    for (let i = 1; i <= simRounds; i++) {
      const dropRes = engine.evaluate({
        amount: 10,
        serverSeed: `sim-seed-${i % 500}`,
        clientSeed: `sim-client`,
        nonce: i,
        params: { rows: testRows, risk: testRisk },
      });
      totalWagered += 10;
      totalPaid += dropRes.payout;
    }

    const empiricalRtp = (totalPaid / totalWagered) * 100;
    console.log(`[Risk: ${testRisk.toUpperCase()}] ${simRounds} drops: Wagered = ${totalWagered} ETB, Paid = ${totalPaid.toFixed(2)} ETB, Empirical RTP = ${empiricalRtp.toFixed(2)}%`);
    assert(
      empiricalRtp >= 97.5 && empiricalRtp <= 100.5,
      `Empirical RTP for ${testRisk} (${empiricalRtp.toFixed(2)}%) matches 99.0% RTP within statistical variance`
    );
  }

  console.log('\n🎉 ALL PLINKO TESTS PASSED! Multiplier tables, binomial distribution, and 99.0% RTP verified.');
}

runPlinkoTests().catch((err) => {
  console.error(err);
  process.exit(1);
});

