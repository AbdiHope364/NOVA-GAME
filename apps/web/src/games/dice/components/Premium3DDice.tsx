import React, { useMemo } from 'react';
import { DiceAnimationPhase } from '../hooks/useDice';

export interface Premium3DDiceProps {
  value: number; // Current value (1-6)
  phase: DiceAnimationPhase;
  size?: number; // Size in pixels (default 100)
}

// Exact rotation needed to bring each face (1-6) to point straight towards the viewer
const FACE_ROTATIONS: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: -90, y: 0 },
  3: { x: 0, y: -90 },
  4: { x: 0, y: 90 },
  5: { x: 90, y: 0 },
  6: { x: 0, y: 180 },
};

// 3x3 grid coordinates for pips
const PIP_COORDINATES: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

const DieFace: React.FC<{
  faceValue: number;
  size: number;
  isWon: boolean;
}> = ({ faceValue, size, isWon }) => {
  const pips = PIP_COORDINATES[faceValue] || [];
  const pipSize = Math.max(8, Math.round(size * 0.18));

  return (
    <div
      className={`absolute inset-0 rounded-2xl select-none backface-hidden p-2.5 flex items-center justify-center border transition-all duration-300 ${
        isWon
          ? 'bg-gradient-to-br from-white via-emerald-50 to-emerald-100/90 border-emerald-400 shadow-[inset_0_2px_6px_rgba(255,255,255,1),inset_0_-3px_6px_rgba(16,185,129,0.3)]'
          : 'bg-gradient-to-br from-white via-slate-50 to-slate-200 border-white/80 shadow-[inset_0_3px_6px_rgba(255,255,255,1),inset_0_-3px_6px_rgba(15,23,42,0.2),0_8px_20px_rgba(0,0,0,0.25)]'
      }`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      {/* Specular Diagonal Reflection Sheen */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-80" />

      {/* 3x3 Pip Grid */}
      <div className="w-full h-full grid grid-cols-3 grid-rows-3 items-center justify-items-center relative z-10">
        {Array.from({ length: 3 }, (_, r) =>
          Array.from({ length: 3 }, (_, c) => {
            const hasPip = pips.some(([pr, pc]) => pr === r && pc === c);
            if (!hasPip) {
              return <div key={`${r}-${c}`} className="w-full h-full" />;
            }

            const isRedCenterPip = faceValue === 1;

            return (
              <div
                key={`${r}-${c}`}
                className="rounded-full flex items-center justify-center transition-all duration-300"
                style={{
                  width: `${pipSize}px`,
                  height: `${pipSize}px`,
                  backgroundColor: isRedCenterPip ? '#EF4444' : '#0F172A',
                  boxShadow: isRedCenterPip
                    ? 'inset 0 1px 3px rgba(0,0,0,0.4), 0 0 6px rgba(239,68,68,0.5)'
                    : 'inset 0 1.5px 3px rgba(0,0,0,0.8), 0 1px 1px rgba(255,255,255,0.6)',
                }}
              >
                {/* Subtle highlight dot inside pip */}
                <span
                  className="rounded-full bg-white/40 block"
                  style={{
                    width: `${Math.max(2, pipSize * 0.28)}px`,
                    height: `${Math.max(2, pipSize * 0.28)}px`,
                    transform: 'translate(-25%, -25%)',
                  }}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export const Premium3DDice: React.FC<Premium3DDiceProps> = ({
  value,
  phase,
  size = 100,
}) => {
  const half = size / 2;
  const clampedValue = Math.max(1, Math.min(6, Math.round(value || 1)));

  const isIdle = phase === 'IDLE';
  const isRolling = phase === 'ROLLING';
  const isSettling = phase === 'SETTLING';
  const isWon = phase === 'WON';
  const isLost = phase === 'LOST';

  const targetRotation = FACE_ROTATIONS[clampedValue] || { x: 0, y: 0 };

  // Calculate transform for settling and outcome states
  const settleTransform = useMemo(() => {
    // 2 complete flips + target orientation
    const extraX = 720;
    const extraY = 720;
    return `translateY(0px) rotateX(${extraX + targetRotation.x}deg) rotateY(${extraY + targetRotation.y}deg) rotateZ(0deg)`;
  }, [targetRotation]);

  return (
    <div className="flex flex-col items-center justify-center select-none relative py-6">
      {/* 3D Perspective Canvas Container */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: `${size + 40}px`,
          height: `${size + 40}px`,
          perspective: '1000px',
        }}
      >
        {/* Dynamic Ground Shadow */}
        <div
          className={`absolute -bottom-2 rounded-full blur-md transition-all duration-500 pointer-events-none ${
            isWon
              ? 'bg-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.8)] scale-125 opacity-90'
              : isLost
              ? 'bg-rose-500/30 shadow-[0_0_20px_rgba(239,68,68,0.4)] scale-95 opacity-70'
              : isRolling
              ? 'bg-black/60 animate-dice-shadow-tumble'
              : isSettling
              ? 'bg-black/70 scale-100 opacity-80'
              : 'bg-black/55 animate-dice-shadow-idle'
          }`}
          style={{
            width: `${size * 0.9}px`,
            height: `${size * 0.28}px`,
          }}
        />

        {/* Ambient Ring Glow in Won / Lost states */}
        {isWon && (
          <div className="absolute inset-0 rounded-full animate-win-pulse pointer-events-none" />
        )}
        {isLost && (
          <div className="absolute inset-0 rounded-full animate-lose-pulse pointer-events-none" />
        )}

        {/* The 3D Cube Die */}
        <div
          className={`transform-style-3d relative transition-all ${
            isRolling
              ? 'animate-dice-tumble'
              : isIdle
              ? 'animate-dice-idle'
              : ''
          }`}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            transform: isRolling
              ? undefined
              : isIdle
              ? undefined
              : settleTransform,
            transition: isSettling
              ? 'transform 0.5s cubic-bezier(0.18, 0.89, 0.32, 1.15)'
              : isWon || isLost
              ? 'transform 0.3s ease-out'
              : undefined,
          }}
        >
          {/* Face 1 (Front: Z+) */}
          <div
            className="absolute inset-0 transform-style-3d"
            style={{ transform: `translateZ(${half}px)` }}
          >
            <DieFace faceValue={1} size={size} isWon={isWon} />
          </div>

          {/* Face 6 (Back: Z-) */}
          <div
            className="absolute inset-0 transform-style-3d"
            style={{ transform: `rotateY(180deg) translateZ(${half}px)` }}
          >
            <DieFace faceValue={6} size={size} isWon={isWon} />
          </div>

          {/* Face 2 (Top: Y+) */}
          <div
            className="absolute inset-0 transform-style-3d"
            style={{ transform: `rotateX(90deg) translateZ(${half}px)` }}
          >
            <DieFace faceValue={2} size={size} isWon={isWon} />
          </div>

          {/* Face 5 (Bottom: Y-) */}
          <div
            className="absolute inset-0 transform-style-3d"
            style={{ transform: `rotateX(-90deg) translateZ(${half}px)` }}
          >
            <DieFace faceValue={5} size={size} isWon={isWon} />
          </div>

          {/* Face 3 (Right: X+) */}
          <div
            className="absolute inset-0 transform-style-3d"
            style={{ transform: `rotateY(90deg) translateZ(${half}px)` }}
          >
            <DieFace faceValue={3} size={size} isWon={isWon} />
          </div>

          {/* Face 4 (Left: X-) */}
          <div
            className="absolute inset-0 transform-style-3d"
            style={{ transform: `rotateY(-90deg) translateZ(${half}px)` }}
          >
            <DieFace faceValue={4} size={size} isWon={isWon} />
          </div>
        </div>
      </div>
    </div>
  );
};
