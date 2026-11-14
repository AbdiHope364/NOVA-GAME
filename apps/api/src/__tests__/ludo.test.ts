import assert from 'node:assert/strict';
import test from 'node:test';
import { ProvablyFair } from '@nova/fairness';
import { prisma } from '../config/database.js';
import { LudoMatchService } from '../services/ludoMatch.service.js';

async function createLudoUser(label: string, balanceEtb = 500) {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  const username = `ludo_${label}_${suffix}`;
  const user = await prisma.user.create({
    data: {
      username,
      email: `${username}@nova-test.et`,
      passwordHash: 'test-hash',
      role: 'USER',
    },
  });
  await prisma.wallet.create({
    data: {
      userId: user.id,
      balance: Math.round(balanceEtb * 100),
    },
  });
  return user;
}

test('LUDO_HMAC_V1 rejection sampling uniformity and independent verification', () => {
  const serverSeed = ProvablyFair.generateServerSeed();
  const serverSeedHash = ProvablyFair.hashServerSeed(serverSeed);
  const combinedSeed = 'client-a:client-b';

  const counts = [0, 0, 0, 0, 0, 0];
  for (let nonce = 1; nonce <= 12000; nonce++) {
    const roll = ProvablyFair.generateLudoDice(serverSeed, combinedSeed, nonce);
    assert.equal(roll.algorithmVersion, 'LUDO_HMAC_V1');
    assert.ok(roll.dice >= 1 && roll.dice <= 6);
    counts[roll.dice - 1]++;
  }
  // Each face expected ~2000 out of 12000 (chi-square well within loose tolerance)
  for (const c of counts) {
    assert.ok(c > 1750 && c < 2250, `Unexpected die distribution count ${c}`);
  }

  const check = ProvablyFair.verifyLudoRoll(serverSeed, serverSeedHash, combinedSeed, 42);
  assert.equal(check.isValidHash, true);
  assert.equal(
    check.dice,
    ProvablyFair.generateLudoDice(serverSeed, combinedSeed, 42).dice
  );
});

