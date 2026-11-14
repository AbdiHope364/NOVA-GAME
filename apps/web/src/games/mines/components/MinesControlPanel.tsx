import React from 'react';
import { Button } from '@nova/ui';
import { useI18nStore } from '../../../stores/i18nStore';
import { Bomb, Gem } from 'lucide-react';

export interface MinesControlPanelProps {
  mineCount: number;
  onMineCountChange: (val: number) => void;
  betAmount: number;
  onBetAmountChange: (val: number) => void;
  maxBalance: number;
  isPlaying: boolean;
  gemsRevealed: number;
  currentMultiplier: number;
  currentPayout: number;
  onStart: () => void;
  onCashout: () => void;
}

export const MinesControlPanel: React.FC<MinesControlPanelProps> = ({
  mineCount,
  onMineCountChange,
  betAmount,
  onBetAmountChange,
  maxBalance,
  isPlaying,
  gemsRevealed,
  currentMultiplier,
  currentPayout,
  onStart,
  onCashout,
}) => {
  const t = useI18nStore((s) => s.t);
  const quickMineOptions = [1, 3, 5, 10];

  return (
    <div className="flex flex-col gap-4 w-full">
      {!isPlaying ? (
        <>
          {/* Mine Count Selector */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>{(t.games as any).mines?.mineCount || 'Mines Count'}</span>
              <span className="text-amber-400 font-extrabold flex items-center gap-1">
                <Bomb className="w-3.5 h-3.5" /> {mineCount} Mines ({25 - mineCount} Gems)
              </span>
            </div>

            <input
              type="range"
              min={1}
              max={24}
              value={mineCount}
              onChange={(e) => onMineCountChange(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-950 rounded-lg cursor-pointer h-2"
            />

            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mt-1">
              {quickMineOptions.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onMineCountChange(m)}
                  className={`py-2 rounded-lg text-xs font-bold border transition-all active:scale-95 flex items-center justify-center gap-1 ${
                    mineCount === m
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Bomb className="w-3 h-3" /> {m}
                </button>
              ))}
            </div>
          </div>

          {/* Bet Amount Input */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Bet Amount</span>
              <span className="text-emerald-400">{maxBalance.toFixed(0)} ETB</span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => onBetAmountChange(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-base sm:text-lg font-bold focus:outline-none focus:border-cyan-500 transition-colors pr-14"
                />
                <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-500">ETB</span>
              </div>

              <Button
                type="button"
                variant="secondary"
                onClick={() => onBetAmountChange(Math.max(1, Math.floor(betAmount / 2)))}
                className="px-3 min-h-[44px] active:scale-95"
              >
                ½
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => onBetAmountChange(Math.min(maxBalance, betAmount * 2))}
                className="px-3 min-h-[44px] active:scale-95"
              >
                2x
              </Button>
            </div>
          </div>

          {/* Start Game Button */}
          <Button
            variant="accent"
            size="lg"
            disabled={betAmount > maxBalance}
            onClick={onStart}
            className="w-full py-3.5 sm:py-4 text-base sm:text-lg font-black tracking-wider uppercase shadow-xl shadow-emerald-500/20 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 rounded-2xl min-h-[48px] active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <span>START MINES GAME</span>
            <Bomb className="w-5 h-5" />
          </Button>
        </>
      ) : (
        /* Active Cashout Button */
        <Button
          variant="accent"
          size="lg"
          disabled={gemsRevealed === 0}
          onClick={onCashout}
          className={`w-full py-3.5 sm:py-4 text-sm sm:text-lg font-black tracking-wider uppercase shadow-xl rounded-2xl min-h-[48px] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 ${
            gemsRevealed > 0
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          {gemsRevealed === 0 ? (
            <>
              <span>SELECT A TILE TO REVEAL GEM</span>
              <Gem className="w-5 h-5 text-emerald-300" />
            </>
          ) : (
            `CASHOUT ${currentPayout} ETB (${currentMultiplier.toFixed(2)}x)`
          )}
        </Button>
      )}
    </div>
  );
};
