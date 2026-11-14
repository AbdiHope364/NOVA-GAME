export interface PocketMeta {
  number: number;
  color: 'GREEN' | 'RED' | 'BLACK';
  third: 'LO' | 'MID' | 'HI' | null;
  half: '1-6' | '7-12' | null;
}

export const ODD_RED_NUMBERS = [1, 3, 5, 7, 9, 11];
export const EVEN_BLACK_NUMBERS = [2, 4, 6, 8, 10, 12];

export const POCKET_MAP: Record<number, PocketMeta> = {
  0: { number: 0, color: 'GREEN', third: null, half: null },
  1: { number: 1, color: 'RED', third: 'LO', half: '1-6' },
  2: { number: 2, color: 'BLACK', third: 'LO', half: '1-6' },
  3: { number: 3, color: 'RED', third: 'LO', half: '1-6' },
  4: { number: 4, color: 'BLACK', third: 'LO', half: '1-6' },
  5: { number: 5, color: 'RED', third: 'MID', half: '1-6' },
  6: { number: 6, color: 'BLACK', third: 'MID', half: '1-6' },
  7: { number: 7, color: 'RED', third: 'MID', half: '7-12' },
  8: { number: 8, color: 'BLACK', third: 'MID', half: '7-12' },
  9: { number: 9, color: 'RED', third: 'HI', half: '7-12' },
  10: { number: 10, color: 'BLACK', third: 'HI', half: '7-12' },
  11: { number: 11, color: 'RED', third: 'HI', half: '7-12' },
  12: { number: 12, color: 'BLACK', third: 'HI', half: '7-12' },
};

export * from './engine.js';
