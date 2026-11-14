import React, { useState } from 'react';
import {
  RotateCcw,
  Undo2,
  Bot,
  Users,
  Settings2,
  HelpCircle,
  X,
  CheckCircle2,
  Sliders,
  ArrowUpDown,
} from 'lucide-react';
import { DamaDifficulty } from '@nova/game-dama';

interface DamaControlsProps {
  gameMode: 'ai' | 'local';
  setGameMode: (m: 'ai' | 'local') => void;
  difficulty: DamaDifficulty;
  setDifficulty: (d: DamaDifficulty) => void;
  requireMaxCapture: boolean;
  setRequireMaxCapture: (v: boolean) => void;
  flyingKings: boolean;
  setFlyingKings: (v: boolean) => void;
  menCaptureBackward: boolean;
  setMenCaptureBackward: (v: boolean) => void;
  flipped: boolean;
  onToggleFlip: () => void;
  onNewGame: () => void;
  onUndo: () => void;
  canUndo: boolean;
  disabled?: boolean;
}

export const DamaControls: React.FC<DamaControlsProps> = ({
  gameMode,
  setGameMode,
  difficulty,
  setDifficulty,
  requireMaxCapture,
  setRequireMaxCapture,
  flyingKings,
  setFlyingKings,
  menCaptureBackward,
  setMenCaptureBackward,
  flipped,
  onToggleFlip,
  onNewGame,
  onUndo,
  canUndo,
  disabled = false,
}) => {
  const [showRules, setShowRules] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className="w-full max-w-[460px] mx-auto flex flex-col gap-3">
      {/* Primary Action Buttons */}
      <div className="grid grid-cols-5 gap-1.5">
        <button
          type="button"
          onClick={onNewGame}
          className="flex items-center justify-center gap-1 py-2.5 px-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>

        <button
          type="button"
          disabled={!canUndo || disabled}
          onClick={onUndo}
          className={`flex items-center justify-center gap-1 py-2.5 px-1.5 rounded-xl font-bold text-xs transition-all ${
            canUndo && !disabled
              ? 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 active:scale-95'
              : 'bg-stone-900/50 text-stone-600 border border-stone-800/50 cursor-not-allowed'
          }`}
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span>Undo</span>
        </button>

        <button
          type="button"
          onClick={onToggleFlip}
          className={`flex items-center justify-center gap-1 py-2.5 px-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 ${
            flipped
              ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50'
              : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700'
          }`}
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>Flip</span>
        </button>

        <button
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          className={`flex items-center justify-center gap-1 py-2.5 px-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 ${
            showOptions
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
              : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Rules</span>
        </button>

        <button
          type="button"
          onClick={() => setShowRules(true)}
          className="flex items-center justify-center gap-1 py-2.5 px-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-amber-300 border border-amber-500/30 font-bold text-xs transition-all"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Help</span>
        </button>
      </div>

      {/* Mode & Difficulty Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-stone-900/90 border border-stone-800">
        {/* Game Mode */}
        <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-lg border border-stone-800">
          <button
            type="button"
            onClick={() => setGameMode('ai')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              gameMode === 'ai'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>vs AI</span>
          </button>
          <button
            type="button"
            onClick={() => setGameMode('local')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              gameMode === 'local'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Pass & Play</span>
          </button>
        </div>

        {/* AI Difficulty (if mode === 'ai') */}
        {gameMode === 'ai' && (
          <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-lg border border-stone-800">
            {(['easy', 'medium', 'hard'] as DamaDifficulty[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={`px-2 py-1 rounded text-[11px] font-bold capitalize transition-all ${
                  difficulty === d
                    ? 'bg-stone-800 text-amber-400 border border-amber-500/40 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* House Rules Configuration Drawer */}
      {showOptions && (
        <div className="p-3 rounded-xl bg-stone-900/95 border border-amber-500/30 flex flex-col gap-2.5 text-xs animate-in fade-in">
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wide flex items-center justify-between border-b border-stone-800 pb-1.5">
            <span>House Rule Variations</span>
            <span className="text-stone-400 font-mono text-[10px]">Regional Options</span>
          </div>

          <label className="flex items-center justify-between cursor-pointer select-none">
            <span className="text-stone-300">Flying Kings (Sliding Draughts)</span>
            <input
              type="checkbox"
              checked={flyingKings}
              onChange={(e) => setFlyingKings(e.target.checked)}
              className="accent-amber-500 w-4 h-4 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer select-none">
            <span className="text-stone-300">Men Capture Backward</span>
            <input
              type="checkbox"
              checked={menCaptureBackward}
              onChange={(e) => setMenCaptureBackward(e.target.checked)}
              className="accent-amber-500 w-4 h-4 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer select-none">
            <span className="text-stone-300">Majority Rule (Max Pieces Capture)</span>
            <input
              type="checkbox"
              checked={requireMaxCapture}
              onChange={(e) => setRequireMaxCapture(e.target.checked)}
              className="accent-amber-500 w-4 h-4 cursor-pointer"
            />
          </label>
        </div>
      )}

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl bg-stone-900 border border-amber-500/30 p-5 text-left shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                <HelpCircle className="w-5 h-5" />
                <span>Ethiopian Dama Rules (12 Pieces)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowRules(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-stone-300 leading-relaxed">
              <div className="p-3 rounded-lg bg-stone-950/80 border border-stone-800">
                <h4 className="font-bold text-amber-300 mb-1">🏁 Setup</h4>
                <p>
                  8x8 board. Each player starts with <strong>12 pieces</strong> occupying the dark squares across the 3 rows closest to their side. All moves happen exclusively on dark squares.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-stone-950/80 border border-stone-800">
                <h4 className="font-bold text-amber-300 mb-1">♟️ Men Movement</h4>
                <ul className="list-disc pl-4 space-y-1 text-stone-400">
                  <li>Men move one square diagonally forward onto an empty dark square.</li>
                  <li>Regular men never move backward.</li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-stone-950/80 border border-stone-800">
                <h4 className="font-bold text-amber-300 mb-1">⚔️ Compulsory Capture</h4>
                <ul className="list-disc pl-4 space-y-1 text-stone-400">
                  <li>Capturing is mandatory! If a jump exists, you must take it.</li>
                  <li>Men capture by jumping an adjacent enemy diagonally forward (backward capture optional).</li>
                  <li>Multi-jumps must be completed to their fullest extent.</li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-stone-950/80 border border-stone-800">
                <h4 className="font-bold text-amber-300 mb-1">👑 Kings (Dama)</h4>
                <ul className="list-disc pl-4 space-y-1 text-stone-400">
                  <li>Reaching the opponent's back row crowns a man into a King.</li>
                  <li>Kings move and capture in all four diagonal directions.</li>
                  <li>With Flying Kings enabled, kings can slide any distance diagonally.</li>
                </ul>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowRules(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
