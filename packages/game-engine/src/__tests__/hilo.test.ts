import { HiLoEngine } from '../../../../games/hilo/src/index.js';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ ${msg}`);
}

async function runHiLoTests() {
  console.log('--- HI-LO TEST SUITE: Card Generation & Provably Fair Determinism ---');
  const engine = new HiLoEngine(1.0);

  // 1. Card generation bounds & determinism
  const serverSeed = 'test-server-seed-hilo-99';
  const clientSeed = 'test-client-seed-player-01';
  const nonce = 42;

  const card1 = HiLoEngine.generateCard(serverSeed, clientSeed, nonce, 0);
  const card2 = HiLoEngine.generateCard(serverSeed, clientSeed, nonce, 0);
  assert(card1.rank >= 1 && card1.rank <= 13, `Card rank in [1, 13]: ${card1.label} (Rank ${card1.rank})`);
  assert(card1.index === card2.index, 'Card generation is 100% deterministic given identical seeds & nonce');
  assert(['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'].includes(card1.suit), `Card suit valid: ${card1.suit}`);

  // 2. Mathematical Odds & 1% House Edge Verification
  console.log('\n--- HI-LO TEST SUITE: Mathematical Odds & House Edge (1% Edge) ---');
  for (let r = 1; r <= 13; r++) {
    const odds = HiLoEngine.calculateStepOdds(r, 1.0);
    const hiProb = (14 - r) / 13;
    const loProb = r / 13;

    // Expected value = Prob * Multiplier == 0.99
    const hiEV = hiProb * odds.nextHiMultiplier;
    const loEV = loProb * odds.nextLoMultiplier;

    assert(
      Math.abs(hiEV - 0.99) < 0.02,
      `Rank ${r} (${HiLoEngine.LABELS[r - 1]}): Higher EV is ${hiEV.toFixed(3)} (Expected ~0.99)`
    );
    assert(
      Math.abs(loEV - 0.99) < 0.02,
      `Rank ${r} (${HiLoEngine.LABELS[r - 1]}): Lower EV is ${loEV.toFixed(3)} (Expected ~0.99)`
    );
  }

  // 3. Gameplay Round Evaluation: START -> GUESS -> CASHOUT
  console.log('\n--- HI-LO TEST SUITE: State Machine Round Flow ---');
  const startRes = engine.evaluate({
    amount: 100,
    serverSeed,
    clientSeed,
    nonce,
    params: { action: 'START' },
  });

  assert(startRes.outcome.history.length === 1, 'Initial deal creates 1-card history');
  assert(startRes.outcome.currentMultiplier === 1.0, 'Starting multiplier is 1.0x');
  assert(!startRes.outcome.isGameOver, 'Round is active');

  const startCard = startRes.outcome.currentCard;

  // Simulate guess: if rank >= 7 guess LO, else guess HI
  const guessChoice = startCard.rank >= 7 ? 'LO' : 'HI';
  const guessRes = engine.evaluate({
    amount: 100,
    serverSeed,
    clientSeed,
    nonce,
    params: {
      action: 'GUESS',
      guess: guessChoice,
      history: startRes.outcome.history,
      currentMultiplier: 1.0,
    },
  });

  assert(guessRes.outcome.history.length === 2, 'History updated to 2 cards after guess');
  console.log(
    `Dealt ${startCard.label}${startCard.suit} -> Guessed ${guessChoice} -> Next ${guessRes.outcome.currentCard.label}${guessRes.outcome.currentCard.suit} (Result: ${
      guessRes.won ? 'CORRECT' : 'WRONG'
    })`
  );

  if (guessRes.won) {
    assert(guessRes.multiplier > 1.0, `Compounded multiplier increased: ${guessRes.multiplier}x`);
    const cashoutRes = engine.evaluate({
      amount: 100,
      serverSeed,
      clientSeed,
      nonce,
      params: {
        action: 'CASHOUT',
        history: guessRes.outcome.history,
        currentMultiplier: guessRes.multiplier,
      },
    });
    assert(cashoutRes.outcome.cashedOut, 'Round cashed out successfully');
    assert(cashoutRes.payout === Math.floor(100 * guessRes.multiplier), 'Payout matches compound multiplier');
  }

  // 4. Monte Carlo Simulation: 100,000 Rounds
  console.log('\n--- HI-LO TEST SUITE: Monte Carlo Simulation (100,000 rounds) ---');
  let totalWagered = 0;
  let totalPaid = 0;
  const simCount = 100000;

  for (let i = 1; i <= simCount; i++) {
    const bet = 10;
    totalWagered += bet;

    // Single step guess simulation with optimal probability policy
    const sCard = HiLoEngine.generateCard(`sim-hilo-seed`, `client-${i}`, i, 0);
    const policyGuess = sCard.rank >= 7 ? 'LO' : 'HI';
    const nCard = HiLoEngine.generateCard(`sim-hilo-seed`, `client-${i}`, i, 1);

    const isWin = policyGuess === 'HI' ? nCard.rank >= sCard.rank : nCard.rank <= sCard.rank;
    if (isWin) {
      const stepOdds = HiLoEngine.calculateStepOdds(sCard.rank, 1.0);
      const mult = policyGuess === 'HI' ? stepOdds.nextHiMultiplier : stepOdds.nextLoMultiplier;
      totalPaid += bet * mult;
    }
  }

  const empiricalRtp = (totalPaid / totalWagered) * 100;
  console.log(
    `${simCount} rounds: Wagered = ${totalWagered} ETB, Paid = ${totalPaid} ETB, Empirical RTP = ${empiricalRtp.toFixed(2)}%`
  );
  assert(
    empiricalRtp >= 98.0 && empiricalRtp <= 100.0,
    `Empirical RTP (${empiricalRtp.toFixed(2)}%) matches theoretical 99.0% RTP within statistical variance`
  );

  console.log('\n🎉 ALL HI-LO TESTS PASSED! Cryptographic determinism, odds, and 99.0% RTP verified.');
}

runHiLoTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
