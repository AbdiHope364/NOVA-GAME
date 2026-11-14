export type PieceColor = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PromotionPiece = 'q' | 'r' | 'b' | 'n';

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
}

export type ChessTimeControlKey =
  | 'BULLET_1_0'
  | 'BULLET_2_1'
  | 'BLITZ_3_0'
  | 'BLITZ_3_2'
  | 'BLITZ_5_0'
  | 'RAPID_10_0'
  | 'RAPID_10_5'
  | 'RAPID_15_10'
  | 'CLASSICAL_30_0';

export type ChessTimeCategory = 'BULLET' | 'BLITZ' | 'RAPID' | 'CLASSICAL';

export interface ChessTimeControlSpec {
  key: ChessTimeControlKey;
  label: string;
  category: ChessTimeCategory;
  baseTimeMs: number;
  incrementMs: number;
  description: string;
}

export const CHESS_TIME_CONTROLS: Record<ChessTimeControlKey, ChessTimeControlSpec> = {
  BULLET_1_0: {
    key: 'BULLET_1_0',
    label: '1+0',
    category: 'BULLET',
    baseTimeMs: 60_000,
    incrementMs: 0,
    description: '1 min Bullet',
  },
  BULLET_2_1: {
    key: 'BULLET_2_1',
    label: '2+1',
    category: 'BULLET',
    baseTimeMs: 120_000,
    incrementMs: 1_000,
    description: '2 min + 1s Bullet',
  },
  BLITZ_3_0: {
    key: 'BLITZ_3_0',
    label: '3+0',
    category: 'BLITZ',
    baseTimeMs: 180_000,
    incrementMs: 0,
    description: '3 min Blitz',
  },
  BLITZ_3_2: {
    key: 'BLITZ_3_2',
    label: '3+2',
    category: 'BLITZ',
    baseTimeMs: 180_000,
    incrementMs: 2_000,
    description: '3 min + 2s Blitz',
  },
  BLITZ_5_0: {
    key: 'BLITZ_5_0',
    label: '5+0',
    category: 'BLITZ',
    baseTimeMs: 300_000,
    incrementMs: 0,
    description: '5 min Blitz',
  },
  RAPID_10_0: {
    key: 'RAPID_10_0',
    label: '10+0',
    category: 'RAPID',
    baseTimeMs: 600_000,
    incrementMs: 0,
    description: '10 min Rapid',
  },
  RAPID_10_5: {
    key: 'RAPID_10_5',
    label: '10+5',
    category: 'RAPID',
    baseTimeMs: 600_000,
    incrementMs: 5_000,
    description: '10 min + 5s Rapid',
  },
  RAPID_15_10: {
    key: 'RAPID_15_10',
    label: '15+10',
    category: 'RAPID',
    baseTimeMs: 900_000,
    incrementMs: 10_000,
    description: '15 min + 10s Rapid',
  },
  CLASSICAL_30_0: {
    key: 'CLASSICAL_30_0',
    label: '30+0',
    category: 'CLASSICAL',
    baseTimeMs: 1_800_000,
    incrementMs: 0,
    description: '30 min Classical',
  },
};

export type ChessTermination =
  | 'CHECKMATE'
  | 'RESIGNATION'
  | 'TIMEOUT'
  | 'STALEMATE'
  | 'THREEFOLD'
  | 'FIVEFOLD'
  | 'FIFTY_MOVE'
  | 'SEVENTY_FIVE_MOVE'
  | 'INSUFFICIENT_MATERIAL'
  | 'DRAW_AGREEMENT'
  | 'ABANDONED'
  | 'ADMIN_ABORTED';

export type ChessDifficulty = 'BEGINNER' | 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

export interface ChessMoveOption {
  from: string;
  to: string;
  piece: PieceType;
  color: PieceColor;
  captured?: PieceType;
  promotion?: PromotionPiece;
  isCastleKing?: boolean;
  isCastleQueen?: boolean;
  isEnPassant?: boolean;
  san: string;
  uci: string;
}

export interface ChessMoveRecord {
  ply: number;
  from: string;
  to: string;
  uci: string;
  san: string;
  piece: PieceType;
  color: PieceColor;
  captured?: PieceType;
  promotion?: PromotionPiece;
  fenAfter: string;
}

export interface CapturedSummary {
  whiteCaptured: PieceType[]; // Black pieces captured by White
  blackCaptured: PieceType[]; // White pieces captured by Black
  whiteAdvantage: number; // Positive = White ahead in points, Negative = Black ahead
}
