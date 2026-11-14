import assert from 'node:assert/strict';
import { LettiEngine } from '../engine.js';

function runLettiEngineTests() {
  const engine = new LettiEngine(2.0);
  const serverSeed = 'a'.repeat(64);
  const clientSeed = 'nova-test-client-seed';

  // 1. Validate bounds and invalid inputs
  assert.equal(engine.validateBet(100, { pickedCardIndex: 0 }).valid, true);
  assert.equal(engine.validateBet(100, { pickedCardIndex: 51 }).valid, true);
  assert.equal(engine.validateBet(100, { pickedCardIndex: -1 }).valid, false);
  assert.equal(engine.validateBet(100, { pickedCardIndex: 52 }).valid, false);
  assert.equal(engine.validateBet(100, { pickedCardIndex: 3.5 }).valid, false);
  assert.equal(engine.validateBet(100, {} as any).valid, false);
  assert.equal(engine.validateBet(0, { pickedCardIndex: 10 }).valid, false);

  // 2. Remaining 51-card deck integrity & exclusion of pickedCardIndex
  for (let picked = 0; picked < 52; picked++) {
    const order = LettiEngine.buildShuffledOrder(picked, serverSeed, clientSeed, picked + 1);
    assert.equal(order.length, 51, `Expected 51 cards for pickedIndex=${picked}`);
    assert.equal(order.includes(picked), false, `Picked card ${picked} must not remain in deck`);
    const unique = new Set(order);
    assert.equal(unique.size, 51, `Shuffled deck must contain 51 unique cards`);
  }

  // 3. Determinism: identical seeds/nonce produce identical shuffle and outcome
  const orderA = LettiEngine.buildShuffledOrder(17, serverSeed, clientSeed, 42);
  const orderB = LettiEngine.buildShuffledOrder(17, serverSeed, clientSeed, 42);
  assert.deepEqual(orderA, orderB, 'Shuffle must be strictly deterministic');

  const resA = engine.evaluate({
    amount: 100,
    serverSeed,
    clientSeed,
    nonce: 42,
    params: { pickedCardIndex: 17 },
  });
  const resB = LettiEngine.evaluateFromOrder(100, 17, orderA);
  assert.deepEqual(resA, resB, 'evaluate() and evaluateFromOrder() must produce identical outcomes');

  // 4. Alternating flip sequence & 1.90x Total Return payout math
  assert.ok(resA.outcome.steps.length >= 1 && resA.outcome.steps.length <= 49);
  resA.outcome.steps.forEach((step, idx) => {
    const expectedSide = idx % 2 === 0 ? 'USER' : 'SYSTEM';
    assert.equal(step.side, expectedSide);
    assert.equal(step.step, idx + 1);
    const isLast = idx === resA.outcome.steps.length - 1;
    assert.equal(step.matched, isLast);
    if (isLast) {
      assert.equal(step.card.rank, resA.outcome.pickedCard.rank);
    } else {
      assert.notEqual(step.card.rank, resA.outcome.pickedCard.rank);
    }
  });

  if (resA.won) {
    assert.equal(resA.outcome.winnerSide, 'USER');
    assert.equal(resA.multiplier, 1.9);
    assert.equal(resA.payout, 190);
    assert.equal(resA.profit, 90);
  } else {
    assert.equal(resA.outcome.winnerSide, 'SYSTEM');
    assert.equal(resA.multiplier, 0);
    assert.equal(resA.payout, 0);
    assert.equal(resA.profit, -100);
  }

  // 5. Statistical distribution sanity test (2,000 rounds)
  // Expected: ~51.50% player win probability, ~97.85% RTP at 1.90x total return
  let wins = 0;
  let totalWagered = 0;
  let totalPayout = 0;
  const sampleSize = 2000;
  for (let i = 1; i <= sampleSize; i++) {
    const out = engine.evaluate({
      amount: 100,
      serverSeed,
      clientSeed: 'monte-carlo-suite',
      nonce: i,
      params: { pickedCardIndex: i % 52 },
    });
    totalWagered += 100;
    totalPayout += out.payout;
    if (out.won) wins++;
  }
  const winRate = wins / sampleSize;
  const rtp = totalPayout / totalWagered;
  assert.ok(winRate > 0.47 && winRate < 0.56, `Win rate ${winRate.toFixed(4)} out of expected ~0.5150 range`);
  assert.ok(rtp > 0.90 && rtp < 1.06, `RTP ${rtp.toFixed(4)} out of expected ~0.9785 range`);

  console.log(
    `LettiEngine tests passed (${sampleSize} Monte Carlo rounds: winRate=${(winRate * 100).toFixed(2)}%, rtp=${(
      rtp * 100
    ).toFixed(2)}%)`
  );
}

runLettiEngineTests();
