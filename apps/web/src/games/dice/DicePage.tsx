import React, { useState, useEffect, useRef } from 'react';
import { useDice } from './hooks/useDice';
import { DiceBox } from './components/DiceBox';
import { DiceIcon } from './components/DiceIcon';
import {
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Zap,
  HelpCircle,
  BarChart2,
  ShieldCheck,
  Volume2,
  VolumeX,
  X,
  Wallet,
  Play,
  Dices,
  Sliders,
} from 'lucide-react';

export const DicePage: React.FC = () => {
  const {
    mode,
    setMode,
    targetNumber,
    setTargetNumber,
    singlePick,
    setSinglePick,
    condition,
    setCondition,
    winChance,
    setWinChance,
    currentMultiplier,
    possibleWin,
    profitOnWin,
    betAmount,
    setBetAmount,
    isRolling,
    animationPhase,
    displayRoll,
    lastResult,
    history,
    error,
    balance,
    soundEnabled,
    setSoundEnabled,
    resetDefaults,
    play,
  } = useDice();

  const [betTab, setBetTab] = useState<'MANUAL' | 'AUTO'>('MANUAL');
  const [autoRollsTotal, setAutoRollsTotal] = useState<number>(10);
  const [autoRunning, setAutoRunning] = useState<boolean>(false);
  const autoAbortRef = useRef<boolean>(false);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showFairModal, setShowFairModal] = useState(false);

  const startAutoBet = async () => {
    if (autoRunning) {
      autoAbortRef.current = true;
      setAutoRunning(false);
      return;
    }
    autoAbortRef.current = false;
    setAutoRunning(true);

    for (let i = 0; i < autoRollsTotal; i++) {
      if (autoAbortRef.current) break;
      const res = await play();
      if (!res) break;
      await new Promise((r) => setTimeout(r, 450));
    }

    setAutoRunning(false);
  };

  useEffect(() => {
    return () => {
      autoAbortRef.current = true;
    };
  }, []);

  const ruleText =
    mode === 'SINGLE'
      ? `Pick die #${singlePick} — if the 3D die lands on #${singlePick}, you win ${possibleWin.toFixed(0)} ETB (5.94x).`
      : condition === 'UNDER'
      ? `Win if the rolled number lands BELOW ${targetNumber} (0.00 – ${(targetNumber - 0.01).toFixed(2)}).`
      : `Win if the rolled number lands ABOVE ${targetNumber} (${(targetNumber + 0.01).toFixed(2)} – 99.99).`;

  const formatRollDisplay = (val: number, m: 'SLIDER' | 'SINGLE') =>
    m === 'SINGLE' ? String(Math.round(val)) : val.toFixed(2);

  const isActionDisabled = isRolling || animationPhase !== 'IDLE' || autoRunning;

  return (
    <div className="w-full min-h-[calc(100vh-5.5rem)] flex flex-col lg:flex-row gap-2.5 sm:gap-4 py-1.5 sm:py-2 px-1 sm:px-2 pb-8 sm:pb-12 select-none">
      {/* ==================================================================== */}
      {/* LEFT CONTROL PANEL                                                   */}
      {/* ==================================================================== */}
      <aside className="order-2 lg:order-1 w-full lg:w-[320px] xl:w-[340px] shrink-0 bg-[#0e1628] border border-slate-800/90 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-2xl">
        <div className="space-y-2.5 sm:space-y-3.5">
          {/* Manual | Auto | Reset */}
          <div className="flex items-center justify-between border-b border-slate-800/90 pb-1.5 sm:pb-2">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setBetTab('MANUAL')}
                className={`pb-1.5 sm:pb-2 text-xs sm:text-sm font-bold transition-colors relative cursor-pointer ${
                  betTab === 'MANUAL' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Manual
                {betTab === 'MANUAL' && (
                  <span className="absolute bottom-[-9px] inset-x-0 h-0.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setBetTab('AUTO')}
                className={`pb-1.5 sm:pb-2 text-xs sm:text-sm font-bold transition-colors relative cursor-pointer ${
                  betTab === 'AUTO' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Auto
                {betTab === 'AUTO' && (
                  <span className="absolute bottom-[-9px] inset-x-0 h-0.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={resetDefaults}
              disabled={isActionDisabled}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors cursor-pointer disabled:opacity-40"
              title="Reset Parameters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Bet Amount */}
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold">Bet Amount</span>
              <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5" /> {balance.toLocaleString()} ETB
              </span>
            </div>

            <div className="flex items-center gap-2 bg-[#070b14] border border-slate-800 focus-within:border-emerald-500 rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 transition-colors">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-black shrink-0">
                ETB
              </span>
              <input
                type="number"
                min={1}
                max={Math.max(1, Math.floor(balance))}
                disabled={isActionDisabled}
                value={betAmount}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setBetAmount(isNaN(val) ? 0 : Math.max(0, val));
                }}
                className="w-full bg-transparent text-white font-mono font-extrabold text-sm sm:text-base focus:outline-none"
              />

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={isActionDisabled}
                  onClick={() => setBetAmount(Math.max(1, Math.floor(betAmount / 2)))}
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-[#162032] hover:bg-[#1e2b42] text-[10px] sm:text-[11px] font-bold text-slate-300 cursor-pointer disabled:opacity-40"
                >
                  ½
                </button>
                <button
                  type="button"
                  disabled={isActionDisabled}
                  onClick={() =>
                    setBetAmount(Math.min(balance > 0 ? balance : 10000, betAmount * 2))
                  }
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-[#162032] hover:bg-[#1e2b42] text-[10px] sm:text-[11px] font-bold text-slate-300 cursor-pointer disabled:opacity-40"
                >
                  2×
                </button>
                <button
                  type="button"
                  disabled={isActionDisabled}
                  onClick={() => setBetAmount(Math.max(1, Math.floor(balance)))}
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-[10px] sm:text-[11px] font-black text-emerald-400 cursor-pointer disabled:opacity-40"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Quick Stake Preset Buttons */}
            <div className="grid grid-cols-4 gap-1 sm:gap-1.5 pt-0.5">
              {[10, 50, 100, 500].map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={isActionDisabled}
                  onClick={() => setBetAmount(q)}
                  className={`py-1 sm:py-1.5 rounded-lg font-mono text-[11px] sm:text-xs font-bold border transition-colors cursor-pointer ${
                    betAmount === q
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-[#070b14] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  +{q}
                </button>
              ))}
            </div>
          </div>

          {/* Potential Win & Multiplier Info */}
          <div className="grid grid-cols-2 gap-2 bg-[#070b14] p-2 sm:p-2.5 rounded-xl border border-slate-800/80 text-xs font-mono">
            <div>
              <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold block">Multiplier</span>
              <span className="text-xs sm:text-sm font-extrabold text-cyan-400">{currentMultiplier.toFixed(2)}x</span>
            </div>
            <div>
              <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold block">Possible Win</span>
              <span className="text-xs sm:text-sm font-extrabold text-emerald-400">+{possibleWin.toFixed(0)} ETB</span>
            </div>
          </div>

          {/* Win Chance Adjuster for SLIDER mode */}
          {mode === 'SLIDER' && (
            <div className="space-y-1 sm:space-y-1.5">
              <span className="text-[11px] sm:text-xs text-slate-400 font-semibold block">Win Chance</span>
              <div className="flex items-stretch gap-1.5 sm:gap-2">
                <div className="flex-1 bg-[#070b14] border border-slate-800 rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center justify-between">
                  <input
                    type="number"
                    min={2}
                    max={98}
                    disabled={isActionDisabled}
                    value={winChance}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v)) setWinChance(v);
                    }}
                    className="w-16 bg-transparent text-white font-mono font-bold text-xs sm:text-sm focus:outline-none"
                  />
                  <span className="text-slate-400 font-mono font-bold text-xs">%</span>
                </div>

                <div className="flex flex-col gap-1 w-9 sm:w-11">
                  <button
                    type="button"
                    disabled={isActionDisabled || winChance >= 98}
                    onClick={() => setWinChance(winChance + 1)}
                    className="flex-1 rounded-lg bg-[#162032] hover:bg-[#1e2b42] border border-slate-800 text-slate-300 flex items-center justify-center cursor-pointer disabled:opacity-40"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={isActionDisabled || winChance <= 2}
                    onClick={() => setWinChance(winChance - 1)}
                    className="flex-1 rounded-lg bg-[#162032] hover:bg-[#1e2b42] border border-slate-800 text-slate-300 flex items-center justify-center cursor-pointer disabled:opacity-40"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Auto Roll Count */}
          {betTab === 'AUTO' && (
            <div className="space-y-1 pt-0.5">
              <span className="text-[11px] sm:text-xs text-slate-400 font-semibold block">Auto Rolls</span>
              <div className="grid grid-cols-4 gap-1.5">
                {[5, 10, 25, 50].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    disabled={autoRunning}
                    onClick={() => setAutoRollsTotal(cnt)}
                    className={`py-1 rounded-lg font-mono font-bold text-xs border transition-colors cursor-pointer ${
                      autoRollsTotal === cnt
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-[#070b14] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="p-2 sm:p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[11px] sm:text-xs font-bold">
              {error}
            </div>
          )}

          {/* THE SINGLE PRIMARY ACTION BUTTON (MANUAL / AUTO) */}
          {betTab === 'MANUAL' ? (
            <button
              type="button"
              disabled={isRolling || animationPhase !== 'IDLE'}
              onClick={play}
              className={`w-full py-3.5 sm:py-4 rounded-xl font-black text-sm sm:text-base uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                isRolling || animationPhase !== 'IDLE'
                  ? 'bg-slate-800 text-slate-500 cursor-wait opacity-70'
                  : 'bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.45)]'
              }`}
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              {isRolling ? 'ROLLING DICE...' : `ROLL DICE · ${betAmount} ETB`}
            </button>
          ) : (
            <button
              type="button"
              onClick={startAutoBet}
              className={`w-full py-3.5 sm:py-4 rounded-xl font-black text-sm sm:text-base uppercase tracking-wider active:scale-[0.98] transition-all cursor-pointer ${
                autoRunning
                  ? 'bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/40'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.45)]'
              }`}
            >
              {autoRunning ? 'STOP AUTO' : `START AUTO (${autoRollsTotal})`}
            </button>
          )}
        </div>

        {/* Bottom RTP Indicator (Desktop only - mobile already has it in the arena footer) */}
        <div className="hidden lg:flex mt-4 pt-3 border-t border-slate-800/70 items-center justify-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#070b14] border border-slate-800 text-xs font-bold text-slate-300">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>99.0% RTP · Provably Fair</span>
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="text-slate-400 hover:text-white ml-0.5 cursor-pointer"
              title="How to Play"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* RIGHT MAIN DICE ARENA                                                */}
      {/* ==================================================================== */}
      <section className="order-1 lg:order-2 flex-1 bg-[#090e1a] border border-slate-800/80 rounded-xl sm:rounded-2xl p-2.5 sm:p-5 flex flex-col justify-between gap-2.5 sm:gap-4">
        {/* Top Bar: Mode Switcher + Recent Rolls */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex bg-[#0e1628] border border-slate-800 p-0.5 sm:p-1 rounded-xl gap-0.5 sm:gap-1">
            <button
              type="button"
              disabled={isActionDisabled}
              onClick={() => setMode('SINGLE')}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold inline-flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                mode === 'SINGLE'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Dices className="w-3.5 h-3.5" /> 6-Sided 3D Die
            </button>
            <button
              type="button"
              disabled={isActionDisabled}
              onClick={() => setMode('SLIDER')}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold inline-flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                mode === 'SLIDER'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" /> Over / Under Slider (0–100)
            </button>
          </div>

          {/* History Pill Ticker */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full">
            {history.slice(0, 8).map((item) => (
              <span
                key={item.id}
                className={`px-2 py-0.5 rounded-full font-mono text-[10px] sm:text-[11px] font-black shrink-0 border ${
                  item.won
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700'
                }`}
              >
                {formatRollDisplay(item.roll, item.mode)}
              </span>
            ))}
          </div>
        </div>

        {/* Rule Banner */}
        <div className="rounded-xl bg-[#0e1628] border border-slate-800/90 px-3 py-1.5 sm:py-2 text-center text-[11px] sm:text-xs font-semibold text-emerald-300">
          {ruleText}
        </div>

        {/* ================================================================== */}
        {/* CENTERPIECE: 3D DICE & DIGITAL HUD ROLLER                          */}
        {/* ================================================================== */}
        <DiceBox
          mode={mode}
          phase={animationPhase}
          displayRoll={displayRoll}
          targetNumber={targetNumber}
          singlePick={singlePick}
          condition={condition}
          lastResult={lastResult}
          isRolling={isRolling}
        />

        {/* MODE-SPECIFIC CONTROLS */}
        {mode === 'SINGLE' ? (
          /* SINGLE PICK NUMBER SELECTOR BUTTONS */
          <div className="w-full max-w-xl mx-auto bg-[#0e1628] border border-slate-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 space-y-2 sm:space-y-3 shadow-xl">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 block text-center">
              Tap a number (1–6) to bet on:
            </span>
            <div className="grid grid-cols-6 gap-1.5 sm:gap-3">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  type="button"
                  disabled={isActionDisabled}
                  onClick={() => setSinglePick(num)}
                  className={`py-2 sm:py-3 rounded-lg sm:rounded-xl border flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all cursor-pointer ${
                    singlePick === num
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-2 ring-emerald-500/50 scale-105 font-black'
                      : 'bg-[#070b14] border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'
                  }`}
                >
                  <DiceIcon value={num} className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-[10px] sm:text-xs font-mono font-bold">#{num}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* SLIDER MODE QUICK CONTROLS */
          <div className="w-full max-w-xl mx-auto bg-[#0e1628] border border-slate-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 space-y-2.5 sm:space-y-3 shadow-xl">
            {/* Condition Selection: ROLL UNDER vs ROLL OVER */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                type="button"
                disabled={isActionDisabled}
                onClick={() => setCondition('UNDER')}
                className={`py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-black border transition-all cursor-pointer ${
                  condition === 'UNDER'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-2 ring-emerald-500/40'
                    : 'bg-[#070b14] border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                ROLL UNDER (&lt; {targetNumber})
              </button>
              <button
                type="button"
                disabled={isActionDisabled}
                onClick={() => setCondition('OVER')}
                className={`py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-black border transition-all cursor-pointer ${
                  condition === 'OVER'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-2 ring-emerald-500/40'
                    : 'bg-[#070b14] border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                ROLL OVER (&gt; {targetNumber})
              </button>
            </div>

            {/* Quick Chance Presets */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase">Presets:</span>
              <div className="flex items-center gap-1 sm:gap-1.5">
                {[25, 50, 75, 90].map((c) => (
                  <button
                    key={c}
                    type="button"
                    disabled={isActionDisabled}
                    onClick={() => setWinChance(c)}
                    className="px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-mono font-bold bg-[#070b14] border border-slate-800 text-slate-300 hover:border-slate-600 cursor-pointer"
                  >
                    {c}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Result Feedback Banner (Compact, zero duplicate button) */}
        {lastResult && !isRolling && animationPhase === 'IDLE' && (
          <div className="w-full max-w-md mx-auto">
            <div
              className={`rounded-xl px-3 py-2 text-center text-xs font-bold border ${
                lastResult.won
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {lastResult.won
                ? `YOU WON +${lastResult.payout.toFixed(2)} ETB! (Rolled ${formatRollDisplay(
                    lastResult.roll,
                    lastResult.mode
                  )})`
                : `No Match — Rolled ${formatRollDisplay(lastResult.roll, lastResult.mode)} (Lost ${lastResult.betAmount} ETB)`}
            </div>
          </div>
        )}

        {/* Bottom Utility Bar */}
        <div className="pt-1.5 sm:pt-2 flex items-center justify-between border-t border-slate-800/80">
          <span className="text-[11px] sm:text-xs font-mono text-slate-400">99.0% RTP · Provably Fair</span>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="p-1.5 sm:p-2 rounded-lg bg-[#0e1628] text-slate-400 hover:text-white cursor-pointer"
              title="Roll History"
            >
              <BarChart2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowFairModal(true)}
              className="p-1.5 sm:p-2 rounded-lg bg-[#0e1628] text-slate-400 hover:text-emerald-400 cursor-pointer"
              title="Provably Fair"
            >
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="p-1.5 sm:p-2 rounded-lg bg-[#0e1628] text-slate-400 hover:text-white cursor-pointer"
              title="Rules"
            >
              <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 sm:p-2 rounded-lg bg-[#0e1628] text-slate-400 hover:text-white cursor-pointer"
              title={soundEnabled ? 'Mute' : 'Unmute'}
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Modals */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1628] border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white uppercase">Recent Dice Rolls</h3>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto text-xs font-mono">
              {history.length === 0 ? (
                <p className="text-slate-500 text-center py-6 font-sans">No rolls recorded yet.</p>
              ) : (
                history.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#070b14] border border-slate-800"
                  >
                    <div>
                      <span className="font-black text-white">
                        Roll {formatRollDisplay(h.roll, h.mode)}
                      </span>
                      <span className="text-slate-500 ml-2">
                        {h.mode === 'SINGLE'
                          ? `(Pick #${h.targetNumber})`
                          : `(${h.condition} ${h.targetNumber})`}
                      </span>
                    </div>
                    <span className={h.won ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {h.won ? `+${h.payout} ETB` : `-${h.betAmount} ETB`}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1628] border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-3 text-xs text-slate-300 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white uppercase">How to Play Dice</h3>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p><strong>6-Sided 3D Die Mode:</strong> Pick any die face from 1 to 6 and press <strong>ROLL DICE</strong>. An exact match pays <strong>5.94x</strong> your stake.</p>
            <p><strong>Over / Under Slider:</strong> Choose a target number between 2 and 98, select <strong>ROLL UNDER</strong> or <strong>ROLL OVER</strong>, and press <strong>ROLL DICE</strong>. If the rolled number lands in your green zone, you win instantly!</p>
          </div>
        </div>
      )}

      {showFairModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1628] border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-3 text-xs text-slate-300 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-emerald-400 uppercase flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Provably Fair Verification
              </h3>
              <button
                type="button"
                onClick={() => setShowFairModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p>Every dice roll is computed deterministically via HMAC-SHA256 using your active server seed, client seed, and nonce before you press roll.</p>
          </div>
        </div>
      )}
    </div>
  );
};
