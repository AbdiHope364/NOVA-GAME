import React from 'react';
import { TttBoard, WinningLine } from '../types/ticTacToe.types';
import { GameCell } from './GameCell';
import { getWinningLineSvgCoords } from '../utils/boardHelpers';

export interface GameBoardProps {
  board: TttBoard;
  winningLine: WinningLine;
  isMyTurn: boolean;
  onCellClick: (index: number) => void;
  disabled?: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  winningLine,
  isMyTurn,
  onCellClick,
  disabled = false,
}) => {
  const lineCoords = getWinningLineSvgCoords(winningLine);
  const winningSet = new Set(winningLine || []);

  return (
    <div className="relative w-full max-w-[330px] sm:max-w-[380px] aspect-square mx-auto p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-slate-950/80 border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-xl">
      {/* 3x3 CSS Grid */}
      <div className="grid grid-cols-3 grid-rows-3 gap-2 sm:gap-3 w-full h-full relative z-10">
        {board.map((cellValue, idx) => (
          <GameCell
            key={`cell-${idx}`}
            index={idx}
            value={cellValue}
            isWinningCell={winningSet.has(idx)}
            isClickable={isMyTurn && cellValue === null && !disabled}
            onClick={() => onCellClick(idx)}
          />
        ))}
      </div>

      {/* Animated Bright Emerald Winning Strike Line Overlay */}
      {lineCoords && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-30"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Outer glow */}
          <line
            x1={lineCoords.x1}
            y1={lineCoords.y1}
            x2={lineCoords.x2}
            y2={lineCoords.y2}
            stroke="#10b981"
            strokeWidth="5"
            strokeLinecap="round"
            className="opacity-75 blur-sm"
          />
          {/* Core bright neon beam */}
          <line
            x1={lineCoords.x1}
            y1={lineCoords.y1}
            x2={lineCoords.x2}
            y2={lineCoords.y2}
            stroke="#6ee7b7"
            strokeWidth="3"
            strokeLinecap="round"
            className="drop-shadow-[0_0_10px_#10b981] animate-in fade-in duration-300"
          />
        </svg>
      )}
    </div>
  );
};