test('Real-money gate blocks staked rooms when realMoneyEnabled=false, allows when enabled + atomic lock/refund/settlement', async () => {
  const admin = await createLudoUser('adm', 1000);
  const p1 = await createLudoUser('p1', 200);
  const p2 = await createLudoUser('p2', 200);
  const p3 = await createLudoUser('p3', 200);

  await LudoMatchService.updateAdminConfig(admin.id, {
    enabled: true,
    realMoneyEnabled: false,
    quickMatchEnabled: true,
    privateRoomsEnabled: true,
    platformFeePercent: 5,
  });

  // Staked creation blocked while realMoneyEnabled=false
  await assert.rejects(
    () => LudoMatchService.createRoom(p1.id, { playerCount: 2, stakeEtb: 50 }),
    (err: any) => err?.statusCode === 403
  );

  // Enable realMoneyEnabled via Admin -> create 3-player room -> join -> leave refunds
  await LudoMatchService.updateAdminConfig(admin.id, { realMoneyEnabled: true });
  const r3 = await LudoMatchService.createRoom(p1.id, { playerCount: 3, stakeEtb: 50 });
  assert.equal(r3.status, 'WAITING');
  assert.equal(r3.prizeBreakdown.winnerReceivesEtb, 142.5);

  const joined2 = await LudoMatchService.joinRoom(p2.id, r3.roomCode);
  assert.equal(joined2.players.length, 2);
  assert.equal(joined2.status, 'WAITING'); // 3P does not start until seat 3 fills

  // Host cancels lobby -> refunds p1 and p2 atomically
  await LudoMatchService.leaveRoom(r3.roomId, p1.id);
  const w1 = await prisma.wallet.findUnique({ where: { userId: p1.id } });
  const w2 = await prisma.wallet.findUnique({ where: { userId: p2.id } });
  assert.equal(w1?.balance, 20000);
  assert.equal(w2?.balance, 20000);

  // Full 2P Staked Match + Client Seed lock + Idempotent Roll + Forfeit Settlement
  const r2 = await LudoMatchService.createRoom(p1.id, { playerCount: 2, stakeEtb: 50 });
  const full = await LudoMatchService.joinRoom(p3.id, r2.roomCode);
  assert.equal(full.status, 'PLAYING');
  const matchId = full.match.matchId;

  // Client seed update allowed before nonce > 0
  await LudoMatchService.updateClientSeed(r2.roomId, p1.id, 'custom-pre-roll-seed');

  // Idempotent roll
  const rollKey = `idemp-roll-${matchId}`;
  const rolled1 = await LudoMatchService.rollDice(matchId, p1.id, { idempotencyKey: rollKey });
  const rolledDup = await LudoMatchService.rollDice(matchId, p1.id, { idempotencyKey: rollKey });
  assert.equal(rolled1.match.nonce, 1);
  assert.equal(rolledDup.match.nonce, 1);

  // Client seed locked permanently once Roll #1 happened
  await assert.rejects(
    () => LudoMatchService.updateClientSeed(r2.roomId, p1.id, 'tamper-seed'),
    (err: any) => err?.statusCode === 409
  );

  // P3 forfeits -> P1 wins 95 ETB payout (200 - 50 + 95 = 245 ETB = 24500 santim)
  const ended = await LudoMatchService.forfeitPlayer(matchId, p3.id);
  assert.equal(ended.match.status, 'COMPLETED');
  assert.equal(ended.match.winnerId, p1.id);

  const p1WalletAfter = await prisma.wallet.findUnique({ where: { userId: p1.id } });
  assert.equal(p1WalletAfter?.balance, 24500);

  // Fairness verification post-match
  const verification = await LudoMatchService.verifyMatchRolls(matchId);
  assert.ok(verification.serverSeed);
  assert.equal(verification.rolls.length, 1);
  assert.equal(verification.rolls[0].matches, true);

  // Reset default realMoneyEnabled back to false
  await LudoMatchService.updateAdminConfig(admin.id, { realMoneyEnabled: false });
});

test('30s turn timeout auto-rolls without strategic move and pauses during 45s disconnect grace', async () => {
  const p1 = await createLudoUser('tm1', 0);
  const p2 = await createLudoUser('tm2', 0);

  const r = await LudoMatchService.createRoom(p1.id, { playerCount: 2, stakeEtb: 0 });
  const full = await LudoMatchService.joinRoom(p2.id, r.roomCode);
  const matchId = full.match.matchId;

  // Disconnect p1 -> pauses active turn clock (turnPausedRemainMs set, turnDeadlineAt cleared)
  await LudoMatchService.updateConnectionStatus(r.roomId, p1.id, 'DISCONNECTED');
  const pausedMatch = await prisma.ludoMatch.findUnique({ where: { id: matchId } });
  assert.equal(pausedMatch?.turnDeadlineAt, null);
  assert.ok((pausedMatch?.turnPausedRemainMs ?? 0) >= 10_000);

  // Timeout check while paused MUST NOT trigger timeout before reconnect grace resolves
  const noOpWhilePaused = await LudoMatchService.handleTurnTimeout(matchId);
  assert.equal(noOpWhilePaused, null);

  // Reconnect p1 -> restores turnDeadlineAt
  await LudoMatchService.updateConnectionStatus(r.roomId, p1.id, 'CONNECTED');
  const resumed = await prisma.ludoMatch.findUnique({ where: { id: matchId } });
  assert.ok(resumed?.turnDeadlineAt);
  assert.equal(resumed?.turnPausedRemainMs, null);

  // Backdate turnDeadlineAt -> server auto-rolls on ROLL phase timeout
  await prisma.ludoMatch.update({
    where: { id: matchId },
    data: { turnDeadlineAt: new Date(Date.now() - 5000) },
  });
  const afterAutoRoll = await LudoMatchService.handleTurnTimeout(matchId);
  assert.equal(afterAutoRoll?.match?.nonce, 1);
});
