import React from 'react';
import { Card, Button, Badge } from '@nova/ui';
import { RouletteWheel } from './components/RouletteWheel';
import { BetTypeSelector } from './components/BetTypeSelector';
import { BetSelector } from './components/BetSelector';
import { Result } from './components/Result';
import { useRoulette } from './hooks/useRoulette';
import { useI18nStore } from '../../stores/i18nStore';
import { History } from 'lucide-react';

export const RoulettePage: React.FC = () => {
  const {
    selection,
    setSelection,
    betAmount,
    setBetAmount,
    isSpinning,
    lastResult,
    history,
    error,
    balance,
    play,
  } = useRoulette();

  const t = useI18nStore((s) => s.t);
  const possibleMultiplier = selection === 'GREEN' ? 35.0 : 1.94;
  const possibleWin = Math.floor(betAmount * possibleMultiplier);

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto py-2 px-2 sm:px-0">
      {/* Main Roulette Card */}
      <Card className="flex flex-col gap-6 border-slate-800 bg-slate-900/90 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2 tracking-tight">
              🎡 {t.games.roulette.title}
            </h1>
            <p className="text-xs text-slate-400">{t.games.roulette.subtitle}</p>
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

        {/* Animated Roulette Wheel Display */}
        <RouletteWheel
          isSpinning={isSpinning}
          resultNumber={lastResult ? lastResult.number : null}
          resultColor={lastResult ? lastResult.color : null}
        />

        {/* Bet Type Selector (RED / BLACK / GREEN) */}
        <BetTypeSelector selected={selection} onChange={setSelection} disabled={isSpinning} />

        {/* Bet Selector */}
        <BetSelector amount={betAmount} onChange={setBetAmount} maxBalance={balance} disabled={isSpinning} />

        {/* Result Banner */}
        {lastResult && (
          <Result
            won={lastResult.won}
            number={lastResult.number}
            color={lastResult.color}
            multiplier={lastResult.multiplier}
            payout={lastResult.payout}
            betAmount={lastResult.betAmount}
          />
        )}

        {/* SPIN ROULETTE Action Button */}
        <Button
          variant="accent"
          size="lg"
          disabled={isSpinning || betAmount > balance}
          onClick={play}
          className="w-full py-4 text-lg font-black tracking-wider uppercase shadow-xl shadow-emerald-500/20 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950"
        >
          {isSpinning ? t.games.roulette.spinning : `${t.games.roulette.spinRoulette} (${possibleWin} ETB Win)`}
        </Button>
      </Card>

      {/* Recent Numbers Bar */}
      {history.length > 0 && (
        <Card className="flex flex-col gap-3 p-4 border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-emerald-400" /> Recent Winning Numbers
            </span>
            <Badge variant="info">{t.common.liveFeed}</Badge>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {history.map((h, i) => (
              <div
                key={i}
                className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold shrink-0 flex items-center gap-1.5 ${
                  h.color === 'RED'
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : h.color === 'BLACK'
                    ? 'bg-slate-800 border-slate-700 text-slate-200'
                    : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                }`}
              >
                <span>{h.color === 'RED' ? '🔴' : h.color === 'BLACK' ? '⚫' : '🟢'}</span>
                <span>{h.number}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
