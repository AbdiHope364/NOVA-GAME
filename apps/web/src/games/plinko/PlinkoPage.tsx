import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Badge } from '@nova/ui';
import { useWalletStore } from '../../stores/walletStore';
import { api } from '../../services/api';
import { PlinkoEngine, PlinkoRisk } from '@nova/game-plinko';
import {
  Layers,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  History,
  Zap,
  CheckCircle2,
  XCircle,
  Play,
  Flame,
  ChevronDown,
} from 'lucide-react';

interface PlinkoResult {
  won: boolean;
  multiplier: number;
  payout: number;
  profit: number;
  betAmount: number;
  outcome: {
    path: ('L' | 'R')[];
    slot: number;
    rows: number;
    risk: PlinkoRisk;
    slotMultiplier: number;
  };
  provablyFair?: {
    serverSeedHash: string;
    clientSeed: string;
    nonce: number;
  };
}

export const PlinkoPage: React.FC = () => {
  const { balance, updateBalance, fetchWallet } = useWalletStore();

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);
  const [rows, setRows] = useState<number>(10);
  const [risk, setRisk] = useState<PlinkoRisk>('medium');
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isDropping, setIsDropping] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<PlinkoResult | null>(null);
  const [history, setHistory] = useState<PlinkoResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showFairness, setShowFairness] = useState<boolean>(false);

  // Ball animation state
  const [activeBallPos, setActiveBallPos] = useState<{ row: number; col: number } | null>(null);
  const [highlightedSlot, setHighlightedSlot] = useState<number | null>(null);
  const [hitPegs, setHitPegs] = useState<Set<string>>(new Set());

  const engine = useRef(new PlinkoEngine()).current;
  const multipliers = engine.getMultipliers(rows, risk);

  const quickBets = [10, 25, 50, 100, 500];
  const rowOptions = [8, 10, 12, 14, 16];

  // Helper color gradient for slot buckets based on multiplier value
  const getSlotColor = (mult: number, idx: number, total: number) => {
    const distFromCenter = Math.abs(idx - (total - 1) / 2) / ((total - 1) / 2);
    if (distFromCenter > 0.8) {
      return 'bg-gradient-to-t from-rose-600 via-rose-500 to-rose-400 text-white shadow-rose-500/30';
    } else if (distFromCenter > 0.5) {
      return 'bg-gradient-to-t from-amber-600 via-amber-500 to-amber-400 text-slate-950 shadow-amber-500/20';
    } else if (distFromCenter > 0.25) {
      return 'bg-gradient-to-t from-yellow-600 via-yellow-500 to-yellow-400 text-slate-950 shadow-yellow-500/20';
    } else {
      return 'bg-gradient-to-t from-slate-700 via-slate-600 to-slate-500 text-slate-200';
    }
  };

  const handleDrop = async () => {
    if (betAmount > balance) {
      setError('Insufficient wallet balance. Please lower bet or deposit.');
      return;
    }

    setError(null);
    setIsDropping(true);
    setHighlightedSlot(null);
    setHitPegs(new Set());

    try {
      let resultData: PlinkoResult;

      try {
        const res = await api.post('/games/play/plinko', {
          amount: betAmount,
          params: { rows, risk },
        });
        const d = res.data.data;
        resultData = {
          won: d.won,
          multiplier: d.multiplier,
          payout: d.payout,
          profit: d.profit,
          betAmount,
          outcome: d.outcome,
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
        // Fallback local engine evaluation
        const evalRes = engine.evaluate({
          amount: betAmount,
          serverSeed: 'offline-server-seed',
          clientSeed: 'offline-client-seed',
          nonce: Date.now() % 100000,
          params: { rows, risk },
        });

        const newBal = evalRes.won ? balance + evalRes.profit : balance - betAmount;
        resultData = {
          won: evalRes.won,
          multiplier: evalRes.multiplier,
          payout: evalRes.payout,
          profit: evalRes.profit,
          betAmount,
          outcome: evalRes.outcome,
        };
        updateBalance(newBal);
      }

      // Animate ball drop along outcome.path
      const path = resultData.outcome.path;
      let currentCol = 0; // starts at top (index 0)
      const newHitPegs = new Set<string>();

      for (let r = 0; r < path.length; r++) {
        const dir = path[r];
        if (dir === 'R') currentCol += 1;
        const pegKey = `${r}-${currentCol}`;
        newHitPegs.add(pegKey);
        setHitPegs(new Set(newHitPegs));
        setActiveBallPos({ row: r, col: currentCol });
        await new Promise((resolve) => setTimeout(resolve, 75));
      }

      // Land in bottom slot
      const finalSlot = resultData.outcome.slot;
      setHighlightedSlot(finalSlot);
      setActiveBallPos(null);
      setLastResult(resultData);
      setHistory((prev) => [resultData, ...prev.slice(0, 9)]);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Error executing Plinko game');
    } finally {
      setIsDropping(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:gap-5 max-w-4xl mx-auto py-1 sm:py-2 px-1 sm:px-0 pb-10 sm:pb-12">
      {/* Main Board Card */}
      <Card className="flex flex-col gap-3 sm:gap-5 border-slate-800 bg-slate-900/90 shadow-2xl relative overflow-hidden p-2.5 sm:p-6">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 sm:w-[500px] h-24 sm:h-32 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />

        {/* Header - Mobile Compact */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 sm:pb-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-2xl font-black text-white tracking-tight">Plinko Pyramid</h1>
                <Badge variant="warning" className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider py-0 px-1.5 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> PROVABLE
                </Badge>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 hidden min-[360px]:block">
                50/50 binomial pegboard path • 99% RTP
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase">Balance</span>
            <span className="font-mono text-xs sm:text-base font-black text-emerald-400">
              {balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ETB
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-2.5 sm:p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Center Plinko Pegboard Canvas / Grid - Mobile Scaled */}
        <div className="relative flex flex-col items-center justify-center p-2 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800/80 shadow-inner min-h-[250px] sm:min-h-[360px] overflow-hidden">
          {/* Top Drop Spout */}
          <div className="w-8 sm:w-12 h-3 sm:h-4 rounded-b-xl bg-amber-500/30 border border-amber-500/50 mb-1.5 sm:mb-3 shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <div className="w-2 sm:w-3 h-2 sm:h-3 rounded-full bg-amber-400 animate-ping opacity-75" />
          </div>

          {/* Pegs Grid with Mobile-Responsive Spacing */}
          <div className="flex flex-col items-center gap-1.5 sm:gap-3.5 my-auto select-none w-full max-w-full">
            {Array.from({ length: rows }).map((_, r) => {
              const pegCount = r + 3;
              return (
                <div
                  key={r}
                  className={`flex items-center justify-center relative ${
                    rows > 12 ? 'gap-1.5 sm:gap-3.5 md:gap-5' : 'gap-2 sm:gap-4 md:gap-6'
                  }`}
                >
                  {Array.from({ length: pegCount }).map((_, c) => {
                    const pegKey = `${r}-${c}`;
                    const wasHit = hitPegs.has(pegKey);
                    const isCurrentBall = activeBallPos && activeBallPos.row === r && activeBallPos.col === c;

                    return (
                      <div key={c} className="relative flex items-center justify-center">
                        {/* Animated Dropping Ball */}
                        {isCurrentBall && (
                          <div
                            className={`absolute -top-1 rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 border-2 border-white shadow-xl shadow-amber-400/80 z-20 animate-bounce scale-110 ${
                              rows > 12 ? 'w-3 h-3 sm:w-5 sm:h-5' : 'w-3.5 h-3.5 sm:w-5 sm:h-5'
                            }`}
                          />
                        )}

                        {/* Peg Dot */}
                        <div
                          className={`rounded-full transition-all duration-150 ${
                            rows > 12
                              ? 'w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5'
                              : 'w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3'
                          } ${
                            wasHit
                              ? 'bg-amber-300 shadow-lg shadow-amber-400 scale-125'
                              : 'bg-slate-600/90 hover:bg-slate-500'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Bottom Multiplier Buckets - Scaled to Card Width without horizontal overflow */}
          <div className="w-full flex items-center justify-between gap-0.5 sm:gap-1 mt-3 sm:mt-5 pt-2 sm:pt-3 border-t border-slate-850 px-0.5">
            {multipliers.map((mult, idx) => {
              const isLandingSlot = highlightedSlot === idx;
              const colorClass = getSlotColor(mult, idx, multipliers.length);

              return (
                <div
                  key={idx}
                  className={`flex-1 min-w-0 max-w-[48px] py-1 sm:py-2 px-0 rounded sm:rounded-lg text-center font-mono font-black transition-all duration-200 border ${colorClass} ${
                    rows >= 14
                      ? 'text-[7px] min-[380px]:text-[8px] sm:text-xs'
                      : rows >= 12
                      ? 'text-[8px] min-[380px]:text-[9px] sm:text-xs'
                      : 'text-[9px] sm:text-xs'
                  } ${
                    isLandingSlot
                      ? 'scale-110 -translate-y-1 sm:-translate-y-2 ring-2 ring-white shadow-2xl brightness-125 z-10'
                      : 'border-slate-800 opacity-90'
                  }`}
                >
                  <span className="block truncate">{mult >= 1000 ? '1kx' : `${mult}x`}</span>
                </div>
              );
            })}
          </div>

          {/* Outcome Result Banner */}
          {lastResult && (
            <div className="mt-2.5 flex items-center gap-1.5 animate-in fade-in zoom-in duration-200">
              {lastResult.won ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-extrabold text-xs sm:text-sm shadow-md">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WIN ({lastResult.multiplier}x): +{lastResult.profit.toFixed(2)} ETB</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-extrabold text-xs sm:text-sm shadow-md">
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>RETURN ({lastResult.multiplier}x): {lastResult.payout.toFixed(2)} ETB</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Configuration Controls (Risk & Rows) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 border-t border-slate-800/80 pt-2.5 sm:pt-4">
          {/* Risk Level Selector */}
          <div className="flex flex-col gap-1.5 sm:gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Risk Volatility
              </label>
              <span className="text-[10px] text-slate-500 uppercase font-mono">{risk} volatility</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {(['low', 'medium', 'high'] as PlinkoRisk[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRisk(r)}
                  disabled={isDropping}
                  className={`py-1.5 sm:py-2.5 px-2 rounded-xl font-black text-xs uppercase tracking-wider border transition-all min-h-[38px] sm:min-h-[40px] flex items-center justify-center ${
                    risk === r
                      ? r === 'low'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                        : r === 'medium'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/80 active:scale-95'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Rows Count Selector */}
          <div className="flex flex-col gap-1.5 sm:gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Pyramid Rows ({rows})
              </label>
              <span className="text-[10px] text-slate-500 font-mono">8 to 16 Rows</span>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {rowOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setRows(opt)}
                  disabled={isDropping}
                  className={`flex-1 py-1.5 sm:py-2.5 rounded-xl font-bold font-mono text-xs border transition-all min-h-[38px] sm:min-h-[40px] flex items-center justify-center ${
                    rows === opt
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-md shadow-cyan-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/80 active:scale-95'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bet Amount Controls - Touch-Friendly */}
        <div className="flex flex-col gap-1.5 sm:gap-2 border-t border-slate-800/80 pt-2.5 sm:pt-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300">Bet Amount (ETB)</label>
            <span className="text-[10px] text-slate-500 font-mono">Max: 5,000 ETB</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <input
                type="number"
                min="1"
                max="5000"
                step="1"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 sm:py-2.5 font-mono font-bold text-white focus:outline-none focus:border-amber-500 min-h-[42px] sm:min-h-[44px]"
                disabled={isDropping}
              />
              <button
                type="button"
                onClick={() => setBetAmount((b) => Math.max(1, Math.floor(b / 2)))}
                className="px-3 sm:px-3.5 py-2 sm:py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold font-mono text-xs border border-slate-700 min-h-[42px] sm:min-h-[44px] active:scale-95 shrink-0"
                disabled={isDropping}
              >
                ½
              </button>
              <button
                type="button"
                onClick={() => setBetAmount((b) => Math.min(5000, b * 2))}
                className="px-3 sm:px-3.5 py-2 sm:py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold font-mono text-xs border border-slate-700 min-h-[42px] sm:min-h-[44px] active:scale-95 shrink-0"
                disabled={isDropping}
              >
                2X
              </button>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar">
              {quickBets.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setBetAmount(amt)}
                  className={`flex-1 py-1.5 sm:py-2 px-1 text-xs font-mono font-bold rounded-lg border transition-all min-h-[38px] sm:min-h-[40px] flex items-center justify-center shrink-0 ${
                    betAmount === amt
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                      : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border-slate-700/80 active:scale-95'
                  }`}
                  disabled={isDropping}
                >
                  {amt}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setBetAmount(Math.min(5000, Math.floor(balance)))}
                className="py-1.5 sm:py-2 px-2 text-xs font-mono font-black rounded-lg border bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/30 min-h-[38px] sm:min-h-[40px] flex items-center justify-center shrink-0 ml-auto active:scale-95"
                disabled={isDropping}
              >
                MAX
              </button>
            </div>
          </div>
        </div>

        {/* Drop Ball Action Button */}
        <Button
          onClick={handleDrop}
          disabled={isDropping || betAmount > balance}
          className="w-full py-3.5 sm:py-4 text-sm sm:text-base font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-xl shadow-amber-500/20 active:scale-98 transition-all min-h-[46px] sm:min-h-[48px]"
        >
          {isDropping ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
              BALL DROPPING...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Play className="w-4 h-4 fill-current" />
              DROP BALL • {betAmount} ETB
            </span>
          )}
        </Button>

        {/* Provably Fair Details (Collapsible on Mobile) */}
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
                HMAC-SHA256 binomial bounce: byte &ge; 128 &rarr; Right (R), else Left (L).
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
                    <span className="text-slate-500">Path:</span>
                    <span className="text-cyan-400 font-bold truncate max-w-[200px] sm:max-w-[300px]">
                      {lastResult.outcome.path.join('')} (Slot #{lastResult.outcome.slot})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Nonce:</span>
                    <span className="text-emerald-400 font-bold">{lastResult.provablyFair.nonce}</span>
                  </div>
                </>
              ) : (
                <span className="text-slate-500 italic">Play a round to inspect hash and seed verification details.</span>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* History Ribbon - Mobile Horizontal */}
      {history.length > 0 && (
        <Card className="flex flex-col gap-2 border-slate-800 bg-slate-900/60 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 border-b border-slate-800/80 pb-1.5">
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Recent Drops</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {history.map((h, i) => (
              <div
                key={i}
                className={`py-1 px-2.5 rounded-lg border font-mono text-[10px] font-bold shrink-0 flex items-center gap-1.5 ${
                  h.won
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-800/80 border-slate-700/60 text-slate-400'
                }`}
              >
                <span>{h.multiplier}x</span>
                <span className="opacity-75">({h.outcome.rows}r)</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
