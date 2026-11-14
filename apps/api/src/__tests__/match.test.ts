import assert from 'node:assert';
import { prisma, initDatabaseTriggers } from '../config/database.js';
import { MatchService } from '../services/match.service.js';
import { IllegalMoveError, type Pos } from '@nova/game-dama';

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

async function createPlayer(prefix: string, balanceSantim = 100000) {
  const userId = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await prisma.user.create({
    data: {
      id: userId,
      username: `user_${userId}`,
      email: `${userId}@novagame.io`,
      passwordHash: 'dummy',
      wallet: {
        create: {
          balance: balanceSantim,
          currency: 'ETB',
        },
      },
    },
  });
  return userId;
}

async function runTests() {
  await prisma.$connect();
  await initDatabaseTriggers(prisma);

  await describe('Dama Match Service End-to-End Integration', async () => {
    await it('1. Locks stakes from both wallets on match join in one transaction', async () => {
      const p1 = await createPlayer('host', 50000); // 500.00 ETB
      const p2 = await createPlayer('joiner', 50000); // 500.00 ETB
      const stakeMinor = 10000n; // 100.00 ETB

      const challenge = await MatchService.createChallenge(p1, stakeMinor);
      assert.strictEqual(challenge.status, 'LOBBY');

      const match = await MatchService.joinMatch(challenge.id, p2);
      assert.strictEqual(match.status, 'ACTIVE');

      // Both players must have exactly 400.00 ETB (40,000 Santim) remaining
      const w1 = await prisma.wallet.findUniqueOrThrow({ where: { userId: p1 } });
      const w2 = await prisma.wallet.findUniqueOrThrow({ where: { userId: p2 } });
      assert.strictEqual(w1.balance, 40000, 'Host stake locked');
      assert.strictEqual(w2.balance, 40000, 'Joiner stake locked');
    });

    await it('2. Rejects join and charges nothing if joining player has insufficient funds', async () => {
      const p1 = await createPlayer('rich_host', 50000);
      const p2 = await createPlayer('broke_joiner', 500); // Only 5.00 ETB
      const stakeMinor = 2000n; // 20.00 ETB

      const challenge = await MatchService.createChallenge(p1, stakeMinor);

      let threw = false;
      try {
        await MatchService.joinMatch(challenge.id, p2);
      } catch (err) {
        threw = true;
      }
      assert.strictEqual(threw, true, 'Join should fail due to insufficient funds');

      // Check host wallet: unchanged at 500.00 ETB
      const w1 = await prisma.wallet.findUniqueOrThrow({ where: { userId: p1 } });
      const w2 = await prisma.wallet.findUniqueOrThrow({ where: { userId: p2 } });
      assert.strictEqual(w1.balance, 50000, 'Host was charged nothing');
      assert.strictEqual(w2.balance, 500, 'Joiner balance unchanged');
    });

    await it('3. Validates legal moves via pure rules engine & rejects illegal moves', async () => {
      const p1 = await createPlayer('m1', 50000);
      const p2 = await createPlayer('m2', 50000);
      const stake = 1000n;

      const challenge = await MatchService.createChallenge(p1, stake);
      const match = await MatchService.joinMatch(challenge.id, p2);

      const whiteUserId = match.whitePlayer?.id!;
      const blackUserId = match.blackPlayer?.id!;

      // White tries an illegal move (moving backward or jumping into wall)
      let rejected = false;
      try {
        await MatchService.handleMove(match.id, whiteUserId, [7, 0] as Pos, [[8, 1]] as Pos[]);
      } catch (err: any) {
        rejected = true;
      }
      assert.strictEqual(rejected, true, 'Illegal move out of bounds rejected');

      // Black tries to move when it is White's turn
      let wrongTurn = false;
      try {
        await MatchService.handleMove(match.id, blackUserId, [2, 1] as Pos, [[3, 2]] as Pos[]);
      } catch (err: any) {
        wrongTurn = true;
      }
      assert.strictEqual(wrongTurn, true, 'Moving out of turn rejected');

      // White plays legal opening move [5, 2] -> [4, 3]
      const moveRes = await MatchService.handleMove(match.id, whiteUserId, [5, 2] as Pos, [[4, 3]] as Pos[]);
      assert.strictEqual(moveRes.isFinished, false);
      assert.strictEqual(moveRes.state.turn, 'B');
      assert.strictEqual(moveRes.ply, 1);

      // Verify MatchMove dispute record was appended to DB
      const recordedMoves = await prisma.matchMove.findMany({ where: { matchId: match.id } });
      assert.strictEqual(recordedMoves.length, 1);
      assert.strictEqual(recordedMoves[0].userId, whiteUserId);
    });

    await it('4. Settles winner payout minus 5% rake on resignation or win', async () => {
      const p1 = await createPlayer('resigner', 50000);
      const p2 = await createPlayer('victor', 50000);
      const stake = 10000n; // 100.00 ETB

      const challenge = await MatchService.createChallenge(p1, stake);
      const match = await MatchService.joinMatch(challenge.id, p2);

      // p1 resigns
      const settlement = await MatchService.resignMatch(match.id, p1);
      assert.strictEqual(settlement.status, 'FINISHED');
      assert.strictEqual(settlement.winnerId, p2);

      // Total pot = 200.00 ETB (20,000 Santim)
      // Rake (5%) = 10.00 ETB (1,000 Santim)
      // Winner payout = 190.00 ETB (19,000 Santim)
      assert.strictEqual(settlement.payoutMinor, '19000');
      assert.strictEqual(settlement.rakeMinor, '1000');

      const victorWallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: p2 } });
      // Victor started with 50,000, locked 10,000 (bal 40,000), won 19,000 -> final 59,000
      assert.strictEqual(victorWallet.balance, 59000);
    });

    await it('5. Draw refunds exact stake to both players', async () => {
      const p1 = await createPlayer('draw1', 50000);
      const p2 = await createPlayer('draw2', 50000);
      const stake = 5000n; // 50.00 ETB

      const challenge = await MatchService.createChallenge(p1, stake);
      const match = await MatchService.joinMatch(challenge.id, p2);

      // Settle as draw
      const settlement = await MatchService.settleMatch(match.id, null, 'DRAW');
      assert.strictEqual(settlement?.result, 'DRAW');

      const w1 = await prisma.wallet.findUniqueOrThrow({ where: { userId: p1 } });
      const w2 = await prisma.wallet.findUniqueOrThrow({ where: { userId: p2 } });
      assert.strictEqual(w1.balance, 50000, 'Player 1 refunded full stake');
      assert.strictEqual(w2.balance, 50000, 'Player 2 refunded full stake');
    });

    await it('6. Single-execution settlement idempotency: double settlement executes payout once', async () => {
      const p1 = await createPlayer('idemp1', 50000);
      const p2 = await createPlayer('idemp2', 50000);
      const stake = 2000n;

      const challenge = await MatchService.createChallenge(p1, stake);
      const match = await MatchService.joinMatch(challenge.id, p2);

      // Call settleMatch twice in parallel
      const [res1, res2] = await Promise.all([
        MatchService.settleMatch(match.id, p1, 'WHITE_WIN'),
        MatchService.settleMatch(match.id, p1, 'WHITE_WIN'),
      ]);

      const victorWallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: p1 } });
      // 50,000 - 2,000 = 48,000 + 3,800 payout = 51,800
      assert.strictEqual(victorWallet.balance, 51800, 'Payout must be credited exactly once');
    });

    await it('7. Forfeits match on clock expiry', async () => {
      const p1 = await createPlayer('timeout_white', 50000);
      const p2 = await createPlayer('fast_black', 50000);
      const stake = 1000n;

      const challenge = await MatchService.createChallenge(p1, stake);
      const match = await MatchService.joinMatch(challenge.id, p2);

      const whiteUserId = match.whitePlayer?.id!;
      const blackUserId = match.blackPlayer?.id!;

      // Simulate clock expiry by updating clocks in DB to 0 ms remaining
      await prisma.match.update({
        where: { id: match.id },
        data: {
          clocks: JSON.stringify({
            whiteTimeMs: 0,
            blackTimeMs: 300000,
            lastMoveTimestamp: Date.now() - 5000,
          }),
        },
      });

      // White attempts move after time expired
      const res = await MatchService.handleMove(match.id, whiteUserId, [5, 2] as Pos, [[4, 3]] as Pos[]);
      assert.strictEqual(res.isFinished, true);
      assert.strictEqual(res.result, 'FORFEIT_WHITE');
      assert.strictEqual(res.winnerId, blackUserId);
    });

    await it('8. Reconnect state retrieval returns full authoritative board and dispute record', async () => {
      const p1 = await createPlayer('rec1', 50000);
      const p2 = await createPlayer('rec2', 50000);

      const challenge = await MatchService.createChallenge(p1, 1000n);
      const match = await MatchService.joinMatch(challenge.id, p2);

      // Reconnect query by ID
      const state = await MatchService.getMatch(match.id);
      assert.strictEqual(state.id, match.id);
      assert.strictEqual(state.status, 'ACTIVE');
      assert(state.state.board.length === 8);
      assert(state.clocks !== null);
      assert.strictEqual(state.rulesetVersion, '1.0.0');
    });

    await it('9. Free-to-Play match (0 stake): works end-to-end without touching wallet balances', async () => {
      const p1 = await createPlayer('free_host', 0); // 0 balance
      const p2 = await createPlayer('free_joiner', 0); // 0 balance

      const challenge = await MatchService.createChallenge(p1, 0n);
      assert.strictEqual(challenge.status, 'LOBBY');
      assert.strictEqual(challenge.isFreePlay, true);

      const match = await MatchService.joinMatch(challenge.id, p2);
      assert.strictEqual(match.status, 'ACTIVE');
      assert.strictEqual(match.stakeMinor, '0');

      // Wallets must remain strictly untouched
      const w1 = await prisma.wallet.findUniqueOrThrow({ where: { userId: p1 } });
      const w2 = await prisma.wallet.findUniqueOrThrow({ where: { userId: p2 } });
      assert.strictEqual(w1.balance, 0);
      assert.strictEqual(w2.balance, 0);

      // Resign free match
      const whiteId = match.whitePlayer?.id!;
      const resignRes = await MatchService.resignMatch(match.id, whiteId);
      assert.strictEqual(resignRes.status, 'FINISHED');
      assert.strictEqual(resignRes.payoutMinor, '0');
    });

    await it('10. Host can cancel an open challenge in LOBBY; non-host is rejected', async () => {
      const p1 = await createPlayer('cancel_host', 50000);
      const p2 = await createPlayer('stranger', 50000);

      const challenge = await MatchService.createChallenge(p1, 0n);
      assert.strictEqual(challenge.status, 'LOBBY');

      // Stranger tries to cancel -> 403
      await assert.rejects(
        async () => {
          await MatchService.cancelChallenge(challenge.id, p2);
        },
        (err: any) => err.statusCode === 403
      );

      // Host cancels -> CANCELLED
      const res = await MatchService.cancelChallenge(challenge.id, p1);
      assert.strictEqual(res.status, 'CANCELLED');
    });

    await it('11. User match history retrieves paginated past matches with opponent metadata', async () => {
      const p1 = await createPlayer('hist_player', 50000);
      const p2 = await createPlayer('hist_opponent', 50000);

      const challenge = await MatchService.createChallenge(p1, 0n);
      const match = await MatchService.joinMatch(challenge.id, p2);
      await MatchService.resignMatch(match.id, p2);

      const history = await MatchService.getUserMatchHistory(p1, 1, 10);
      assert(history.matches.length >= 1);
      const found = history.matches.find((m) => m.id === match.id);
      assert(found !== undefined);
      assert.strictEqual(found.isWinner, true);
      assert.strictEqual(found.isFreePlay, true);
      assert.strictEqual(found.rulesetVersion, '1.0.0');
      assert(found.opponent !== null);
    });
  });

  console.log(`\n🎉 ALL ${passedCount}/${testCount} MATCH INTEGRATION TESTS PASSED SUCCESSFULLY!\n`);
  await prisma.$disconnect();
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
