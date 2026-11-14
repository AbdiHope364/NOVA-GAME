import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '../config/database.js';
import { ChessMatchService } from '../services/chessMatch.service.js';

async function createChessTestUser(label: string) {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  const username = `chess_${label}_${suffix}`;
  return prisma.user.create({
    data: {
      username,
      email: `${username}@nova-test.et`,
      passwordHash: 'test-hash',
      role: 'USER',
    },
  });
}

test('Private room authorization, legal/illegal moves, duplicate idempotency & ranked category ELO settlement', async () => {
  const p1 = await createChessTestUser('p1');
  const p2 = await createChessTestUser('p2');
  const outsider = await createChessTestUser('outsider');

  // Ensure default ChessConfig allows all modes
  await ChessMatchService.updateAdminConfig(p1.id, {
    enabled: true,
    rankedEnabled: true,
    casualEnabled: true,
    aiEnabled: true,
  });

  const created = await ChessMatchService.createRoom(p1.id, {
    timeControl: 'BLITZ_3_2',
    isRanked: true,
  });
  assert.equal(created.status, 'WAITING');
  assert.equal(created.category, 'BLITZ');

  const joined = await ChessMatchService.joinRoom(p2.id, created.roomCode);
  assert.equal(joined.status, 'PLAYING');
  const matchId = joined.match.matchId;

  // Determine actual White & Black user IDs
  const whiteId = joined.match.whitePlayer.id;
  const blackId = joined.match.blackPlayer.id;

  // Outsider cannot join an active private room
  await assert.rejects(
    () => ChessMatchService.joinRoom(outsider.id, created.roomCode),
    (err: any) => err?.statusCode === 409
  );

  // Outsider cannot move or resign
  await assert.rejects(
    () => ChessMatchService.resignMatch(matchId, outsider.id),
    (err: any) => err?.statusCode === 403
  );

  // Wrong turn (Black trying to move first) rejected
  await assert.rejects(
    () => ChessMatchService.submitMove(matchId, blackId, { from: 'e7', to: 'e5' }),
    (err: any) => err?.statusCode === 403
  );

  // Illegal move (White pawn e2 -> e5) rejected
  await assert.rejects(
    () => ChessMatchService.submitMove(matchId, whiteId, { from: 'e2', to: 'e5' }),
    (err: any) => err?.statusCode === 400
  );

  // Play Fool's Mate with idempotency key on ply 1 and test duplicate idempotency
  const key1 = `key-ply1-${matchId}`;
  const m1 = await ChessMatchService.submitMove(matchId, whiteId, {
    from: 'f2',
    to: 'f3',
    expectedPly: 1,
    idempotencyKey: key1,
  });
  assert.equal(m1.match.moveCount, 1);

  // Re-submitting identical idempotencyKey returns cleanly without duplicating ply
  const m1Dup = await ChessMatchService.submitMove(matchId, whiteId, {
    from: 'f2',
    to: 'f3',
    expectedPly: 1,
    idempotencyKey: key1,
  });
  assert.equal(m1Dup.match.moveCount, 1);

  // Stale expectedPly rejected
  await assert.rejects(
    () =>
      ChessMatchService.submitMove(matchId, blackId, {
        from: 'e7',
        to: 'e5',
        expectedPly: 1,
      }),
    (err: any) => err?.statusCode === 409
  );

  await ChessMatchService.submitMove(matchId, blackId, { from: 'e7', to: 'e5', expectedPly: 2 });
  await ChessMatchService.submitMove(matchId, whiteId, { from: 'g2', to: 'g4', expectedPly: 3 });
  const mateView = await ChessMatchService.submitMove(matchId, blackId, {
    from: 'd8',
    to: 'h4',
    expectedPly: 4,
  });

  assert.equal(mateView.match.status, 'COMPLETED');
  assert.equal(mateView.match.termination, 'CHECKMATE');
  assert.equal(mateView.match.winnerColor, 'b');
  assert.ok(mateView.match.pgn.includes('1. f3 e5 2. g4 Qh4# 0-1'));
  assert.equal(mateView.match.blackEloAfter, 1216);
  assert.equal(mateView.match.whiteEloAfter, 1184);

  // Duplicate settlement must NOT mutate ratings a second time
  await ChessMatchService.finalizeMatch(matchId, { winnerColor: 'b', termination: 'CHECKMATE' });
  const blackBlitzRating = await ChessMatchService.getOrCreateCategoryRating(blackId, 'BLITZ');
  assert.equal(blackBlitzRating.rating, 1216);
  assert.equal(blackBlitzRating.gamesPlayed, 1);

  // Rapid category rating remains untouched at 1200!
  const blackRapidRating = await ChessMatchService.getOrCreateCategoryRating(blackId, 'RAPID');
  assert.equal(blackRapidRating.rating, 1200);
});

