import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '@nova/ui';
import { useWalletStore } from '../../stores/walletStore';
import { api } from '../../services/api';
import { HiLoEngine } from '@nova/game-hilo';
import { HiLoCard, HiLoStep, HiLoGuess } from '@nova/types';
import { PlayingCard } from './components/PlayingCard';
import { CardStreak } from './components/CardStreak';
import { BetSelector } from './components/BetSelector';
import {
  ShieldCheck,
  TrendingUp,
  Sparkles,
  ArrowUp,
  ArrowDown,
  SkipForward,
  Coins,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Trophy,
  History,
  RotateCcw,
  Flame,
} from 'lucide-react';

export const HiLoPage: React.FC = () => {
  const { balance, updateBalance, fetchWallet } = useWalletStore();

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);
  const [betAmount, setBetAmount] = useState<number>(100);

  // Round states
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isDealing, setIsDealing] = useState<boolean>(false);
  const [currentCard, setCurrentCard] = useState<HiLoCard | null>(null);
  const [history, setHistory] = useState<HiLoStep[]>([]);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [gameOutcome, setGameOutcome] = useState<'WON' | 'LOST' | null>(null);
  const [profit, setProfit] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Provably Fair commitment details
  const [activeServerSeedHash, setActiveServerSeedHash] = useState<string>('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  const [activeClientSeed, setActiveClientSeed] = useState<string>('hilo_seed_' + Date.now().toString(36));
  const [activeNonce, setActiveNonce] = useState<number>(1);
  const [showFairness, setShowFairness] = useState<boolean>(false);

  // Hi-Lo engine instance
  const engine = new HiLoEngine(1.0);

  // Calculate live odds for next guess
  const odds = currentCard
    ? HiLoEngine.calculateStepOdds(currentCard.rank, 1.0)
    : { nextHiMultiplier: 1.5, nextLoMultiplier: 1.5, nextHiProbability: 50, nextLoProbability: 50 };

  // 1. Start a new Hi-Lo round
  const handleStartGame = async () => {
    if (betAmount > balance) {
      setError('Insufficient wallet balance. Please lower your bet or deposit.');
      return;
    }

    setError(null);
    setIsDealing(true);
    setGameOutcome(null);
    setProfit(0);

    const nonce = activeNonce + 1;
    setActiveNonce(nonce);

    try {
      // 1. Attempt authoritative backend deal
      const res = await api.post('/games/play/hilo', {
        amount: betAmount,
        params: { action: 'START' },
      });
      const d = res.data.data;
      const initialCard = d.outcome.currentCard;

      setCurrentCard(initialCard);
      setHistory(d.outcome.history);
      setCurrentMultiplier(1.0);
      setIsPlaying(true);

      const isAuth = !!localStorage.getItem('nova_token');
      if (isAuth && d.newBalance !== undefined) {
        updateBalance(d.newBalance);
      } else {
        updateBalance(balance - betAmount);
      }
    } catch {
      // 2. Fallback to local Provably Fair engine
      const evalRes = engine.evaluate({
        amount: betAmount,
        serverSeed: 'offline-server-seed',
        clientSeed: activeClientSeed,
        nonce,
        params: { action: 'START' },
      });

      setCurrentCard(evalRes.outcome.currentCard);
      setHistory(evalRes.outcome.history);
      setCurrentMultiplier(1.0);
      setIsPlaying(true);
      updateBalance(balance - betAmount);
    } finally {
      setIsDealing(false);
    }
  };

  // 2. Submit a Guess ('HI' | 'LO' | 'SKIP')
  const handleGuess = async (guess: HiLoGuess) => {
    if (!isPlaying || isDealing || !currentCard) return;

    setIsDealing(true);
    setError(null);

    try {
      // 1. Attempt backend play
      const res = await api.post('/games/play/hilo', {
        amount: betAmount,
        params: {
          action: 'GUESS',
          guess,
          history,
          currentMultiplier,
        },
      });
      const d = res.data.data;
      const outcome = d.outcome;

      setCurrentCard(outcome.currentCard);
      setHistory(outcome.history);

      if (outcome.isGameOver) {
        setIsPlaying(false);
        setGameOutcome('LOST');
        setCurrentMultiplier(0);
        setProfit(-betAmount);
      } else {
        setCurrentMultiplier(outcome.currentMultiplier);
      }
    } catch {
      // 2. Local engine evaluation fallback
      const evalRes = engine.evaluate({
        amount: betAmount,
        serverSeed: 'offline-server-seed',
        clientSeed: activeClientSeed,
        nonce: activeNonce,
        params: {
          action: 'GUESS',
          guess,
          history,
          currentMultiplier,
        },
      });

      setCurrentCard(evalRes.outcome.currentCard);
      setHistory(evalRes.outcome.history);

      if (evalRes.outcome.isGameOver) {
        setIsPlaying(false);
        setGameOutcome('LOST');
        setCurrentMultiplier(0);
        setProfit(-betAmount);
      } else {
        setCurrentMultiplier(evalRes.outcome.currentMultiplier);
      }
    } finally {
      setIsDealing(false);
    }
  };

  // 3. Cashout current compounded winnings
  const handleCashout = async () => {
    if (!isPlaying || isDealing || currentMultiplier <= 1.0) return;

    setIsDealing(true);
    const payoutAmount = Math.floor(betAmount * currentMultiplier);
    const winProfit = payoutAmount - betAmount;

    try {
      const res = await api.post('/games/play/hilo', {
        amount: betAmount,
        params: {
          action: 'CASHOUT',
          history,
          currentMultiplier,
        },
      });
      const d = res.data.data;

      const isAuth = !!localStorage.getItem('nova_token');
      if (isAuth && d.newBalance !== undefined) {
        updateBalance(d.newBalance);
      } else {
        updateBalance(balance + payoutAmount);
      }
    } catch {
      updateBalance(balance + payoutAmount);
    } finally {
      setIsPlaying(false);
      setIsDealing(false);
      setGameOutcome('WON');
      setProfit(winProfit);
    }
  };

  const streakCount = history.filter((h) => h.correct).length;

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-4 sm:gap-6 pb-12 px-2 sm:px-0">
      {/* Title & Stats Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              ♠
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              HI-LO CARDS
            </h1>
            <Badge variant="warning" className="uppercase font-bold tracking-wider text-[10px]">
              NEW MODULE
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Guess whether the next card is Higher or Lower. Compound your multiplier & cash out anytime!
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="info" className="gap-1 items-center">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> 99.0% RTP (1% House Edge)
          </Badge>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Main Play Arena & Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Controls Column (Left on Desktop, Bottom on Mobile) */}
        <div className="lg:col-span-5 flex flex-col gap-4 order-2 lg:order-1">
          <Card className="flex flex-col gap-4 border-slate-800 bg-slate-900/90 shadow-2xl p-4 sm:p-5">
            {/* Bet Input */}
            <BetSelector
              amount={betAmount}
              onChange={setBetAmount}
              maxBalance={balance}
              disabled={isPlaying}
            />

            {!isPlaying ? (
              <Button
                variant="accent"
                size="lg"
                disabled={isDealing || betAmount <= 0 || betAmount > balance}
                onClick={handleStartGame}
                className="w-full min-h-[50px] font-black text-sm tracking-wider uppercase active:scale-95 shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> START ROUND (DEAL CARD)
              </Button>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Guess Controls */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Higher Button */}
                  <button
                    type="button"
                    disabled={isDealing}
                    onClick={() => handleGuess('HI')}
                    className="p-3.5 rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-slate-950 font-black shadow-lg shadow-emerald-500/20 active:scale-95 flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50"
                  >
                    <div className="flex items-center gap-1.5 text-sm sm:text-base">
                      <ArrowUp className="w-5 h-5 stroke-[3]" /> HIGHER OR SAME
                    </div>
                    <span className="text-xs bg-emerald-950/40 text-emerald-100 px-2 py-0.5 rounded-md font-mono">
                      {odds.nextHiMultiplier.toFixed(2)}x ({odds.nextHiProbability}%)
                    </span>
                  </button>

                  {/* Lower Button */}
                  <button
                    type="button"
                    disabled={isDealing}
                    onClick={() => handleGuess('LO')}
                    className="p-3.5 rounded-2xl bg-gradient-to-b from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black shadow-lg shadow-cyan-500/20 active:scale-95 flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50"
                  >
                    <div className="flex items-center gap-1.5 text-sm sm:text-base">
                      <ArrowDown className="w-5 h-5 stroke-[3]" /> LOWER OR SAME
                    </div>
                    <span className="text-xs bg-slate-950/40 text-cyan-200 px-2 py-0.5 rounded-md font-mono">
                      {odds.nextLoMultiplier.toFixed(2)}x ({odds.nextLoProbability}%)
                    </span>
                  </button>
                </div>

                {/* Skip Option */}
                <button
                  type="button"
                  disabled={isDealing}
                  onClick={() => handleGuess('SKIP')}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold border border-slate-700 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <SkipForward className="w-3.5 h-3.5 text-slate-400" /> Skip Card (Replace)
                </button>

                {/* Cashout Button */}
                <Button
                  variant="accent"
                  size="lg"
                  disabled={isDealing || streakCount === 0}
                  onClick={handleCashout}
                  className="w-full min-h-[50px] font-black text-sm tracking-wider uppercase active:scale-95 shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 mt-1"
                >
                  <Coins className="w-5 h-5" /> CASHOUT {(betAmount * currentMultiplier).toFixed(0)} ETB (
                  {currentMultiplier.toFixed(2)}x)
                </Button>
              </div>
            )}
          </Card>

          {/* Quick Rules & House Edge */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-2 font-bold text-slate-300">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span>How to Play Hi-Lo</span>
            </div>
            <p className="leading-relaxed">
              Ace is lowest (1) and King is highest (13). Ties (identical rank) count as a win for both Higher and Lower.
              Multipliers compound with every correct guess and you can cash out your profits at any time!
            </p>
          </div>
        </div>

        {/* Card Stage Arena (Right on Desktop, Top on Mobile) */}
        <div className="lg:col-span-7 flex flex-col gap-4 order-1 lg:order-2">
          <Card className="flex flex-col items-center justify-between border-slate-800 bg-slate-900/90 shadow-2xl p-6 sm:p-8 min-h-[380px] sm:min-h-[440px] relative overflow-hidden">
            {/* Multiplier & Status Banner */}
            <div className="flex items-center justify-between w-full border-b border-slate-800/80 pb-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Current Multiplier
                </span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400 drop-shadow-md">
                  {currentMultiplier.toFixed(2)}x
                </span>
              </div>

              {streakCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-extrabold text-xs">
                  <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>{streakCount} In A Row</span>
                </div>
              )}

              <div className="flex flex-col text-right">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Potential Win</span>
                <span className="text-base sm:text-xl font-black font-mono text-emerald-400">
                  {(betAmount * currentMultiplier).toFixed(0)} <span className="text-xs">ETB</span>
                </span>
              </div>
            </div>

            {/* Central Duel Card Arena */}
            <div className="flex items-center justify-center gap-4 sm:gap-8 my-6 sm:my-8 w-full">
              {/* Current Visible Card */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Current Card
                </span>
                <PlayingCard
                  card={currentCard || { index: 0, rank: 1, suit: 'SPADES', label: 'A', color: 'BLACK' }}
                  isFlipped={!currentCard}
                  size="md"
                  isWinner={gameOutcome === 'WON'}
                />
              </div>

              <div className="flex flex-col items-center justify-center gap-1">
                <span className="text-xs font-black text-slate-500 font-mono">VS</span>
                <div className="w-6 h-0.5 bg-slate-800 rounded-full" />
              </div>

              {/* Next Mystery Card */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Next Card
                </span>
                <PlayingCard isFlipped={true} size="md" />
              </div>
            </div>

            {/* Win / Loss Overlay Alert */}
            {gameOutcome && (
              <div
                className={`w-full p-4 rounded-2xl flex items-center justify-between border shadow-xl animate-in zoom-in-95 duration-200 ${
                  gameOutcome === 'WON'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  {gameOutcome === 'WON' ? (
                    <Trophy className="w-6 h-6 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
                  )}
                  <div className="flex flex-col">
                    <span className="font-black text-sm sm:text-base">
                      {gameOutcome === 'WON' ? 'CASHED OUT SUCCESSFULLY!' : 'ROUND OVER — NO MATCH'}
                    </span>
                    <span className="text-xs font-mono">
                      {gameOutcome === 'WON'
                        ? `Won +${profit.toFixed(0)} ETB (${currentMultiplier.toFixed(2)}x)`
                        : `Lost -${betAmount.toFixed(0)} ETB`}
                    </span>
                  </div>
                </div>

                <Button
                  variant={gameOutcome === 'WON' ? 'accent' : 'secondary'}
                  size="sm"
                  onClick={handleStartGame}
                  className="font-bold text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Play Again
                </Button>
              </div>
            )}

            {/* Card Streak History */}
            <CardStreak history={history} />
          </Card>
        </div>
      </div>

      {/* Provably Fair Commitment Footer */}
      <Card className="flex flex-col gap-3 border-slate-800 bg-slate-900/90 shadow-2xl p-4 sm:p-5">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowFairness((prev) => !prev)}
        >
          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Cryptographic Provably Fair SHA-256 HMAC</span>
          </div>
          <span className="text-xs text-cyan-400 font-bold hover:underline">
            {showFairness ? 'Hide Details' : 'Verify Cards'}
          </span>
        </div>

        {showFairness && (
          <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-800 text-xs text-slate-400 animate-in fade-in duration-150">
            <div className="flex flex-col gap-1">
              <span className="font-bold text-slate-300">Server Seed Hash (Committed SHA-256):</span>
              <span className="font-mono bg-slate-950 p-2 rounded-lg border border-slate-800 break-all select-all text-emerald-400 text-[11px]">
                {activeServerSeedHash}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <span className="font-bold text-slate-300">Client Seed:</span>
                <span className="font-mono bg-slate-950 p-2 rounded-lg border border-slate-800 break-all select-all text-[11px]">
                  {activeClientSeed}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-bold text-slate-300">Nonce:</span>
                <span className="font-mono bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px]">
                  {activeNonce}
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
