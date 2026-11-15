import React, { useState } from 'react';
import { CartellaCrashHeader } from './components/CartellaCrashHeader';
import { CartellaCrashStats } from './components/CartellaCrashStats';
import { CartellaCrashHistory } from './components/CartellaCrashHistory';
import { CartellaCrashChart } from './components/CartellaCrashChart';
import { CartellaCrashControls } from './components/CartellaCrashControls';
import { CartellaCrashBanner } from './components/CartellaCrashBanner';
import { Result } from './components/Result';
import { useCrash } from './hooks/useCrash';
import { ShieldCheck, HelpCircle } from 'lucide-react';
import { HowToPlayModal } from '../../components/common/HowToPlayModal';

export const CrashPage: React.FC = () => {
  const [showHelpModal, setShowHelpModal] = useState(false);
  const {
    betAmount,
    setBetAmount,
    autoCashoutEnabled,
    setAutoCashoutEnabled,
    autoCashout,
    setAutoCashout,
    currentMultiplier,
    isFlying,
    isCrashed,
    isCashedOut,
    isBetting,
    countdown,
    hasPlacedBet,
    queuedNextRound,
    lastResult,
    history,
    error,
    balance,
    placeBet,
    manualCashout,
    cancelBet,
  } = useCrash();

  const [showMenu, setShowMenu] = useState(false);
  const livePayout = Math.floor(betAmount * currentMultiplier);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#110224] via-[#1d083d] to-[#0c011a] text-white py-2 px-2.5 sm:px-4 w-full flex flex-col items-center">
      {/* Centered Mobile-Optimized NovaGame Container */}
      <div className="flex flex-col gap-2.5 sm:gap-3.5 max-w-md sm:max-w-xl w-full mx-auto relative z-10 pb-12">
        {/* 1. Header: Live Viewer Badge, NovaGame Crown Logo, Aviator Ribbon, Floating Elements */}
        <CartellaCrashHeader onMenuToggle={() => setShowMenu((prev) => !prev)} />

        {/* Optional Menu Modal */}
        {showMenu && (
          <div className="p-3.5 bg-[#1d063a] border border-purple-500/50 rounded-2xl shadow-2xl flex flex-col gap-2.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs font-bold text-purple-200 border-b border-purple-800/60 pb-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>NovaGame Aviator Provably Fair</span>
              </span>
              <span className="font-mono text-amber-300">Balance: {balance.toLocaleString()} ETB</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Curve powered by pre-committed cryptographic seeds with zero outcome tampering.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                setShowHelpModal(true);
              }}
              className="w-full py-2 px-3 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-purple-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>How to Play Aviator &amp; Crash Rules</span>
            </button>
          </div>
        )}

        {/* 2. Dynamic Stat Cards (Stake, Potential Win / Payout, Active Players) */}
        <CartellaCrashStats
          stake={betAmount}
          potentialWin={livePayout}
          multiplier={isFlying ? currentMultiplier : (autoCashoutEnabled ? autoCashout : 2.0)}
          isFlying={isFlying}
          playersCount={42}
        />

        {/* 3. Multiplier History Reel */}
        <CartellaCrashHistory history={history} />

        {/* 4. MAIN VISUAL ATTRACTION: Multiplier Graph & Animated Airplane Flight */}
        <CartellaCrashChart
          currentMultiplier={currentMultiplier}
          isFlying={isFlying}
          isCrashed={isCrashed}
          isCashedOut={isCashedOut}
          cashedOutMultiplier={lastResult?.multiplier ?? (isCashedOut ? currentMultiplier : undefined)}
          finalCrashPoint={lastResult?.crashPoint ?? (isCrashed ? currentMultiplier : undefined)}
          countdown={countdown}
          isBetting={isBetting}
          hasPlacedBet={hasPlacedBet}
        />

        {/* Error Alert */}
        {error && (
          <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-bold w-full text-center">
            {error}
          </div>
        )}

        {/* Result Notification when round concludes */}
        {lastResult && (
          <Result
            won={lastResult.won}
            multiplier={lastResult.multiplier}
            crashPoint={lastResult.crashPoint}
            payout={lastResult.payout}
            betAmount={lastResult.betAmount}
          />
        )}

        {/* 5. Bet Amount Controls, Auto Cashout Setting & Large Cash Out Button */}
        <CartellaCrashControls
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          autoCashoutEnabled={autoCashoutEnabled}
          setAutoCashoutEnabled={setAutoCashoutEnabled}
          autoCashout={autoCashout}
          setAutoCashout={setAutoCashout}
          isFlying={isFlying}
          isCrashed={isCrashed}
          hasPlacedBet={hasPlacedBet}
          queuedNextRound={queuedNextRound}
          isCashedOut={isCashedOut}
          currentMultiplier={currentMultiplier}
          countdown={countdown}
          balance={balance}
          lastResult={lastResult}
          onPlaceBet={placeBet}
          onManualCashout={manualCashout}
          onCancelBet={cancelBet}
        />

        {/* 6. Win Condition & Good Luck Banners */}
        <CartellaCrashBanner />
      </div>

      {/* Comprehensive How to Play Modal */}
      <HowToPlayModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        defaultGameId="crash"
      />
    </div>
  );
};
