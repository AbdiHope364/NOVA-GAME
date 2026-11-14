import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CHESS_TIME_CONTROLS,
  ChessDifficulty,
  ChessEngine,
  STARTING_FEN,
  calculateChessElo,
  chooseChessAiMove,
} from '../index.js';

test('Fools mate checkmate detection and PGN generation', () => {
  const chess = new ChessEngine(STARTING_FEN);
  assert.ok(chess.makeMove({ from: 'f2', to: 'f3' }));
  assert.ok(chess.makeMove({ from: 'e7', to: 'e5' }));
  assert.ok(chess.makeMove({ from: 'g2', to: 'g4' }));
  const mate = chess.makeMove({ from: 'd8', to: 'h4' });
  if (!mate) throw new Error('Expected Qh4# move to succeed');
  assert.equal(mate.san, 'Qh4#');
  assert.equal(chess.isCheckmate(), true);
  assert.deepEqual(chess.getGameOverResult(), {
    isOver: true,
    winnerColor: 'b',
    termination: 'CHECKMATE',
  });
  const pgn = chess.getPgn({ white: 'Alice', black: 'Bob', result: '0-1' });
  assert.ok(pgn.includes('1. f3 e5 2. g4 Qh4# 0-1'));
});

test('Castling blocked through attacked square and allowed when clear', () => {
  const safeFen = '4k3/8/2b5/8/8/8/8/4K2R w K - 0 1';
  const c1 = new ChessEngine(safeFen);
  const castle = c1.makeMove({ from: 'e1', to: 'g1' });
  if (!castle) throw new Error('Expected O-O move to succeed');
  assert.equal(castle.san, 'O-O');
  assert.equal(c1.getPieceAt('f1')?.type, 'r');

  const blockedFen = '4kr2/8/8/8/8/8/8/4K2R w K - 0 1';
  const c2 = new ChessEngine(blockedFen);
  assert.equal(c2.makeMove({ from: 'e1', to: 'g1' }), null);
});

test('En passant capture removes enemy pawn', () => {
  const chess = new ChessEngine();
  assert.ok(chess.makeMove({ from: 'e2', to: 'e4' }));
  assert.ok(chess.makeMove({ from: 'a7', to: 'a6' }));
  assert.ok(chess.makeMove({ from: 'e4', to: 'e5' }));
  assert.ok(chess.makeMove({ from: 'd7', to: 'd5' }));
  const ep = chess.makeMove({ from: 'e5', to: 'd6' });
  if (!ep) throw new Error('Expected en passant move to succeed');
  assert.equal(ep.san, 'exd6');
  assert.equal(chess.getPieceAt('d5'), null);
  assert.equal(chess.getPieceAt('d6')?.type, 'p');
});

test('Pawn promotion converts piece to Queen, Rook, Bishop, or Knight', () => {
  const chess = new ChessEngine('7k/P7/8/8/8/8/8/4K3 w - - 0 1');
  const mv = chess.makeMove({ from: 'a7', to: 'a8', promotion: 'n' });
  if (!mv) throw new Error('Expected promotion move to succeed');
  assert.equal(mv.san, 'a8=N');
  assert.equal(chess.getPieceAt('a8')?.type, 'n');
});

test('Stalemate & Insufficient material draw rules', () => {
  const stalemate = new ChessEngine('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
  assert.equal(stalemate.isStalemate(), true);
  assert.deepEqual(stalemate.getGameOverResult(), {
    isOver: true,
    winnerColor: null,
    termination: 'STALEMATE',
  });

  const insuff = new ChessEngine('4k3/8/8/8/8/8/8/4K2N w - - 0 1');
  assert.equal(insuff.isInsufficientMaterial(), true);
  assert.equal(insuff.getGameOverResult().termination, 'INSUFFICIENT_MATERIAL');
});

test('Threefold & Fivefold repetition and 50-move & 75-move rules', () => {
  const rep = new ChessEngine();
  const cycle = [
    { from: 'g1', to: 'f3' },
    { from: 'g8', to: 'f6' },
    { from: 'f3', to: 'g1' },
    { from: 'f6', to: 'g8' },
  ];
  for (let i = 0; i < 2; i++) {
    for (const mv of cycle) assert.ok(rep.makeMove(mv));
  }
  assert.equal(rep.isThreefoldRepetition(), true);
  assert.equal(rep.getGameOverResult().termination, 'THREEFOLD');

  for (let i = 0; i < 2; i++) {
    for (const mv of cycle) assert.ok(rep.makeMove(mv));
  }
  assert.equal(rep.isFivefoldRepetition(), true);
  assert.equal(rep.getGameOverResult().termination, 'FIVEFOLD');

  const fifty = new ChessEngine('4k3/8/8/8/8/8/8/4K2R w - - 99 60');
  assert.ok(fifty.makeMove({ from: 'h1', to: 'h2' }));
  assert.equal(fifty.isFiftyMoveRule(), true);

  const seventyFive = new ChessEngine('4k3/8/8/8/8/8/8/4K2R w - - 149 90');
  assert.ok(seventyFive.makeMove({ from: 'h1', to: 'h2' }));
  assert.equal(seventyFive.isSeventyFiveMoveRule(), true);
  assert.equal(seventyFive.getGameOverResult().termination, 'SEVENTY_FIVE_MOVE');
});

test('All 9 time controls, ELO calculation, and all 5 AI difficulties', () => {
  assert.equal(Object.keys(CHESS_TIME_CONTROLS).length, 9);
  assert.equal(CHESS_TIME_CONTROLS.CLASSICAL_30_0.baseTimeMs, 1_800_000);
  assert.equal(CHESS_TIME_CONTROLS.BULLET_2_1.incrementMs, 1_000);

  const elo = calculateChessElo(1200, 1200, 1, 0, 0);
  assert.equal(elo.whiteAfter, 1216);
  assert.equal(elo.blackAfter, 1184);

  for (const diff of ['BEGINNER', 'EASY', 'MEDIUM', 'HARD', 'EXPERT'] as ChessDifficulty[]) {
    const aiMove = chooseChessAiMove(STARTING_FEN, diff);
    if (!aiMove) throw new Error(`Expected legal AI move for ${diff}`);
    const verify = new ChessEngine(STARTING_FEN);
    assert.ok(verify.makeMove(aiMove));
  }
});
