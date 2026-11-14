import {
  GameState,
  LegalMove,
  Color,
  RuleOptions,
  DEFAULT_OPTIONS,
  SIZE,
  getLegalMoves,
  applyMove,
  getResult,
} from './rules.js';

export type DamaDifficulty = 'easy' | 'medium' | 'hard';

const MAN_VALUE = 100;
const KING_VALUE = 650;
const BACK_RANK_BONUS = 30;

/**
 * Static evaluation function from the perspective of state.turn.
 * Higher score = better for player.
 */
export function evaluateBoard(state: GameState, color: Color): number {
  const result = getResult(state);
  if (result.status === 'win') {
    return result.winner === color ? 100000 : -100000;
  }
  if (result.status === 'draw') {
    return 0;
  }

  let myScore = 0;
  let oppScore = 0;

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const piece = state.board[r][c];
      if (!piece) continue;

      const isMyPiece = piece.color === color;
      let val = piece.king ? KING_VALUE : MAN_VALUE;

      if (!piece.king) {
        // Advancement bonus (closer to king row)
        const advance = piece.color === 'W' ? (7 - r) : r;
        val += advance * 8;

        // Center control bonus
        if (c >= 2 && c <= 5 && r >= 2 && r <= 5) {
          val += 12;
        }

        // Back-rank home protection bonus
        const isBackRank = piece.color === 'W' ? r === 7 : r === 0;
        if (isBackRank) {
          val += BACK_RANK_BONUS;
        }
      } else {
        // King freedom bonus: center is dominant
        const distFromCenter = Math.abs(r - 3.5) + Math.abs(c - 3.5);
        val += Math.round((7 - distFromCenter) * 10);
      }

      if (isMyPiece) {
        myScore += val;
      } else {
        oppScore += val;
      }
    }
  }

  return myScore - oppScore;
}

/**
 * Minimax with Alpha-Beta pruning
 */
function minimax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  color: Color,
  options?: Partial<RuleOptions>
): { score: number; move: LegalMove | null } {
  const result = getResult(state, options);
  if (depth === 0 || result.status !== 'ongoing') {
    return { score: evaluateBoard(state, color), move: null };
  }

  const legalMoves = getLegalMoves(state, options);
  if (legalMoves.length === 0) {
    return { score: evaluateBoard(state, color), move: null };
  }

  // Move ordering: try captures first to maximize alpha-beta pruning
  legalMoves.sort((a, b) => b.captured.length - a.captured.length);

  let bestMove: LegalMove | null = legalMoves[0];

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of legalMoves) {
      const { state: nextState } = applyMove(state, move, options);
      const evalResult = minimax(nextState, depth - 1, alpha, beta, false, color, options);
      if (evalResult.score > maxEval) {
        maxEval = evalResult.score;
        bestMove = move;
      }
      alpha = Math.max(alpha, evalResult.score);
      if (beta <= alpha) break; // Beta cutoff
    }
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    for (const move of legalMoves) {
      const { state: nextState } = applyMove(state, move, options);
      const evalResult = minimax(nextState, depth - 1, alpha, beta, true, color, options);
      if (evalResult.score < minEval) {
        minEval = evalResult.score;
        bestMove = move;
      }
      beta = Math.min(beta, evalResult.score);
      if (beta <= alpha) break; // Alpha cutoff
    }
    return { score: minEval, move: bestMove };
  }
}

/**
 * Select the optimal AI move for the current state given difficulty.
 */
export function findBestMove(
  state: GameState,
  difficulty: DamaDifficulty = 'medium',
  options?: Partial<RuleOptions>
): LegalMove | null {
  const legalMoves = getLegalMoves(state, options);
  if (legalMoves.length === 0) return null;
  if (legalMoves.length === 1) return legalMoves[0];

  // Easy: picks with slight randomness
  if (difficulty === 'easy') {
    if (Math.random() < 0.6) {
      return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }
    const { move } = minimax(state, 1, -Infinity, Infinity, true, state.turn, options);
    return move || legalMoves[0];
  }

  // Medium: Depth 3 search
  if (difficulty === 'medium') {
    const { move } = minimax(state, 3, -Infinity, Infinity, true, state.turn, options);
    return move || legalMoves[0];
  }

  // Hard: Depth 4 search (or depth 5 if few pieces left)
  const totalPieces = state.board.flat().filter(Boolean).length;
  const depth = totalPieces <= 10 ? 5 : 4;
  const { move } = minimax(state, depth, -Infinity, Infinity, true, state.turn, options);
  return move || legalMoves[0];
}

