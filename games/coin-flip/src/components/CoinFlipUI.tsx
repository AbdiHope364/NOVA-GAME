import React, { useState } from 'react';
import { Button, Card, Badge } from '@nova/ui';
import { CoinFlipParams } from '@nova/types';

export interface CoinFlipUIProps {
  onPlay: (amount: number, params: CoinFlipParams) => Promise<any>;
  isLoading?: boolean;
}

export const CoinFlipUI: React.FC<CoinFlipUIProps> = ({ onPlay, isLoading = false }) => {
  const [choice, setChoice] = useState<'HEADS' | 'TAILS'>('HEADS');
  const [betAmount, setBetAmount] = useState<number>(10);
  const [lastResult, setLastResult] = useState<any>(null);

  const handlePlay = async () => {
    try {
      const res = await onPlay(betAmount, { choice });
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
            🪙 Coin Flip
          </h2>
          <p className="text-xs text-slate-400">Pick Heads or Tails. 1.98x payout ratio.</p>
        </div>
        <Badge variant="info">Provably Fair</Badge>
      </div>

      <div className="flex flex-col items-center justify-center py-8 bg-slate-950/60 rounded-xl border border-slate-850">
        <div className={`w-28 h-28 rounded-full border-4 flex items-center justify-center text-4xl shadow-2xl transition-all transform duration-300 ${
          lastResult?.won ? 'border-emerald-500 bg-emerald-500/20 shadow-emerald-500/30 scale-105' : 
          lastResult?.won === false ? 'border-rose-500 bg-rose-500/20 shadow-rose-500/30' : 
          'border-amber-500 bg-amber-500/10 shadow-amber-500/20'
        }`}>
          {lastResult ? (lastResult.outcome.result === 'HEADS' ? '👑' : '🦅') : (choice === 'HEADS' ? '👑' : '🦅')}
        </div>
        <span className="mt-3 text-sm font-semibold text-slate-300">
          {lastResult ? `Flipped: ${lastResult.outcome.result}` : `Selected: ${choice}`}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setChoice('HEADS')}
          className={`py-3 rounded-lg font-bold border flex items-center justify-center gap-2 transition-all ${
            choice === 'HEADS' 
              ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/10' 
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          👑 HEADS
        </button>
        <button
          type="button"
          onClick={() => setChoice('TAILS')}
          className={`py-3 rounded-lg font-bold border flex items-center justify-center gap-2 transition-all ${
            choice === 'TAILS' 
              ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/10' 
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          🦅 TAILS
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
          <span>{lastResult.won ? '🎉 YOU WON!' : '💥 YOU LOST'}</span>
          <span>{lastResult.won ? `+$${lastResult.profit.toFixed(2)} (${lastResult.multiplier}x)` : `-$${betAmount.toFixed(2)}`}</span>
        </div>
      )}

      <Button variant="accent" size="lg" onClick={handlePlay} isLoading={isLoading}>
        FLIP COIN (1.98x)
      </Button>
    </Card>
  );
};
