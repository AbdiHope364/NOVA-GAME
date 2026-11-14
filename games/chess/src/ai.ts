import { ChessEngine, squareToIndex } from './engine.js';
import { ChessDifficulty, PieceColor, PieceType, PromotionPiece } from './types.js';

const MAT_SCORE: Record<PieceType, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

const PAWN_PST = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5,  5, 10, 25, 25, 10,  5,  5,
  0,  0,  0, 20, 20,  0,  0,  0,
  5, -5,-10,  0,  0,-10, -5,  5,
  5, 10, 10,-20,-20, 10, 10,  5,
  0,  0,  0,  0,  0,  0,  0,  0,
];

const KNIGHT_PST = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
];

const BISHOP_PST = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
];

const ROOK_PST = [
  0,  0,  0,  0,  0,  0,  0,  0,
  5, 10, 10, 10, 10, 10, 10,  5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
  0,  0,  0,  5,  5,  0,  0,  0,
];

const KING_MID_PST = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20,
];

function evaluateBoard(engine: ChessEngine, perspective: PieceColor): number {
  const board = engine.getBoard();
  let whiteScore = 0;
  let blackScore = 0;

  for (let idx = 0; idx < 64; idx++) {
    const p = board[idx];
    if (!p) continue;
    const pstIdx = p.color === 'w' ? idx : (7 - Math.floor(idx / 8)) * 8 + (idx % 8);
    let posBonus = 0;
    if (p.type === 'p') posBonus = PAWN_PST[pstIdx];
    else if (p.type === 'n') posBonus = KNIGHT_PST[pstIdx];
    else if (p.type === 'b') posBonus = BISHOP_PST[pstIdx];
    else if (p.type === 'r') posBonus = ROOK_PST[pstIdx];
    else if (p.type === 'k') posBonus = KING_MID_PST[pstIdx];

    const total = MAT_SCORE[p.type] + posBonus;
    if (p.color === 'w') whiteScore += total;
    else blackScore += total;
  }

  return perspective === 'w' ? whiteScore - blackScore : blackScore - whiteScore;
}

function orderMoves<
  T extends { piece: PieceType; captured?: PieceType; promotion?: PromotionPiece }
>(moves: T[]): T[] {
  return [...moves].sort((a, b) => {
    const scoreA =
      (a.captured ? MAT_SCORE[a.captured] * 10 - MAT_SCORE[a.piece] : 0) +
      (a.promotion ? MAT_SCORE[a.promotion] : 0);
    const scoreB =
      (b.captured ? MAT_SCORE[b.captured] * 10 - MAT_SCORE[b.piece] : 0) +
      (b.promotion ? MAT_SCORE[b.promotion] : 0);
    return scoreB - scoreA;
  });
}

function quiescence(
  engine: ChessEngine,
  alpha: number,
  beta: number,
  qDepth: number
): number {
  const standPat = evaluateBoard(engine, engine.getTurn());
  if (qDepth <= 0) return standPat;
  if (standPat >= beta) return beta;
  if (alpha < standPat) alpha = standPat;

  const captures = orderMoves(
    engine.getLegalRawMoves().filter((m) => Boolean(m.captured || m.promotion))
  );
  for (const mv of captures) {
    const next = engine.clone();
    next.makeMove(mv);
    const score = -quiescence(next, -beta, -alpha, qDepth - 1);
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

function negamax(
  engine: ChessEngine,
  depth: number,
  alpha: number,
  beta: number,
  ply: number,
  useQuiescence: boolean
): number {
  const rawMoves = engine.getLegalRawMoves();
  if (rawMoves.length === 0) {
    if (engine.isInCheck()) {
      return -100_000 + ply;
    }
    return 0; // Stalemate
  }

  if (
    engine.isInsufficientMaterial() ||
    engine.isFiftyMoveRule() ||
    engine.isThreefoldRepetition()
  ) {
    return 0;
  }

  if (depth <= 0) {
    return useQuiescence
      ? quiescence(engine, alpha, beta, 2)
      : evaluateBoard(engine, engine.getTurn());
  }

  const ordered = orderMoves(rawMoves);
  let best = -Infinity;

  for (const mv of ordered) {
    const next = engine.clone();
    next.makeMove(mv);
    const score = -negamax(next, depth - 1, -beta, -alpha, ply + 1, useQuiescence);
    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }

  return best;
}

export function chooseChessAiMove(
  fen: string,
  difficulty: ChessDifficulty = 'MEDIUM'
): { from: string; to: string; promotion?: PromotionPiece } | null {
  const engine = new ChessEngine(fen);
  const rawMoves = orderMoves(engine.getLegalRawMoves());
  if (rawMoves.length === 0) return null;

  if (difficulty === 'BEGINNER') {
    // Picks casually among legal moves while preferring captures if obvious
    const pool = rawMoves.slice(0, Math.min(8, rawMoves.length));
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return { from: pick.from, to: pick.to, promotion: pick.promotion };
  }

  const depth =
    difficulty === 'EASY'
      ? 1
      : difficulty === 'MEDIUM'
      ? 2
      : difficulty === 'HARD'
      ? 3
      : 3; // EXPERT uses depth 3 + quiescence capture extension for fast <250ms search
  const useQuiescence = difficulty === 'EXPERT';

  const scored: Array<{
    mv: { from: string; to: string; promotion?: PromotionPiece };
    score: number;
  }> = [];

  for (const mv of rawMoves) {
    const next = engine.clone();
    next.makeMove(mv);
    const toIdx = squareToIndex(mv.to);
    const centerFiles = [3, 4];
    const centerBonus = centerFiles.includes(toIdx % 8) ? 3 : 0;
    const score =
      -negamax(next, depth - 1, -Infinity, Infinity, 1, useQuiescence) + centerBonus;
    scored.push({
      mv: { from: mv.from, to: mv.to, promotion: mv.promotion },
      score,
    });
  }

  scored.sort((a, b) => b.score - a.score);

  if (difficulty === 'EASY' && scored.length > 1) {
    const topScore = scored[0].score;
    const reasonable = scored.slice(0, 4).filter((s) => s.score >= topScore - 220);
    const pick = reasonable[Math.floor(Math.random() * reasonable.length)] || scored[0];
    return pick.mv;
  }

  return scored[0].mv;
}
