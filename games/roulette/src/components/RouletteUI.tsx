import React, { useState } from 'react';
import { Button, Card, Badge } from '@nova/ui';
import { RouletteParams } from '@nova/types';

export interface RouletteUIProps {
  onPlay: (amount: number, params: RouletteParams) => Promise<any>;
  isLoading?: boolean;
}

export const RouletteUI: React.FC<RouletteUIProps> = ({ onPlay, isLoading = false }) => {
  const [selection, setSelection] = useState<'RED' | 'BLACK' | 'GREEN' | number>('RED');
  const [betAmount, setBetAmount] = useState<number>(10);
  const [lastResult, setLastResult] = useState<any>(null);

  const handlePlay = async () => {
    try {
      const res = await onPlay(betAmount, { selection });
      setLastResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card className="max-w-xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🎡 European Roulette
          </h2>
          <p className="text-xs text-slate-400">Bet on Red (2x), Black (2x), Green Zero (36x), or Exact Number!</p>
        </div>
        <Badge variant="info">Provably Fair</Badge>
      </div>

      <div className="flex flex-col items-center justify-center p-8 bg-slate-950/80 rounded-xl border border-slate-800">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl font-extrabold text-white border-4 shadow-2xl transition-all ${
          lastResult?.outcome.color === 'RED' ? 'bg-rose-600 border-rose-400 shadow-rose-600/40' :
          lastResult?.outcome.color === 'BLACK' ? 'bg-slate-900 border-slate-700 shadow-slate-900/60' :
          lastResult?.outcome.color === 'GREEN' ? 'bg-emerald-600 border-emerald-400 shadow-emerald-600/40' :
          'bg-slate-800 border-slate-700'
        }`}>
          {lastResult ? lastResult.outcome.number : '?'}
        </div>
        <span className="mt-3 text-sm font-bold text-slate-300">
          {lastResult ? `${lastResult.outcome.color} ${lastResult.outcome.number}` : 'SPIN WHEEL'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setSelection('RED')}
          className={`py-3 rounded-lg font-extrabold text-sm border transition-all ${
            selection === 'RED' ? 'bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-600/30' : 'bg-slate-900 border-slate-800 text-rose-400'
          }`}
        >
          🔴 RED (2x)
        </button>
        <button
          type="button"
          onClick={() => setSelection('GREEN')}
          className={`py-3 rounded-lg font-extrabold text-sm border transition-all ${
            selection === 'GREEN' ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-600/30' : 'bg-slate-900 border-slate-800 text-emerald-400'
          }`}
        >
          🟢 GREEN (36x)
        </button>
        <button
          type="button"
          onClick={() => setSelection('BLACK')}
          className={`py-3 rounded-lg font-extrabold text-sm border transition-all ${
            selection === 'BLACK' ? 'bg-slate-800 border-slate-600 text-white shadow-lg shadow-slate-800/30' : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}
        >
          ⚫ BLACK (2x)
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-400 uppercase">Bet Amount</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
          />
          <Button variant="secondary" size="sm" onClick={() => setBetAmount((prev) => Math.max(1, prev / 2))}>½</Button>
          <Button variant="secondary" size="sm" onClick={() => setBetAmount((prev) => prev * 2)}>2x</Button>
        </div>
      </div>

      {lastResult && (
        <div className={`p-4 rounded-lg border text-sm font-semibold flex items-center justify-between ${
          lastResult.won ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          <span>{lastResult.won ? '🎉 WIN!' : '💥 LOSS'}</span>
          <span>{lastResult.won ? `+$${lastResult.profit.toFixed(2)} (${lastResult.multiplier}x)` : `-$${betAmount.toFixed(2)}`}</span>
        </div>
      )}

      <Button variant="accent" size="lg" onClick={handlePlay} isLoading={isLoading}>
        SPIN ROULETTE WHEEL
      </Button>
    </Card>
  );
};
