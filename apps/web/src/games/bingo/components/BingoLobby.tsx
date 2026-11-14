import React, { useState } from 'react';
import { BingoPattern } from '@nova/types';
import { Trophy, CheckCircle2, X } from 'lucide-react';

export interface BingoLobbyProps {
  pattern: BingoPattern;
  onPatternChange: (pattern: BingoPattern) => void;
  ticketPrice: number;
  onTicketPriceChange: (price: number) => void;
  disabled?: boolean;
  isModal?: boolean;
  onClose?: () => void;
}

export interface PatternMeta {
  key: BingoPattern;
  name: string;
  category: 'Standard' | 'Shapes' | 'Jackpot';
  mult: string;
  spacesNeeded: string;
  description: string;
  // Representative 5x5 preview mask (true = highlight)
  previewMask: boolean[][];
}

export const PATTERNS_CATALOG: PatternMeta[] = [
  {
    key: 'ANY_LINE',
    name: '1 Line',
    category: 'Standard',
    mult: '1.8x - 10x',
    spacesNeeded: '5 spaces',
    description: 'A single line of numbers in any direction: horizontal row, vertical column, or diagonal.',
    previewMask: [
      [false, false, true, false, false],
      [false, false, true, false, false],
      [false, false, true, false, false],
      [false, false, true, false, false],
      [false, false, true, false, false],
    ],
  },
  {
    key: 'TWO_LINES',
    name: '2 Lines',
    category: 'Standard',
    mult: '3x - 25x',
    spacesNeeded: '9-10 spaces',
    description: 'Any two distinct lines (rows, columns, or diagonals) completed on the same card.',
    previewMask: [
      [true, false, false, false, true],
      [false, true, false, true, false],
      [false, false, true, false, false],
      [false, true, false, true, false],
      [true, false, false, false, true],
    ],
  },
  {
    key: 'FOUR_CORNERS',
    name: 'Four Corners',
    category: 'Standard',
    mult: '1.5x - 8x',
    spacesNeeded: '4 spaces',
    description: 'The four outer corner numbers of the card (Top-Left, Top-Right, Bottom-Left, Bottom-Right).',
    previewMask: [
      [true, false, false, false, true],
      [false, false, false, false, false],
      [false, false, false, false, false],
      [false, false, false, false, false],
      [true, false, false, false, true],
    ],
  },
  {
    key: 'SQUARE',
    name: 'Square',
    category: 'Shapes',
    mult: '1.5x - 8x',
    spacesNeeded: '4 spaces',
    description: 'Any 2x2 square shape (4 adjacent numbers) anywhere on the card grid.',
    previewMask: [
      [true, true, false, false, false],
      [true, true, false, false, false],
      [false, false, false, false, false],
      [false, false, false, false, false],
      [false, false, false, false, false],
    ],
  },
  {
    key: 'LETTER_T',
    name: 'Letter T',
    category: 'Shapes',
    mult: '1.8x - 10x',
    spacesNeeded: '5 spaces',
    description: 'An upright horizontal letter T: a 3-wide horizontal top bar and 2-space vertical stem down.',
    previewMask: [
      [false, true, true, true, false],
      [false, false, true, false, false],
      [false, false, true, false, false],
      [false, false, false, false, false],
      [false, false, false, false, false],
    ],
  },
  {
    key: 'ARROW',
    name: 'Arrow',
    category: 'Shapes',
    mult: '2.5x - 20x',
    spacesNeeded: '9 spaces',
    description: 'Diagonal arrow pointing to any of the 4 card corners (5-space diagonal shaft + 4 arrowhead barbs).',
    previewMask: [
      [true, true, true, false, false],
      [true, true, false, false, false],
      [true, false, true, false, false],
      [false, false, false, true, false],
      [false, false, false, false, true],
    ],
  },
  {
    key: 'PYRAMID',
    name: 'Pyramid',
    category: 'Shapes',
    mult: '2.5x - 20x',
    spacesNeeded: '9 spaces',
    description: 'Horizontal upright pyramid (9 spaces: 5 at base, 3 in middle, and 1 at apex).',
    previewMask: [
      [false, false, false, false, false],
      [false, false, false, false, false],
      [false, false, true, false, false],
      [false, true, true, true, false],
      [true, true, true, true, true],
    ],
  },
  {
    key: 'T_AND_LINE',
    name: 'T & Line',
    category: 'Shapes',
    mult: '4x - 30x',
    spacesNeeded: '10 spaces',
    description: 'A 5-space upright Letter T combined with an independent (non-overlapping) 5-space Line.',
    previewMask: [
      [false, true, true, true, false],
      [false, false, true, false, false],
      [false, false, true, false, false],
      [false, false, false, false, false],
      [true, true, true, true, true],
    ],
  },
  {
    key: 'SQUARE_AND_LINE',
    name: 'Square & Line',
    category: 'Shapes',
    mult: '4x - 30x',
    spacesNeeded: '9 spaces',
    description: 'A 4-space Square combined with an independent (non-overlapping) 5-space Line.',
    previewMask: [
      [true, true, false, false, false],
      [true, true, false, false, false],
      [false, false, false, false, false],
      [false, false, false, false, false],
      [true, true, true, true, true],
    ],
  },
  {
    key: 'CLOCK',
    name: 'Clock',
    category: 'Jackpot',
    mult: '8x - 50x',
    spacesNeeded: '14 spaces',
    description: 'Outer circular ring of 12 numbers + center pivot + clock hand, leaving exactly 11 free spaces.',
    previewMask: [
      [false, true, true, true, false],
      [true, false, true, false, true],
      [true, false, true, false, true],
      [true, false, false, false, true],
      [false, true, true, true, false],
    ],
  },
  {
    key: 'TOP_MIDDLE_BOTTOM',
    name: 'Layer Cake',
    category: 'Jackpot',
    mult: '10x - 80x',
    spacesNeeded: '15 spaces',
    description: 'Top, middle, and bottom horizontal rows (Rows 0, 2, 4) all daubed (15 numbers total).',
    previewMask: [
      [true, true, true, true, true],
      [false, false, false, false, false],
      [true, true, true, true, true],
      [false, false, false, false, false],
      [true, true, true, true, true],
    ],
  },
  {
    key: 'FULL_HOUSE',
    name: 'Full House',
    category: 'Jackpot',
    mult: '25x - 250x',
    spacesNeeded: '25 spaces',
    description: 'Blackout / Coverall: Every single space on the 5x5 card must be daubed for the grand jackpot!',
    previewMask: [
      [true, true, true, true, true],
      [true, true, true, true, true],
      [true, true, true, true, true],
      [true, true, true, true, true],
      [true, true, true, true, true],
    ],
  },
];

