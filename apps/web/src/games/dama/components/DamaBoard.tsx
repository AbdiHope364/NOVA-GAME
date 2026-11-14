import React from 'react';
import { Crown } from 'lucide-react';
import {
  Board,
  Pos,
  LegalMove,
  Color,
  isDarkSquare,
} from '@nova/game-dama';

interface DamaBoardProps {
  board: Board;
  turn: Color;
  selectedPos: Pos | null;
  validMovesForSelected: LegalMove[];
  compulsoryPieces: Pos[];
  lastMove: { from: Pos; to: Pos } | null;
  onSquareClick: (r: number, c: number) => void;
  playerColor?: Color;
  disabled?: boolean;
  flipped?: boolean;
}

export const DamaBoard: React.FC<DamaBoardProps> = ({
  board,
  turn,
  selectedPos,
  validMovesForSelected,
  compulsoryPieces,
  lastMove,
  onSquareClick,
  playerColor = 'W',
  disabled = false,
  flipped = false,
}) => {
  const isPos = (pos: Pos, r: number, c: number) => pos[0] === r && pos[1] === c;
  const isSelected = (r: number, c: number) => (selectedPos ? isPos(selectedPos, r, c) : false);

  const isValidTarget = (r: number, c: number) =>
    validMovesForSelected.some((m) => {
      const dest = m.path[m.path.length - 1];
      return isPos(dest, r, c);
    });

  const isCompulsory = (r: number, c: number) => compulsoryPieces.some((p) => isPos(p, r, c));

  const isLastMoveSquare = (r: number, c: number) =>
    lastMove ? isPos(lastMove.from, r, c) || isPos(lastMove.to, r, c) : false;

  const rows = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const cols = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const colLetters = flipped ? ['H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'] : ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  return (
    <div
      className="relative w-full max-w-[min(calc(100vw-16px),460px,calc(100dvh-200px))] aspect-square mx-auto p-2 sm:p-3.5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#4a260f] via-[#2c1305] to-[#1a0802] shadow-[0_10px_35px_rgba(0,0,0,0.85)] border-4 border-[#6d3a17] select-none touch-manipulation flex flex-col"
      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
    >
      {/* Top Column Notations A - H */}
      <div className="grid grid-cols-8 w-full pl-5 sm:pl-6 pr-0.5 mb-1">
        {colLetters.map((l) => (
          <span
            key={l}
            className="text-center text-[10px] sm:text-xs font-black text-amber-200/80 font-mono tracking-wider"
          >
            {l}
          </span>
        ))}
      </div>

      <div className="flex-1 flex w-full">
        {/* Left Row Notations 1 - 8 */}
        <div className="flex flex-col justify-around pr-1 sm:pr-1.5 w-4 sm:w-5">
          {rows.map((r) => (
            <span
              key={r}
              className="text-center text-[10px] sm:text-xs font-black text-amber-200/80 font-mono leading-none"
            >
              {8 - r}
            </span>
          ))}
        </div>

        {/* 8x8 Wooden Checkered Board */}
        <div className="flex-1 rounded-xl overflow-hidden grid grid-cols-8 grid-rows-8 border-2 border-[#54290d] shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] aspect-square">
          {rows.map((r) =>
            cols.map((c) => {
              const dark = isDarkSquare(r, c);
              const piece = board[r][c];
              const selected = isSelected(r, c);
              const validTarget = isValidTarget(r, c);
              const compulsory = isCompulsory(r, c);
              const wasLastMove = isLastMoveSquare(r, c);

              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  disabled={disabled || (!dark && !selected)}
                  onClick={() => onSquareClick(r, c)}
                  className={`
                    relative flex items-center justify-center transition-all duration-150 select-none touch-manipulation focus:outline-none p-0 m-0
                    ${
                      dark
                        ? 'bg-gradient-to-br from-[#452714] to-[#341b0c] shadow-[inset_0_0_6px_rgba(245,158,11,0.18)]'
                        : 'bg-gradient-to-br from-[#dec098] to-[#cba374] cursor-default'
                    }
                    ${dark && wasLastMove ? 'ring-2 ring-inset ring-amber-400/60 bg-[#593219]' : ''}
                    ${selected ? 'ring-3 ring-inset ring-amber-400 bg-[#5e351b]' : ''}
                    ${dark && !disabled ? 'active:brightness-125' : ''}
                  `}
                  aria-label={`Square ${String.fromCharCode(65 + c)}${8 - r}`}
                >
                  {/* Valid Landing Target Indicator */}
                  {validTarget && (
                    <div className="z-10 absolute inset-0 flex items-center justify-center pointer-events-none">
                      {piece ? (
                        <div className="w-[88%] h-[88%] rounded-full border-2 border-dashed border-red-400 animate-pulse" />
                      ) : (
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)] animate-pulse" />
                      )}
                    </div>
                  )}

                  {/* 3D Ribbed Checkers Piece */}
                  {piece && (
                    <div
                      className={`
                        relative z-20 w-[84%] h-[84%] rounded-full flex items-center justify-center transition-transform duration-150
                        ${
                          piece.color === 'W'
                            ? 'bg-[radial-gradient(circle_at_35%_25%,#ffffff_0%,#f5f5f4_40%,#d6d3d1_90%)] shadow-[0_4px_8px_rgba(0,0,0,0.65),inset_0_2px_4px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(0,0,0,0.35)] border border-stone-200'
                            : 'bg-[radial-gradient(circle_at_35%_25%,#444444_0%,#181818_40%,#050505_95%)] shadow-[0_4px_8px_rgba(0,0,0,0.9),inset_0_2px_3px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.9)] border border-stone-800'
                        }
                        ${selected ? 'scale-105 ring-2 sm:ring-4 ring-amber-400' : ''}
                        ${compulsory && piece.color === turn ? 'ring-2 ring-red-400 ring-offset-1 ring-offset-stone-900 animate-pulse' : ''}
                      `}
                    >
                      {/* Concentric Ribbed Ring */}
                      <div
                        className={`
                          w-[68%] h-[68%] rounded-full border-2 flex items-center justify-center
                          ${piece.color === 'W' ? 'border-stone-300 shadow-inner' : 'border-stone-700 shadow-inner'}
                        `}
                      >
                        {/* Center Ring / King Crown */}
                        {piece.king ? (
                          <Crown
                            className={`w-3.5 h-3.5 sm:w-5 sm:h-5 drop-shadow ${
                              piece.color === 'W' ? 'text-amber-600 fill-amber-400' : 'text-amber-400 fill-amber-300'
                            }`}
                          />
                        ) : (
                          <div
                            className={`w-[50%] h-[50%] rounded-full border ${
                              piece.color === 'W' ? 'border-stone-200 bg-stone-100' : 'border-stone-800 bg-stone-900'
                            }`}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
