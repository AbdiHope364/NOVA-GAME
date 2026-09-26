import React, { useState, useEffect } from 'react';
import { Button, Card, Badge } from '@nova/ui';
import { CrashParams } from '@nova/types';

export interface CrashUIProps {
  onPlay: (amount: number, params: CrashParams) => Promise<any>;
  isLoading?: boolean;
}

export const CrashUI: React.FC<CrashUIProps> = ({ onPlay, isLoading = false }) => {
  const [betAmount, setBetAmount] = useState<number>(10);
  const [autoCashout, setAutoCashout] = useState<number>(2.0);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [isFlying, setIsFlying] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const handlePlay = async () => {
    try {
      setIsFlying(true);
      setCurrentMultiplier(1.0);
      setLastResult(null);

      // Simulate real-time multiplier curve up to outcome
      const res = await onPlay(betAmount, { autoCashoutMultiplier: autoCashout });

      const crashTarget = res.outcome.crashPoint;
      let val = 1.0;
      const interval = setInterval(() => {
        val += 0.05 + val * 0.02;
        if (val >= crashTarget) {
          clearInterval(interval);
          setCurrentMultiplier(crashTarget);
          setIsFlying(false);
          setLastResult(res);
        } else {
          setCurrentMultiplier(Math.floor(val * 100) / 100);
        }
      }, 100);
    } catch (err) {
      setIsFlying(false);
      console.error(err);
    }
  };

  return (
    <Card className="max-w-xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🚀 Crash Multiplier
          </h2>
          <p className="text-xs text-slate-400">Cash out before the rocket crashes!</p>
        </div>
        <Badge variant="info">Provably Fair</Badge>
      </div>

      <div className="relative h-64 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col items-center justify-center overflow-hidden">
        <div className={`text-6xl font-black font-mono tracking-tight ${
          isFlying ? 'text-cyan-400 animate-pulse' : 
          lastResult?.won ? 'text-emerald-400' : 
          lastResult ? 'text-rose-500' : 'text-slate-400'
        }`}>
          {currentMultiplier.toFixed(2)}x
        </div>
        <div className="mt-2 text-sm font-bold tracking-widest text-slate-400 uppercase">
          {isFlying ? '🚀 ROCKET IN FLIGHT...' : lastResult ? (lastResult.won ? `CASHED OUT AT ${lastResult.multiplier}x` : `CRASHED AT ${lastResult.outcome.crashPoint}x`) : 'READY FOR TAKEOFF'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-400 uppercase">Bet Amount</label>
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-400 uppercase">Auto Cashout (x)</label>
          <input
            type="number"
            step="0.1"
            value={autoCashout}
            onChange={(e) => setAutoCashout(Math.max(1.01, Number(e.target.value)))}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {lastResult && (
        <div className={`p-4 rounded-lg border text-sm font-semibold flex items-center justify-between ${
          lastResult.won ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          <span>{lastResult.won ? '🎉 CASHED OUT!' : '💥 CRASHED!'}</span>
          <span>{lastResult.won ? `+$${lastResult.profit.toFixed(2)}` : `-$${betAmount.toFixed(2)}`}</span>
        </div>
      )}

      <Button variant="accent" size="lg" onClick={handlePlay} isLoading={isLoading || isFlying}>
        {isFlying ? 'FLYING...' : `LAUNCH ROCKET (${autoCashout}x)`}
      </Button>
    </Card>
  );
};
