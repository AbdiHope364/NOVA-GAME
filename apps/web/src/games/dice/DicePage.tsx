import React from 'react';
import { Card, Button, Badge } from '@nova/ui';
import { DiceBox } from './components/DiceBox';
import { NumberSelector } from './components/NumberSelector';
import { BetSelector } from './components/BetSelector';
import { Result } from './components/Result';
import { useDice } from './hooks/useDice';
import { useI18nStore } from '../../stores/i18nStore';
import { History } from 'lucide-react';

export const DicePage: React.FC = () => {
  const {
    targetNumber,
    setTargetNumber,
    betAmount,
    setBetAmount,
    isRolling,
    lastResult,
    history,
    error,
    balance,
    play,
  } = useDice();

  const t = useI18nStore((s) => s.t);

  const diceFaces: Record<number, string> = {
    1: '⚀',
    2: '⚁',
    3: '⚂',
    4: '⚃',
    5: '⚄',
    6: '⚅',
  };

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto py-2 px-2 sm:px-0">
      {/* Main Dice Card */}
      <Card className="flex flex-col gap-6 border-slate-800 bg-slate-900/90 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2 tracking-tight">
              🎲 {t.games.dice.title}
            </h1>
            <p className="text-xs text-slate-400">{t.games.dice.subtitle}</p>
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

        {/* 3D Dice Box Display */}
        <DiceBox isRolling={isRolling} result={lastResult ? lastResult.roll : null} targetNumber={targetNumber} />

        {/* Number Selector (1 - 6 Grid) */}
        <NumberSelector selectedNumber={targetNumber} onChange={setTargetNumber} disabled={isRolling} />

        {/* Bet Selector */}
        <BetSelector
          amount={betAmount}
          onChange={setBetAmount}
          maxBalance={balance}
          disabled={isRolling}
        />

        {/* Result Display */}
        {lastResult && (
          <Result
            won={lastResult.won}
            rolledNumber={lastResult.roll}
            targetNumber={lastResult.targetNumber}
            payout={lastResult.payout}
            betAmount={lastResult.betAmount}
          />
        )}

        {/* ROLL Action Button */}
        <Button
          variant="accent"
          size="lg"
          disabled={isRolling || betAmount > balance}
          onClick={play}
          className="w-full py-4 text-lg font-black tracking-wider uppercase shadow-xl shadow-cyan-500/20 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950"
        >
          {isRolling ? t.games.dice.rolling : `${t.games.dice.rollDice} (${(betAmount * 5.88).toFixed(0)} ETB ${t.games.dice.winAmount})`}
        </Button>
      </Card>

      {/* Recent Results Bar */}
      {history.length > 0 && (
        <Card className="flex flex-col gap-3 p-4 border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-cyan-400" /> {t.common.recentGames}
            </span>
            <Badge variant="info">{t.common.liveFeed}</Badge>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {history.map((h, i) => (
              <div
                key={i}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-xs font-bold shrink-0 ${
                  h.won ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}
              >
                <span>{diceFaces[h.roll]}</span>
                <span>{h.roll}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
