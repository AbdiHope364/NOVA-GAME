export type Role = 'USER' | 'ADMIN' | 'MODERATOR';

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  lockedBalance: number;
  updatedAt: string;
}

export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'BET_PLACED' | 'BET_WON' | 'BET_REFUND' | 'BONUS';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface Transaction {
  id: string;
  walletId: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  referenceId?: string;
  description?: string;
  createdAt: string;
}

export type GameId = 'coin-flip' | 'dice' | 'crash' | 'roulette';

export interface ProvablyFairSeed {
  id: string;
  userId: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  active: boolean;
}

export interface BetRequest<TGameParams = Record<string, unknown>> {
  gameId: GameId;
  amount: number;
  clientSeed?: string;
  gameParams: TGameParams;
}

export interface BetResult<TOutcome = Record<string, unknown>> {
  id: string;
  userId: string;
  gameId: GameId;
  amount: number;
  multiplier: number;
  payout: number;
  profit: number;
  outcome: TOutcome;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  won: boolean;
  createdAt: string;
}

export interface CoinFlipParams {
  choice: 'HEADS' | 'TAILS';
}

export interface DiceParams {
  target: number; // 1-98
  condition: 'UNDER' | 'OVER';
}

export interface CrashParams {
  autoCashoutMultiplier?: number;
}

export interface RouletteParams {
  selection: 'RED' | 'BLACK' | 'GREEN' | number;
}

export interface GameEngineConfig {
  gameId: GameId;
  name: string;
  houseEdgePercent: number;
  minBet: number;
  maxBet: number;
}

export interface SocketServerToClientEvents {
  'crash:tick': (data: { multiplier: number; elapsedMs: number }) => void;
  'crash:crashed': (data: { finalMultiplier: number; crashPoint: number }) => void;
  'crash:start': (data: { gameId: string; startTime: number }) => void;
  'live:bet': (bet: BetResult) => void;
  'wallet:update': (data: { newBalance: number }) => void;
}

export interface SocketClientToServerEvents {
  'crash:cashout': (data: { betId: string }) => void;
  'subscribe:game': (gameId: GameId) => void;
}
