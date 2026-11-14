import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge } from '@nova/ui';
import { RouletteWheel } from './components/RouletteWheel';
import { BetTypeSelector } from './components/BetTypeSelector';
import { BetSelector } from './components/BetSelector';
import { Result } from './components/Result';
import { useRoulette } from './hooks/useRoulette';
import { useI18nStore } from '../../stores/i18nStore';
import { History, ShieldCheck, CircleDot, Wallet, Plus } from 'lucide-react';

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

  const getMultiplier = (sel: any) => {
    if (typeof sel === 'number' || sel === 'GREEN') return 12.0;
    if (Array.isArray(sel)) return 6.0;
    if (sel === 'LO' || sel === 'MID' || sel === 'HI') return 3.0;
    return 2.0;
  };

  const possibleMultiplier = getMultiplier(selection);
  const possibleWin = Math.floor(betAmount * possibleMultiplier);

  return (
    <div className="flex flex-col gap-4 sm:gap-6 max-w-xl mx-auto py-1 sm:py-2 px-1 sm:px-0">
      {/* Main Roulette Card */}
      <Card className="flex flex-col gap-4 sm:gap-6 border-slate-800 bg-slate-900/90 shadow-2xl p-3.5 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div>
            <h1 className="text-lg sm:text-2xl font-extrabold text-white flex items-center gap-2 tracking-tight">
              <CircleDot className="w-6 h-6 text-emerald-400 inline" /> Mini Roulette
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-400">13 Pockets (0 - 12) • 92.3% RTP</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/wallet" className="flex flex-col items-end hover:opacity-80 transition-opacity">
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase">{t.common.balance}</span>
              <span className="font-mono text-sm sm:text-base font-extrabold text-emerald-400">{balance.toLocaleString()} ETB</span>
            </Link>
            <Link
              to="/wallet?tab=deposit"
              className="w-7 h-7 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center font-black shadow-md active:scale-95 transition-all"
              title="Deposit funds"
            >
              <Plus className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Roulette Wheel Display */}
        <RouletteWheel
          isSpinning={isSpinning}
          resultNumber={lastResult ? lastResult.number : null}
          resultColor={lastResult ? lastResult.color : null}
        />

        {/* Result Notification */}
        {lastResult && (
          <Result
            won={lastResult.won}
            number={lastResult.number}
            color={lastResult.color}
            multiplier={lastResult.multiplier}
            payout={lastResult.payout}
            betAmount={betAmount}
          />
        )}

        {/* Bet Type & Grid Selector */}
        <BetTypeSelector
          selected={selection}
          onChange={setSelection}
          disabled={isSpinning}
        />

        {/* Bet Amount Controls */}
        <BetSelector
          amount={betAmount}
          onChange={setBetAmount}
          disabled={isSpinning}
          maxBalance={balance}
        />

        {/* Action Button: Spin Wheel */}
        <Button
          variant="accent"
          size="lg"
          disabled={isSpinning || betAmount > balance}
          onClick={play}
          className="w-full py-4 text-base sm:text-lg font-black tracking-wider uppercase shadow-xl shadow-emerald-500/20 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 rounded-2xl min-h-[48px] active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <CircleDot className="w-5 h-5 text-slate-950" />
          <span>{isSpinning ? t.games.roulette.spinning : `${t.games.roulette.spinRoulette} (${betAmount} ETB)`}</span>
        </Button>
      </Card>

      {/* Winning History Pockets */}
      {history.length > 0 && (
        <Card className="flex flex-col gap-3 p-4 border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-emerald-400" /> Recent Winning Pockets
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
                <span
                  className={`w-2.5 h-2.5 rounded-full inline-block ${
                    h.color === 'RED'
                      ? 'bg-rose-500'
                      : h.color === 'BLACK'
                      ? 'bg-slate-400 border border-slate-600'
                      : 'bg-emerald-500'
                  }`}
                />
                <span>{h.number}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
