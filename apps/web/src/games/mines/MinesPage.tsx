import React, { useState, useRef, useEffect } from 'react';
import { MinesGrid } from './components/MinesGrid';
import { useMines } from './hooks/useMines';
import {
  Volume2,
  VolumeX,
  BarChart2,
  ShieldCheck,
  X,
  RotateCcw,
  Wallet,
  Infinity as InfinityIcon,
  Shuffle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { HowToPlayModal } from '../../components/common/HowToPlayModal';

export const MinesPage: React.FC = () => {
  const {
    mineCount,
    setMineCount,
    betAmount,
    setBetAmount,
    isPlaying,
    revealedTiles,
    minePositions,
    hitTile,
    gameOver,
    lastResult,
    error,
    balance,
    currentMultiplier,
    currentPayout,
    soundEnabled,
    setSoundEnabled,
    liveStats,
    resetStats,
    startGame,
    revealTile,
    pickRandomTile,
    cashout,
    playAutoBatch,
  } = useMines();

  const [tabMode, setTabMode] = useState<'MANUAL' | 'AUTO'>('MANUAL');
  const [selectedAutoTiles, setSelectedAutoTiles] = useState<number[]>([15]); // default purple tile highlight
  const [autoBetsCount, setAutoBetsCount] = useState<number>(0); // 0 = infinite
  const [onWinMode, setOnWinMode] = useState<'RESET' | 'INCREASE'>('RESET');
  const [onWinPct, setOnWinPct] = useState<number>(0);
  const [onLossMode, setOnLossMode] = useState<'RESET' | 'INCREASE'>('RESET');
  const [onLossPct, setOnLossPct] = useState<number>(0);
  const [stopOnProfit, setStopOnProfit] = useState<number>(0);
  const [stopOnLoss, setStopOnLoss] = useState<number>(0);
  const [autoRunning, setAutoRunning] = useState<boolean>(false);
  const autoAbortRef = useRef<boolean>(false);

  const [showLiveStats, setShowLiveStats] = useState<boolean>(false);
  const [showFairnessModal, setShowFairnessModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  const handleTileClick = (index: number) => {
    if (tabMode === 'AUTO' && !isPlaying) {
      setSelectedAutoTiles((prev) =>
        prev.includes(index) ? prev.filter((t) => t !== index) : [...prev, index]
      );
      return;
    }
    revealTile(index);
  };

  const handleStartAutobet = async () => {
    if (autoRunning) {
      autoAbortRef.current = true;
      setAutoRunning(false);
      return;
    }
    if (selectedAutoTiles.length === 0) return;

    autoAbortRef.current = false;
    setAutoRunning(true);

    let currentStake = betAmount;
    const baseStake = betAmount;
    let sessionProfit = 0;
    const maxLoops = autoBetsCount === 0 ? 50 : autoBetsCount;

    for (let i = 0; i < maxLoops; i++) {
      if (autoAbortRef.current) break;
      const res = await playAutoBatch(selectedAutoTiles, currentStake);
      if (!res) break;

      const delta = res.won ? res.payout - currentStake : -currentStake;
      sessionProfit += delta;

      if (stopOnProfit > 0 && sessionProfit >= stopOnProfit) break;
      if (stopOnLoss > 0 && sessionProfit <= -stopOnLoss) break;

      if (res.won) {
        currentStake =
          onWinMode === 'RESET'
            ? baseStake
            : Number((currentStake * (1 + onWinPct / 100)).toFixed(2));
      } else {
        currentStake =
          onLossMode === 'RESET'
            ? baseStake
            : Number((currentStake * (1 + onLossPct / 100)).toFixed(2));
      }

      await new Promise((r) => setTimeout(r, 650));
    }

    setAutoRunning(false);
  };

  useEffect(() => {
    return () => {
      autoAbortRef.current = true;
    };
  }, []);

  const gemsRemaining = Math.max(0, 25 - mineCount - revealedTiles.length);

  return (
    <div className="w-full min-h-[calc(100vh-5.5rem)] flex flex-col gap-3 py-2 px-1 sm:px-2 pb-12 select-none">
      {/* Main Split Container */}
      <div className="flex-1 flex flex-col lg:flex-row rounded-2xl overflow-hidden border border-[#2f4553] bg-[#0f212e] shadow-2xl">
        {/* ================================================================ */}
        {/* LEFT CONTROL SIDEBAR (#213743)                                   */}
        {/* ================================================================ */}
        <aside className="w-full lg:w-[320px] xl:w-[340px] shrink-0 bg-[#213743] p-4 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#2f4553] gap-4">
          <div className="space-y-4">
            {/* Manual / Auto Pill Toggle */}
            <div className="bg-[#0f212e] p-1 rounded-full grid grid-cols-2">
              <button
                type="button"
                disabled={isPlaying || autoRunning}
                onClick={() => setTabMode('MANUAL')}
                className={`py-2 rounded-full text-xs font-bold transition-all cursor-pointer disabled:opacity-60 ${
                  tabMode === 'MANUAL'
                    ? 'bg-[#2f4553] text-white shadow'
                    : 'text-[#b1bad3] hover:text-white'
                }`}
              >
                Manual
              </button>
              <button
                type="button"
                disabled={isPlaying || autoRunning}
                onClick={() => setTabMode('AUTO')}
                className={`py-2 rounded-full text-xs font-bold transition-all cursor-pointer disabled:opacity-60 ${
                  tabMode === 'AUTO'
                    ? 'bg-[#2f4553] text-white shadow'
                    : 'text-[#b1bad3] hover:text-white'
                }`}
              >
                Auto
              </button>
            </div>

            {/* Bet Amount Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#b1bad3]">
                <span>Bet Amount</span>
                <span className="font-mono text-emerald-400 flex items-center gap-1">
                  <Wallet className="w-3 h-3" /> {balance.toFixed(0)} ETB
                </span>
              </div>

              <div className="flex items-stretch bg-[#0f212e] border-2 border-[#2f4553] focus-within:border-[#557086] rounded-lg overflow-hidden">
                <div className="flex-1 flex items-center gap-2 px-3 py-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-black flex items-center justify-center shrink-0">
                    ETB
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={balance}
                    disabled={isPlaying || autoRunning}
                    value={betAmount}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setBetAmount(isNaN(v) ? 0 : Math.max(0, v));
                    }}
                    className="w-full bg-transparent text-white font-mono font-bold text-sm focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  disabled={isPlaying || autoRunning}
                  onClick={() => setBetAmount(Math.max(1, Math.floor(betAmount / 2)))}
                  className="px-3 bg-[#2f4553] hover:bg-[#3c5769] text-white font-bold text-xs border-l border-[#0f212e] cursor-pointer disabled:opacity-50"
                >
                  ½
                </button>
                <button
                  type="button"
                  disabled={isPlaying || autoRunning}
                  onClick={() =>
                    setBetAmount(Math.min(Math.floor(balance), Math.max(1, betAmount * 2)))
                  }
                  className="px-3 bg-[#2f4553] hover:bg-[#3c5769] text-white font-bold text-xs border-l border-[#0f212e] cursor-pointer disabled:opacity-50"
                >
                  2×
                </button>
              </div>
            </div>

            {/* Mines Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#b1bad3] block">Mines</label>
              <select
                disabled={isPlaying || autoRunning}
                value={mineCount}
                onChange={(e) => setMineCount(Number(e.target.value))}
                className="w-full bg-[#0f212e] border-2 border-[#2f4553] focus:border-[#557086] rounded-lg px-3 py-2.5 text-sm font-mono font-bold text-white outline-none cursor-pointer disabled:opacity-60"
              >
                {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            {/* MANUAL MODE ACTIVE STATS */}
            {tabMode === 'MANUAL' && isPlaying && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#0f212e] border border-[#2f4553] rounded-lg p-2.5">
                    <span className="text-[10px] text-[#b1bad3] font-semibold block">Gems Left</span>
                    <span className="text-sm font-mono font-black text-emerald-400">
                      {gemsRemaining}
                    </span>
                  </div>
                  <div className="bg-[#0f212e] border border-[#2f4553] rounded-lg p-2.5">
                    <span className="text-[10px] text-[#b1bad3] font-semibold block">
                      Total Profit ({currentMultiplier.toFixed(2)}×)
                    </span>
                    <span className="text-sm font-mono font-black text-white">
                      {currentPayout.toFixed(0)} ETB
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={pickRandomTile}
                  className="w-full py-2.5 rounded-lg bg-[#2f4553] hover:bg-[#3c5769] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Shuffle className="w-3.5 h-3.5" /> Pick Random Tile
                </button>
              </div>
            )}

            {/* AUTO MODE CONTROLS (Matching Screenshot) */}
            {tabMode === 'AUTO' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#b1bad3] block">
                    Number of Bets
                  </label>
                  <div className="flex items-center bg-[#0f212e] border-2 border-[#2f4553] rounded-lg px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      disabled={autoRunning}
                      value={autoBetsCount}
                      onChange={(e) => setAutoBetsCount(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-transparent text-white font-mono font-bold text-xs focus:outline-none"
                    />
                    {autoBetsCount === 0 && (
                      <InfinityIcon className="w-4 h-4 text-[#b1bad3] shrink-0" />
                    )}
                  </div>
                </div>

                {/* On Win */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#b1bad3] block">On Win</label>
                  <div className="flex items-stretch gap-1.5">
                    <button
                      type="button"
                      disabled={autoRunning}
                      onClick={() => setOnWinMode('RESET')}
                      className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold cursor-pointer ${
                        onWinMode === 'RESET'
                          ? 'bg-[#2f4553] text-white'
                          : 'bg-[#0f212e] text-[#b1bad3]'
                      }`}
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      disabled={autoRunning}
                      onClick={() => setOnWinMode('INCREASE')}
                      className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold cursor-pointer ${
                        onWinMode === 'INCREASE'
                          ? 'bg-[#2f4553] text-white'
                          : 'bg-[#0f212e] text-[#b1bad3]'
                      }`}
                    >
                      Increase by:
                    </button>
                    <div className="flex-1 flex items-center bg-[#0f212e] border border-[#2f4553] rounded-md px-2">
                      <input
                        type="number"
                        disabled={autoRunning || onWinMode === 'RESET'}
                        value={onWinPct}
                        onChange={(e) => setOnWinPct(Number(e.target.value))}
                        className="w-full bg-transparent text-white font-mono text-xs focus:outline-none disabled:opacity-40"
                      />
                      <span className="text-[11px] text-[#b1bad3]">%</span>
                    </div>
                  </div>
                </div>

                {/* On Loss */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#b1bad3] block">On Loss</label>
                  <div className="flex items-stretch gap-1.5">
                    <button
                      type="button"
                      disabled={autoRunning}
                      onClick={() => setOnLossMode('RESET')}
                      className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold cursor-pointer ${
                        onLossMode === 'RESET'
                          ? 'bg-[#2f4553] text-white'
                          : 'bg-[#0f212e] text-[#b1bad3]'
                      }`}
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      disabled={autoRunning}
                      onClick={() => setOnLossMode('INCREASE')}
                      className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold cursor-pointer ${
                        onLossMode === 'INCREASE'
                          ? 'bg-[#2f4553] text-white'
                          : 'bg-[#0f212e] text-[#b1bad3]'
                      }`}
                    >
                      Increase by:
                    </button>
                    <div className="flex-1 flex items-center bg-[#0f212e] border border-[#2f4553] rounded-md px-2">
                      <input
                        type="number"
                        disabled={autoRunning || onLossMode === 'RESET'}
                        value={onLossPct}
                        onChange={(e) => setOnLossPct(Number(e.target.value))}
                        className="w-full bg-transparent text-white font-mono text-xs focus:outline-none disabled:opacity-40"
                      />
                      <span className="text-[11px] text-[#b1bad3]">%</span>
                    </div>
                  </div>
                </div>

                {/* Stop on Profit & Stop on Loss */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#b1bad3] block">
                      Stop on Profit
                    </label>
                    <input
                      type="number"
                      min={0}
                      disabled={autoRunning}
                      value={stopOnProfit}
                      onChange={(e) => setStopOnProfit(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-[#0f212e] border border-[#2f4553] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#b1bad3] block">
                      Stop on Loss
                    </label>
                    <input
                      type="number"
                      min={0}
                      disabled={autoRunning}
                      value={stopOnLoss}
                      onChange={(e) => setStopOnLoss(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-[#0f212e] border border-[#2f4553] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-purple-300 font-semibold">
                  Selected Tiles: {selectedAutoTiles.length} (Click grid tiles to toggle)
                </p>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold">
                {error}
              </div>
            )}

            {/* Primary Bright Green Action Button (#00e701) */}
            {tabMode === 'MANUAL' ? (
              !isPlaying ? (
                <button
                  type="button"
                  onClick={startGame}
                  disabled={betAmount <= 0 || betAmount > balance}
                  className="w-full py-3.5 rounded-lg bg-[#00e701] hover:bg-[#1fff20] text-[#05080a] font-black text-sm tracking-wide shadow-[0_0_20px_rgba(0,231,1,0.25)] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                >
                  Bet
                </button>
              ) : (
                <button
                  type="button"
                  onClick={cashout}
                  disabled={revealedTiles.length === 0}
                  className="w-full py-3.5 rounded-lg bg-[#00e701] hover:bg-[#1fff20] text-[#05080a] font-black text-sm tracking-wide shadow-[0_0_20px_rgba(0,231,1,0.35)] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-40"
                >
                  {revealedTiles.length === 0
                    ? 'Pick a Tile...'
                    : `Cashout (${currentPayout.toFixed(0)} ETB)`}
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={handleStartAutobet}
                disabled={selectedAutoTiles.length === 0 || betAmount <= 0 || betAmount > balance}
                className={`w-full py-3.5 rounded-lg font-black text-sm tracking-wide active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 ${
                  autoRunning
                    ? 'bg-rose-500 hover:bg-rose-400 text-white'
                    : 'bg-[#00e701] hover:bg-[#1fff20] text-[#05080a] shadow-[0_0_20px_rgba(0,231,1,0.25)]'
                }`}
              >
                {autoRunning ? 'Stop Autobet' : 'Start Autobet'}
              </button>
            )}
          </div>
        </aside>

        {/* ================================================================ */}
        {/* RIGHT 5x5 GRID ARENA & FOOTER                                    */}
        {/* ================================================================ */}
        <section className="flex-1 flex flex-col justify-between p-4 sm:p-8 relative">
          {/* Optional Floating Live Stats Drawer (Matching Left Card in Screenshot) */}
          {showLiveStats && (
            <div className="mb-4 sm:mb-0 sm:absolute sm:top-4 sm:left-4 z-30 w-full sm:w-56 bg-[#1a2c38] border border-[#2f4553] rounded-xl p-3.5 shadow-2xl space-y-2.5">
              <div className="flex items-center justify-between border-b border-[#2f4553] pb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5 text-[#00e701]" /> Live Stats
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={resetStats}
                    className="text-[#b1bad3] hover:text-white cursor-pointer"
                    title="Reset Stats"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLiveStats(false)}
                    className="text-[#b1bad3] hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-[#b1bad3] font-sans block">Profit</span>
                  <span
                    className={`font-bold ${
                      liveStats.profit >= 0 ? 'text-[#00e701]' : 'text-rose-400'
                    }`}
                  >
                    {liveStats.profit >= 0 ? '+' : ''}
                    {liveStats.profit.toFixed(0)} ETB
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#b1bad3] font-sans block">Wins</span>
                  <span className="font-bold text-[#00e701]">{liveStats.wins}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#b1bad3] font-sans block">Wagered</span>
                  <span className="font-bold text-white">{liveStats.wagered.toFixed(0)} ETB</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#b1bad3] font-sans block">Losses</span>
                  <span className="font-bold text-rose-400">{liveStats.losses}</span>
                </div>
              </div>
            </div>
          )}

          {/* Centered 5x5 Tile Grid */}
          <div className="my-auto py-2 sm:py-4 w-full">
            <MinesGrid
              isPlaying={isPlaying}
              gameOver={gameOver}
              revealedTiles={revealedTiles}
              minePositions={minePositions}
              hitTile={hitTile}
              lastResult={lastResult}
              autoMode={tabMode === 'AUTO'}
              selectedAutoTiles={selectedAutoTiles}
              onTileClick={handleTileClick}
            />
          </div>

          {/* Mobile Direct Action Button (Cashout / Bet directly adjacent to grid) */}
          <div className="lg:hidden w-full max-w-sm mx-auto mb-3">
            {tabMode === 'MANUAL' ? (
              isPlaying ? (
                <button
                  type="button"
                  onClick={cashout}
                  disabled={revealedTiles.length === 0}
                  className="w-full py-3.5 rounded-xl bg-[#00e701] hover:bg-[#1fff20] text-[#05080a] font-black text-sm tracking-wide shadow-[0_0_20px_rgba(0,231,1,0.35)] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {revealedTiles.length === 0
                    ? 'Pick a Tile...'
                    : `Cashout (${currentPayout.toFixed(0)} ETB · ${currentMultiplier.toFixed(2)}x)`}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startGame}
                  disabled={betAmount <= 0 || betAmount > balance}
                  className="w-full py-3.5 rounded-xl bg-[#00e701] hover:bg-[#1fff20] text-[#05080a] font-black text-sm tracking-wide shadow-[0_0_20px_rgba(0,231,1,0.25)] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                >
                  Bet ({betAmount} ETB · {mineCount} Mines)
                </button>
              )
            ) : null}
          </div>

          {/* Bottom Utility Bar */}
          <div className="pt-3 border-t border-[#1a2c38] flex items-center justify-between text-xs text-[#b1bad3]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 rounded-lg hover:bg-[#213743] text-[#b1bad3] hover:text-white transition-colors cursor-pointer"
                title={soundEnabled ? 'Mute Audio' : 'Enable Audio'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowLiveStats(!showLiveStats)}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  showLiveStats
                    ? 'bg-[#2f4553] text-white'
                    : 'hover:bg-[#213743] text-[#b1bad3] hover:text-white'
                }`}
                title="Toggle Live Stats"
              >
                <BarChart2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="p-2 rounded-lg hover:bg-[#213743] text-[#00e701] hover:text-white transition-colors cursor-pointer"
                title="How to Play Mines"
                aria-label="How to Play Mines"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowFairnessModal(true)}
              className="px-3 py-1.5 rounded-lg hover:bg-[#213743] font-bold text-[#b1bad3] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#00e701]" />
              <span>Fairness</span>
            </button>
          </div>
        </section>
      </div>

      {/* Comprehensive How to Play Modal */}
      <HowToPlayModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        defaultGameId="mines"
      />

      {/* Provably Fair Modal */}
      {showFairnessModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#213743] border border-[#2f4553] rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-3 text-xs text-[#b1bad3]">
            <div className="flex items-center justify-between border-b border-[#2f4553] pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00e701]" /> Provably Fair Mines
              </h3>
              <button
                type="button"
                onClick={() => setShowFairnessModal(false)}
                className="p-1.5 rounded-lg bg-[#0f212e] text-[#b1bad3] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p>
              Every 5×5 mine placement is generated deterministically before the round starts via HMAC-SHA256 using the server seed, client seed, and round nonce.
            </p>
            <p>
              Selecting <strong>{mineCount} mines</strong> leaves <strong>{25 - mineCount} gems</strong> on the board. Each gem uncovered raises your payout multiplier automatically.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
