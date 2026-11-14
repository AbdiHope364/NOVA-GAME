import { INITIAL_BOARD } from './constants.js';
import { TttBoard, TttMoveResult, TttSymbol } from './types.js';
import { validateMove } from './validation.js';
import { checkWinner } from './winner.js';

export function createInitialBoard(): TttBoard {
  return [...INITIAL_BOARD];
}

export function getNextPlayer(current: TttSymbol): TttSymbol {
  return current === 'X' ? 'O' : 'X';
}

export function getAvailableMoves(board: TttBoard): number[] {
  const moves: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      moves.push(i);
    }
  }
  return moves;
}

export function applyMove(
  board: TttBoard,
  player: TttSymbol,
  cellIndex: number,
  expectedTurn: TttSymbol = player,
  currentMoveNumber: number = 0
): TttMoveResult {
  const validation = validateMove(board, player, cellIndex, expectedTurn);
  if (!validation.valid) {
    return {
      valid: false,
      reason: validation.reason,
      board,
      nextPlayer: expectedTurn,
      winner: null,
      winningLine: null,
      isDraw: false,
      isGameOver: false,
      moveNumber: currentMoveNumber,
    };
  }

  // Pure state update: clone board
  const newBoard: TttBoard = [...board];
  newBoard[cellIndex] = player;

  const { winner, winningLine } = checkWinner(newBoard);
  const isGameOver = winner !== null;
  const isDraw = winner === 'DRAW';
  const nextPlayer = isGameOver ? expectedTurn : getNextPlayer(player);

  return {
    valid: true,
    board: newBoard,
    nextPlayer,
    winner,
    winningLine,
    isDraw,
    isGameOver,
    moveNumber: currentMoveNumber + 1,
  };
}

export function getMatchStatus(board: TttBoard): 'IN_PROGRESS' | 'FINISHED' {
  const { winner } = checkWinner(board);
  return winner !== null ? 'FINISHED' : 'IN_PROGRESS';
}
