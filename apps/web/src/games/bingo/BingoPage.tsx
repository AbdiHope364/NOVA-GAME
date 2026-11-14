import React, { useState } from 'react';
import { Button } from '@nova/ui';
import { CartellaHeader } from './components/CartellaHeader';
import { CartellaStats } from './components/CartellaStats';
import { PatternSelector } from './components/PatternSelector';
import { BingoCard } from './components/BingoCard';
import { CurrentBall } from './components/CurrentBall';
import { CartellaStatusFooter } from './components/CartellaStatusFooter';
import { CartellaWinnerBanner } from './components/CartellaWinnerBanner';
import { useBingo } from './hooks/useBingo';
import { Sparkles, XCircle, Ticket } from 'lucide-react';

export const BingoPage: React.FC = () => {
  const {
    roundConfig,
    countdown,
    pattern,
    setPattern,
    card,
    userMarks,
    toggleMarkTile,
    isDrawing,
    currentBall,
    drawnHistory,
    lastResult,
    error,
    balance,
    buyTicketAndStart,
    claimBingo,
  } = useBingo();

  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#110224] via-[#1d083d] to-[#0c011a] text-white py-2 px-2.5 sm:px-4 w-full flex flex-col items-center">
      {/* Centered Mobile-Optimized NovaGame Container */}
      <div className="flex flex-col gap-2.5 sm:gap-3.5 max-w-md sm:max-w-xl w-full mx-auto relative z-10 pb-12">
        {/* 1. Header: Live Bingo Badge, NovaGame Logo, Crown, Floating Balls */}
        <CartellaHeader onMenuToggle={() => setShowMenu((prev) => !prev)} />

        {/* Optional Menu Modal */}
        {showMenu && (
          <div className="p-3 bg-[#1d063a] border border-purple-500/50 rounded-2xl shadow-2xl flex flex-col gap-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs font-bold text-purple-200 border-b border-purple-800/60 pb-2">
              <span>Game Mode: 75-Ball NovaGame Bingo</span>
              <span className="font-mono text-amber-300">Balance: {balance.toFixed(0)} ETB</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Round ID: <span className="font-mono text-cyan-300">{roundConfig.roundId}</span> • Target: <span className="text-amber-300 font-bold">{roundConfig.patternName}</span>
            </p>
          </div>
        )}

        {/* 2. Dynamic Stat Cards (Stake, Prize, Admin Fee) from Admin Round Config */}
        <CartellaStats roundConfig={roundConfig} />

        {/* 3. Pattern Selector Bar (Pattern: Full House / Drop List) */}
        <PatternSelector
          pattern={pattern}
          onPatternChange={setPattern}
          disabled={isDrawing}
        />

        {/* 4. Complete 5×5 NovaGame Bingo Board */}
        <BingoCard
          card={card}
          userMarks={userMarks}
          onToggleMark={toggleMarkTile}
          disabled={!isDrawing}
        />

        {/* 5. Called Numbers Tray */}
        <CurrentBall
          currentBall={currentBall}
          drawnHistory={drawnHistory}
          isDrawing={isDrawing}
        />

        {/* 6. Live Game Status & Countdown Controls */}
        <CartellaStatusFooter
          roundConfig={roundConfig}
          countdown={countdown}
        />

        {/* 7. Winner-Condition Banner */}
        <CartellaWinnerBanner roundConfig={roundConfig} />

        {/* Error Alert */}
        {error && (
          <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-bold w-full text-center">
            {error}
          </div>
        )}

        {/* Result Notification Banner */}
        {lastResult && (
          <div
            className={`p-3 rounded-2xl border flex items-center justify-between px-4 shadow-xl w-full animate-in zoom-in-95 duration-200 ${
              lastResult.won
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-emerald-500/20'
                : 'bg-rose-500/20 border-rose-400 text-rose-300 shadow-rose-500/20'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {lastResult.won ? (
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span className="text-xs sm:text-base font-black uppercase">
                {lastResult.won ? 'BINGO! YOU WON!' : 'NO BINGO THIS ROUND'}
              </span>
            </div>
            <span className="text-xs sm:text-sm font-mono font-black text-amber-300">
              {lastResult.won ? `+${lastResult.payout} ETB` : 'Try again!'}
            </span>
          </div>
        )}

        {/* Primary Gameplay Button: BUY BINGO TICKET / CLAIM BINGO */}
        <div className="w-full mt-1">
          {!isDrawing ? (
            <Button
              variant="accent"
              size="lg"
              disabled={roundConfig.stake > balance}
              onClick={buyTicketAndStart}
              className="w-full py-3.5 sm:py-4 text-base sm:text-lg font-black tracking-wider uppercase shadow-[0_0_25px_rgba(16,185,129,0.4)] bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-2xl min-h-[50px] active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer"
            >
              <Ticket className="w-5 h-5" />
              <span>BUY BINGO TICKET ({roundConfig.stake} ETB)</span>
            </Button>
          ) : (
            <Button
              variant="accent"
              size="lg"
              onClick={claimBingo}
              className="w-full py-3.5 sm:py-4 text-base sm:text-xl font-black tracking-widest uppercase shadow-[0_0_30px_rgba(245,158,11,0.6)] bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 rounded-2xl animate-pulse cursor-pointer min-h-[50px] active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              <span>BINGO! CLAIM PRIZE ({roundConfig.prize} ETB)</span>
              <Sparkles className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
