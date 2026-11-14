import { TttBoard, TttSymbol } from './types.js';

export interface MoveValidation {
  valid: boolean;
  reason?: string;
}

export function validateMove(
  board: TttBoard,
  player: TttSymbol,
  cellIndex: number,
  expectedTurn: TttSymbol
): MoveValidation {
  // 1. Verify cell index within bounds [0..8]
  if (!Number.isInteger(cellIndex) || cellIndex < 0 || cellIndex > 8) {
    return {
      valid: false,
      reason: `Invalid cell index ${cellIndex}. Must be integer between 0 and 8.`,
    };
  }

  // 2. Verify player symbol
  if (player !== 'X' && player !== 'O') {
    return {
      valid: false,
      reason: `Invalid player symbol: ${player}. Must be 'X' or 'O'.`,
    };
  }

  // 3. Verify turn order
  if (player !== expectedTurn) {
    return {
      valid: false,
      reason: `Not ${player}'s turn. Current turn is ${expectedTurn}.`,
    };
  }

  // 4. Verify cell is empty
  if (board[cellIndex] !== null) {
    return {
      valid: false,
      reason: `Cell ${cellIndex} is already occupied by ${board[cellIndex]}.`,
    };
  }

  return { valid: true };
}
