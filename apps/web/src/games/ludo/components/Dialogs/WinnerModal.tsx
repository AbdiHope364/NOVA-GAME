import React, { useEffect } from 'react';
import { Award, Home, RotateCcw, Trophy } from 'lucide-react';
import { LudoColor, LudoMatchState } from '@nova/game-ludo';
import { LUDO_COLORS, LudoPlayerConfig } from '../../types';
import { playSound, triggerHaptic } from '../../audio';

export interface WinnerModalProps {
  isOpen: boolean;
  state: LudoMatchState;
  playerConfigs: Record<number, LudoPlayerConfig>;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
  onPlayAgain: () => void;
  onBackHome: () => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  isOpen,
  state,
  playerConfigs,
  soundEnabled = true,
  vibrationEnabled = true,
  onPlayAgain,
  onBackHome,
}) => {
  useEffect(() => {
    if (isOpen) {
      playSound.winFanfare(soundEnabled);
      triggerHaptic('win', vibrationEnabled);
    }
  }, [isOpen, soundEnabled, vibrationEnabled]);

  if (!isOpen || !state.winnerSeat) return null;

  const winnerSeatConfig = playerConfigs[state.winnerSeat];
  const winnerColor = state.winnerColor || winnerSeatConfig?.color || 'RED';
  const winnerMeta = LUDO_COLORS[winnerColor];

  // Rank players: 1st is winner, then sorted by completed tokens then progress
  const rankedSeats = [...state.seats].sort((a, b) => {
    if (a.seat === state.winnerSeat) return -1;
    if (b.seat === state.winnerSeat) return 1;
    const aFin = a.tokens.filter((t) => t.progress === 56).length;
    const bFin = b.tokens.filter((t) => t.progress === 56).length;
    if (bFin !== aFin) return bFin - aFin;
    const aSum = a.tokens.reduce((acc, t) => acc + (t.progress > 0 ? t.progress : 0), 0);
    const bSum = b.tokens.reduce((acc, t) => acc + (t.progress > 0 ? t.progress : 0), 0);
    return bSum - aSum;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="winner-title"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-300"
    >
      {/* Animated Confetti Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {Array.from({ length: 36 }).map((_, i) => {
          const colors = ['#E53935', '#43A047', '#FDD835', '#1E88E5', '#EC4899', '#A855F7'];
          const randomColor = colors[i % colors.length];
          const leftPercent = (i * 2.8 + (i % 7) * 4) % 100;
          const animDelay = (i * 0.12) % 2.5;
          const animDuration = 2.2 + (i % 4) * 0.6;
          return (
            <span
              key={i}
              className="absolute w-2.5 h-2.5 rounded-sm animate-fall"
              style={{
                backgroundColor: randomColor,
                left: `${leftPercent}%`,
                top: '-10px',
                animation: `fall ${animDuration}s linear infinite`,
                animationDelay: `${animDelay}s`,
                transform: `rotate(${i * 25}deg)`,
              }}
            />
          );
        })}
      </div>

      {/* Celebration Card */}
      <div className="w-full max-w-md rounded-3xl bg-[#1B2A41] border-2 border-amber-400/50 p-6 space-y-5 shadow-[0_0_50px_rgba(250,204,21,0.35)] relative z-10 text-center">
        {/* Trophy Icon */}
        <div className="relative inline-block mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-4xl shadow-xl animate-bounce">
            🏆
          </div>
          <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black shadow">
            1ST PLACE
          </span>
        </div>

        <div>
          <h2 id="winner-title" className="text-2xl font-black text-white tracking-tight">
            {winnerSeatConfig?.name || 'Winner'} Triumphs!
          </h2>
          <p className="text-xs text-amber-300 font-bold mt-1">
            {winnerMeta.label} player has safely guided all 4 tokens home!
          </p>
        </div>

        {/* Podium Standings Table */}
        <div className="rounded-2xl bg-[#141F38] border border-white/10 p-3 space-y-2 text-left">
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-2">
            Final Standings
          </div>
          {rankedSeats.map((seat, rankIdx) => {
            const config = playerConfigs[seat.seat];
            const meta = LUDO_COLORS[seat.color];
            const finished = seat.tokens.filter((t) => t.progress === 56).length;
            const medals = ['🥇', '🥈', '🥉', '4th'];

            return (
              <div
                key={seat.seat}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs ${
                  rankIdx === 0
                    ? 'bg-amber-400/20 border border-amber-400/40 text-amber-200'
                    : 'bg-black/30 text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{medals[rankIdx]}</span>
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: meta.hex }}
                  />
                  <span className="font-bold truncate max-w-[140px]">
                    {config?.name || seat.username}
                  </span>
                </div>
                <div className="font-mono font-bold text-[11px] text-amber-300">
                  {finished}/4 Finished
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={onPlayAgain}
            className="py-3 px-4 rounded-2xl bg-[#43A047] hover:bg-[#388E3C] text-white font-black text-xs inline-flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-102 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Play Again
          </button>
          <button
            type="button"
            onClick={onBackHome}
            className="py-3 px-4 rounded-2xl bg-[#1E88E5] hover:bg-[#1976D2] text-white font-black text-xs inline-flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-102 cursor-pointer"
          >
            <Home className="w-4 h-4" /> Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};
