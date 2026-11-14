import React from 'react';
import { Trophy, Flame, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { HeadsCoinSvg, TailsCoinSvg } from './CoinArtwork';
import { FlipResultData } from '../hooks/useCoinFlip';

export interface ResultProps {
  result: FlipResultData;
  balance: number;
}

export const Result: React.FC<ResultProps> = ({ result, balance }) => {
  const isWon = result.won;
  const profit = isWon ? (result.payout - result.betAmount).toFixed(2) : `-${result.betAmount.toFixed(2)}`;

  return (
    <div
      className={`relative w-full rounded-2xl border p-4 sm:p-5 transition-all duration-300 select-none overflow-hidden ${
        isWon
          ? 'bg-gradient-to-r from-emerald-950/60 via-[#0e1713] to-[#07130d] border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.25)]'
          : 'bg-gradient-to-r from-rose-950/40 via-[#160d10] to-[#0f090b] border-rose-500/40 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
      }`}
    >
      {/* Background Ambient Glow */}
      <div
        className={`absolute -right-8 -top-8 w-40 h-40 rounded-full blur-2xl pointer-events-none ${
          isWon ? 'bg-emerald-500/20' : 'bg-rose-500/15'
        }`}
      />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left Side: Outcome icon & summary */}
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
              isWon
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : 'bg-rose-500/20 border-rose-500/60 text-rose-400'
            }`}
          >
            {isWon ? <Trophy className="w-6 h-6" /> : <Flame className="w-6 h-6" />}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span
                className={`text-sm sm:text-base font-black tracking-wider uppercase ${
                  isWon ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isWon ? 'YOU WON!' : 'ROUND LOST'}
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/40 border border-white/10 text-slate-300">
                {result.result}
              </span>
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
              <span>Your Pick:</span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <span className="w-4 h-4 inline-block">
                  {result.choice === 'HEADS' ? (
                    <HeadsCoinSvg className="w-full h-full" />
                  ) : (
                    <TailsCoinSvg className="w-full h-full" />
                  )}
                </span>
                {result.choice}
              </span>
              <span className="text-slate-600">·</span>
              <span>Stake: {result.betAmount} ETB</span>
            </div>
          </div>
        </div>

        {/* Right Side: Financial Delta & Multiplier */}
        <div className="text-left sm:text-right font-mono flex sm:flex-col justify-between w-full sm:w-auto items-center sm:items-end border-t sm:border-t-0 pt-2 sm:pt-0 border-white/10">
          <div
            className={`text-lg sm:text-xl font-black flex items-center gap-1 ${
              isWon ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'text-rose-400'
            }`}
          >
            {isWon ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
            <span>{isWon ? `+${result.payout.toFixed(2)} ETB` : `-${result.betAmount} ETB`}</span>
          </div>

          <div className="text-[11px] text-slate-400">
            {isWon ? (
              <span className="text-emerald-300 font-bold">Net Profit: +{profit} ETB (1.98x)</span>
            ) : (
              <span className="text-slate-500">Wallet: {balance.toFixed(0)} ETB</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
