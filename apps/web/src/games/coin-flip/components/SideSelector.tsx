import React from 'react';
import { HeadsCoinSvg, TailsCoinSvg } from './CoinArtwork';

export interface SideSelectorProps {
  selected: 'HEADS' | 'TAILS';
  onChange: (side: 'HEADS' | 'TAILS') => void;
  disabled?: boolean;
}

export const SideSelector: React.FC<SideSelectorProps> = ({ selected, onChange, disabled }) => {
  return (
    <div className="w-full grid grid-cols-2 gap-2 sm:gap-4 select-none">
      {/* HEADS Selection Card */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('HEADS')}
        className={`group relative rounded-xl sm:rounded-2xl p-2.5 sm:p-5 flex flex-col items-center justify-between transition-all duration-300 cursor-pointer disabled:opacity-50 text-left ${
          selected === 'HEADS'
            ? 'bg-gradient-to-b from-[#1c180e] via-[#15120a] to-[#0d0b06] border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.35)] scale-[1.02] ring-1 ring-amber-300/40'
            : 'bg-[#0e131f] hover:bg-[#141b2b] border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
        }`}
      >
        {/* Subtle Ambient Gold Flare for Active Card */}
        {selected === 'HEADS' && (
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/15 rounded-full blur-xl pointer-events-none" />
        )}

        {/* Header Pill */}
        <div className="w-full flex items-center justify-between mb-1 sm:mb-2">
          <span
            className={`text-[11px] sm:text-xs font-black tracking-wider uppercase ${
              selected === 'HEADS' ? 'text-amber-300 drop-shadow-[0_1px_4px_rgba(245,158,11,0.5)]' : 'text-slate-400'
            }`}
          >
            HEADS
          </span>
          <span className="text-[9px] sm:text-[10px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
            50.0%
          </span>
        </div>

        {/* Embossed Svg Emblem */}
        <div className="w-14 h-14 sm:w-24 sm:h-24 my-1 sm:my-2 relative transition-transform duration-300 group-hover:scale-105">
          <HeadsCoinSvg dimmed={selected !== 'HEADS'} />
        </div>

        {/* Multiplier / Payout Badge */}
        <div className="w-full mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] sm:text-[11px] font-mono">
          <span className="text-slate-500">Payout</span>
          <span className={selected === 'HEADS' ? 'text-amber-400 font-extrabold' : 'text-slate-400'}>
            1.98x
          </span>
        </div>
      </button>

      {/* TAILS Selection Card */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('TAILS')}
        className={`group relative rounded-xl sm:rounded-2xl p-2.5 sm:p-5 flex flex-col items-center justify-between transition-all duration-300 cursor-pointer disabled:opacity-50 text-left ${
          selected === 'TAILS'
            ? 'bg-gradient-to-b from-[#1c180e] via-[#15120a] to-[#0d0b06] border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.35)] scale-[1.02] ring-1 ring-amber-300/40'
            : 'bg-[#0e131f] hover:bg-[#141b2b] border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
        }`}
      >
        {/* Subtle Ambient Gold Flare for Active Card */}
        {selected === 'TAILS' && (
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/15 rounded-full blur-xl pointer-events-none" />
        )}

        {/* Header Pill */}
        <div className="w-full flex items-center justify-between mb-1 sm:mb-2">
          <span
            className={`text-[11px] sm:text-xs font-black tracking-wider uppercase ${
              selected === 'TAILS' ? 'text-amber-300 drop-shadow-[0_1px_4px_rgba(245,158,11,0.5)]' : 'text-slate-400'
            }`}
          >
            TAILS
          </span>
          <span className="text-[9px] sm:text-[10px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
            50.0%
          </span>
        </div>

        {/* Embossed Svg Emblem */}
        <div className="w-14 h-14 sm:w-24 sm:h-24 my-1 sm:my-2 relative transition-transform duration-300 group-hover:scale-105">
          <TailsCoinSvg dimmed={selected !== 'TAILS'} />
        </div>

        {/* Multiplier / Payout Badge */}
        <div className="w-full mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] sm:text-[11px] font-mono">
          <span className="text-slate-500">Payout</span>
          <span className={selected === 'TAILS' ? 'text-amber-400 font-extrabold' : 'text-slate-400'}>
            1.98x
          </span>
        </div>
      </button>
    </div>
  );
};
