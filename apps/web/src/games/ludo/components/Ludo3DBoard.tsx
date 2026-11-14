import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LUDO_FINISH_CELLS,
  LUDO_HOME_COLUMNS,
  LUDO_OUTER_TRACK,
  LUDO_SAFE_TRACK_INDICES,
  LUDO_START_TRACK_INDEX,
  LudoColor,
  LudoMatchState,
  getTokenBoardCoord,
} from '@nova/game-ludo';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { LudoPawn3D } from './LudoPawn3D';

export interface Ludo3DBoardProps {
  state: LudoMatchState;
  mySeat: number;
  isMyTurn: boolean;
  legalTokenIndices: number[];
  onMoveToken: (tokenIndex: number) => void;
  playerNames?: Partial<Record<LudoColor, string>>;
  theme?: 'CLASSIC' | 'GLOW' | 'STADIUM';
}

export const Ludo3DBoard: React.FC<Ludo3DBoardProps> = ({
  state,
  mySeat,
  isMyTurn,
  legalTokenIndices,
  onMoveToken,
  playerNames = {},
  theme = 'CLASSIC',
}) => {
  const legalTokenSet = useMemo(() => new Set(legalTokenIndices), [legalTokenIndices]);

  // Gentle acoustic tile hop sound when token steps on each box
  const playStepSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(620, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(340, ctx.currentTime + 0.045);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  };

  // Step-by-step displayed progress state for every token
  const [displayProgress, setDisplayProgress] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    state.seats.forEach((s) => {
      s.tokens.forEach((t) => {
        init[`${s.color}-${t.tokenIndex}`] = t.progress;
      });
    });
    return init;
  });

  const [activeSteppingKey, setActiveSteppingKey] = useState<string | null>(null);
  const isWalkingRef = useRef(false);

  // Detect advancement and animate the token one by one box on the line
  useEffect(() => {
    let advancingToken: { key: string; from: number; to: number } | null = null;
    let capturedKeys: string[] = [];

    state.seats.forEach((s) => {
      s.tokens.forEach((t) => {
        const key = `${s.color}-${t.tokenIndex}`;
        const cur = displayProgress[key] ?? t.progress;
        if (t.progress > cur) {
          advancingToken = { key, from: cur, to: t.progress };
        } else if (t.progress === 0 && cur > 0) {
          capturedKeys.push(key);
        }
      });
    });

    if (!advancingToken) {
      setDisplayProgress((prev) => {
        let changed = false;
        const next = { ...prev };
        state.seats.forEach((s) => {
          s.tokens.forEach((t) => {
            const key = `${s.color}-${t.tokenIndex}`;
            if (next[key] !== t.progress) {
              next[key] = t.progress;
              changed = true;
            }
          });
        });
        return changed ? next : prev;
      });
      return;
    }

    if (isWalkingRef.current) return;
    isWalkingRef.current = true;

    const { key, from, to } = advancingToken;
    setActiveSteppingKey(key);

    let currentStep: number = from;
    // Step interval: 200ms per box ensures a smooth box-by-box walk along the line
    const stepInterval = setInterval(() => {
      currentStep += 1;
      playStepSound();

      setDisplayProgress((prev) => ({
        ...prev,
        [key]: currentStep,
      }));

      if (currentStep >= to) {
        clearInterval(stepInterval);
        isWalkingRef.current = false;
        setActiveSteppingKey(null);

        if (capturedKeys.length > 0) {
          setDisplayProgress((prev) => {
            const next = { ...prev };
            capturedKeys.forEach((ck) => {
              next[ck] = 0;
            });
            return next;
          });
        }
      }
    }, 200);

    return () => clearInterval(stepInterval);
  }, [state, displayProgress]);

  // Map outer track coordinates for safe stars and start indicators
  const outerCoordMap = useMemo(() => {
    const map = new Map<string, number>();
    LUDO_OUTER_TRACK.forEach((coord, idx) => {
      map.set(`${coord.row},${coord.col}`, idx);
    });
    return map;
  }, []);

  // Map tokens to coordinates using the current step-by-step displayProgress
  const tokensByCoord = useMemo(() => {
    const map = new Map<
      string,
      Array<{
        seat: number;
        color: LudoColor;
        tokenIndex: number;
        state: string;
      }>
    >();

    state.seats.forEach((s) => {
      if (s.forfeited) return;
      s.tokens.forEach((t) => {
        const key = `${s.color}-${t.tokenIndex}`;
        const prog = displayProgress[key] ?? t.progress;
        const coord = getTokenBoardCoord(s.color, t.tokenIndex, prog);
        const cellKey = `${coord.row},${coord.col}`;
        const arr = map.get(cellKey) || [];
        arr.push({
          seat: s.seat,
          color: s.color,
          tokenIndex: t.tokenIndex,
          state: prog === 0 ? 'HOME' : prog === 56 ? 'FINISHED' : 'ACTIVE',
        });
        map.set(cellKey, arr);
      });
    });

    return map;
  }, [state, displayProgress]);

  // Track arrow direction based on board position
  const getTrackArrow = (row: number, col: number) => {
    if (row === 6 && col === 1) return 'right'; // Red start arrow
    if (row === 1 && col === 8) return 'down'; // Green start arrow
    if (row === 8 && col === 13) return 'left'; // Yellow start arrow
    if (row === 13 && col === 6) return 'up'; // Blue start arrow
    return null;
  };

  // Determine cell background styling matching classic Ludo King or Glow Neon
  const getCellStyle = (row: number, col: number) => {
    if (theme === 'GLOW') {
      // 1. Red Yard (Top-Left: rows 0..5, cols 0..5)
      if (row < 6 && col < 6) return 'bg-[#180A0E] border-rose-900/40';
      // 2. Green Yard (Top-Right: rows 0..5, cols 9..14)
      if (row < 6 && col > 8) return 'bg-[#08180E] border-emerald-900/40';
      // 3. Blue Yard (Bottom-Left: rows 9..14, cols 0..5)
      if (row > 8 && col < 6) return 'bg-[#091526] border-sky-900/40';
      // 4. Yellow Yard (Bottom-Right: rows 9..14, cols 9..14)
      if (row > 8 && col > 8) return 'bg-[#1C1808] border-amber-900/40';

      // 5. Center 3x3 Home (rows 6..8, cols 6..8)
      if (row >= 6 && row <= 8 && col >= 6 && col <= 8) return 'bg-[#0C1222] border-cyan-500/40';

      // 6. Home columns (Neon luminous strips)
      if (col === 7 && row >= 1 && row <= 5) return 'bg-emerald-600/40 border-emerald-400 shadow-[inset_0_0_8px_rgba(16,185,129,0.5)]';
      if (col === 7 && row >= 9 && row <= 13) return 'bg-sky-600/40 border-sky-400 shadow-[inset_0_0_8px_rgba(14,165,233,0.5)]';
      if (row === 7 && col >= 1 && col <= 5) return 'bg-rose-600/40 border-rose-400 shadow-[inset_0_0_8px_rgba(244,63,94,0.5)]';
      if (row === 7 && col >= 9 && col <= 13) return 'bg-amber-500/40 border-amber-400 shadow-[inset_0_0_8px_rgba(245,158,11,0.5)]';

      // 7. Starting squares
      if (row === 6 && col === 1) return 'bg-rose-500/70 border-rose-400 text-white shadow-[0_0_10px_rgba(244,63,94,0.6)]';
      if (row === 1 && col === 8) return 'bg-emerald-500/70 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.6)]';
      if (row === 8 && col === 13) return 'bg-amber-400/70 border-amber-300 text-black shadow-[0_0_10px_rgba(245,158,11,0.6)]';
      if (row === 13 && col === 6) return 'bg-sky-500/70 border-sky-400 text-white shadow-[0_0_10px_rgba(14,165,233,0.6)]';

      // 8. Regular outer track tile (Dark neon tile)
      return 'bg-[#0B1224] border-slate-700/60 shadow-[inset_0_0_4px_rgba(15,23,42,0.8)]';
    }

    // Classic Theme (Default)
    // 1. Red Yard (Top-Left: rows 0..5, cols 0..5)
    if (row < 6 && col < 6) return 'bg-[#E52521] border-transparent';
    // 2. Green Yard (Top-Right: rows 0..5, cols 9..14)
    if (row < 6 && col > 8) return 'bg-[#28A745] border-transparent';
    // 3. Blue Yard (Bottom-Left: rows 9..14, cols 0..5)
    if (row > 8 && col < 6) return 'bg-[#0099E5] border-transparent';
    // 4. Yellow Yard (Bottom-Right: rows 9..14, cols 9..14)
    if (row > 8 && col > 8) return 'bg-[#FFCC00] border-transparent';

    // 5. Center 3x3 Home (rows 6..8, cols 6..8)
    if (row >= 6 && row <= 8 && col >= 6 && col <= 8) return 'bg-white border-black';

    // 6. Home columns (5 colored steps leading to center)
    if (col === 7 && row >= 1 && row <= 5) return 'bg-[#28A745] border-black/80'; // Green Home Path
    if (col === 7 && row >= 9 && row <= 13) return 'bg-[#0099E5] border-black/80'; // Blue Home Path
    if (row === 7 && col >= 1 && col <= 5) return 'bg-[#E52521] border-black/80'; // Red Home Path
    if (row === 7 && col >= 9 && col <= 13) return 'bg-[#FFCC00] border-black/80'; // Yellow Home Path

    // 7. Starting squares
    if (row === 6 && col === 1) return 'bg-[#E52521] border-black/80 text-white'; // Red Start
    if (row === 1 && col === 8) return 'bg-[#28A745] border-black/80 text-white'; // Green Start
    if (row === 8 && col === 13) return 'bg-[#FFCC00] border-black/80 text-black'; // Yellow Start
    if (row === 13 && col === 6) return 'bg-[#0099E5] border-black/80 text-white'; // Blue Start

    // 8. Regular outer track tile (Pure white with black borders)
    return 'bg-white border-black/75';
  };

  // Safe star cells (Outlined 5-point gray star matching screenshot)
  const isSafeStarCell = (row: number, col: number) => {
    return (
      (row === 8 && col === 2) || // Red side star
      (row === 2 && col === 6) || // Green side star
      (row === 6 && col === 12) || // Yellow side star
      (row === 12 && col === 8) // Blue side star
    );
  };

  return (
    <div className={`w-full flex flex-col items-center select-none ${theme === 'STADIUM' ? 'perspective-[1000px]' : ''}`}>
      {/* Board Outer Container */}
      <div
        className={`w-full max-w-[500px] aspect-square rounded-2xl p-1 transition-all duration-300 relative ${
          theme === 'GLOW'
            ? 'bg-[#0B1224] border-4 border-cyan-400/80 shadow-[0_0_35px_rgba(6,182,212,0.4)]'
            : theme === 'STADIUM'
            ? 'bg-[#10172A] border-4 border-amber-400/60 shadow-[0_20px_50px_rgba(0,0,0,0.85)]'
            : 'bg-black border-4 border-black shadow-2xl'
        }`}
        style={theme === 'STADIUM' ? { transform: 'rotateX(16deg)', transformStyle: 'preserve-3d' } : undefined}
      >
        {/* 15x15 Grid Canvas */}
        <div
          className={`w-full h-full grid relative overflow-hidden ${
            theme === 'GLOW' ? 'bg-[#080E1E]' : 'bg-white'
          }`}
          style={{
            gridTemplateColumns: 'repeat(15, minmax(0, 1fr))',
            gridTemplateRows: 'repeat(15, minmax(0, 1fr))',
          }}
        >
          {/* RENDER CELLS */}
          {Array.from({ length: 15 }, (_, row) =>
            Array.from({ length: 15 }, (_, col) => {
              const key = `${row},${col}`;
              const cellTokens = tokensByCoord.get(key) || [];
              const arrow = getTrackArrow(row, col);
              const isStar = isSafeStarCell(row, col);
              const isCellSteppedOn = cellTokens.some(
                (tok) => activeSteppingKey === `${tok.color}-${tok.tokenIndex}`
              );

              return (
                <div
                  key={key}
                  className={`relative flex items-center justify-center border-[0.6px] text-[8px] font-bold ${getCellStyle(
                    row,
                    col
                  )} ${
                    isCellSteppedOn
                      ? 'ring-2 ring-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.9)] z-30 scale-105'
                      : ''
                  }`}
                >
                  {/* Start Arrows */}
                  {arrow && cellTokens.length === 0 && (
                    <div className="flex items-center justify-center pointer-events-none drop-shadow">
                      {arrow === 'right' && (
                        <ArrowRight className="w-3.5 h-3.5 text-white stroke-[3]" />
                      )}
                      {arrow === 'down' && (
                        <ArrowDown className="w-3.5 h-3.5 text-white stroke-[3]" />
                      )}
                      {arrow === 'left' && (
                        <ArrowLeft className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                      )}
                      {arrow === 'up' && (
                        <ArrowUp className="w-3.5 h-3.5 text-white stroke-[3]" />
                      )}
                    </div>
                  )}

                  {/* Outlined Star Icon on Safe Squares */}
                  {isStar && cellTokens.length === 0 && (
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-slate-400 stroke-2 drop-shadow-sm">
                      <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
                    </svg>
                  )}

                  {/* Central 3x3 Finishing Zone (4 Colored Triangles meeting in the center) */}
                  {row === 7 && col === 7 && (
                    <div className="absolute -inset-[100%] z-10 pointer-events-none flex items-center justify-center overflow-hidden border-2 border-black">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        {/* Top Green Triangle */}
                        <polygon points="0,0 100,0 50,50" fill="#28A745" />
                        {/* Right Yellow Triangle */}
                        <polygon points="100,0 100,100 50,50" fill="#FFCC00" />
                        {/* Bottom Blue Triangle */}
                        <polygon points="100,100 0,100 50,50" fill="#0099E5" />
                        {/* Left Red Triangle */}
                        <polygon points="0,100 0,0 50,50" fill="#E52521" />
                        <line x1="0" y1="0" x2="100" y2="100" stroke="#000000" strokeWidth="1" />
                        <line x1="100" y1="0" x2="0" y2="100" stroke="#000000" strokeWidth="1" />
                      </svg>
                    </div>
                  )}

                  {/* Pawns */}
                  {cellTokens.length > 0 && (
                    <div className="absolute inset-0 z-20 flex flex-wrap items-center justify-center p-0.5 gap-0.5 pointer-events-auto">
                      {/* Blockade Shield Badge when 2+ tokens of same color form a block */}
                      {cellTokens.length >= 2 && cellTokens.every((c) => c.color === cellTokens[0].color) && (
                        <span className="absolute -top-1.5 -right-1 z-30 px-1 rounded-full bg-slate-950/90 border border-amber-400 text-[8px] font-black text-amber-300 shadow flex items-center gap-0.5 pointer-events-none">
                          🛡️{cellTokens.length}
                        </span>
                      )}
                      {cellTokens.map((tok) => {
                        const canClick =
                          isMyTurn &&
                          state.turnPhase === 'MOVE' &&
                          tok.seat === mySeat &&
                          legalTokenSet.has(tok.tokenIndex);
                        const isStepping =
                          activeSteppingKey === `${tok.color}-${tok.tokenIndex}`;

                        return (
                          <div key={`${tok.color}-${tok.tokenIndex}`}>
                            <LudoPawn3D
                              color={tok.color}
                              isSelectable={canClick}
                              isStepping={isStepping}
                              tokenNumber={tok.tokenIndex + 1}
                              size={cellTokens.length > 1 ? 'sm' : 'md'}
                              variant={theme === 'GLOW' ? 'gem' : 'pawn'}
                              onClick={() => canClick && onMoveToken(tok.tokenIndex)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* 4 YARD BASES (Matching screenshot with Player Name banner + White Square + 4 Circular Recessed Pedestals) */}

          {/* Top-Left: RED YARD */}
          <div className="absolute top-0 left-0 w-[40%] h-[40%] pointer-events-none flex flex-col items-center justify-center p-1.5 bg-[#E52521] border-r-2 border-b-2 border-black">
            <span className="text-white text-[11px] font-black uppercase tracking-wider mb-1 drop-shadow">
              {playerNames.RED || 'GUEST'}
            </span>
            <div className="w-[84%] h-[84%] bg-white rounded-xl border-2 border-black/40 shadow-inner flex items-center justify-center">
              <div className="grid grid-cols-2 grid-rows-2 gap-3 p-2">
                {[0, 1, 2, 3].map((slot) => (
                  <div
                    key={`red-slot-${slot}`}
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#E52521] border-2 border-[#B31B18] shadow-inner flex items-center justify-center"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Top-Right: GREEN YARD */}
          <div className="absolute top-0 right-0 w-[40%] h-[40%] pointer-events-none flex flex-col items-center justify-center p-1.5 bg-[#28A745] border-l-2 border-b-2 border-black">
            <span className="text-white text-[11px] font-black uppercase tracking-wider mb-1 drop-shadow">
              {playerNames.GREEN || 'TENDER'}
            </span>
            <div className="w-[84%] h-[84%] bg-white rounded-xl border-2 border-black/40 shadow-inner flex items-center justify-center">
              <div className="grid grid-cols-2 grid-rows-2 gap-3 p-2">
                {[0, 1, 2, 3].map((slot) => (
                  <div
                    key={`green-slot-${slot}`}
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#28A745] border-2 border-[#1E7E34] shadow-inner flex items-center justify-center"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Bottom-Left: BLUE YARD */}
          <div className="absolute bottom-0 left-0 w-[40%] h-[40%] pointer-events-none flex flex-col items-center justify-center p-1.5 bg-[#0099E5] border-r-2 border-t-2 border-black">
            <div className="w-[84%] h-[84%] bg-white rounded-xl border-2 border-black/40 shadow-inner flex items-center justify-center">
              <div className="grid grid-cols-2 grid-rows-2 gap-3 p-2">
                {[0, 1, 2, 3].map((slot) => (
                  <div
                    key={`blue-slot-${slot}`}
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#0099E5] border-2 border-[#0077B3] shadow-inner flex items-center justify-center"
                  />
                ))}
              </div>
            </div>
            <span className="text-white text-[11px] font-black uppercase tracking-wider mt-1 drop-shadow">
              {playerNames.BLUE || 'GUEST'}
            </span>
          </div>

          {/* Bottom-Right: YELLOW YARD */}
          <div className="absolute bottom-0 right-0 w-[40%] h-[40%] pointer-events-none flex flex-col items-center justify-center p-1.5 bg-[#FFCC00] border-l-2 border-t-2 border-black">
            <div className="w-[84%] h-[84%] bg-white rounded-xl border-2 border-black/40 shadow-inner flex items-center justify-center">
              <div className="grid grid-cols-2 grid-rows-2 gap-3 p-2">
                {[0, 1, 2, 3].map((slot) => (
                  <div
                    key={`yellow-slot-${slot}`}
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#FFCC00] border-2 border-[#DDAA00] shadow-inner flex items-center justify-center"
                  />
                ))}
              </div>
            </div>
            <span className="text-slate-950 text-[11px] font-black uppercase tracking-wider mt-1 drop-shadow">
              {playerNames.YELLOW || 'EVE'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
