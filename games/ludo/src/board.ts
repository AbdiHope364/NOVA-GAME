import { BoardCoord, LudoColor, LudoPlayerCount } from './types.js';

/**
 * Single Source of Truth: Complete 15x15 NOVA Ludo Board Coordinate Map (rows 0..14, cols 0..14).
 * Shared identically by @nova/api (server validation) and @nova/web (UI rendering).
 */
export const LUDO_OUTER_TRACK: readonly BoardCoord[] = [
  // Segment 1 (0..12): Left arm top row right -> Top arm left col up -> Top middle
  { row: 6, col: 1 }, // 0: SAFE — RED Start
  { row: 6, col: 2 }, // 1
  { row: 6, col: 3 }, // 2
  { row: 6, col: 4 }, // 3
  { row: 6, col: 5 }, // 4
  { row: 5, col: 6 }, // 5
  { row: 4, col: 6 }, // 6
  { row: 3, col: 6 }, // 7
  { row: 2, col: 6 }, // 8: SAFE — Star #1
  { row: 1, col: 6 }, // 9
  { row: 0, col: 6 }, // 10
  { row: 0, col: 7 }, // 11: GREEN Home Turn-In (progress 50 for GREEN)
  { row: 0, col: 8 }, // 12

  // Segment 2 (13..25): Top arm right col down -> Right arm top row right -> Right middle
  { row: 1, col: 8 }, // 13: SAFE — GREEN Start
  { row: 2, col: 8 }, // 14
  { row: 3, col: 8 }, // 15
  { row: 4, col: 8 }, // 16
  { row: 5, col: 8 }, // 17
  { row: 6, col: 9 }, // 18
  { row: 6, col: 10 }, // 19
  { row: 6, col: 11 }, // 20
  { row: 6, col: 12 }, // 21: SAFE — Star #2
  { row: 6, col: 13 }, // 22
  { row: 6, col: 14 }, // 23
  { row: 7, col: 14 }, // 24: YELLOW Home Turn-In (progress 50 for YELLOW)
  { row: 8, col: 14 }, // 25

  // Segment 3 (26..38): Right arm bottom row left -> Bottom arm right col down -> Bottom middle
  { row: 8, col: 13 }, // 26: SAFE — YELLOW Start
  { row: 8, col: 12 }, // 27
  { row: 8, col: 11 }, // 28
  { row: 8, col: 10 }, // 29
  { row: 8, col: 9 }, // 30
  { row: 9, col: 8 }, // 31
  { row: 10, col: 8 }, // 32
  { row: 11, col: 8 }, // 33
  { row: 12, col: 8 }, // 34: SAFE — Star #3
  { row: 13, col: 8 }, // 35
  { row: 14, col: 8 }, // 36
  { row: 14, col: 7 }, // 37: BLUE Home Turn-In (progress 50 for BLUE)
  { row: 14, col: 6 }, // 38

  // Segment 4 (39..51): Bottom arm left col up -> Left arm bottom row left -> Left middle
  { row: 13, col: 6 }, // 39: SAFE — BLUE Start
  { row: 12, col: 6 }, // 40
  { row: 11, col: 6 }, // 41
  { row: 10, col: 6 }, // 42
  { row: 9, col: 6 }, // 43
  { row: 8, col: 5 }, // 44
  { row: 8, col: 4 }, // 45
  { row: 8, col: 3 }, // 46
  { row: 8, col: 2 }, // 47: SAFE — Star #4
  { row: 8, col: 1 }, // 48
  { row: 8, col: 0 }, // 49
  { row: 7, col: 0 }, // 50: RED Home Turn-In (progress 50 for RED)
  { row: 6, col: 0 }, // 51
];

export const LUDO_START_TRACK_INDEX: Record<LudoColor, number> = {
  RED: 0,
  GREEN: 13,
  YELLOW: 26,
  BLUE: 39,
};

export const LUDO_SAFE_TRACK_INDICES = new Set<number>([0, 8, 13, 21, 26, 34, 39, 47]);

export const LUDO_HOME_COLUMNS: Record<LudoColor, readonly BoardCoord[]> = {
  RED: [
    { row: 7, col: 1 },
    { row: 7, col: 2 },
    { row: 7, col: 3 },
    { row: 7, col: 4 },
    { row: 7, col: 5 },
  ],
  GREEN: [
    { row: 1, col: 7 },
    { row: 2, col: 7 },
    { row: 3, col: 7 },
    { row: 4, col: 7 },
    { row: 5, col: 7 },
  ],
  YELLOW: [
    { row: 7, col: 13 },
    { row: 7, col: 12 },
    { row: 7, col: 11 },
    { row: 7, col: 10 },
    { row: 7, col: 9 },
  ],
  BLUE: [
    { row: 13, col: 7 },
    { row: 12, col: 7 },
    { row: 11, col: 7 },
    { row: 10, col: 7 },
    { row: 9, col: 7 },
  ],
};

export const LUDO_FINISH_CELLS: Record<LudoColor, BoardCoord> = {
  RED: { row: 7, col: 6 },
  GREEN: { row: 6, col: 7 },
  YELLOW: { row: 7, col: 8 },
  BLUE: { row: 8, col: 7 },
};

export const LUDO_YARD_SLOTS: Record<LudoColor, readonly BoardCoord[]> = {
  RED: [
    { row: 1, col: 1 },
    { row: 1, col: 4 },
    { row: 4, col: 1 },
    { row: 4, col: 4 },
  ],
  GREEN: [
    { row: 1, col: 10 },
    { row: 1, col: 13 },
    { row: 4, col: 10 },
    { row: 4, col: 13 },
  ],
  YELLOW: [
    { row: 10, col: 10 },
    { row: 10, col: 13 },
    { row: 13, col: 10 },
    { row: 13, col: 13 },
  ],
  BLUE: [
    { row: 10, col: 1 },
    { row: 10, col: 4 },
    { row: 13, col: 1 },
    { row: 13, col: 4 },
  ],
};

export const LUDO_SEAT_COLOR_ORDER: Record<LudoPlayerCount, readonly LudoColor[]> = {
  2: ['RED', 'YELLOW'], // Opposite corners
  3: ['RED', 'GREEN', 'YELLOW'],
  4: ['RED', 'GREEN', 'YELLOW', 'BLUE'],
};

export function progressToTrackIndex(color: LudoColor, progress: number): number | null {
  if (progress < 0 || progress > 50) return null;
  return (LUDO_START_TRACK_INDEX[color] + progress) % 52;
}

export function getTokenBoardCoord(
  color: LudoColor,
  tokenIndex: number,
  progress: number
): BoardCoord {
  if (progress < 0) {
    return LUDO_YARD_SLOTS[color][tokenIndex] || LUDO_YARD_SLOTS[color][0];
  }
  if (progress <= 50) {
    const trackIdx = (LUDO_START_TRACK_INDEX[color] + progress) % 52;
    return LUDO_OUTER_TRACK[trackIdx];
  }
  if (progress <= 55) {
    return LUDO_HOME_COLUMNS[color][progress - 51];
  }
  return LUDO_FINISH_CELLS[color];
}
