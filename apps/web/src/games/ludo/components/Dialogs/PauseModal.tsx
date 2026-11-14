import React, { useState } from 'react';
import { Home, Play, RotateCcw, Settings, X } from 'lucide-react';

export interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onQuitToHome: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onResume,
  onRestart,
  onOpenSettings,
  onQuitToHome,
}) => {
  const [confirmQuit, setConfirmQuit] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-menu-title"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onResume}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-[#1B2A41] border border-white/10 p-6 space-y-5 shadow-2xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 id="pause-menu-title" className="text-lg font-black text-white tracking-wider">
            GAME PAUSED
          </h2>
          <button
            type="button"
            onClick={onResume}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
            aria-label="Close pause menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!confirmQuit ? (
          <div className="space-y-3">
            {/* Resume Button */}
            <button
              type="button"
              onClick={onResume}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#43A047] hover:bg-[#388E3C] text-white font-black text-sm inline-flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-102 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" /> Resume Game
            </button>

            {/* Restart Button */}
            <button
              type="button"
              onClick={onRestart}
              className="w-full py-3 px-4 rounded-2xl bg-[#1E88E5] hover:bg-[#1976D2] text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow-md transition-transform hover:scale-102 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Restart Match
            </button>

            {/* Settings Button */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs inline-flex items-center justify-center gap-2 border border-white/10 transition-transform hover:scale-102 cursor-pointer"
            >
              <Settings className="w-4 h-4 text-amber-300" /> Game Settings
            </button>

            {/* Quit to Home */}
            <button
              type="button"
              onClick={() => setConfirmQuit(true)}
              className="w-full py-3 px-4 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs inline-flex items-center justify-center gap-2 transition-transform hover:scale-102 cursor-pointer"
            >
              <Home className="w-4 h-4" /> Quit to Home
            </button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to quit the current match? Your current progress will be lost.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmQuit(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold border border-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onQuitToHome}
                className="flex-1 py-2.5 rounded-xl bg-[#E53935] hover:bg-[#D32F2F] text-white text-xs font-black shadow cursor-pointer"
              >
                Yes, Quit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
