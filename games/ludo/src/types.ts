export type LudoColor = 'RED' | 'GREEN' | 'YELLOW' | 'BLUE';
export type LudoPlayerCount = 2 | 3 | 4;
export type LudoTurnPhase = 'ROLL' | 'MOVE' | 'FINISHED';
export type LudoDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface BoardCoord {
  row: number; // 0..14
  col: number; // 0..14
}

export interface LudoTokenState {
  tokenIndex: number; // 0..3
  progress: number; // -1 base, 0..50 shared track, 51..55 home column, 56 finished
}

export interface LudoSeatState {
  seat: number; // 1..4
  color: LudoColor;
  userId: string;
  username: string;
  tokens: LudoTokenState[];
  forfeited: boolean;
  missedTurns: number;
  finishedRank?: number; // 1 for winner
}

export interface LudoRulesetOptions {
  blockadesEnabled: boolean; // default false
  extraTurnOnCapture: boolean; // default true
  mustRollSixToStart: boolean; // default true
  exactFinishRequired: boolean; // default true
}

export interface LudoMoveRecord {
  color: LudoColor;
  seat: number;
  tokenIndex: number;
  dice: number;
  fromProgress: number;
  toProgress: number;
  captured: Array<{ color: LudoColor; tokenIndex: number; trackIdx: number }>;
  reachedHome: boolean;
  extraTurnGranted: boolean;
}

export interface LudoMatchState {
  rulesetVersion: 'NOVA_CLASSIC_V1';
  rulesetOptions?: LudoRulesetOptions;
  playerCount: LudoPlayerCount;
  turnPhase: LudoTurnPhase;
  currentTurnSeat: number;
  currentDice: number | null;
  consecutiveSixes: number;
  turnNumber: number;
  seats: LudoSeatState[];
  winnerSeat: number | null;
  winnerColor: LudoColor | null;
  lastMove: LudoMoveRecord | null;
}

export interface LegalLudoMove {
  tokenIndex: number;
  fromProgress: number;
  toProgress: number;
  wouldLeaveBase: boolean;
  wouldFinish: boolean;
  targetTrackIdx: number | null; // null if home column / finish
  wouldCapture: Array<{ color: LudoColor; tokenIndex: number }>;
}
