import React from 'react';

export interface Ludo3DDiceProps {
  value: number | null;
  isRolling: boolean;
  canRoll: boolean;
  onRoll: () => void;
  size?: number; // size in px, default 56
  variant?: 'classic' | 'glow';
}

const FACE_ROTATIONS: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: 90, y: 0 },
  3: { x: 0, y: -90 },
  4: { x: 0, y: 90 },
  5: { x: -90, y: 0 },
  6: { x: 0, y: 180 },
};

const PipFace: React.FC<{ value: number; size: number; variant?: 'classic' | 'glow' }> = ({
  value,
  size,
  variant = 'glow',
}) => {
  const pipSize = Math.max(6, Math.round(size * 0.18));

  const pipsForValue: Record<number, [number, number][]> = {
    1: [[1, 1]],
    2: [[0, 0], [2, 2]],
    3: [[0, 0], [1, 1], [2, 2]],
    4: [[0, 0], [0, 2], [2, 0], [2, 2]],
    5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
    6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
  };

  const activePips = pipsForValue[value] || [];

  const isGlow = variant === 'glow';

  return (
    <div
      className={`absolute inset-0 rounded-xl border-2 backface-hidden select-none flex items-center justify-center p-2 transition-all ${
        isGlow
          ? 'bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 border-yellow-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),0_0_12px_rgba(250,204,21,0.6)]'
          : 'bg-gradient-to-br from-white via-slate-50 to-slate-200 border-slate-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),inset_0_-2px_4px_rgba(0,0,0,0.15)]'
      }`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      <div className="w-full h-full grid grid-cols-3 grid-rows-3 items-center justify-items-center">
        {Array.from({ length: 3 }, (_, r) =>
          Array.from({ length: 3 }, (_, c) => {
            const hasPip = activePips.some(([pr, pc]) => pr === r && pc === c);
            if (!hasPip) return <div key={`${r}-${c}`} className="w-full h-full" />;
            return (
              <div
                key={`${r}-${c}`}
                className="rounded-full shadow-inner"
                style={{
                  width: `${pipSize}px`,
                  height: `${pipSize}px`,
                  backgroundColor: isGlow
                    ? '#FFFFFF' // Bright incandescent white pips on neon golden die
                    : value === 1
                    ? '#EF4444'
                    : '#0F172A',
                  boxShadow: isGlow ? '0 0 6px #FFFFFF' : 'none',
                }}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export const Ludo3DDice: React.FC<Ludo3DDiceProps> = ({
  value,
  isRolling,
  canRoll,
  onRoll,
  size = 56,
  variant = 'glow',
}) => {
  const half = size / 2;
  const targetRotation = value && FACE_ROTATIONS[value] ? FACE_ROTATIONS[value] : { x: 0, y: 0 };

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <button
        type="button"
        disabled={!canRoll || isRolling}
        onClick={onRoll}
        className={`group relative p-2.5 rounded-2xl transition-all duration-300 flex items-center justify-center focus:outline-none ${
          canRoll && !isRolling
            ? 'cursor-pointer hover:scale-110 active:scale-95 bg-yellow-400/20 ring-2 ring-[#FACC15] shadow-[0_0_30px_rgba(250,204,21,0.6)] animate-pulse'
            : isRolling
            ? 'cursor-wait bg-slate-900/40 ring-1 ring-[#22D3EE]/50 shadow-[0_0_20px_rgba(34,211,238,0.4)]'
            : 'cursor-not-allowed bg-slate-900/30 opacity-80 ring-1 ring-white/10'
        }`}
        style={{ perspective: '800px' }}
        title={canRoll ? 'Click to Roll Dice' : 'Waiting for turn'}
      >
        {/* Soft ground shadow underneath 3D dice */}
        <div
          className={`absolute bottom-0.5 w-12 h-3 rounded-full blur-sm transition-all duration-300 ${
            variant === 'glow'
              ? 'bg-amber-500/40'
              : 'bg-black/60'
          } ${isRolling ? 'scale-75 opacity-40 animate-pulse' : 'scale-100 opacity-80'}`}
        />

        {/* 3D Cube Canvas */}
        <div
          className="relative transition-transform duration-700 ease-out transform-style-3d"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            transform: isRolling
              ? 'translateY(-16px) rotateX(720deg) rotateY(1080deg) rotateZ(360deg)'
              : `rotateX(${targetRotation.x}deg) rotateY(${targetRotation.y}deg)`,
            transitionProperty: 'transform',
            animation: isRolling ? 'ludoDiceTumble 0.6s linear infinite' : 'none',
          }}
        >
          {/* Front Face: 1 */}
          <div
            className="absolute inset-0 transform-style-3d"
            style={{ transform: `rotateY(0deg) translateZ(${half}px)` }}
          >
            <PipFace value={1} size={size} variant={variant} />
          </div>

          {/* Back Face: 6 */}
          <div
            className="absolute inset-0 transform-style-3d"
            style={{ transform: `rotateY(180deg) translateZ(${half}px)` }}
          >
            <PipFace value={6} size={size} variant={variant} />
          </div>

          {/* Right Face: 3 */}
          <div
            className="absolute inset-0 transform-style-3d"
            style={{ transform: `rotateY(90deg) translateZ(${half}px)` }}
          >
            <PipFace value={3} size={size} variant={variant} />
          </div>

          {/* Left Face: 4 */}
          <div
            className="absolute inset-0 transform-style-3d"
            style={{ transform: `rotateY(-90deg) translateZ(${half}px)` }}
          >
            <PipFace value={4} size={size} variant={variant} />
          </div>

          {/* Top Face: 5 */}
          <div
            className="absolute inset-0 transform-style-3d"
            style={{ transform: `rotateX(90deg) translateZ(${half}px)` }}
          >
            <PipFace value={5} size={size} variant={variant} />
          </div>

          {/* Bottom Face: 2 */}
          <div
            className="absolute inset-0 transform-style-3d"
            style={{ transform: `rotateX(-90deg) translateZ(${half}px)` }}
          >
            <PipFace value={2} size={size} variant={variant} />
          </div>
        </div>

        <style>{`
          @keyframes ludoDiceTumble {
            0% { transform: translateY(-12px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1.1); }
            50% { transform: translateY(-24px) rotateX(360deg) rotateY(540deg) rotateZ(180deg) scale(1.2); }
            100% { transform: translateY(-12px) rotateX(720deg) rotateY(1080deg) rotateZ(360deg) scale(1.1); }
          }
        `}</style>
      </button>

      {/* Helper caption */}
      <span
        className={`text-[10px] font-black uppercase tracking-widest mt-1.5 transition-colors ${
          canRoll ? 'text-[#FACC15]' : isRolling ? 'text-[#22D3EE]' : 'text-[#A8A3BC]'
        }`}
      >
        {isRolling ? 'Rolling...' : canRoll ? 'Tap to Roll' : value ? `Rolled ${value}` : 'Dice'}
      </span>
    </div>
  );
};
