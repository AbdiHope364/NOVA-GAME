export type Role = 'USER' | 'ADMIN' | 'MODERATOR';

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  role: Role;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  lockedBalance: number;
  updatedAt: string | Date;
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
  createdAt: string | Date;
}

export type GameId = 'coin-flip' | 'dice' | 'crash' | 'roulette' | 'mines' | 'bingo' | 'limbo' | 'plinko' | 'hilo' | 'dama' | 'letti';

export type HiLoSuit = 'HEARTS' | 'DIAMONDS' | 'CLUBS' | 'SPADES';
export type HiLoGuess = 'HI' | 'LO' | 'SKIP';

export interface HiLoCard {
  index: number;
  rank: number; // 1 (Ace) to 13 (King)
  suit: HiLoSuit;
  label: string; // 'A', '2'..'10', 'J', 'Q', 'K'
  color: 'RED' | 'BLACK';
}

export type LettiSuit = HiLoSuit;
export type LettiCard = HiLoCard;

export interface LettiStep {
  step: number;
  side: 'USER' | 'SYSTEM';
  card: LettiCard;
  matched: boolean;
}

export interface LettiParams {
  pickedCardIndex: number; // 0 to 51
}

export interface LettiOutcome {
  pickedCard: LettiCard;
  steps: LettiStep[];
  winnerSide: 'USER' | 'SYSTEM';
  matchedCard: LettiCard;
  totalFlips: number;
}

export type LettiRoundStatus = 'PREPARED' | 'SETTLED' | 'CANCELLED';

export interface LettiProvablyFairProof {
  serverSeedHash: string;
  serverSeed?: string;
  clientSeed: string;
  nonce: number;
  verified?: boolean;
}

export interface LettiPrepareResponse {
  roundId: string;
  roundCode: string;
  pickedCard: LettiCard;
  shuffledCardCount: number;
  status: LettiRoundStatus;
  provablyFair: LettiProvablyFairProof;
}

export interface LettiConfirmResponse {
  roundId: string;
  roundCode: string;
  betId: string;
  amount: number;
  won: boolean;
  multiplier: number;
  payout: number;
  profit: number;
  newBalance: number;
  outcome: LettiOutcome;
  provablyFair: LettiProvablyFairProof;
}

export interface LettiRoundHistoryItem {
  roundId: string;
  roundCode: string;
  pickedCard: LettiCard;
  matchedCard: LettiCard;
  winnerSide: 'USER' | 'SYSTEM';
  winningFlip: string;
  totalFlips: number;
  betAmount: number;
  payout: number;
  multiplier: number;
  won: boolean;
  serverSeedHash: string;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  outcome: LettiOutcome;
  createdAt: string;
}

export interface LettiVerifyResponse {
  isValid: boolean;
  hashValid: boolean;
  pickedCard: LettiCard;
  winnerSide: 'USER' | 'SYSTEM';
  matchedCard: LettiCard;
  totalFlips: number;
  payout: number;
  multiplier: number;
  shuffledOrder: number[];
  steps: LettiStep[];
}

// ============================================================================
// LETTI CARD 1v1 FACE-TO-FACE MULTIPLAYER TYPES
// ============================================================================

export type LettiRoomType = 'QUICK_MATCH' | 'PRIVATE';
export type LettiRoomStatus =
  | 'WAITING'
  | 'READY'
  | 'PLAYING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

export type LettiMatchPhase = 'PICKING' | 'READY' | 'PLAYING' | 'COMPLETED' | 'CANCELLED';

export interface LettiMultiplayerConfigDTO {
  enabled: boolean;
  quickMatchEnabled: boolean;
  privateRoomsEnabled: boolean;
  minStakeEtb: number;
  maxStakeEtb: number;
  platformFeePercent: number;
  reconnectGraceSeconds: number;
  maxDisconnects: number;
  roomExpiryMinutes: number;
  turnTimeoutSeconds: number;
  allowBonusBalance: boolean;
}

export interface LettiPvpFlip {
  step: number;
  playerId: string;
  seat: 1 | 2;
  card: LettiCard;
  matched: boolean;
  createdAt: string;
}

export interface LettiPvpPlayerView {
  userId: string;
  username: string;
  avatarUrl?: string | null;
  seat: 1 | 2;
  ready: boolean;
  connectionStatus: 'CONNECTED' | 'DISCONNECTED';
  disconnectCount: number;
  hasPicked: boolean;
}

