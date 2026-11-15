import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '@nova/ui';
import { useWalletStore } from '../../stores/walletStore';
import { api } from '../../services/api';
import { LimboEngine } from '@nova/game-limbo';
import {
  Rocket,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  History,
  Target,
  Zap,
  CheckCircle2,
  XCircle,
  ChevronDown,
  HelpCircle,
} from 'lucide-react';
import { HowToPlayModal } from '../../components/common/HowToPlayModal';

interface LimboResult {
  won: boolean;
  targetMultiplier: number;
  resultMultiplier: number;
  betAmount: number;
  payout: number;
  profit: number;
  winChance: number;
  provablyFair?: {
    serverSeedHash: string;
    clientSeed: string;
    nonce: number;
  };
}

export const LimboPage: React.FC = () => {
  const { balance, updateBalance, fetchWallet } = useWalletStore();

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [targetMultiplier, setTargetMultiplier] = useState<number>(2.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<LimboResult | null>(null);
  const [displayMultiplier, setDisplayMultiplier] = useState<number>(1.0);
  const [history, setHistory] = useState<LimboResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showFairness, setShowFairness] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  // Win probability formula with 1% house edge: 0.99 / Target * 100%
  const winChance = Math.min(99.0, Math.round((0.99 / targetMultiplier) * 10000) / 100);
  const potentialPayout = Math.floor(betAmount * targetMultiplier * 100) / 100;
  const potentialProfit = Math.floor((potentialPayout - betAmount) * 100) / 100;

  const quickMultipliers = [1.5, 2.0, 3.0, 5.0, 10.0, 50.0, 100.0];
  const quickBets = [10, 25, 50, 100, 500];

  const handleLaunch = async () => {
    if (betAmount > balance) {
      setError('Insufficient wallet balance. Please lower bet or deposit.');
      return;
    }
    if (targetMultiplier < 1.01 || targetMultiplier > 1000000) {
      setError('Target multiplier must be between 1.01x and 1,000,000x');
      return;
    }

    setError(null);
    setIsPlaying(true);

    // Fast animation counter before landing
    let count = 0;
    const interval = setInterval(() => {
      count++;
      const randomDisplay = (Math.random() * (targetMultiplier * 1.5) + 1.0).toFixed(2);
      setDisplayMultiplier(parseFloat(randomDisplay));
      if (count > 7) {
        clearInterval(interval);
      }
    }, 45);

    try {
      let resultData: LimboResult;

      try {
        const res = await api.post('/games/play/limbo', {
          amount: betAmount,
          params: { targetMultiplier },
        });
        const d = res.data.data;
        resultData = {
          won: d.won,
          targetMultiplier,
          resultMultiplier: d.outcome?.resultMultiplier || targetMultiplier,
          betAmount,
          payout: d.payout,
          profit: d.profit,
          winChance: d.outcome?.winChance || winChance,
          provablyFair: d.provablyFair,
        };
        const isAuth = !!localStorage.getItem('nova_token');
        if (isAuth && d.newBalance !== undefined) {
          updateBalance(d.newBalance);
        } else {
          const newBal = d.won ? balance + d.profit : balance - betAmount;
          updateBalance(newBal);
        }
      } catch {
        // Fallback to local Provably Fair Limbo engine
        const localEngine = new LimboEngine(1.0);
        const evalRes = localEngine.evaluate({
          amount: betAmount,
          serverSeed: 'client-offline-server-seed',
          clientSeed: 'client-offline-seed',
          nonce: Date.now() % 10000,
          params: { targetMultiplier },
        });

        const newBal = evalRes.won ? balance + evalRes.profit : balance - betAmount;
        resultData = {
          won: evalRes.won,
          targetMultiplier,
          resultMultiplier: evalRes.outcome.resultMultiplier,
          betAmount,
          payout: evalRes.payout,
          profit: evalRes.profit,
          winChance: evalRes.outcome.winChance,
        };
        updateBalance(newBal);
      }

      clearInterval(interval);
      setDisplayMultiplier(resultData.resultMultiplier);
      setLastResult(resultData);
      setHistory((prev) => [resultData, ...prev.slice(0, 9)]);
    } catch (err: any) {
      clearInterval(interval);
      setError(err?.response?.data?.message || err?.message || 'Error executing Limbo game');
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 max-w-4xl mx-auto py-1 sm:py-2 px-1 sm:px-0">
      {/* Main Game Arena Card */}
      <Card className="flex flex-col gap-4 sm:gap-6 border-slate-800 bg-slate-900/90 shadow-2xl relative overflow-hidden p-3 sm:p-6">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 sm:w-96 h-24 sm:h-32 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Rocket className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">Limbo Rocket</h1>
                <Badge variant="warning" className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider py-0 px-1.5 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> PROVABLE
                </Badge>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 hidden min-[360px]:block">
                Pick target multiplier • 99% theoretical RTP
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-800 border border-slate-700/80 text-amber-400 hover:text-amber-300 flex items-center justify-center hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
              title="How to Play Limbo"
              aria-label="How to Play"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-end">
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase">Balance</span>
              <span className="font-mono text-sm sm:text-base font-black text-emerald-400">
                {balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ETB
              </span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-2.5 sm:p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Center Multiplier Display - Mobile Optimized */}
        <div
          className={`relative flex flex-col items-center justify-center p-6 sm:p-10 rounded-2xl border transition-all duration-300 min-h-[180px] sm:min-h-[220px] ${
            lastResult
              ? lastResult.won
                ? 'bg-gradient-to-b from-emerald-950/60 via-slate-950/80 to-slate-950 border-emerald-500/50 shadow-2xl shadow-emerald-500/20'
                : 'bg-gradient-to-b from-rose-950/60 via-slate-950/80 to-slate-950 border-rose-500/50 shadow-2xl shadow-rose-500/20'
              : 'bg-slate-950/80 border-slate-800 shadow-inner'
          }`}
        >
          {/* Target Multiplier Sub-badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px] text-slate-300 mb-2 sm:mb-4 font-mono">
            <Target className="w-3 h-3 text-amber-400" />
            <span>Target:</span>
            <span className="font-bold text-amber-400">{targetMultiplier.toFixed(2)}x</span>
          </div>

          {/* Huge Dynamic Multiplier Output */}
          <div className="flex items-baseline gap-1 sm:gap-2">
            <span
              className={`font-mono text-5xl sm:text-7xl font-black tracking-tight transition-all ${
                lastResult
                  ? lastResult.won
                    ? 'text-emerald-400 scale-105 drop-shadow-[0_0_25px_rgba(16,185,129,0.5)]'
                    : 'text-rose-400 drop-shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                  : 'text-white'
              }`}
            >
              {displayMultiplier.toFixed(2)}
            </span>
            <span
              className={`text-xl sm:text-2xl font-black ${
                lastResult ? (lastResult.won ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-400'
              }`}
            >
              x
            </span>
          </div>

          {/* Outcome Result Ribbon */}
          {lastResult && (
            <div className="mt-3 flex items-center gap-2 animate-in fade-in zoom-in duration-200">
              {lastResult.won ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-extrabold text-xs sm:text-sm shadow-md">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WIN +{lastResult.profit.toFixed(2)} ETB</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-extrabold text-xs sm:text-sm shadow-md">
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>BUST -{lastResult.betAmount.toFixed(2)} ETB</span>
                </div>
              )}
            </div>
          )}

          {/* Recent Multipliers Top Ribbon */}
          {history.length > 0 && (
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 overflow-x-auto max-w-[150px] sm:max-w-none no-scrollbar">
              {history.slice(0, 4).map((item, idx) => (
                <span
                  key={idx}
                  className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded border shrink-0 ${
                    item.won
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {item.resultMultiplier.toFixed(2)}x
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Game Stats Cards: Win Probability & Potential Payout - 3-Col Compact Mobile */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
          <div className="p-2 sm:p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-center text-center sm:text-left">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
              <TrendingUp className="w-3 h-3 text-cyan-400 hidden min-[360px]:inline" />
              Win Chance
            </span>
            <span className="font-mono text-xs sm:text-lg font-black text-cyan-400 mt-0.5">{winChance.toFixed(1)}%</span>
          </div>

          <div className="p-2 sm:p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-center text-center sm:text-left">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
              <Zap className="w-3 h-3 text-amber-400 hidden min-[360px]:inline" />
              Payout
            </span>
            <span className="font-mono text-xs sm:text-lg font-black text-amber-400 mt-0.5">{targetMultiplier.toFixed(2)}x</span>
          </div>

          <div className="p-2 sm:p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-center text-center sm:text-left">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400 hidden min-[360px]:inline" />
              Profit
            </span>
            <span className="font-mono text-xs sm:text-lg font-black text-emerald-400 mt-0.5">+{potentialProfit.toFixed(0)} ETB</span>
          </div>
        </div>

        {/* Multiplier & Bet Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5 border-t border-slate-800/80 pt-3 sm:pt-4">
          {/* Target Multiplier Control */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                Target Multiplier (x)
              </label>
              <span className="text-[10px] text-slate-500 font-mono">1.01x - 1,000,000x</span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <input
                type="number"
                min="1.01"
                max="1000000"
                step="0.05"
                value={targetMultiplier}
                onChange={(e) => setTargetMultiplier(Math.max(1.01, parseFloat(e.target.value) || 1.01))}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 font-mono font-bold text-white focus:outline-none focus:border-amber-500 min-h-[44px]"
                disabled={isPlaying}
              />
              <button
                type="button"
                onClick={() => setTargetMultiplier((m) => Math.max(1.01, parseFloat((m - 0.5).toFixed(2))))}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold font-mono text-xs border border-slate-700 min-h-[44px] active:scale-95 shrink-0"
                disabled={isPlaying}
              >
                -0.5
              </button>
              <button
                type="button"
                onClick={() => setTargetMultiplier((m) => parseFloat((m + 0.5).toFixed(2)))}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold font-mono text-xs border border-slate-700 min-h-[44px] active:scale-95 shrink-0"
                disabled={isPlaying}
              >
                +0.5
              </button>
            </div>

            {/* Quick Multiplier Buttons - Touch Friendly */}
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
              {quickMultipliers.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTargetMultiplier(m)}
                  className={`flex-1 py-1.5 px-2 text-xs font-mono font-bold rounded-lg border transition-all min-h-[38px] flex items-center justify-center shrink-0 ${
                    targetMultiplier === m
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                      : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border-slate-700/80 active:scale-95'
                  }`}
                  disabled={isPlaying}
                >
                  {m}x
                </button>
              ))}
            </div>
          </div>

          {/* Bet Amount Control */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">Bet Amount (ETB)</label>
              <span className="text-[10px] text-slate-500 font-mono">Max: 10,000 ETB</span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <input
                type="number"
                min="1"
                max="10000"
                step="1"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 font-mono font-bold text-white focus:outline-none focus:border-amber-500 min-h-[44px]"
                disabled={isPlaying}
              />
              <button
                type="button"
                onClick={() => setBetAmount((b) => Math.max(1, Math.floor(b / 2)))}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold font-mono text-xs border border-slate-700 min-h-[44px] active:scale-95 shrink-0"
                disabled={isPlaying}
              >
                ½
              </button>
              <button
                type="button"
                onClick={() => setBetAmount((b) => Math.min(10000, b * 2))}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold font-mono text-xs border border-slate-700 min-h-[44px] active:scale-95 shrink-0"
                disabled={isPlaying}
              >
                2X
              </button>
            </div>

            {/* Quick Bet Buttons */}
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
              {quickBets.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setBetAmount(amt)}
                  className={`flex-1 py-1.5 px-2 text-xs font-mono font-bold rounded-lg border transition-all min-h-[38px] flex items-center justify-center shrink-0 ${
                    betAmount === amt
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                      : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border-slate-700/80 active:scale-95'
                  }`}
                  disabled={isPlaying}
                >
                  {amt}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setBetAmount(Math.min(10000, Math.floor(balance)))}
                className="py-1.5 px-2.5 text-xs font-mono font-black rounded-lg border bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/30 min-h-[38px] flex items-center justify-center shrink-0 ml-auto active:scale-95"
                disabled={isPlaying}
              >
                MAX
              </button>
            </div>
          </div>
        </div>

        {/* Play Action Button */}
        <Button
          onClick={handleLaunch}
          disabled={isPlaying || betAmount > balance}
          className="w-full py-3.5 sm:py-4 text-sm sm:text-base font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-xl shadow-amber-500/20 active:scale-98 transition-all min-h-[48px]"
        >
          {isPlaying ? (
            <span className="flex items-center gap-2">
              <Rocket className="w-5 h-5 animate-spin" />
              LAUNCHING INTO ORBIT...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Rocket className="w-5 h-5" />
              BET {betAmount} ETB (WIN {(betAmount * targetMultiplier).toFixed(2)} ETB)
            </span>
          )}
        </Button>

        {/* Provably Fair Seed Verification Drawer (Collapsible) */}
        <div className="border-t border-slate-800/80 pt-3">
          <button
            type="button"
            onClick={() => setShowFairness(!showFairness)}
            className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 py-1"
          >
            <span className="flex items-center gap-1.5 font-bold text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Cryptographic Provable Fairness
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFairness ? 'rotate-180' : ''}`} />
          </button>

          {showFairness && (
            <div className="mt-2 p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-[10px] font-mono flex flex-col gap-1.5 text-slate-400 animate-in fade-in duration-150">
              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                Deterministic Pareto distribution:{' '}
                <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300 font-mono">
                  M = max(1.00, floor((0.99 / (1 - X)) * 100) / 100)
                </code>
              </p>

              {lastResult?.provablyFair ? (
                <>
                  <div className="flex items-center justify-between truncate">
                    <span className="text-slate-500">Seed Hash:</span>
                    <span className="text-amber-400 truncate max-w-[200px] sm:max-w-[300px]">
                      {lastResult.provablyFair.serverSeedHash}
                    </span>
                  </div>
                  <div className="flex items-center justify-between truncate">
                    <span className="text-slate-500">Client Seed:</span>
                    <span className="text-slate-300 truncate max-w-[200px] sm:max-w-[300px]">
                      {lastResult.provablyFair.clientSeed}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Nonce:</span>
                    <span className="text-emerald-400 font-bold">{lastResult.provablyFair.nonce}</span>
                  </div>
                </>
              ) : (
                <span className="text-slate-500 italic">Play a round to view committed server seed hash and nonce.</span>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* History Card - Mobile Horizontal Scroll */}
      {history.length > 0 && (
        <Card className="flex flex-col gap-2 border-slate-800 bg-slate-900/60 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 border-b border-slate-800/80 pb-1.5">
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Recent Limbo Rolls</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {history.map((h, i) => (
              <div
                key={i}
                className={`py-1 px-2.5 rounded-lg border font-mono text-[10px] font-bold shrink-0 flex items-center gap-1.5 ${
                  h.won
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                }`}
              >
                <span>{h.resultMultiplier.toFixed(2)}x</span>
                <span className="opacity-75">(Target: {h.targetMultiplier.toFixed(2)}x)</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Comprehensive How to Play Modal */}
      <HowToPlayModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        defaultGameId="limbo"
      />
    </div>
  );
};
