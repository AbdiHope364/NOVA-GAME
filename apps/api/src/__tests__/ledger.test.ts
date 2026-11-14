import assert from 'node:assert';
import { prisma, initDatabaseTriggers } from '../config/database.js';
import { LedgerService, InsufficientFundsError } from '../services/ledger.service.js';

let testCount = 0;
let passedCount = 0;

function describe(suiteName: string, fn: () => Promise<void> | void) {
  console.log(`\n📋 SUITE: ${suiteName}`);
  return fn();
}

async function it(testName: string, fn: () => Promise<void>) {
  testCount++;
  try {
    await fn();
    passedCount++;
    console.log(`  ✅ ${testName}`);
  } catch (err) {
    console.error(`  ❌ FAIL: ${testName}`);
    console.error(err);
    process.exit(1);
  }
}

async function runTests() {
  await prisma.$connect();
  await initDatabaseTriggers(prisma);

  // Setup unique test user and wallet
  const testUserId = `test-user-${Date.now()}`;
  await prisma.user.create({
    data: {
      id: testUserId,
      username: `user_${Date.now()}`,
      email: `user_${Date.now()}@novagame.io`,
      passwordHash: 'dummy-hash',
      wallet: {
        create: {
          balance: 10000, // 100.00 ETB in Santim
          currency: 'ETB',
        },
      },
    },
  });

  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: testUserId } });

  await describe('Ledger Service & Database Integrity', async () => {
    await it('1. Rejects overdraft when debit amount exceeds balance', async () => {
      let threw = false;
      try {
        await LedgerService.recordEntry({
          walletId: wallet.id,
          amount: -50000n, // Attempt to debit 500 ETB when balance is 100 ETB
          type: 'STAKE_LOCK',
          idempotencyKey: `test:overdraft:${Date.now()}`,
          actorId: testUserId,
        });
      } catch (err: any) {
        threw = true;
        assert(err instanceof InsufficientFundsError, 'Should throw InsufficientFundsError');
      }
      assert.strictEqual(threw, true, 'Overdraft debit must be rejected');

      // Verify balance was untouched
      const current = await prisma.wallet.findUniqueOrThrow({ where: { id: wallet.id } });
      assert.strictEqual(current.balance, 10000);
    });

    await it('2. Enforces idempotency: duplicate keys return existing entry without double-deduction', async () => {
      const idempotencyKey = `test:idemp:${Date.now()}`;

      // First debit: 2,000 Santim (20.00 ETB)
      const res1 = await LedgerService.recordEntry({
        walletId: wallet.id,
        amount: -2000n,
        type: 'STAKE_LOCK',
        idempotencyKey,
        actorId: testUserId,
      });

      assert.strictEqual(res1.isDuplicate, false);
      assert.strictEqual(res1.balanceAfter, 8000n);

      const balAfterFirst = (await prisma.wallet.findUniqueOrThrow({ where: { id: wallet.id } })).balance;
      assert.strictEqual(balAfterFirst, 8000);

      // Repeat identical debit
      const res2 = await LedgerService.recordEntry({
        walletId: wallet.id,
        amount: -2000n,
        type: 'STAKE_LOCK',
        idempotencyKey,
        actorId: testUserId,
      });

      assert.strictEqual(res2.isDuplicate, true);
      assert.strictEqual(res2.balanceAfter, 8000n);

      // Balance must remain unchanged at 8000
      const balAfterSecond = (await prisma.wallet.findUniqueOrThrow({ where: { id: wallet.id } })).balance;
      assert.strictEqual(balAfterSecond, 8000);
    });

    await it('3. Blocks UPDATE and DELETE on LedgerEntry at database trigger level', async () => {
      const entry = await prisma.ledgerEntry.findFirstOrThrow({ where: { walletId: wallet.id } });

      let updateBlocked = false;
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE LedgerEntry SET amount = 999999 WHERE id = '${entry.id}'`
        );
      } catch (err: any) {
        updateBlocked = true;
      }
      assert.strictEqual(updateBlocked, true, 'Database trigger must abort UPDATE on LedgerEntry');

      let deleteBlocked = false;
      try {
        await prisma.$executeRawUnsafe(
          `DELETE FROM LedgerEntry WHERE id = '${entry.id}'`
        );
      } catch (err: any) {
        deleteBlocked = true;
      }
      assert.strictEqual(deleteBlocked, true, 'Database trigger must abort DELETE on LedgerEntry');
    });

    await it('4. 50 parallel debits test: no race conditions or negative balances', async () => {
      // Create fresh wallet with 1,000 Santim
      const concurrentUserId = `concurrent-user-${Date.now()}`;
      await prisma.user.create({
        data: {
          id: concurrentUserId,
          username: `concurrent_${Date.now()}`,
          email: `concurrent_${Date.now()}@novagame.io`,
          passwordHash: 'dummy-hash',
          wallet: {
            create: {
              balance: 1000, // 10.00 ETB
              currency: 'ETB',
            },
          },
        },
      });

      const concurrentWallet = await prisma.wallet.findUniqueOrThrow({
        where: { userId: concurrentUserId },
      });

      // Fire 50 simultaneous debits of 100 Santim each (total 5,000 Santim, only 10 should succeed!)
      const debits = Array.from({ length: 50 }, (_, i) =>
        LedgerService.recordEntry({
          walletId: concurrentWallet.id,
          amount: -100n,
          type: 'STAKE_LOCK',
          idempotencyKey: `concurrent:${concurrentUserId}:${i}`,
          actorId: concurrentUserId,
        }).then(
          () => ({ success: true }),
          (err) => ({ success: false, err: err.message })
        )
      );

      const results = await Promise.all(debits);
      const successes = results.filter((r) => r.success);
      const failures = results.filter((r) => !r.success);

      assert.strictEqual(successes.length, 10, 'Exactly 10 debits of 100 Santim should succeed from 1000 balance');
      assert.strictEqual(failures.length, 40, 'Remaining 40 debits must fail with insufficient funds');

      const finalWallet = await prisma.wallet.findUniqueOrThrow({
        where: { id: concurrentWallet.id },
      });
      assert.strictEqual(finalWallet.balance, 0, 'Final balance must be exactly 0, never negative');
    });

    await it('5. Match money flow: stake lock -> payout minus rake', async () => {
      const matchId = `match-test-${Date.now()}`;
      const player1Id = `p1-${Date.now()}`;
      const player2Id = `p2-${Date.now()}`;

      // Create two players with 5,000 Santim each
      for (const pid of [player1Id, player2Id]) {
        await prisma.user.create({
          data: {
            id: pid,
            username: `user_${pid}`,
            email: `${pid}@novagame.io`,
            passwordHash: 'dummy',
            wallet: { create: { balance: 5000, currency: 'ETB' } },
          },
        });
      }

      const stakeMinor = 1000n; // 10.00 ETB
      // Lock both stakes
      await LedgerService.lockStake(matchId, player1Id, stakeMinor);
      await LedgerService.lockStake(matchId, player2Id, stakeMinor);

      const w1 = await prisma.wallet.findUniqueOrThrow({ where: { userId: player1Id } });
      const w2 = await prisma.wallet.findUniqueOrThrow({ where: { userId: player2Id } });
      assert.strictEqual(w1.balance, 4000);
      assert.strictEqual(w2.balance, 4000);

      // Payout: Total Pot = 2000 Santim, Rake (5%) = 100 Santim, Winner Payout = 1900 Santim
      const rakeMinor = (stakeMinor * 2n * 500n) / 10000n; // 100n
      const payoutMinor = stakeMinor * 2n - rakeMinor; // 1900n

      await LedgerService.settlePayout(matchId, player1Id, payoutMinor, rakeMinor);

      const w1Final = await prisma.wallet.findUniqueOrThrow({ where: { userId: player1Id } });
      assert.strictEqual(w1Final.balance, 4000 + 1900, 'Winner balance should reflect 1900 payout');
    });
  });

  console.log(`\n🎉 ALL ${passedCount}/${testCount} LEDGER TESTS PASSED SUCCESSFULLY!\n`);
  await prisma.$disconnect();
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
