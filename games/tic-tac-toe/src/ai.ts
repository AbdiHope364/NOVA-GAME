import { applyMove, getAvailableMoves, getNextPlayer } from './engine.js';
import { AiDifficulty, TttBoard, TttSymbol } from './types.js';
import { checkWinner } from './winner.js';

/**
 * Minimax algorithm with depth weighting for Tic-Tac-Toe.
 * Returns score relative to the `aiPlayer`:
 * +10 for ai win, -10 for opponent win, 0 for draw.
 */
function minimax(
  board: TttBoard,
  depth: number,
  isMaximizing: boolean,
  aiPlayer: TttSymbol,
  humanPlayer: TttSymbol
): number {
  const { winner } = checkWinner(board);

  if (winner === aiPlayer) return 10 - depth;
  if (winner === humanPlayer) return depth - 10;
  if (winner === 'DRAW') return 0;

  const availableMoves = getAvailableMoves(board);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of availableMoves) {
      board[move] = aiPlayer;
      const evaluation = minimax(board, depth + 1, false, aiPlayer, humanPlayer);
      board[move] = null;
      maxEval = Math.max(maxEval, evaluation);
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of availableMoves) {
      board[move] = humanPlayer;
      const evaluation = minimax(board, depth + 1, true, aiPlayer, humanPlayer);
      board[move] = null;
      minEval = Math.min(minEval, evaluation);
    }
    return minEval;
  }
}

/**
 * Finds the optimal minimax move for Hard AI.
 * Guaranteed to never lose (optimal play always results in win or draw).
 */
export function getBestMoveMinimax(board: TttBoard, aiPlayer: TttSymbol): number {
  const availableMoves = getAvailableMoves(board);
  if (availableMoves.length === 0) return -1;

  // Opening optimization: if board is empty, take center or corner
  if (availableMoves.length === 9) {
    const openings = [4, 0, 2, 6, 8];
    return openings[Math.floor(Math.random() * openings.length)];
  }

  const humanPlayer = getNextPlayer(aiPlayer);
  let bestScore = -Infinity;
  let bestMove = availableMoves[0];

  for (const move of availableMoves) {
    board[move] = aiPlayer;
    const score = minimax(board, 0, false, aiPlayer, humanPlayer);
    board[move] = null;

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

/**
 * Medium AI:
 * 1. Win if 1 move completes 3-in-a-row.
 * 2. Block if opponent has 1 winning move.
 * 3. Take center cell (4) if available.
 * 4. Take random corner (0, 2, 6, 8).
 * 5. Fallback to random move.
 */
export function getMediumMove(board: TttBoard, aiPlayer: TttSymbol): number {
  const availableMoves = getAvailableMoves(board);
  if (availableMoves.length === 0) return -1;

  const humanPlayer = getNextPlayer(aiPlayer);

  // 1. Check if AI can win immediately
  for (const move of availableMoves) {
    board[move] = aiPlayer;
    const { winner } = checkWinner(board);
    board[move] = null;
    if (winner === aiPlayer) return move;
  }

  // 2. Check if human is about to win and block them
  for (const move of availableMoves) {
    board[move] = humanPlayer;
    const { winner } = checkWinner(board);
    board[move] = null;
    if (winner === humanPlayer) return move;
  }

  // 3. Take center
  if (board[4] === null) return 4;

  // 4. Take corners
  const corners = [0, 2, 6, 8].filter((c) => board[c] === null);
  if (corners.length > 0) {
    return corners[Math.floor(Math.random() * corners.length)];
  }

  // 5. Random
  return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}

/**
 * Easy AI: picks completely random legal move.
 */
export function getEasyMove(board: TttBoard): number {
  const availableMoves = getAvailableMoves(board);
  if (availableMoves.length === 0) return -1;
  return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}

/**
 * High-level AI selector based on difficulty level.
 */
export function computeAiMove(
  board: TttBoard,
  aiPlayer: TttSymbol,
  difficulty: AiDifficulty
): number {
  switch (difficulty) {
    case 'EASY':
      return getEasyMove(board);
    case 'MEDIUM':
      return getMediumMove(board, aiPlayer);
    case 'HARD':
      return getBestMoveMinimax(board, aiPlayer);
    default:
      return getMediumMove(board, aiPlayer);
  }
}
