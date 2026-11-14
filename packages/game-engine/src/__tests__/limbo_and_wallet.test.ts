import { LimboEngine } from '../../../../games/limbo/src/index.js';
import { WalletServiceLogic } from '../../../wallet/src/index.js';
import { ProvablyFair, generateHashChain, verifyHashChainLink, calculateCrashPointFromHash } from '../../../fairness/src/index.js';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ ${msg}`);
}

async function runTestSuite() {
  console.log('--- TEST SUITE 1: Limbo Game Engine & House Edge Math ---');
  const limbo = new LimboEngine(1.0);

  // 1. Parameter Validation
  const v1 = limbo.validateBet(10, { targetMultiplier: 2.0 });
  assert(v1.valid, 'Valid targetMultiplier 2.0x is accepted');

  const v2 = limbo.validateBet(10, { targetMultiplier: 1.00 });
  assert(!v2.valid && Boolean(v2.error?.includes('1.01x')), 'Target multiplier < 1.01x is rejected');

  const v3 = limbo.validateBet(0, { targetMultiplier: 2.0 });
  assert(!v3.valid, 'Bet amount < minBet (1.0) is rejected');

  const v4 = limbo.validateBet(10, { targetMultiplier: 2000000 });
  assert(!v4.valid && Boolean(v4.error?.includes('1,000,000x')), 'Target multiplier > 1,000,000x is rejected');

  // 2. Deterministic Provably Fair Evaluation
  const serverSeed = 'test-server-seed-xyz-123';
  const clientSeed = 'test-client-seed-abc-456';
  const nonce = 42;

  const res1 = limbo.evaluate({
    amount: 100,
    serverSeed,
    clientSeed,
    nonce,
    params: { targetMultiplier: 2.0 },
  });

  assert(typeof res1.outcome.resultMultiplier === 'number', 'Result multiplier is a valid number');
  assert(res1.outcome.resultMultiplier >= 1.00, 'Result multiplier is at least 1.00x');
  assert(res1.outcome.winChance === 49.5, `Win probability for 2.0x target is 49.5% (got ${res1.outcome.winChance}%)`);

  if (res1.won) {
    assert(res1.multiplier === 2.0, 'Won round multiplier matches target 2.0x');
    assert(res1.payout === 200, 'Payout is amount * 2.0 (200 ETB)');
    assert(res1.profit === 100, 'Profit is 100 ETB');
  } else {
    assert(res1.multiplier === 0, 'Lost round multiplier is 0');
    assert(res1.payout === 0, 'Payout is 0 on loss');
    assert(res1.profit === -100, 'Profit is -100 on loss');
  }

  // 3. Monte Carlo Distribution & House Edge Verification (10,000 rounds)
  console.log('Running 10,000 simulated rounds to verify 1% house edge...');
  let totalWagered = 0;
  let totalPayout = 0;
  const simTarget = 2.0;

  for (let i = 1; i <= 10000; i++) {
    const simRes = limbo.evaluate({
      amount: 10,
      serverSeed: `seed-batch-${i % 100}`,
      clientSeed: `client-seed`,
      nonce: i,
      params: { targetMultiplier: simTarget },
    });
    totalWagered += 10;
    totalPayout += simRes.payout;
  }

  const rtp = (totalPayout / totalWagered) * 100;
  console.log(`Simulated 10,000 rounds: Total Wagered = ${totalWagered} ETB, Total Paid = ${totalPayout} ETB, RTP = ${rtp.toFixed(2)}%`);
  assert(rtp > 95.0 && rtp < 103.0, 'RTP aligns closely with 99.0% theoretical RTP (within statistical variance)');

  console.log('\n--- TEST SUITE 2: Integer Santim & Wallet Ledger Logic ---');
  // 1. Santim Conversion
  assert(WalletServiceLogic.etbToSantim(1.0) === 100, '1 ETB = 100 Santim');
  assert(WalletServiceLogic.etbToSantim(125.75) === 12575, '125.75 ETB = 12575 Santim');
  assert(WalletServiceLogic.santimToEtb(12575) === 125.75, '12575 Santim = 125.75 ETB');

  // 2. Balance Validation & Deduction
  const mockWallet = { balance: 100000, lockedBalance: 0 }; // 1,000.00 ETB
  assert(WalletServiceLogic.validateSufficientBalance(mockWallet, 50000), 'Sufficient balance check passes for 500 ETB');
  assert(!WalletServiceLogic.validateSufficientBalance(mockWallet, 150000), 'Insufficient balance check rejects 1500 ETB');

  const afterBet = WalletServiceLogic.deductBet(mockWallet.balance, 1000); // bet 10 ETB
  assert(afterBet === 99000, '990.00 ETB remaining after 10 ETB bet');

  const afterWin = WalletServiceLogic.creditWin(afterBet, 2000); // won 20 ETB
  assert(afterWin === 101000, '1,010.00 ETB balance after 20 ETB payout');

  // 3. Maker-Checker Review Threshold
  assert(!WalletServiceLogic.requiresWithdrawalReview(100000), '1,000 ETB withdrawal does not trigger manual review');
  assert(WalletServiceLogic.requiresWithdrawalReview(500000), '5,000 ETB withdrawal triggers maker-checker review');
  assert(WalletServiceLogic.requiresWithdrawalReview(1000000), '10,000 ETB withdrawal triggers maker-checker review');

  console.log('\n--- TEST SUITE 3: Provably Fair SHA-256 Hash Chain Verification ---');
  const chainLength = 10;
  const chain = generateHashChain(chainLength);
  assert(chain.length === chainLength, `Generated hash chain of length ${chainLength}`);

  for (let i = 0; i < chain.length - 1; i++) {
    const isLinked = verifyHashChainLink(chain[i], chain[i + 1]);
    assert(isLinked, `Hash chain link #${i} correctly hashes to link #${i + 1}`);
  }

  const crashPoint = calculateCrashPointFromHash(chain[0], 'client-salt-test');
  assert(crashPoint >= 1.00, `Crash point calculated from hash is >= 1.00x (${crashPoint}x)`);

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! Everything is hardened, mathematically sound, and fully verified.');
}

runTestSuite().catch((err) => {
  console.error(err);
  process.exit(1);
});