export interface LettiMatchPublicView {
  roomId: string;
  roomCode: string;
  roomType: LettiRoomType;
  roomStatus: LettiRoomStatus;
  stakeEtb: number;
  totalPotEtb: number;
  platformFeeEtb: number;
  winnerPayoutEtb: number;
  matchId: string | null;
  phase: LettiMatchPhase;
  currentTurnUserId: string | null;
  remainingDeckCount: number;
  mySeat: 1 | 2 | null;
  myPickedCard: LettiCard | null;
  opponentPickedCard: LettiCard | null; // Strictly null until match is COMPLETED
  playerOne: LettiPvpPlayerView | null;
  playerTwo: LettiPvpPlayerView | null;
  playerOneFlips: LettiPvpFlip[];
  playerTwoFlips: LettiPvpFlip[];
  winnerId: string | null;
  resultType: 'WIN' | 'DRAW' | 'CANCELLED' | 'FORFEIT' | null;
  rematchAcceptedBy: string[];
  serverSeedHash: string | null;
  serverSeed: string | null; // Strictly null until match is COMPLETED
  clientSeed: string | null;
  nonce: number | null;
  expiresAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface HiLoStep {
  card: HiLoCard;
  guess?: HiLoGuess;
  stepMultiplier?: number;
  correct?: boolean;
}

export interface HiLoParams {
  action?: 'START' | 'GUESS' | 'CASHOUT';
  guess?: HiLoGuess;
  history?: HiLoStep[];
  currentMultiplier?: number;
}

export interface HiLoOutcome {
  currentCard: HiLoCard;
  history: HiLoStep[];
  currentMultiplier: number;
  nextHiMultiplier: number;
  nextLoMultiplier: number;
  nextHiProbability: number;
  nextLoProbability: number;
  isGameOver: boolean;
  cashedOut: boolean;
}

export type PlinkoRisk = 'low' | 'medium' | 'high';

export interface PlinkoParams {
  rows: number;
  risk: PlinkoRisk;
}

export interface PlinkoOutcome {
  path: ('L' | 'R')[];
  slot: number;
  rows: number;
  risk: PlinkoRisk;
  slotMultiplier: number;
}

export interface LimboParams {
  targetMultiplier: number;
}

export interface LimboOutcome {
  targetMultiplier: number;
  resultMultiplier: number;
  winChance: number;
}


export type BingoPattern =
  | 'ANY_LINE'
  | 'TWO_LINES'
  | 'FOUR_CORNERS'
  | 'TOP_MIDDLE_BOTTOM'
  | 'CLOCK'
  | 'ARROW'
  | 'PYRAMID'
  | 'SQUARE'
  | 'LETTER_T'
  | 'T_AND_LINE'
  | 'SQUARE_AND_LINE'
  | 'FULL_HOUSE';

export interface BingoParams {
  roomId?: string;
  cardId?: string;
  claimPattern?: BingoPattern;
  markedNumbers?: number[];
}

export interface BingoCardData {
  id: string;
  grid: number[][]; // 5x5 matrix
  marked: boolean[][];
}

export interface BingoRoomData {
  id: string;
  name: string;
  entryFee: number;
  prizePool: number;
  playersCount: number;
  pattern: BingoPattern;
  status: 'WAITING' | 'STARTING' | 'DRAWING' | 'ENDED';
  currentBall?: { letter: string; number: number };
  drawnNumbers: number[];
}

export interface NovaRoundConfig {
  id?: string;
  gameId?: string;
  roundId: string;
  stake: number;          // Stake in ETB per slot (e.g. 50 ETB)
  prize: number;          // Total prize payout (e.g. 350 ETB)
  adminFee: number;       // Admin fee collected (e.g. 150 ETB)
  maxSlots: number;       // Total slots available in round (e.g. 10)
  activePlayers: number;  // Currently occupied slots (e.g. 10)
  pattern: BingoPattern;  // Active winning pattern (e.g. 'FULL_HOUSE')
  patternName: string;    // Display name (e.g. 'Full House')
  patternDescription: string; // Winning rule description (e.g. 'Get all numbers in the card!')
  status: 'WAITING' | 'ON_GOING' | 'ENDED';
  nextNumberCountdown: number; // Countdown to next number call in seconds
  gameName?: string;
}

export type CartellaRoundConfig = NovaRoundConfig;

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
  createdAt: string | Date;
}

export interface CoinFlipParams {
  choice: 'HEADS' | 'TAILS';
}

export interface DiceParams {
  target: number;
  condition?: 'UNDER' | 'OVER';
  mode?: 'SLIDER' | 'SINGLE';
}

export interface CrashParams {
  autoCashoutEnabled?: boolean;
  autoCashoutMultiplier?: number;
  cashedOutMultiplier?: number;
}

export interface CrashAdminMonitor {
  upcomingCrashPoint: number;
  flightDurationSeconds: number;
  accelerationK: number;
  activeBetsCount: number;
  totalWagered: number;
  maxPotentialPayout: number;
  isEmergencyCrashed: boolean;
}

export type AfricanRouletteBetType =
  | 'STRAIGHT'
  | 'SPLIT'
  | 'COLOR_RED'
  | 'COLOR_BLACK'
  | 'HALF_1_6'
  | 'HALF_7_12'
  | 'THIRD_LO'
  | 'THIRD_MID'
  | 'THIRD_HI';

export interface RouletteParams {
  betType?: AfricanRouletteBetType;
  selection:
    | 'RED'
    | 'BLACK'
    | 'GREEN'
    | 'LO'
    | 'MID'
    | 'HI'
    | '1-6'
    | '7-12'
    | 'COLOR_RED'
    | 'COLOR_BLACK'
    | 'HALF_1_6'
    | 'HALF_7_12'
    | 'THIRD_LO'
    | 'THIRD_MID'
    | 'THIRD_HI'
    | number
    | number[];
}

export interface MinesParams {
  mineCount: number;
  revealedTiles?: number[];
  action?: 'PLAY' | 'CASHOUT' | 'REVEAL';
  tileIndex?: number;
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
