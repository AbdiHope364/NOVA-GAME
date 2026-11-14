import { TttBoard } from './types.js';

export const WINNING_COMBINATIONS: [number, number, number][] = [
  // Horizontal rows
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  // Vertical columns
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  // Diagonals
  [0, 4, 8],
  [2, 4, 6],
];

export const INITIAL_BOARD: TttBoard = [
  null, null, null,
  null, null, null,
  null, null, null,
];

export const TURN_TIMEOUT_SECONDS = 15;
export const RECONNECT_GRACE_SECONDS = 30;
export const DEFAULT_STARTING_RATING = 1000;
export const ELO_K_FACTOR = 32;
export const DEFAULT_PLATFORM_FEE_BPS = 500; // 5% fee for competitive matches
