import React from 'react';
import { Card, Button, Badge } from '@nova/ui';
import { Coin } from './components/Coin';
import { SideSelector } from './components/SideSelector';
import { BetSelector } from './components/BetSelector';
import { Result } from './components/Result';
import { useCoinFlip } from './hooks/useCoinFlip';
import { ShieldCheck, History } from 'lucide-react';

export const CoinFlipPage: React.FC = () => {
  const {
    choice,
    setChoice,
    betAmount,
    setBetAmount,
    isFlipping,
    lastResult,
    history,
    error,
    balance,
    play,
  } = useCoinFlip();

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto py-2">
      {/* Game Card */}
      <Card className="flex flex-col gap-6 border-slate-800 bg-slate-900/90 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2 tracking-tight">
              🪙 COIN FLIP
            </h1>
            <p className="text-xs text-slate-400">Choose side → Enter bet → Flip → Win 1.96x</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Balance</span>
            <span className="font-mono text-base font-extrabold text-emerald-400">{balance.toFixed(0)} ETB</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* 3D Coin Animation Display */}
        <Coin isFlipping={isFlipping} result={lastResult ? lastResult.result : null} choice={choice} />

        {/* Side Selector (HEADS / TAILS) */}
        <SideSelector selected={choice} onChange={setChoice} disabled={isFlipping} />

        {/* Bet Selector */}
        <BetSelector
          amount={betAmount}
          onChange={setBetAmount}
          maxBalance={balance}
          disabled={isFlipping}
        />

        {/* Result Display */}
        {lastResult && (
          <Result
            won={lastResult.won}
            resultSide={lastResult.result}
            payout={lastResult.payout}
            betAmount={lastResult.betAmount}
          />
        )}

        {/* FLIP Action Button */}
        <Button
          variant="accent"
          size="lg"
          disabled={isFlipping || betAmount > balance}
          onClick={play}
          className="w-full py-4 text-lg font-black tracking-wider uppercase shadow-xl shadow-amber-500/20"
        >
          {isFlipping ? 'FLIPPING COIN...' : `FLIP 🪙 (${(betAmount * 1.96).toFixed(0)} ETB Win)`}
        </Button>
      </Card>

      {/* Recent History Table */}
      {history.length > 0 && (
        <Card className="flex flex-col gap-3 p-4 border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-cyan-400" /> Recent Games
            </span>
            <Badge variant="info">Live Feed</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-850 text-slate-500 uppercase font-bold">
                  <th className="py-2">Side</th>
                  <th className="py-2">Bet</th>
                  <th className="py-2">Result</th>
                  <th className="py-2 text-right">Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 font-mono">
                {history.map((h, i) => (
                  <tr key={i} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-2.5 font-sans font-bold text-white">{h.choice}</td>
                    <td className="py-2.5">{h.betAmount} ETB</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded font-bold ${h.won ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {h.result}
                      </span>
                    </td>
                    <td className={`py-2.5 text-right font-bold ${h.won ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {h.won ? `+${h.payout} ETB` : '+0 ETB'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