export const BingoLobby: React.FC<BingoLobbyProps> = ({
  pattern,
  onPatternChange,
  ticketPrice,
  onTicketPriceChange,
  disabled,
  isModal,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Standard' | 'Shapes' | 'Jackpot'>('All');

  const filteredPatterns =
    selectedCategory === 'All'
      ? PATTERNS_CATALOG
      : PATTERNS_CATALOG.filter((p) => p.category === selectedCategory);

  const activeMeta = PATTERNS_CATALOG.find((p) => p.key === pattern) || PATTERNS_CATALOG[0];

  const prices = [10, 20, 50, 100];

  const content = (
    <div className={`flex flex-col gap-3 w-full ${isModal ? 'p-4 sm:p-5' : 'bg-slate-950/80 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-xl'}`}>
      {/* Pattern Header & Category Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center justify-between w-full sm:w-auto gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Winning Patterns (12)</span>
          </div>
          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="sm:hidden p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/80"
              aria-label="Close pattern dialog"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter categories */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          {(['All', 'Standard', 'Shapes', 'Jackpot'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              disabled={disabled}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Active Pattern Inspector & Mini-Visualizer */}
      <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-900/90 border border-slate-800/90 flex items-center gap-3">
        {/* 5x5 Mini Preview Grid */}
        <div className="grid grid-cols-5 gap-0.5 sm:gap-1 p-1 rounded-lg bg-slate-950 border border-slate-800 w-16 h-16 sm:w-20 sm:h-20 shrink-0 shadow-inner">
          {activeMeta.previewMask.map((row, r) =>
            row.map((active, c) => (
              <div
                key={`${r}-${c}`}
                className={`rounded-[1px] transition-colors ${
                  r === 2 && c === 2
                    ? 'bg-amber-400 ring-1 ring-amber-300'
                    : active
                    ? 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]'
                    : 'bg-slate-800/60'
                }`}
              />
            ))
          )}
        </div>

        {/* Description & Rules */}
        <div className="flex-1 text-xs min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="font-black text-xs sm:text-sm text-white">{activeMeta.name}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {activeMeta.mult}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">({activeMeta.spacesNeeded})</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">{activeMeta.description}</p>
        </div>
      </div>

      {/* Pattern Grid Selector */}
      <div className={`grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2 ${isModal ? 'max-h-[38vh] overflow-y-auto pr-1 no-scrollbar' : ''}`}>
        {filteredPatterns.map((p) => {
          const isSelected = pattern === p.key;

          return (
            <button
              key={p.key}
              type="button"
              disabled={disabled}
              onClick={() => onPatternChange(p.key)}
              className={`p-2 rounded-xl text-left border flex flex-col justify-between transition-all min-h-[58px] ${
                isSelected
                  ? 'bg-gradient-to-br from-amber-500/20 via-slate-900 to-amber-500/10 border-amber-400 text-white shadow-md shadow-amber-500/10 ring-1 ring-amber-400'
                  : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-start justify-between w-full gap-1">
                <span className="text-xs font-black truncate">{p.name}</span>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              </div>
              <div className="flex items-center justify-between text-[10px] mt-1 text-slate-400 font-mono">
                <span className="text-amber-400 font-bold">{p.mult}</span>
                <span className="text-slate-500">{p.spacesNeeded}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Ticket Price Selector (if inline on desktop) */}
      {!isModal && (
        <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Ticket Price</span>
            <span className="text-emerald-400 font-mono font-bold text-sm">{ticketPrice} ETB</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {prices.map((pr) => (
              <button
                key={pr}
                type="button"
                disabled={disabled}
                onClick={() => onTicketPriceChange(pr)}
                className={`py-1.5 rounded-xl font-mono text-xs font-bold border transition-colors ${
                  ticketPrice === pr
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-black shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {pr} ETB
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Close/Apply button in modal */}
      {isModal && onClose && (
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95 transition-all shadow-lg shadow-amber-500/20"
        >
          Confirm Pattern
        </button>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="w-full max-w-md bg-slate-900/95 border border-slate-700/80 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {content}
      </div>
    );
  }

  return content;
};
