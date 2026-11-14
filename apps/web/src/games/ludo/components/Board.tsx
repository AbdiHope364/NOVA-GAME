import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LUDO_FINISH_CELLS,
  LUDO_HOME_COLUMNS,
  LUDO_OUTER_TRACK,
  LudoColor,
  LudoMatchState,
  getTokenBoardCoord,
} from '@nova/game-ludo';
import { LUDO_COLORS, LudoPlayerConfig, LudoTheme } from '../types';
import { playSound } from '../audio';
import { Tile } from './Tile';
import { Token } from './Token';

export interface BoardProps {
  state: LudoMatchState;
  activeSeat: number;
  isMyTurn: boolean;
  legalTokenIndices: number[];
  playerConfigs: Record<number, LudoPlayerConfig>;
  theme: LudoTheme;
  animationSpeed?: 'NORMAL' | 'FAST';
  soundEnabled?: boolean;
  onMoveToken: (tokenIndex: number) => void;
  onCaptureAnimation?: (color: LudoColor) => void;
}

export const Board: React.FC<BoardProps> = ({
  state,
  activeSeat,
  isMyTurn,
  legalTokenIndices,
  playerConfigs,
  theme,
  animationSpeed = 'NORMAL',
  soundEnabled = true,
  onMoveToken,
  onCaptureAnimation,
}) => {
  const legalTokenSet = useMemo(() => new Set(legalTokenIndices), [legalTokenIndices]);

  // Step-by-step displayed progress state for smooth box-by-box walking
  const [displayProgress, setDisplayProgress] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const s of state.seats) {
      for (const t of s.tokens) {
        init[`${s.color}-${t.tokenIndex}`] = t.progress;
      }
    }
    return init;
  });

  const [activeSteppingKey, setActiveSteppingKey] = useState<string | null>(null);
  const [capturedKey, setCapturedKey] = useState<string | null>(null);
  const isWalkingRef = useRef(false);

  // Step-by-step walking animation effect
  useEffect(() => {
    let advancingToken: { key: string; from: number; to: number; color: LudoColor } | null = null;
    let justCaptured: { key: string; color: LudoColor } | null = null;

    for (const s of state.seats) {
      for (const t of s.tokens) {
        const key = `${s.color}-${t.tokenIndex}`;
        const cur = displayProgress[key] ?? t.progress;
        if (t.progress > cur) {
          advancingToken = { key, from: cur, to: t.progress, color: s.color };
        } else if (t.progress === -1 && cur > -1) {
          justCaptured = { key, color: s.color };
        }
      }
    }

    if (justCaptured && !advancingToken) {
      const cap = justCaptured;
      setCapturedKey(cap.key);
      playSound.capture(soundEnabled);
      onCaptureAnimation?.(cap.color);
      setTimeout(() => {
        setDisplayProgress((prev) => ({ ...prev, [cap.key]: -1 }));
        setCapturedKey(null);
      }, 350);
      return;
    }

    if (!advancingToken) {
      setDisplayProgress((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const s of state.seats) {
          for (const t of s.tokens) {
            const key = `${s.color}-${t.tokenIndex}`;
            if (next[key] !== t.progress) {
              next[key] = t.progress;
              changed = true;
            }
          }
        }
        return changed ? next : prev;
      });
      return;
    }

    if (isWalkingRef.current) return;
    isWalkingRef.current = true;

    const activeAdv = advancingToken;
    const tokenKey = activeAdv.key;
    const from = activeAdv.from;
    const to = activeAdv.to;
    let currentStep: number = from;
    const stepDuration = animationSpeed === 'FAST' ? 120 : 190;

    setActiveSteppingKey(tokenKey);

    const stepInterval = setInterval(() => {
      currentStep += 1;
      playSound.hopTick(currentStep, soundEnabled);
      setDisplayProgress((prev) => ({ ...prev, [tokenKey]: currentStep }));

      if (currentStep >= to) {
        clearInterval(stepInterval);
        isWalkingRef.current = false;
        setActiveSteppingKey(null);
        if (to === 56) {
          playSound.starburst(soundEnabled);
        }
      }
    }, stepDuration);

    return () => {
      clearInterval(stepInterval);
      isWalkingRef.current = false;
      setActiveSteppingKey(null);
    };
  }, [state, displayProgress, animationSpeed, soundEnabled, onCaptureAnimation]);

  // Group active TRACK tokens by their board coordinates (row, col) (only progress >= 0)
  const tokensByCoord = useMemo(() => {
    const map = new Map<
      string,
      Array<{
        seat: number;
        color: LudoColor;
        tokenIndex: number;
        progress: number;
      }>
    >();

    for (const s of state.seats) {
      if (s.forfeited) continue;
      for (const t of s.tokens) {
        const key = `${s.color}-${t.tokenIndex}`;
        const prog = displayProgress[key] ?? t.progress;
        if (prog < 0) continue; // In yard! Rendered in corner yards

        const coord = getTokenBoardCoord(s.color, t.tokenIndex, prog);
        const cellKey = `${coord.row},${coord.col}`;
        const arr = map.get(cellKey) || [];
        arr.push({
          seat: s.seat,
          color: s.color,
          tokenIndex: t.tokenIndex,
          progress: prog,
        });
        map.set(cellKey, arr);
      }
    }

    return map;
  }, [state, displayProgress]);

  // Home column coordinate mapping
  const homeColMap = useMemo(() => {
    const m = new Map<string, LudoColor>();
    (Object.keys(LUDO_HOME_COLUMNS) as LudoColor[]).forEach((color) => {
      LUDO_HOME_COLUMNS[color].forEach((c) => m.set(`${c.row},${c.col}`, color));
    });
    return m;
  }, []);

  // Get arrow orientation and color for start squares
  const getStartArrowInfo = (row: number, col: number) => {
    if (row === 6 && col === 1) return { dir: 'right' as const, color: 'RED' as LudoColor };
    if (row === 1 && col === 8) return { dir: 'down' as const, color: 'GREEN' as LudoColor };
    if (row === 8 && col === 13) return { dir: 'left' as const, color: 'YELLOW' as LudoColor };
    if (row === 13 && col === 6) return { dir: 'up' as const, color: 'BLUE' as LudoColor };
    return null;
  };

  const isSafeStar = (row: number, col: number) => {
    return (
      (row === 8 && col === 2) ||
      (row === 2 && col === 6) ||
      (row === 6 && col === 12) ||
      (row === 12 && col === 8)
    );
  };

  const isInsideCornerYard = (row: number, col: number) => {
    return (
      (row < 6 && col < 6) || // Red top-left
      (row < 6 && col > 8) || // Green top-right
      (row > 8 && col < 6) || // Blue bottom-left
      (row > 8 && col > 8)    // Yellow bottom-right
    );
  };

  // Helper to get seat and tokens for a color
  const getSeatData = (color: LudoColor) => {
    const s = state.seats.find((seat) => seat.color === color);
    if (!s) return null;
    return s;
  };

  const redSeat = getSeatData('RED');
  const greenSeat = getSeatData('GREEN');
  const blueSeat = getSeatData('BLUE');
  const yellowSeat = getSeatData('YELLOW');

  // Render individual yard token in base slot
  const renderYardTokenSlot = (
    color: LudoColor,
    slotIdx: number,
    seatData: (typeof state.seats)[0] | null
  ) => {
    if (!seatData) return null;
    const token = seatData.tokens[slotIdx];
    if (!token) return null;

    const key = `${color}-${token.tokenIndex}`;
    const prog = displayProgress[key] ?? token.progress;
    const inYard = prog === -1;

    const canClick =
      inYard &&
      isMyTurn &&
      state.turnPhase === 'MOVE' &&
      seatData.seat === activeSeat &&
      legalTokenSet.has(token.tokenIndex);

    const isCaptured = capturedKey === key;

    // Colored circular slot border & background matching screenshot
    const slotStyles =
      color === 'RED'
        ? 'border-3.5 border-[#b91c1c] bg-[#e52b2b]/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]'
        : color === 'GREEN'
        ? 'border-3.5 border-[#15803d] bg-[#00b050]/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]'
        : color === 'BLUE'
        ? 'border-3.5 border-[#1d4ed8] bg-[#0088e8]/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]'
        : 'border-3.5 border-[#b45309] bg-[#ffda00]/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]';

    return (
      <div
        key={`yard-${color}-slot-${slotIdx}`}
        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center relative ${slotStyles}`}
      >
        {inYard && (
          <Token
            color={color}
            tokenIndex={token.tokenIndex}
            isLegal={canClick}
            isStepping={false}
            isCaptured={isCaptured}
            size="md"
            onClick={() => canClick && onMoveToken(token.tokenIndex)}
          />
        )}
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* Outer Board Frame */}
      <div className="w-full max-w-[520px] aspect-square rounded-3xl p-1.5 transition-all shadow-[0_20px_60px_rgba(0,0,0,0.9)] relative overflow-hidden border-4 bg-[#0a1222] border-[#070d18]">
        {/* 15x15 CSS Grid Canvas */}
        <div
          role="grid"
          aria-label="Ludo board 15 by 15 grid"
          className="w-full h-full grid bg-white relative overflow-hidden rounded-2xl border border-black/80"
          style={{
            gridTemplateColumns: 'repeat(15, minmax(0, 1fr))',
            gridTemplateRows: 'repeat(15, minmax(0, 1fr))',
          }}
        >
          {/* Render track, home columns & center tiles */}
          {Array.from({ length: 15 }, (_, row) =>
            Array.from({ length: 15 }, (_, col) => {
              const key = `${row},${col}`;
              if (isInsideCornerYard(row, col)) {
                // Don't render cells covered by corner yards
                return <div key={key} className="bg-transparent" />;
              }

              const cellTokens = tokensByCoord.get(key) || [];
              const arrowInfo = getStartArrowInfo(row, col);
              const isStar = isSafeStar(row, col);
              const homeColColor = homeColMap.get(key) || null;
              const isCenter = row >= 6 && row <= 8 && col >= 6 && col <= 8;

              return (
                <Tile
                  key={key}
                  row={row}
                  col={col}
                  theme={theme}
                  isStar={isStar}
                  arrowDirection={arrowInfo?.dir}
                  arrowColor={arrowInfo?.color}
                  homeColColor={homeColColor}
                  startSquareColor={arrowInfo ? arrowInfo.color : null}
                  isCenterFinish={isCenter}
                >
                  {cellTokens.length > 0 && (
                    <div className="absolute inset-0 z-20 flex flex-wrap items-center justify-center p-0.5 gap-0.5 pointer-events-auto">
                      {cellTokens.map((tok, offsetIdx) => {
                        const canClick =
                          isMyTurn &&
                          state.turnPhase === 'MOVE' &&
                          tok.seat === activeSeat &&
                          legalTokenSet.has(tok.tokenIndex);
                        const isStepping =
                          activeSteppingKey === `${tok.color}-${tok.tokenIndex}`;
                        const isCaptured =
                          capturedKey === `${tok.color}-${tok.tokenIndex}`;

                        return (
                          <Token
                            key={`${tok.color}-${tok.tokenIndex}`}
                            color={tok.color}
                            tokenIndex={tok.tokenIndex}
                            isLegal={canClick}
                            isStepping={isStepping}
                            isCaptured={isCaptured}
                            stackCount={cellTokens.length}
                            stackOffsetIndex={offsetIdx}
                            size={cellTokens.length > 1 ? 'sm' : 'md'}
                            onClick={() => canClick && onMoveToken(tok.tokenIndex)}
                          />
                        );
                      })}
                    </div>
                  )}
                </Tile>
              );
            })
          )}

          {/* 4 AUTHENTIC CORNER YARD BASES */}

          {/* 1. TOP-LEFT: RED YARD */}
          <div className="absolute top-0 left-0 w-[40%] h-[40%] flex flex-col items-center justify-between p-1.5 sm:p-2 bg-[#E53935] border-r-2 border-b-2 border-black/80 z-10 shadow-sm">
            <span className="text-white text-[11px] sm:text-xs font-black uppercase tracking-wider drop-shadow-md">
              {playerConfigs[redSeat?.seat || 1]?.name || 'GUEST'}
            </span>
            <div className="w-[84%] h-[82%] bg-white rounded-2xl border-2 border-black/30 shadow-inner flex items-center justify-center p-2">
              <div className="grid grid-cols-2 grid-rows-2 gap-3 sm:gap-4 place-items-center">
                {[0, 1, 2, 3].map((slotIdx) =>
                  renderYardTokenSlot('RED', slotIdx, redSeat)
                )}
              </div>
            </div>
            <div className="h-0.5" />
          </div>

          {/* 2. TOP-RIGHT: GREEN YARD */}
          <div className="absolute top-0 right-0 w-[40%] h-[40%] flex flex-col items-center justify-between p-1.5 sm:p-2 bg-[#43A047] border-l-2 border-b-2 border-black/80 z-10 shadow-sm">
            <span className="text-white text-[11px] sm:text-xs font-black uppercase tracking-wider drop-shadow-md">
              {playerConfigs[greenSeat?.seat || 2]?.name || 'TENDER'}
            </span>
            <div className="w-[84%] h-[82%] bg-white rounded-2xl border-2 border-black/30 shadow-inner flex items-center justify-center p-2">
              <div className="grid grid-cols-2 grid-rows-2 gap-3 sm:gap-4 place-items-center">
                {[0, 1, 2, 3].map((slotIdx) =>
                  renderYardTokenSlot('GREEN', slotIdx, greenSeat)
                )}
              </div>
            </div>
            <div className="h-0.5" />
          </div>

          {/* 3. BOTTOM-LEFT: BLUE YARD */}
          <div className="absolute bottom-0 left-0 w-[40%] h-[40%] flex flex-col items-center justify-between p-1.5 sm:p-2 bg-[#1E88E5] border-r-2 border-t-2 border-black/80 z-10 shadow-sm">
            <div className="h-0.5" />
            <div className="w-[84%] h-[82%] bg-white rounded-2xl border-2 border-black/30 shadow-inner flex items-center justify-center p-2">
              <div className="grid grid-cols-2 grid-rows-2 gap-3 sm:gap-4 place-items-center">
                {[0, 1, 2, 3].map((slotIdx) =>
                  renderYardTokenSlot('BLUE', slotIdx, blueSeat)
                )}
              </div>
            </div>
            <span className="text-white text-[11px] sm:text-xs font-black uppercase tracking-wider drop-shadow-md">
              {playerConfigs[blueSeat?.seat || 4]?.name || playerConfigs[2]?.name || 'GUEST'}
            </span>
          </div>

          {/* 4. BOTTOM-RIGHT: YELLOW YARD */}
          <div className="absolute bottom-0 right-0 w-[40%] h-[40%] flex flex-col items-center justify-between p-1.5 sm:p-2 bg-[#FDD835] border-l-2 border-t-2 border-black/80 z-10 shadow-sm">
            <div className="h-0.5" />
            <div className="w-[84%] h-[82%] bg-white rounded-2xl border-2 border-black/30 shadow-inner flex items-center justify-center p-2">
              <div className="grid grid-cols-2 grid-rows-2 gap-3 sm:gap-4 place-items-center">
                {[0, 1, 2, 3].map((slotIdx) =>
                  renderYardTokenSlot('YELLOW', slotIdx, yellowSeat)
                )}
              </div>
            </div>
            <span className="text-slate-950 text-[11px] sm:text-xs font-black uppercase tracking-wider drop-shadow-md">
              {playerConfigs[yellowSeat?.seat || 3]?.name || playerConfigs[2]?.name || 'EVE'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
