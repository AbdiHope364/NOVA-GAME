import React from 'react';
import { Wallet } from 'lucide-react';
import { MIN_COIN_BET, MAX_COIN_BET } from '../hooks/useCoinFlip';

export interface BetSelectorProps {
  amount: number;
  onChange: (val: number) => void;
  maxBalance: number;
  disabled?: boolean;
}

export const BetSelector: React.FC<BetSelectorProps> = ({
  amount,
  onChange,
  maxBalance,
  disabled,
}) => {
  const quickAmounts = [25, 50, 100, 250, 500, 1000];

  const possibleWin = (amount * 1.98).toFixed(2);
  const profitOnWin = (amount * 0.98).toFixed(2);

  return (
    <div className="flex flex-col gap-3.5 w-full select-none">
      {/* Balance & Stake Label */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400 font-bold uppercase tracking-wider">Bet Amount</span>
        <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
          <Wallet className="w-3.5 h-3.5" />
          <span>{maxBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ETB</span>
        </span>
      </div>

      {/* Main Stake Input with ½, 2×, and MAX Modifiers */}
      <div className="flex items-center gap-2 bg-[#080c14] border border-slate-800 focus-within:border-amber-400/80 rounded-2xl px-3.5 py-2.5 transition-all shadow-inner">
        <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-black shrink-0">
          ETB
        </span>

        <input
          type="number"
          min={MIN_COIN_BET}
          max={Math.min(MAX_COIN_BET, Math.max(MIN_COIN_BET, Math.floor(maxBalance)))}
          disabled={disabled}
          value={amount}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            onChange(isNaN(val) ? 0 : val);
          }}
          className="w-full bg-transparent text-white font-mono font-black text-lg focus:outline-none"
        />

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(Math.max(MIN_COIN_BET, Math.floor(amount / 2)))}
            className="px-2.5 py-1.5 rounded-lg bg-[#141a29] hover:bg-[#1d263b] text-xs font-bold text-slate-300 transition-colors cursor-pointer disabled:opacity-40"
          >
            ½
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(Math.min(MAX_COIN_BET, Math.floor(amount * 2)))}
            className="px-2.5 py-1.5 rounded-lg bg-[#141a29] hover:bg-[#1d263b] text-xs font-bold text-slate-300 transition-colors cursor-pointer disabled:opacity-40"
          >
            2×
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() =>
              onChange(Math.min(MAX_COIN_BET, Math.max(MIN_COIN_BET, Math.floor(maxBalance))))
            }
            className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-black transition-colors cursor-pointer disabled:opacity-40"
          >
            MAX
          </button>
        </div>
      </div>

      {/* Quick Amount Pills */}
      <div className="grid grid-cols-6 gap-1.5">
        {quickAmounts.map((q) => (
          <button
            key={q}
            type="button"
            disabled={disabled}
            onClick={() => onChange(q)}
            className={`py-1.5 rounded-xl font-mono text-[11px] font-bold border transition-all cursor-pointer ${
              amount === q
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                : 'bg-[#0e131f] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            +{q}
          </button>
        ))}
      </div>

      {/* Odds & Potential Win Summary Card */}
      <div className="grid grid-cols-3 gap-2 bg-[#0e131f] p-3 rounded-2xl border border-slate-800/90 text-center font-mono">
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Multiplier</span>
          <span className="text-sm font-extrabold text-amber-400">1.98x</span>
        </div>
        <div className="border-x border-slate-800/80">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Win Chance</span>
          <span className="text-sm font-extrabold text-slate-200">50.0%</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Profit on Win</span>
          <span className="text-sm font-extrabold text-emerald-400">+{profitOnWin} ETB</span>
        </div>
      </div>
    </div>
  );
};
