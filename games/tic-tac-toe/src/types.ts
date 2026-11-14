export type TttSymbol = 'X' | 'O';
export type TttCell = TttSymbol | null;
export type TttBoard = [
  TttCell, TttCell, TttCell,
  TttCell, TttCell, TttCell,
  TttCell, TttCell, TttCell
];

export type TttWinner = TttSymbol | 'DRAW' | null;
export type WinningLine = [number, number, number] | null;

export type MatchStatus = 'WAITING' | 'READY' | 'IN_PROGRESS' | 'FINISHED' | 'DISCONNECTED' | 'CANCELLED';

export type AiDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface TttMoveResult {
  valid: boolean;
  reason?: string;
  board: TttBoard;
  nextPlayer: TttSymbol;
  winner: TttWinner;
  winningLine: WinningLine;
  isDraw: boolean;
  isGameOver: boolean;
  moveNumber: number;
}

export interface TttPlayer {
  userId: string;
  username: string;
  avatarUrl?: string;
  symbol: TttSymbol;
  rating: number;
  isReady: boolean;
  isConnected: boolean;
}

export interface TttMatchState {
  matchId: string;
  board: TttBoard;
  currentTurn: TttSymbol;
  status: MatchStatus;
  winner: TttWinner;
  winningLine: WinningLine;
  moveCount: number;
  version: number;
  playerX: TttPlayer;
  playerO: TttPlayer;
  turnStartedAt: number; // Unix ms
  turnTimeoutSeconds: number; // default 15
  matchType: 'PRACTICE' | 'FREE' | 'RANKED' | 'COMPETITIVE';
  entryStake: number; // ETB
  pot: number;
  endedReason?: 'WIN' | 'DRAW' | 'FORFEIT' | 'TIMEOUT' | 'RESIGN';
}
