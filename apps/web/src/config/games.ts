import { useCallback, useState } from 'react';

export type GameCategory = 'INSTANT' | 'CARDS' | 'STRATEGY' | 'TABLE' | 'ARCADE';

export interface GameCatalogItem {
  id: string;
  name: string;
  shortName: string;
  description: string;
  category: GameCategory;
  singlePlayer: boolean;
  multiplayer: boolean;
  multiplayerLabel?: string;
  featured: boolean;
  payout: string;
  path: string;
  accentHex: string;
}

export const GAMES_CATALOG: GameCatalogItem[] = [
  {
    id: 'crash',
    name: 'Crash',
    shortName: 'Crash',
    description: 'Real-time flight multiplier curve with instant and auto cash-out.',
    category: 'INSTANT',
    singlePlayer: true,
    multiplayer: false,
    featured: true,
    payout: 'Up to 1,000x+',
    path: '/games/crash',
    accentHex: '#f43f5e',
  },
  {
    id: 'dice',
    name: 'Dice',
    shortName: 'Dice',
    description: 'Predict rolls 1–6 or slider probability with instant cryptographic settlement.',
    category: 'INSTANT',
    singlePlayer: true,
    multiplayer: false,
    featured: true,
    payout: 'Up to 99x',
    path: '/games/dice',
    accentHex: '#06b6d4',
  },
  {
    id: 'coin-flip',
    name: 'Coin Flip',
    shortName: 'Coin Flip',
    description: 'Fast Heads or Tails duel with provably fair outcome verification.',
    category: 'INSTANT',
    singlePlayer: true,
    multiplayer: false,
    featured: true,
    payout: '1.96x',
    path: '/games/coin-flip',
    accentHex: '#f59e0b',
  },
  {
    id: 'roulette',
    name: 'Roulette',
    shortName: 'Roulette',
    description: '13-pocket mini wheel featuring straight number, split, and color bets.',
    category: 'TABLE',
    singlePlayer: true,
    multiplayer: false,
    featured: false,
    payout: '12x Max',
    path: '/games/roulette',
    accentHex: '#10b981',
  },
  {
    id: 'mines',
    name: 'Mines',
    shortName: 'Mines',
    description: 'Reveal sparkling gems across a hidden grid and cash out before a mine.',
    category: 'STRATEGY',
    singlePlayer: true,
    multiplayer: false,
    featured: false,
    payout: '100x Max',
    path: '/games/mines',
    accentHex: '#8b5cf6',
  },
  {
    id: 'limbo',
    name: 'Limbo',
    shortName: 'Limbo',
    description: 'Set your target orbital multiplier and chase massive Pareto payouts.',
    category: 'INSTANT',
    singlePlayer: true,
    multiplayer: false,
    featured: false,
    payout: '1,000,000x Max',
    path: '/games/limbo',
    accentHex: '#a855f7',
  },
  {
    id: 'plinko',
    name: 'Plinko',
    shortName: 'Plinko',
    description: 'Drop balls down a peg pyramid with configurable rows and volatility.',
    category: 'ARCADE',
    singlePlayer: true,
    multiplayer: false,
    featured: false,
    payout: '1,000x Max',
    path: '/games/plinko',
    accentHex: '#f97316',
  },
  {
    id: 'bingo',
    name: 'Bingo / Cartella',
    shortName: 'Bingo',
    description: '75-Ball Ethiopian Cartella cards with live draws and line/full-house pots.',
    category: 'TABLE',
    singlePlayer: true,
    multiplayer: true,
    multiplayerLabel: 'Room Pot',
    featured: true,
    payout: '50x Max',
    path: '/games/bingo',
    accentHex: '#0ea5e9',
  },
  {
    id: 'hilo',
    name: 'Hi-Lo',
    shortName: 'Hi-Lo',
    description: 'Call higher or lower cards in sequence and compound your multiplier.',
    category: 'CARDS',
    singlePlayer: true,
    multiplayer: false,
    featured: false,
    payout: 'Compound',
    path: '/games/hilo',
    accentHex: '#06b6d4',
  },
  {
    id: 'dama',
    name: 'Ethiopian Dama',
    shortName: 'Dama',
    description: 'Traditional draughts with compulsory jumps, flying kings, and real-time PvP.',
    category: 'STRATEGY',
    singlePlayer: true,
    multiplayer: true,
    multiplayerLabel: '1v1 PvP',
    featured: false,
    payout: '1v1 & AI',
    path: '/games/dama',
    accentHex: '#eab308',
  },
  {
    id: 'letti',
    name: 'Letti Card',
    shortName: 'Letti Card',
    description: 'Pick one secret card from 52 and duel Solo or 1v1 Face-to-Face.',
    category: 'CARDS',
    singlePlayer: true,
    multiplayer: true,
    multiplayerLabel: '1v1 Face-to-Face',
    featured: true,
    payout: '1.90x / PvP Pot',
    path: '/games/letti',
    accentHex: '#8b5cf6',
  },
  {
    id: 'chess',
    name: 'NOVA Chess',
    shortName: 'Chess',
    description: 'Ranked 1v1 Bullet, Blitz & Rapid chess with live ELO and AI practice.',
    category: 'STRATEGY',
    singlePlayer: true,
    multiplayer: true,
    multiplayerLabel: 'Ranked 1v1 & AI',
    featured: true,
    payout: 'Free ELO',
    path: '/games/chess',
    accentHex: '#22d3ee',
  },
  {
    id: 'ludo',
    name: 'NOVA Ludo',
    shortName: 'Ludo',
    description: '2–4 player classic cross-board race with LUDO_HMAC_V1 dice & AI.',
    category: 'TABLE',
    singlePlayer: true,
    multiplayer: true,
    multiplayerLabel: '2–4P PvP & AI',
    featured: true,
    payout: '2–4P / Free AI',
    path: '/games/ludo',
    accentHex: '#22c55e',
  },
  {
    id: 'tic-tac-toe',
    name: 'Tic-Tac-Toe Arena',
    shortName: 'Tic-Tac-Toe',
    description: 'Competitive 3x3 tactical duel with AI practice, real-time multiplayer, and ranked Elo ratings.',
    category: 'STRATEGY',
    singlePlayer: true,
    multiplayer: true,
    featured: true,
    payout: '1.90x',
    path: '/games/tic-tac-toe',
    accentHex: '#00e5ff',
  },
];

export const FEATURED_GAME_IDS = ['ludo', 'chess', 'coin-flip', 'dice', 'crash', 'letti'];

const FAVORITES_STORAGE_KEY = 'nova_favorite_games';

export function useFavoriteGames() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = useCallback((gameId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(gameId)
        ? prev.filter((id) => id !== gameId)
        : [...prev, gameId];
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  return { favorites, toggleFavorite };
}
