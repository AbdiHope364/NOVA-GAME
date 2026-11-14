import React from 'react';
import { Crown, Bot, User, Clock, AlertCircle } from 'lucide-react';
import { Board, Color, Result } from '@nova/game-dama';

interface DamaScoreboardProps {
  board: Board;
  turn: Color;
  gameMode: 'ai' | 'local';
  difficulty: string;
  isAiThinking: boolean;
  result: Result;
  quietPlies: number;
}

export const DamaScoreboard: React.FC<DamaScoreboardProps> = ({
  board,
  turn,
  gameMode,
  difficulty,
  isAiThinking,
  result,
  quietPlies,
}) => {
  let whiteMen = 0;
  let whiteKings = 0;
  let blackMen = 0;
  let blackKings = 0;

  for (const row of board) {
    for (const cell of row) {
      if (!cell) continue;
      if (cell.color === 'W') {
        if (cell.king) whiteKings++;
        else whiteMen++;
      } else {
        if (cell.king) blackKings++;
        else blackMen++;
      }
    }
  }

  const whiteTotal = whiteMen + whiteKings;
  const blackTotal = blackMen + blackKings;
  const whiteCaptured = 12 - blackTotal;
  const blackCaptured = 12 - whiteTotal;

  return (
    <div className="w-full max-w-[460px] mx-auto flex flex-col gap-2">
      {/* Turn & Status Header */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-stone-900/90 border border-amber-500/20 backdrop-blur-sm">
        {/* White / You */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
            turn === 'W' && result.status === 'ongoing'
              ? 'bg-amber-500/20 border border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
              : 'opacity-70'
          }`}
        >
          <div className="w-6 h-6 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-950 font-bold text-xs shadow-sm">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-white flex items-center gap-1">
              White {gameMode === 'ai' ? '(You)' : '(P1)'}
            </div>
            <div className="text-[10px] text-amber-200/80 font-mono">
              {whiteTotal} pcs ({whiteKings > 0 ? `${whiteKings} 👑` : `${whiteMen} men`})
            </div>
          </div>
        </div>

        {/* Center Versus / Status */}
        <div className="text-center px-2">
          {result.status === 'ongoing' ? (
            isAiThinking ? (
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium animate-pulse">
                <Bot className="w-3.5 h-3.5 animate-spin" />
                <span>Thinking...</span>
              </div>
            ) : (
              <div className="text-xs font-semibold text-stone-300 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>{turn === 'W' ? 'White' : 'Black'}'s Turn</span>
              </div>
            )
          ) : result.status === 'win' ? (
            <div className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              {result.winner === 'W' ? 'White' : 'Black'} Won!
            </div>
          ) : (
            <div className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
              Draw Game
            </div>
          )}
        </div>

        {/* Black / Opponent */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
            turn === 'B' && result.status === 'ongoing'
              ? 'bg-amber-500/20 border border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
              : 'opacity-70'
          }`}
        >
          <div className="text-right">
            <div className="text-xs font-bold text-white flex items-center justify-end gap-1">
              Black {gameMode === 'ai' ? `(AI ${difficulty})` : '(P2)'}
            </div>
            <div className="text-[10px] text-stone-400 font-mono">
              {blackTotal} pcs ({blackKings > 0 ? `${blackKings} 👑` : `${blackMen} men`})
            </div>
          </div>
          <div className="w-6 h-6 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center text-amber-400 font-bold text-xs shadow-sm">
            {gameMode === 'ai' ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
          </div>
        </div>
      </div>
    </div>
  );
};

