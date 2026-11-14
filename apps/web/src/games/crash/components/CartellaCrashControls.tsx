import React from 'react';
import { Button } from '@nova/ui';
import { Coins, Rocket, CheckCircle2 } from 'lucide-react';

interface CartellaCrashControlsProps {
  betAmount: number;
  setBetAmount: (amt: number) => void;
  autoCashoutEnabled: boolean;
  setAutoCashoutEnabled: (enabled: boolean) => void;
  autoCashout: number;
  setAutoCashout: (val: number) => void;
  isFlying: boolean;
  isCrashed?: boolean;
  hasPlacedBet: boolean;
  queuedNextRound?: boolean;
  isCashedOut: boolean;
  currentMultiplier: number;
  countdown: number;
  balance: number;
  lastResult: any;
  onPlaceBet: () => void;
  onManualCashout: () => void;
  onCancelBet?: () => void;
}

export const CartellaCrashControls: React.FC<CartellaCrashControlsProps> = ({
  betAmount,
  setBetAmount,
  autoCashoutEnabled,
  setAutoCashoutEnabled,
  autoCashout,
  setAutoCashout,
  isFlying,
  isCrashed = false,
  hasPlacedBet,
  queuedNextRound = false,
  isCashedOut,
  currentMultiplier,
  countdown,
  balance,
  lastResult,
  onPlaceBet,
  onManualCashout,
  onCancelBet,
}) => {
  const quickAmounts = [10, 25, 50, 100, 250, 500];
  const autoPresets = [1.5, 2.0, 3.0, 5.0];
  const livePayout = Math.floor(betAmount * Math.max(1.0, currentMultiplier));

  return (
    <div className="flex flex-col gap-2.5 sm:gap-3 w-full select-none">
      {/* 1. Bet Amount Configuration Row */}
      <div className="flex flex-col gap-2 p-2.5 sm:p-3 bg-[#180633]/90 border border-purple-800/60 rounded-2xl shadow-inner">
        <div className="flex items-center justify-between">
          <span className="text-[11px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider">
            Bet Stake (ETB)
          </span>
          <span className="text-xs font-mono font-bold text-emerald-400">
            Wallet: {balance.toFixed(0)} ETB
          </span>
        </div>

        {/* Input with - / + / 1/2 / 2x controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            disabled={isFlying && hasPlacedBet}
            onClick={() => setBetAmount(Math.max(5, betAmount - 10))}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#230948] hover:bg-[#2d0e57] text-white font-black text-lg border border-purple-500/40 disabled:opacity-50 active:scale-95 transition-all cursor-pointer"
          >
            -
          </button>

          <div className="relative flex-1">
            <input
              type="number"
              min="5"
              step="5"
              disabled={isFlying && hasPlacedBet}
              value={betAmount}
              onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
              className="w-full bg-[#110226] border border-purple-600/60 rounded-xl px-3.5 py-2 sm:py-2.5 text-center text-amber-300 font-mono font-black text-base sm:text-lg focus:outline-none focus:border-amber-400 transition-all disabled:opacity-60"
            />
            <span className="absolute right-3 top-2.5 sm:top-3 text-[10px] font-bold text-slate-400 pointer-events-none">
              ETB
            </span>
          </div>

          <button
            type="button"
            disabled={isFlying && hasPlacedBet}
            onClick={() => setBetAmount(betAmount + 10)}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#230948] hover:bg-[#2d0e57] text-white font-black text-lg border border-purple-500/40 disabled:opacity-50 active:scale-95 transition-all cursor-pointer"
          >
            +
          </button>

          <button
            type="button"
            disabled={isFlying && hasPlacedBet}
            onClick={() => setBetAmount(Math.max(5, Math.floor(betAmount / 2)))}
            className="px-2.5 py-2 sm:py-2.5 rounded-xl bg-[#230948] hover:bg-[#2d0e57] text-purple-200 font-bold text-xs border border-purple-500/40 disabled:opacity-50 active:scale-95 transition-all cursor-pointer"
          >
            ½
          </button>

          <button
            type="button"
            disabled={isFlying && hasPlacedBet}
            onClick={() => setBetAmount(Math.min(balance, betAmount * 2))}
            className="px-2.5 py-2 sm:py-2.5 rounded-xl bg-[#230948] hover:bg-[#2d0e57] text-purple-200 font-bold text-xs border border-purple-500/40 disabled:opacity-50 active:scale-95 transition-all cursor-pointer"
          >
            2X
          </button>
        </div>

        {/* Quick Amount Chips */}
        <div className="grid grid-cols-6 gap-1 sm:gap-1.5 pt-1">
          {quickAmounts.map((amt) => (
            <button
              key={amt}
              type="button"
              disabled={isFlying && hasPlacedBet}
              onClick={() => setBetAmount(amt)}
              className={`py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                betAmount === amt
                  ? 'bg-amber-500 text-slate-950 font-black border-amber-300 shadow-sm'
                  : 'bg-[#15042a] text-purple-200 border-purple-900/80 hover:border-purple-600'
              }`}
            >
              {amt}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Optional Auto Cashout Section */}
      <div className="flex flex-col gap-2 p-2.5 sm:p-3 bg-[#180633]/90 border border-purple-800/60 rounded-2xl shadow-inner">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoCashoutEnabled}
              disabled={isFlying && hasPlacedBet}
              onChange={(e) => setAutoCashoutEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-purple-700 text-amber-500 focus:ring-amber-500 bg-[#120326] cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
              Auto Cash Out
            </span>
          </label>
          <span
            className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md ${
              autoCashoutEnabled
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-900 text-slate-500 border border-slate-800'
            }`}
          >
            {autoCashoutEnabled ? `${autoCashout.toFixed(2)}x` : 'Off'}
          </span>
        </div>

        {autoCashoutEnabled && (
          <div className="flex items-center gap-1.5 sm:gap-2 animate-in fade-in duration-150">
            <div className="relative flex-1">
              <input
                type="number"
                step="0.1"
                min="1.05"
                disabled={isFlying && hasPlacedBet}
                value={autoCashout}
                onChange={(e) => setAutoCashout(Math.max(1.05, Number(e.target.value)))}
                className="w-full bg-[#110226] border border-purple-600/60 rounded-xl px-3 py-1.5 text-center text-cyan-300 font-mono font-black text-sm focus:outline-none focus:border-cyan-400"
              />
              <span className="absolute right-3 top-1.5 text-xs font-bold text-slate-400">
                X
              </span>
            </div>

            {autoPresets.map((pr) => (
              <button
                key={pr}
                type="button"
                disabled={isFlying && hasPlacedBet}
                onClick={() => setAutoCashout(pr)}
                className={`px-2.5 py-1.5 rounded-xl font-mono text-xs font-bold border transition-all ${
                  autoCashout === pr
                    ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300'
                    : 'bg-[#15042a] border-purple-900/60 text-slate-400 hover:text-white'
                }`}
              >
                {pr.toFixed(1)}x
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Large Prominent Primary Action Button (CASH OUT / PLACE BET / CANCEL) */}
      <div className="w-full pt-1">
        {isFlying ? (
          hasPlacedBet && !isCashedOut ? (
            /* Large Pulsating Golden Cash Out Button - ALWAYS VISIBLE THROUGHOUT FLIGHT */
            <Button
              variant="accent"
              size="lg"
              onClick={onManualCashout}
              className="w-full py-4 sm:py-5 text-xl sm:text-2xl font-black tracking-wider uppercase shadow-[0_0_35px_rgba(245,158,11,0.85)] bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 rounded-2xl animate-pulse cursor-pointer border-2 border-yellow-200 min-h-[58px] sm:min-h-[64px] active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <Coins className="w-6 h-6 text-slate-950 fill-amber-300" />
              <span>CASH OUT {livePayout} ETB</span>
            </Button>
          ) : isCashedOut ? (
            /* Cashed Out Celebratory Card */
            <div className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border-2 border-emerald-400/80 text-emerald-300 font-black text-center shadow-[0_0_20px_rgba(52,211,153,0.3)] flex items-center justify-center gap-2 min-h-[56px]">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <span className="text-base sm:text-lg">
                YOU CASHED OUT! (+{lastResult?.payout ?? Math.floor(betAmount * currentMultiplier)} ETB @ {(lastResult?.multiplier ?? currentMultiplier ?? 1.0).toFixed(2)}x)
              </span>
            </div>
          ) : queuedNextRound ? (
            /* Bet Queued for Next Flight with Cancel Option */
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
              <div className="flex-1 w-full py-3.5 sm:py-4 px-4 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 border-2 border-cyan-400/80 text-cyan-300 font-black text-center animate-pulse flex items-center justify-center gap-2 min-h-[56px] shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                <CheckCircle2 className="w-6 h-6 text-cyan-400" />
                <span className="text-sm sm:text-base">
                  BET QUEUED ({betAmount} ETB) • READY FOR NEXT FLIGHT
                </span>
              </div>
              {onCancelBet && (
                <button
                  type="button"
                  onClick={onCancelBet}
                  className="w-full sm:w-auto px-4 py-3.5 sm:py-4 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer min-h-[48px] sm:min-h-[56px]"
                >
                  Cancel
                </button>
              )}
            </div>
          ) : (
            /* In-Flight: User can queue bet for the next round! */
            <Button
              variant="accent"
              size="lg"
              onClick={onPlaceBet}
              className={`w-full py-4 sm:py-5 text-base sm:text-lg font-black tracking-wider uppercase shadow-[0_0_25px_rgba(16,185,129,0.5)] bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-2xl min-h-[56px] sm:min-h-[62px] active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer border-2 border-emerald-300 ${
                betAmount > balance ? 'opacity-80' : ''
              }`}
            >
              <Rocket className="w-6 h-6" />
              <span>PLACE BET FOR NEXT FLIGHT ({betAmount} ETB)</span>
            </Button>
          )
        ) : isCrashed ? (
          isCashedOut ? (
            /* Cashed Out Win Confirmation */
            <div className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border-2 border-emerald-400/80 text-emerald-300 font-black text-center shadow-[0_0_20px_rgba(52,211,153,0.3)] flex items-center justify-center gap-2 min-h-[56px]">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <span className="text-base sm:text-lg">
                YOU WON! (+{lastResult?.payout ?? Math.floor(betAmount * (lastResult?.multiplier ?? currentMultiplier))} ETB)
              </span>
            </div>
          ) : hasPlacedBet ? (
            /* Bet Lost */
            <div className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-rose-500/20 via-red-500/20 to-rose-500/20 border-2 border-rose-500/80 text-rose-300 font-black text-center shadow-[0_0_20px_rgba(244,63,94,0.3)] flex items-center justify-center gap-2 min-h-[56px]">
              <span className="text-base sm:text-lg">
                BET LOST (-{betAmount} ETB)
              </span>
            </div>
          ) : (
            /* Round Over */
            <div className="w-full py-4 px-4 rounded-2xl bg-[#1d083b] border border-purple-800/80 text-purple-200 font-bold text-center flex items-center justify-center gap-2 min-h-[56px]">
              <span className="text-base sm:text-lg font-black">
                ROUND OVER
              </span>
            </div>
          )
        ) : hasPlacedBet ? (
          /* Bet Placed (Waiting for countdown takeoff) with Cancel Bet option */
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
            <div className="flex-1 w-full py-3.5 sm:py-4 px-4 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 border-2 border-cyan-400/80 text-cyan-300 font-black text-center animate-pulse flex items-center justify-center gap-2 min-h-[56px] shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <CheckCircle2 className="w-6 h-6 text-cyan-400" />
              <span className="text-sm sm:text-base">
                BET PLACED ({betAmount} ETB) • TAKEOFF IN {countdown > 0 ? `${countdown}s` : 'MOMENTS'}
              </span>
            </div>
            {onCancelBet && (
              <button
                type="button"
                onClick={onCancelBet}
                className="w-full sm:w-auto px-4 py-3.5 sm:py-4 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer min-h-[48px] sm:min-h-[56px]"
              >
                Cancel
              </button>
            )}
          </div>
        ) : (
          /* Place Bet Button */
          <Button
            variant="accent"
            size="lg"
            onClick={onPlaceBet}
            className={`w-full py-4 sm:py-5 text-lg sm:text-xl font-black tracking-wider uppercase shadow-[0_0_25px_rgba(16,185,129,0.5)] bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-2xl min-h-[56px] sm:min-h-[62px] active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer border-2 border-emerald-300 ${
              betAmount > balance ? 'opacity-80' : ''
            }`}
          >
            <Rocket className="w-6 h-6" />
            <span>PLACE BET ({betAmount} ETB)</span>
          </Button>
        )}
      </div>
    </div>
  );
};
