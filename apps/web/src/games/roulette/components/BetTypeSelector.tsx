import React, { useState } from 'react';
import { useI18nStore } from '../../../stores/i18nStore';
import { Scissors } from 'lucide-react';

export type AfricanRouletteSelection =
  | number // Straight Single (0 to 12) -> 12x
  | [number, number] // Split Bet (2 adjacent/chosen numbers) -> 6x
  | 'RED' // All Odd Numbers (1, 3, 5, 7, 9, 11) -> 2x
  | 'BLACK' // All Even Numbers (2, 4, 6, 8, 10, 12) -> 2x
  | '1-6' // Low Half (1 to 6) -> 2x
  | '7-12' // High Half (7 to 12) -> 2x
  | 'LO' // 1st Third (1, 2, 3, 4) -> 3x
  | 'MID' // 2nd Third (5, 6, 7, 8) -> 3x
  | 'HI'; // 3rd Third (9, 10, 11, 12) -> 3x

export interface BetTypeSelectorProps {
  selected: AfricanRouletteSelection;
  onChange: (selection: AfricanRouletteSelection) => void;
  disabled?: boolean;
}

const ODD_RED_NUMBERS = [1, 3, 5, 7, 9, 11];
const EVEN_BLACK_NUMBERS = [2, 4, 6, 8, 10, 12];

export const BetTypeSelector: React.FC<BetTypeSelectorProps> = ({
  selected,
  onChange,
  disabled,
}) => {
  const t = useI18nStore((s) => s.t);
  const [isSplitMode, setIsSplitMode] = useState<boolean>(false);
  const [splitPick, setSplitPick] = useState<number[]>([]);

  const handleSplitClick = (n: number) => {
    if (splitPick.includes(n)) {
      setSplitPick(splitPick.filter((x) => x !== n));
    } else if (splitPick.length === 1) {
      const fullSplit: [number, number] = [splitPick[0], n];
      setSplitPick(fullSplit);
      onChange(fullSplit);
    } else {
      setSplitPick([n]);
    }
  };

  const outsideBets: { id: AfricanRouletteSelection; label: string; payout: string; style: string }[] = [
    { id: 'RED', label: 'RED (Odd: 1,3,5..11)', payout: '2.0x (1:1)', style: 'bg-rose-600/20 border-rose-500 text-rose-300' },
    { id: 'BLACK', label: 'BLACK (Even: 2,4,6..12)', payout: '2.0x (1:1)', style: 'bg-slate-800/80 border-slate-600 text-slate-200' },
    { id: '1-6', label: 'HALF (1 - 6)', payout: '2.0x (1:1)', style: 'bg-cyan-600/20 border-cyan-500 text-cyan-300' },
    { id: '7-12', label: 'HALF (7 - 12)', payout: '2.0x (1:1)', style: 'bg-indigo-600/20 border-indigo-500 text-indigo-300' },
    { id: 'LO', label: 'LO (1 - 4)', payout: '3.0x (2:1)', style: 'bg-teal-600/20 border-teal-500 text-teal-300' },
    { id: 'MID', label: 'MID (5 - 8)', payout: '3.0x (2:1)', style: 'bg-purple-600/20 border-purple-500 text-purple-300' },
    { id: 'HI', label: 'HI (9 - 12)', payout: '3.0x (2:1)', style: 'bg-amber-600/20 border-amber-500 text-amber-300' },
  ];

  const isSelected = (id: AfricanRouletteSelection) => {
    if (Array.isArray(selected) && Array.isArray(id)) {
      return selected.length === id.length && selected.every((v, i) => v === id[i]);
    }
    return selected === id;
  };

  return (
    <div className="flex flex-col gap-4 w-full select-none">
      <div className="flex items-center justify-between">
        <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
          {t.games.roulette.chooseBet}
        </label>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setIsSplitMode(!isSplitMode);
            setSplitPick([]);
          }}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
            isSplitMode
              ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-400'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>Split Mode (6.0x)</span>
        </button>
      </div>

      {/* Outside Bets Grid */}
      {!isSplitMode && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
          {outsideBets.map((b) => (
            <button
              key={String(b.id)}
              type="button"
              disabled={disabled}
              onClick={() => onChange(b.id)}
              className={`py-2 sm:py-2.5 px-2 rounded-xl font-bold text-xs border flex flex-col items-center justify-center gap-0.5 transition-all transform active:scale-95 disabled:opacity-50 min-h-[44px] ${
                isSelected(b.id)
                  ? `${b.style} ring-2 ring-cyan-400/80 scale-[1.02] shadow-lg`
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="truncate max-w-full">{b.label}</span>
              <span className="text-[10px] opacity-80 font-mono">{b.payout}</span>
            </button>
          ))}
        </div>
      )}

      {/* Split Mode Banner */}
      {isSplitMode && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 font-bold flex items-center justify-between">
          <span>Pick 2 numbers to split stake (6.0x return):</span>
          <span className="font-mono bg-amber-500/20 px-2 py-0.5 rounded text-amber-200">
            {splitPick.length}/2 Picked {splitPick.length > 0 ? `(${splitPick.join(', ')})` : ''}
          </span>
        </div>
      )}

      {/* 13-Pocket African / Mini Grid Board */}
      <div className="flex flex-col gap-2.5 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex justify-between items-center px-1">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
            Single Pocket Bets (12.0x Return / 11:1 Payout)
          </span>
          <span className="text-[10px] text-amber-400 font-mono font-bold">Pockets 0 - 12</span>
        </div>

        {/* Green Zero Header Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => (isSplitMode ? handleSplitClick(0) : onChange(0))}
          className={`py-3 rounded-xl text-sm font-black border flex items-center justify-center gap-2 transition-all ${
            isSelected(0) || splitPick.includes(0)
              ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold ring-2 ring-emerald-400 scale-[1.02] shadow-emerald-500/30 shadow-lg'
              : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300 hover:border-emerald-600'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            <span>ZERO (0)</span>
          </span>
          <span className="text-[10px] font-mono opacity-80">(12.0x)</span>
        </button>

        {/* 1..12 Grid (4 Columns x 3 Rows) */}
        <div className="grid grid-cols-4 gap-2 mt-1">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => {
            const isRed = ODD_RED_NUMBERS.includes(n);
            const selectedMatch = isSelected(n);
            const inSplitPick = splitPick.includes(n);

            return (
              <button
                key={n}
                type="button"
                disabled={disabled}
                onClick={() => (isSplitMode ? handleSplitClick(n) : onChange(n))}
                className={`h-12 rounded-xl font-mono text-base font-black border flex flex-col items-center justify-center transition-all duration-200 transform active:scale-95 disabled:opacity-50 relative ${
                  selectedMatch || inSplitPick
                    ? 'ring-4 ring-amber-400 scale-105 z-10 shadow-xl'
                    : ''
                } ${
                  isRed
                    ? selectedMatch || inSplitPick
                      ? 'bg-rose-500 text-white border-rose-400'
                      : 'bg-rose-950/60 border-rose-800/80 text-rose-300 hover:bg-rose-900/80'
                    : selectedMatch || inSplitPick
                    ? 'bg-slate-700 text-white border-slate-500'
                    : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>{n}</span>
                <span className="text-[9px] opacity-75 font-sans font-bold">
                  {isRed ? 'RED' : 'BLK'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
