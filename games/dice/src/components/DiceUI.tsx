import React, { useState } from 'react';
import { Button, Card, Badge } from '@nova/ui';
import { DiceParams } from '@nova/types';

export interface DiceUIProps {
  onPlay: (amount: number, params: DiceParams) => Promise<any>;
  isLoading?: boolean;
}

export const DiceUI: React.FC<DiceUIProps> = ({ onPlay, isLoading = false }) => {
  const [target, setTarget] = useState<number>(50);
  const [condition, setCondition] = useState<'UNDER' | 'OVER'>('UNDER');
  const [betAmount, setBetAmount] = useState<number>(10);
  const [lastResult, setLastResult] = useState<any>(null);

  const winChance = condition === 'UNDER' ? target : 100 - target;
  const multiplier = (99 / winChance).toFixed(4);

  const handlePlay = async () => {
    try {
      const res = await onPlay(betAmount, { target, condition });
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
            🎲 Provably Fair Dice
          </h2>
          <p className="text-xs text-slate-400">Roll under or over your target number.</p>
        </div>
        <Badge variant="info">Provably Fair</Badge>
      </div>

      <div className="flex flex-col items-center justify-center p-6 bg-slate-950/60 rounded-xl border border-slate-850 gap-2">
        <div className="text-5xl font-extrabold font-mono text-cyan-400 tracking-wider">
          {lastResult ? lastResult.outcome.roll.toFixed(2) : '50.00'}
        </div>
        <span className="text-xs font-semibold text-slate-500 uppercase">
          {lastResult ? `Rolled Number (Target: ${condition} ${target})` : 'Roll Number'}
        </span>
      </div>

      {/* Target slider */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between text-xs font-semibold text-slate-400">
          <span>0</span>
          <span>Target: {target}</span>
          <span>100</span>
        </div>
        <input
          type="range"
          min="1"
          max="98"
          value={target}
          onChange={(e) => setTarget(Number(e.target.value))}
          className="w-full h-3 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500 border border-slate-800"
        />
        <div className="grid grid-cols-3 gap-2 text-center text-xs mt-2">
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
            <span className="text-slate-500 block">Multiplier</span>
            <span className="font-mono text-cyan-400 font-bold">{multiplier}x</span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
            <span className="text-slate-500 block">Roll Condition</span>
            <button
              onClick={() => setCondition(condition === 'UNDER' ? 'OVER' : 'UNDER')}
              className="font-bold text-amber-400 underline hover:text-amber-300"
            >
              {condition}
            </button>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
            <span className="text-slate-500 block">Win Chance</span>
            <span className="font-mono text-emerald-400 font-bold">{winChance.toFixed(2)}%</span>
          </div>
        </div>
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
        ROLL DICE ({multiplier}x)
      </Button>
    </Card>
  );
};
