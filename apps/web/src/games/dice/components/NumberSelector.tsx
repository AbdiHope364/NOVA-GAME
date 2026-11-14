import React from 'react';
import { useI18nStore } from '../../../stores/i18nStore';
import { Sliders, Dices } from 'lucide-react';
import { DiceIcon } from './DiceIcon';

export interface NumberSelectorProps {
  mode: 'SLIDER' | 'SINGLE';
  onModeChange: (mode: 'SLIDER' | 'SINGLE') => void;
  targetNumber: number;
  onTargetNumberChange: (val: number) => void;
  singlePick: number;
  onSinglePickChange: (num: number) => void;
  condition: 'UNDER' | 'OVER';
  onConditionChange: (cond: 'UNDER' | 'OVER') => void;
  winChance: number;
  currentMultiplier: number;
  possibleWin: number;
  disabled?: boolean;
}

export const NumberSelector: React.FC<NumberSelectorProps> = ({
  mode,
  onModeChange,
  targetNumber,
  onTargetNumberChange,
  singlePick,
  onSinglePickChange,
  condition,
  onConditionChange,
  winChance,
  currentMultiplier,
  possibleWin,
  disabled,
}) => {
  const t = useI18nStore((s) => s.t);
  const numbers = [1, 2, 3, 4, 5, 6];
  const presetChances = [25, 50, 75, 90];

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-2 gap-2 bg-[#070b14] p-1 rounded-xl border border-slate-800">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onModeChange('SLIDER')}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mode === 'SLIDER'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Over / Under Slider</span>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onModeChange('SINGLE')}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mode === 'SINGLE'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Dices className="w-3.5 h-3.5" />
          <span>6-Sided 3D Die</span>
        </button>
      </div>

      {mode === 'SLIDER' ? (
        /* SLIDER MODE CONTROLS */
        <div className="flex flex-col gap-4 bg-[#0e1628] p-4 rounded-xl border border-slate-800 shadow-xl">
          {/* Condition Toggle: ROLL UNDER vs ROLL OVER */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onConditionChange('UNDER')}
              className={`py-2.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                condition === 'UNDER'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/40'
                  : 'bg-[#070b14] border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              ROLL UNDER &lt; {targetNumber}
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onConditionChange('OVER')}
              className={`py-2.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                condition === 'OVER'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/40'
                  : 'bg-[#070b14] border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              ROLL OVER &gt; {targetNumber}
            </button>
          </div>

          {/* Interactive Range Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400">
              <span>TARGET NUMBER</span>
              <span className="text-emerald-400 text-base font-extrabold">{targetNumber}</span>
            </div>

            <input
              type="range"
              min={2}
              max={98}
              value={targetNumber}
              disabled={disabled}
              onChange={(e) => onTargetNumberChange(Number(e.target.value))}
              className="w-full accent-emerald-400 bg-slate-900 rounded-lg cursor-pointer h-2.5"
            />

            <div className="flex justify-between text-[10px] font-mono text-slate-500 font-bold">
              <span>2</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>98</span>
            </div>

            {/* Quick Preset Chances Buttons */}
            <div className="grid grid-cols-4 gap-2 mt-1">
              {presetChances.map((c) => (
                <button
                  key={c}
                  type="button"
                  disabled={disabled}
                  onClick={() => onTargetNumberChange(condition === 'UNDER' ? c : 100 - c)}
                  className="py-1 rounded-lg text-[11px] font-bold bg-[#070b14] border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200 cursor-pointer"
                >
                  {c}% Chance
                </button>
              ))}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 bg-[#070b14] p-3 rounded-lg border border-slate-800 text-center font-mono">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">Multiplier</div>
              <div className="text-sm font-extrabold text-cyan-400">{currentMultiplier.toFixed(2)}x</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">Win Chance</div>
              <div className="text-sm font-extrabold text-emerald-400">{winChance.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">Win Payout</div>
              <div className="text-sm font-extrabold text-amber-400">{possibleWin} ETB</div>
            </div>
          </div>
        </div>
      ) : (
        /* SINGLE PICK MODE CONTROLS */
        <div className="flex flex-col gap-3 w-full">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>{t.games.dice.pickNumber}</span>
            <span className="text-emerald-400 font-mono font-bold">
              Possible Win: {possibleWin} ETB (5.94x)
            </span>
          </div>

          {/* 6-Sided Single Pick Grid */}
          <div className="grid grid-cols-3 gap-3">
            {numbers.map((num) => (
              <button
                key={num}
                type="button"
                disabled={disabled}
                onClick={() => onSinglePickChange(num)}
                className={`py-3.5 px-2 rounded-xl font-extrabold text-xl border flex flex-col items-center justify-center gap-1.5 transition-all duration-200 transform active:scale-95 disabled:opacity-50 cursor-pointer ${
                  singlePick === num
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-2 ring-emerald-400/50 scale-[1.03]'
                    : 'bg-[#070b14] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <DiceIcon value={num} className="w-8 h-8" />
                <span className="text-xs font-mono font-bold">NUMBER {num}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
