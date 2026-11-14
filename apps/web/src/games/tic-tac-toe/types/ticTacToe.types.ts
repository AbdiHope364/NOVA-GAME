import {
  TttBoard,
  TttSymbol,
  TttWinner,
  WinningLine,
  MatchStatus,
  AiDifficulty,
} from '@nova/game-tic-tac-toe';

export type { TttBoard, TttSymbol, TttWinner, WinningLine, MatchStatus, AiDifficulty };
export type TttCell = TttSymbol | null;

export type GameViewMode =
  | 'HOME'
  | 'MODE_SELECT'
  | 'MATCHMAKING'
  | 'PLAYING'
  | 'RESULT'
  | 'LEADERBOARD';

export type TttGameMode = 'PRACTICE' | 'FREE' | 'RANKED' | 'COMPETITIVE' | 'PRIVATE';

export interface FrontendTttPlayer {
  userId: string;
  username: string;
  avatarUrl?: string;
  symbol: TttSymbol;
  rating: number;
  isConnected: boolean;
  score?: number;
}

export interface FrontendTttMatch {
  id: string;
  roomCode?: string;
  mode: TttGameMode;
  status: MatchStatus;
  board: TttBoard;
  currentTurn: TttSymbol;
  moveCount: number;
  version: number;
  winningLine: WinningLine;
  winnerSymbol: TttWinner;
  winnerId: string | null;
  playerX: FrontendTttPlayer;
  playerO: FrontendTttPlayer;
  turnStartedAt: number;
  turnTimeoutSeconds: number;
  entryStake: number;
  pot: number;
  endReason?: 'WIN' | 'DRAW' | 'FORFEIT' | 'TIMEOUT' | 'RESIGN';
}

export interface UserTttStats {
  userId: string;
  username: string;
  rating: number;
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  streak: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
}
