import React from 'react';
import { TttSymbol } from '../types/ticTacToe.types';

export interface TurnIndicatorProps {
  currentTurn: TttSymbol;
  isMyTurn: boolean;
  isAiThinking?: boolean;
}

export const TurnIndicator: React.FC<TurnIndicatorProps> = ({
  currentTurn,
  isMyTurn,
  isAiThinking = false,
}) => {
  const isX = currentTurn === 'X';

  if (isAiThinking) {
    return (
      <div className="flex items-center justify-center gap-2 py-1 px-4 rounded-full bg-fuchsia-950/60 border border-fuchsia-500/40 text-fuchsia-300 text-xs font-black tracking-wider shadow-[0_0_15px_rgba(217,70,239,0.3)]">
        <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-ping" />
        AI IS THINKING...
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center gap-2 py-1 px-4 rounded-full border text-xs font-black tracking-wider transition-all duration-300 ${
        isMyTurn
          ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,229,255,0.4)] animate-pulse'
          : 'bg-slate-900/60 border-slate-700 text-slate-400'
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isX ? 'bg-[#00e5ff] shadow-[0_0_8px_#00e5ff]' : 'bg-[#d946ef] shadow-[0_0_8px_#d946ef]'
        }`}
      />
      {isMyTurn ? 'YOUR TURN' : "OPPONENT'S TURN"} ({currentTurn})
    </div>
  );
};
