import React from 'react';
import { Card, Button, Badge } from '@nova/ui';
import { CrashChart } from './components/CrashChart';
import { AutoCashoutInput } from './components/AutoCashoutInput';
import { BetSelector } from './components/BetSelector';
import { Result } from './components/Result';
import { useCrash } from './hooks/useCrash';
import { useI18nStore } from '../../stores/i18nStore';
import { History } from 'lucide-react';

export const CrashPage: React.FC = () => {
  const {
    betAmount,
    setBetAmount,
    autoCashout,
    setAutoCashout,
    currentMultiplier,
    isFlying,
    isCrashed,
    isCashedOut,
    lastResult,
    history,
    error,
    balance,
    launch,
  } = useCrash();

  const t = useI18nStore((s) => s.t);
  const possibleWin = Math.floor(betAmount * autoCashout);

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto py-2 px-2 sm:px-0">
      {/* Main Crash Card */}
      <Card className="flex flex-col gap-6 border-slate-800 bg-slate-900/90 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2 tracking-tight">
              🚀 {t.games.crash.title}
            </h1>
            <p className="text-xs text-slate-400">{t.games.crash.subtitle}</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 font-bold uppercase">{t.common.balance}</span>
            <span className="font-mono text-base font-extrabold text-emerald-400">{balance.toFixed(0)} ETB</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Dynamic Crash Rocket Chart */}
        <CrashChart
          currentMultiplier={currentMultiplier}
          isFlying={isFlying}
          isCrashed={isCrashed}
          isCashedOut={isCashedOut}
          cashedOutMultiplier={lastResult?.multiplier}
          finalCrashPoint={lastResult?.crashPoint}
        />

        {/* Auto Cashout Input */}
        <AutoCashoutInput value={autoCashout} onChange={setAutoCashout} disabled={isFlying} />

        {/* Bet Selector */}
        <BetSelector amount={betAmount} onChange={setBetAmount} maxBalance={balance} disabled={isFlying} />

        {/* Result Banner */}
        {lastResult && (
          <Result
            won={lastResult.won}
            multiplier={lastResult.multiplier}
            crashPoint={lastResult.crashPoint}
            payout={lastResult.payout}
            betAmount={lastResult.betAmount}
          />
        )}

        {/* LAUNCH / CASHOUT Action Button */}
        <Button
          variant="accent"
          size="lg"
          disabled={isFlying || betAmount > balance}
          onClick={launch}
          className="w-full py-4 text-lg font-black tracking-wider uppercase shadow-xl shadow-rose-500/20 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white"
        >
          {isFlying ? t.games.crash.inFlight : `${t.games.crash.launchRocket} (${possibleWin} ETB Win)`}
        </Button>
      </Card>

      {/* Recent Crash Multipliers Bar */}
      {history.length > 0 && (
        <Card className="flex flex-col gap-3 p-4 border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-rose-400" /> Recent Crash Multipliers
            </span>
            <Badge variant="info">{t.common.liveFeed}</Badge>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {history.map((m, i) => (
              <div
                key={i}
                className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold shrink-0 ${
                  m >= 2.0
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}
              >
                {m.toFixed(2)}x
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
