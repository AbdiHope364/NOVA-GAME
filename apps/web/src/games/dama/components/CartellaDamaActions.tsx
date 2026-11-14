import React from 'react';
import { RotateCcw, Check, Lightbulb } from 'lucide-react';

interface CartellaDamaActionsProps {
  onUndo: () => void;
  canUndo: boolean;
  onConfirmMove?: () => void;
  canMove?: boolean;
  onHint?: () => void;
  disabled?: boolean;
}

export const CartellaDamaActions: React.FC<CartellaDamaActionsProps> = ({
  onUndo,
  canUndo,
  onConfirmMove,
  canMove = true,
  onHint,
  disabled = false,
}) => {
  return (
    <div className="flex items-center justify-between gap-3 w-full max-w-[460px] mx-auto select-none pt-1">
      {/* 1. Left: Undo Button */}
      <button
        type="button"
        disabled={!canUndo || disabled}
        onClick={onUndo}
        className={`flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full border transition-all ${
          canUndo && !disabled
            ? 'bg-gradient-to-b from-[#290a4f] to-[#16042e] border-purple-500/70 text-purple-200 hover:border-purple-300 active:scale-95 shadow-lg shadow-purple-900/30 cursor-pointer'
            : 'bg-[#180833]/60 border-purple-950/60 text-purple-400/40 cursor-not-allowed'
        }`}
        aria-label="Undo move"
      >
        <RotateCcw className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-extrabold uppercase">Undo</span>
      </button>

      {/* 2. Center: Primary Action Button (Move) */}
      <button
        type="button"
        disabled={disabled}
        onClick={onConfirmMove}
        className="flex-1 max-w-[200px] sm:max-w-[240px] py-3.5 sm:py-4 px-6 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 active:scale-95 transition-all text-slate-950 font-black text-base sm:text-lg uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.5)] flex items-center justify-center gap-2 cursor-pointer border-2 border-yellow-200"
      >
        <div className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center text-amber-400">
          <Check className="w-4 h-4 stroke-[3]" />
        </div>
        <span>Move</span>
      </button>

      {/* 3. Right: Hint Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={onHint}
        className="flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-b from-[#290a4f] to-[#16042e] border border-purple-500/70 text-purple-200 hover:border-purple-300 active:scale-95 shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
        aria-label="Move hint"
      >
        <Lightbulb className="w-5 h-5 text-amber-300 mb-0.5" />
        <span className="text-[10px] font-extrabold uppercase">Hint</span>
      </button>
    </div>
  );
};
