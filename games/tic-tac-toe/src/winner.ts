import { WINNING_COMBINATIONS } from './constants.js';
import { TttBoard, TttWinner, WinningLine } from './types.js';

export function checkWinner(board: TttBoard): {
  winner: TttWinner;
  winningLine: WinningLine;
} {
  for (const [a, b, c] of WINNING_COMBINATIONS) {
    const valA = board[a];
    const valB = board[b];
    const valC = board[c];

    if (valA !== null && valA === valB && valB === valC) {
      return {
        winner: valA,
        winningLine: [a, b, c],
      };
    }
  }

  // Check for draw: all 9 cells are filled and no winner
  const isFull = board.every((cell) => cell !== null);
  if (isFull) {
    return {
      winner: 'DRAW',
      winningLine: null,
    };
  }

  return {
    winner: null,
    winningLine: null,
  };
}

export function isBoardFull(board: TttBoard): boolean {
  return board.every((cell) => cell !== null);
}
