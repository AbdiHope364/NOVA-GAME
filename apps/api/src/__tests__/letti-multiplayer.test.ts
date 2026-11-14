import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { LettiEngine } from '@nova/game-letti';
import { prisma, initDatabaseTriggers } from '../config/database.js';
import { WalletService } from '../services/wallet.service.js';
import { LettiMatchService } from '../services/lettiMatch.service.js';

async function createTestUser(label: string, cashEtb: number, bonusEtb = 0) {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const username = `pvp_${label}_${suffix}`;
  const email = `${username}@nova-test.et`;

  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash: 'test-hash',
      role: 'USER',
    },
  });

  await prisma.wallet.create({
    data: {
      userId: user.id,
      balance: Math.round(cashEtb * 100),
      bonusBalance: Math.round(bonusEtb * 100),
      withdrawableBalance: Math.round(cashEtb * 100),
    },
  });

  return user;
}

async function runLettiMultiplayerTests() {
  await initDatabaseTriggers();

  // 1. Engine duel deck order tests (52 - 2 secret cards = 50 cards)
  const deckA = LettiEngine.buildDuelShuffledOrder(0, 15, 'server-seed-1', 'client-1', 1);
  const deckB = LettiEngine.buildDuelShuffledOrder(0, 15, 'server-seed-1', 'client-1', 1);
  assert.equal(deckA.length, 50);
  assert.deepEqual(deckA, deckB, 'Duel shuffle must be deterministic for identical seeds');
  assert.equal(deckA.includes(0), false, 'P1 picked card must be excluded from 50-card deck');
  assert.equal(deckA.includes(15), false, 'P2 picked card must be excluded from 50-card deck');
  assert.equal(new Set(deckA).size, 50, 'All 50 cards in duel deck must be unique');

  // Ensure default config is standard (5% fee, 10..5000 ETB, allowBonusBalance: false)
  await prisma.lettiMultiplayerConfig.upsert({
    where: { id: 'default' },
    update: {
      enabled: true,
      quickMatchEnabled: true,
      privateRoomsEnabled: true,
      minStakeSantim: 1000,
      maxStakeSantim: 500000,
      platformFeeBps: 500,
      reconnectGraceSeconds: 45,
      maxDisconnects: 3,
      roomExpiryMinutes: 15,
      turnTimeoutSeconds: 30,
      allowBonusBalance: false,
    },
    create: { id: 'default' },
  });

  const p1 = await createTestUser('p1', 1000);
  const p2 = await createTestUser('p2', 1000);
  const p3 = await createTestUser('p3', 1000);
  const bonusOnlyUser = await createTestUser('bonus', 0, 500);

  // 2. Real-cash enforcement check (bonus-only user rejected when allowBonusBalance = false)
  await assert.rejects(
    () => LettiMatchService.createRoom(bonusOnlyUser.id, 100, 'PRIVATE'),
    (err: any) => /Insufficient cash balance/i.test(err?.message || '')
  );

  // 3. Private Room Creation, Joining, Duplicate/3rd Player Rejection
  const createdView = await LettiMatchService.createRoom(p1.id, 100, 'PRIVATE');
  assert.equal(createdView.roomStatus, 'WAITING');
  assert.equal(createdView.stakeEtb, 100);
  assert.equal((await WalletService.getWallet(p1.id)).cashBalance, 900);

  // Re-joining own room is idempotent (no duplicate seat, no double stake deduction)
  const selfRejoinView = await LettiMatchService.joinRoom(p1.id, createdView.roomCode);
  assert.equal(selfRejoinView.roomId, createdView.roomId);
  assert.equal(selfRejoinView.playerTwo, null);
  assert.equal((await WalletService.getWallet(p1.id)).cashBalance, 900);

  // P2 joins private room -> moves to READY / PICKING
  const joinedView = await LettiMatchService.joinRoom(p2.id, createdView.roomCode);
  assert.equal(joinedView.roomStatus, 'READY');
  assert.equal(joinedView.phase, 'PICKING');
  assert.equal(joinedView.remainingDeckCount, 50);
  assert.ok(joinedView.matchId);
  assert.equal((await WalletService.getWallet(p2.id)).cashBalance, 900);

  // 3rd user rejected
  await assert.rejects(
    () => LettiMatchService.joinRoom(p3.id, createdView.roomCode),
    (err: any) => err?.statusCode === 409
  );

  const matchId = joinedView.matchId!;

  // 4. Invalid card pick & identical pick rejection + security view isolation
  await assert.rejects(
    () =>
      LettiMatchService.handleAction(p1.id, matchId, {
        actionType: 'PICK_CARD',
        pickedCardIndex: 99,
      }),
    (err: any) => err?.statusCode === 400
  );

  await LettiMatchService.handleAction(p1.id, matchId, {
    actionType: 'PICK_CARD',
    pickedCardIndex: 7,
  });

  // P2 cannot pick the exact same index 7
  await assert.rejects(
    () =>
      LettiMatchService.handleAction(p2.id, matchId, {
        actionType: 'PICK_CARD',
        pickedCardIndex: 7,
      }),
    (err: any) => err?.statusCode === 409
  );

  await LettiMatchService.handleAction(p2.id, matchId, {
    actionType: 'PICK_CARD',
    pickedCardIndex: 20,
  });

  // Security check: before match completes, NEITHER player sees opponentPickedCard or serverSeed
  const p1ViewPre = await LettiMatchService.getSanitizedRoomView(createdView.roomId, p1.id);
  const p2ViewPre = await LettiMatchService.getSanitizedRoomView(createdView.roomId, p2.id);
  assert.equal(p1ViewPre.myPickedCard?.index, 7);
  assert.equal(p1ViewPre.opponentPickedCard, null);
  assert.equal(p1ViewPre.serverSeed, null);
  assert.equal(p2ViewPre.myPickedCard?.index, 20);
  assert.equal(p2ViewPre.opponentPickedCard, null);
  assert.equal(p2ViewPre.serverSeed, null);

  // 5. Ready Up & Turn Validation
  await LettiMatchService.handleAction(p1.id, matchId, { actionType: 'PLAYER_READY' });
  await LettiMatchService.handleAction(p2.id, matchId, { actionType: 'PLAYER_READY' });

  const startedView = await LettiMatchService.getSanitizedRoomView(createdView.roomId, p1.id);
  assert.equal(startedView.phase, 'PLAYING');
  assert.equal(startedView.currentTurnUserId, p1.id);

  // Out-of-turn flip by P2 must be rejected
  await assert.rejects(
    () => LettiMatchService.handleAction(p2.id, matchId, { actionType: 'FLIP_CARD' }),
    (err: any) => err?.statusCode === 403
  );

  // Idempotency test: duplicate flip request with same key does not advance deck twice
  const idemKey = `test-flip-1-${crypto.randomUUID()}`;
  await LettiMatchService.handleAction(p1.id, matchId, {
    actionType: 'FLIP_CARD',
    idempotencyKey: idemKey,
  });
  await LettiMatchService.handleAction(p1.id, matchId, {
    actionType: 'FLIP_CARD',
    idempotencyKey: idemKey,
  });
  const afterIdem = await LettiMatchService.getSanitizedRoomView(createdView.roomId, p1.id);
  assert.equal(afterIdem.playerOneFlips.length + afterIdem.playerTwoFlips.length, 1);

  // Server restart/refresh state recovery check via getActiveRoomForUser
  const recovered = await LettiMatchService.getActiveRoomForUser(p2.id);
  assert.equal(recovered?.roomId, createdView.roomId);

  // Disconnect & Reconnect state update check
  await LettiMatchService.updateConnectionStatus(createdView.roomId, p2.id, 'DISCONNECTED');
  const whileOffline = await LettiMatchService.getSanitizedRoomView(createdView.roomId, p1.id);
  assert.equal(whileOffline.playerTwo?.connectionStatus, 'DISCONNECTED');
  assert.equal(whileOffline.playerTwo?.disconnectCount, 1);
  await LettiMatchService.updateConnectionStatus(createdView.roomId, p2.id, 'CONNECTED');

  // 6. Play alternate turns until COMPLETED (Win or Draw)
  let current = await LettiMatchService.getSanitizedRoomView(createdView.roomId, p1.id);
  let safetyCounter = 0;
  while (current.phase === 'PLAYING' && safetyCounter < 52) {
    const turnUser = current.currentTurnUserId!;
    await LettiMatchService.handleAction(turnUser, matchId, { actionType: 'FLIP_CARD' });
    current = await LettiMatchService.getSanitizedRoomView(createdView.roomId, p1.id);
    safetyCounter += 1;
  }
  assert.equal(current.phase, 'COMPLETED');
  assert.ok(current.opponentPickedCard !== null, 'Opponent secret card must reveal after completion');
  assert.ok(current.serverSeed !== null, 'Server seed must reveal after completion');

  // Double-settlement / post-completion action guard
  await assert.rejects(
    () => LettiMatchService.handleAction(p1.id, matchId, { actionType: 'FLIP_CARD' }),
    (err: any) => err?.statusCode === 409
  );

  const p1CashAfter = (await WalletService.getWallet(p1.id)).cashBalance;
  const p2CashAfter = (await WalletService.getWallet(p2.id)).cashBalance;
  if (current.resultType === 'DRAW') {
    assert.equal(p1CashAfter, 1000);
    assert.equal(p2CashAfter, 1000);
  } else if (current.winnerId === p1.id) {
    assert.equal(p1CashAfter, 1090); // 900 + 190 (200 pot - 5% 10 fee)
    assert.equal(p2CashAfter, 900);
  } else {
    assert.equal(p2CashAfter, 1090);
    assert.equal(p1CashAfter, 900);
  }

  // 7. Mutual-Consent Rematch
  const r1 = await LettiMatchService.requestRematch(p1.id, createdView.roomId);
  assert.equal(r1.rematchReady, false);
  const r2 = await LettiMatchService.requestRematch(p2.id, createdView.roomId);
  assert.equal(r2.rematchReady, true);
  assert.ok(r2.newRoomId);

  // Cancel rematch room before picking -> both refunded
  await LettiMatchService.leaveOrCancelRoom(p1.id, r2.newRoomId!);
  const cancelledRematch = await LettiMatchService.getSanitizedRoomView(r2.newRoomId!, p1.id);
  assert.equal(cancelledRematch.roomStatus, 'CANCELLED');

  // 8. Quick Match + Forfeit test
  const q1 = await LettiMatchService.quickMatch(p1.id, 50);
  assert.equal(q1.matched, false);
  const q2 = await LettiMatchService.quickMatch(p2.id, 50);
  assert.equal(q2.matched, true);
  assert.equal(q2.view.roomId, q1.view.roomId);

  const qMatchId = q2.view.matchId!;
  await LettiMatchService.handleAction(p1.id, qMatchId, {
    actionType: 'PICK_CARD',
    pickedCardIndex: 1,
  });
  await LettiMatchService.handleAction(p2.id, qMatchId, {
    actionType: 'PICK_CARD',
    pickedCardIndex: 2,
  });
  await LettiMatchService.handleAction(p1.id, qMatchId, { actionType: 'PLAYER_READY' });
  await LettiMatchService.handleAction(p2.id, qMatchId, { actionType: 'PLAYER_READY' });

  // P2 forfeits mid-match -> P1 wins 95 ETB (100 - 5% fee)
  const p1CashBeforeForfeit = (await WalletService.getWallet(p1.id)).cashBalance;
  const leaveOutcome = await LettiMatchService.leaveOrCancelRoom(p2.id, q2.view.roomId);
  assert.equal(leaveOutcome.action, 'FORFEIT_REQUIRED');
  await LettiMatchService.handleAction(p2.id, qMatchId, { actionType: 'FORFEIT' });
  const p1CashAfterForfeit = (await WalletService.getWallet(p1.id)).cashBalance;
  assert.equal(p1CashAfterForfeit, p1CashBeforeForfeit + 95);

  console.log('ALL LETTI 1v1 MULTIPLAYER INTEGRATION & SECURITY TESTS PASSED!');
}

runLettiMultiplayerTests()
  .catch((err) => {
    console.error('Letti multiplayer test failure:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