test('Casual & AI games do not update multiplayer category ratings', async () => {
  const p1 = await createChessTestUser('casual1');
  const p2 = await createChessTestUser('casual2');

  const room = await ChessMatchService.createRoom(p1.id, {
    timeControl: 'RAPID_10_5',
    isRanked: false,
  });
  const joined = await ChessMatchService.joinRoom(p2.id, room.roomCode);
  const finished = await ChessMatchService.resignMatch(joined.match.matchId, joined.match.whitePlayer.id);
  assert.equal(finished.match.status, 'COMPLETED');
  assert.equal(finished.match.isRanked, false);

  const rapidRating = await ChessMatchService.getOrCreateCategoryRating(
    joined.match.blackPlayer.id,
    'RAPID'
  );
  assert.equal(rapidRating.rating, 1200);
  assert.equal(rapidRating.gamesPlayed, 0);

  const aiSaved = await ChessMatchService.recordAiMatch(p1.id, {
    playerColor: 'w',
    difficulty: 'HARD',
    timeControl: 'CLASSICAL_30_0',
    fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    moves: [],
    winnerColor: 'w',
    termination: 'RESIGNATION',
  });
  assert.ok(aiSaved.matchId);
  const classicalRating = await ChessMatchService.getOrCreateCategoryRating(p1.id, 'CLASSICAL');
  assert.equal(classicalRating.rating, 1200);
});

test('Concurrent Quick Match pairs cleanly without double matching', async () => {
  const host = await createChessTestUser('qm_host');
  const joinerA = await createChessTestUser('qm_a');
  const joinerB = await createChessTestUser('qm_b');

  await ChessMatchService.quickMatch(host.id, { timeControl: 'BULLET_2_1', isRanked: true });

  const [resA, resB] = await Promise.all([
    ChessMatchService.quickMatch(joinerA.id, { timeControl: 'BULLET_2_1', isRanked: true }),
    ChessMatchService.quickMatch(joinerB.id, { timeControl: 'BULLET_2_1', isRanked: true }),
  ]);

  const states = [resA.status, resB.status].sort();
  assert.deepEqual(states, ['PLAYING', 'WAITING']);
});

test('Server-authoritative timeout, disconnect forfeit, reconnect recovery & admin abort audit log', async () => {
  const wUser = await createChessTestUser('clk_w');
  const bUser = await createChessTestUser('clk_b');

  const room = await ChessMatchService.createRoom(wUser.id, {
    timeControl: 'BULLET_1_0',
    isRanked: true,
  });
  const joined = await ChessMatchService.joinRoom(bUser.id, room.roomCode);
  const matchId = joined.match.matchId;

  // Play 1 ply so clocks start ticking
  await ChessMatchService.submitMove(matchId, joined.match.whitePlayer.id, {
    from: 'e2',
    to: 'e4',
  });

  // Backdate lastMoveAt by 90 seconds (past 60s Bullet clock)
  await prisma.chessMatch.update({
    where: { id: matchId },
    data: { lastMoveAt: new Date(Date.now() - 90_000) },
  });

  const timedOut = await ChessMatchService.claimTimeout(matchId);
  assert.equal(timedOut?.match?.status, 'COMPLETED');
  assert.equal(timedOut?.match?.termination, 'TIMEOUT');
  assert.equal(timedOut?.match?.winnerColor, 'w');

  // Test disconnect / reconnect tracking + forfeit + admin abort on another room
  const d1 = await createChessTestUser('disc1');
  const d2 = await createChessTestUser('disc2');
  const r2 = await ChessMatchService.createRoom(d1.id, { timeControl: 'BLITZ_5_0', isRanked: true });
  const j2 = await ChessMatchService.joinRoom(d2.id, r2.roomCode);

  await ChessMatchService.updateConnectionStatus(r2.roomId, d1.id, 'DISCONNECTED');
  await ChessMatchService.updateConnectionStatus(r2.roomId, d1.id, 'CONNECTED');
  const recoveredView = await ChessMatchService.getRoomView(r2.roomId, d1.id);
  const pRec = recoveredView.match.participants.find((p: any) => p.userId === d1.id);
  assert.equal(pRec.connectionStatus, 'CONNECTED');
  assert.equal(pRec.disconnectCount, 1);

  const forfeited = await ChessMatchService.finalizeDisconnectForfeit(r2.roomId, d1.id);
  assert.equal(forfeited?.match?.termination, 'ABANDONED');
  assert.equal(forfeited?.match?.status, 'COMPLETED');

  // Admin abort active match + audit log verification
  const a1 = await createChessTestUser('adm1');
  const a2 = await createChessTestUser('adm2');
  const r3 = await ChessMatchService.createRoom(a1.id, { timeControl: 'BLITZ_5_0', isRanked: true });
  const j3 = await ChessMatchService.joinRoom(a2.id, r3.roomCode);
  await ChessMatchService.adminAbortMatch(a1.id, j3.match.matchId, 'Admin test abort');

  const abortedMatch = await prisma.chessMatch.findUnique({ where: { id: j3.match.matchId } });
  assert.equal(abortedMatch?.status, 'ABORTED');
  assert.equal(abortedMatch?.termination, 'ADMIN_ABORTED');

  const audit = await prisma.adminAuditLog.findFirst({
    where: { action: 'CHESS_MATCH_ABORTED', targetId: j3.match.matchId },
  });
  assert.ok(audit);
});
