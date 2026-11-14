import React from 'react';
import { LudoColor } from '@nova/game-ludo';
import { Ludo3DDice } from './Ludo3DDice';

export interface LudoPlayerStationProps {
  color: LudoColor;
  seat: number;
  username: string;
  level?: number;
  avatarIcon?: string;
  isCurrentTurn: boolean;
  isMyTurn: boolean;
  isMe: boolean;
  canRoll: boolean;
  diceValue: number | null;
  isRolling: boolean;
  onRoll: () => void;
  turnRemainSec?: number | null;
  turnTotalSec?: number;
  autoPlay?: boolean;
  onToggleAutoPlay?: () => void;
  align?: 'left' | 'right'; // 'left' = Avatar on left, Dice on right. 'right' = Dice on left, Avatar on right.
}

const COLOR_BORDER: Record<LudoColor, { border: string; bg: string; badge: string }> = {
  RED: {
    border: 'border-[#EF4444]',
    bg: 'bg-red-500/20',
    badge: 'bg-[#EF4444] text-white',
  },
  GREEN: {
    border: 'border-[#22C55E]',
    bg: 'bg-emerald-500/20',
    badge: 'bg-[#22C55E] text-white',
  },
  YELLOW: {
    border: 'border-[#FACC15]',
    bg: 'bg-amber-400/20',
    badge: 'bg-[#FACC15] text-slate-950',
  },
  BLUE: {
    border: 'border-[#0099E5]',
    bg: 'bg-sky-500/20',
    badge: 'bg-[#0099E5] text-white',
  },
};

export const LudoPlayerStation: React.FC<LudoPlayerStationProps> = ({
  color,
  seat,
  username,
  level = 1,
  avatarIcon,
  isCurrentTurn,
  isMyTurn,
  isMe,
  canRoll,
  diceValue,
  isRolling,
  onRoll,
  turnRemainSec,
  turnTotalSec = 30,
  autoPlay = false,
  onToggleAutoPlay,
  align = 'left',
}) => {
  const styles = COLOR_BORDER[color];
  const timerRatio =
    turnRemainSec !== null && turnRemainSec !== undefined
      ? Math.max(0, Math.min(1, turnRemainSec / turnTotalSec))
      : 1;

  // Avatar block matching exact screenshot styling (square rounded with colored rim)
  const avatarBlock = (
    <div className="relative flex flex-col items-center">
      <div
        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-4 ${styles.border} bg-[#141F38] shadow-lg flex items-center justify-center relative overflow-hidden`}
      >
        {avatarIcon ? (
          <img src={avatarIcon} alt={username} className="w-full h-full object-cover" />
        ) : (
          <div className="text-2xl select-none">
            {color === 'RED'
              ? '👤'
              : color === 'GREEN'
              ? '🍔'
              : color === 'YELLOW'
              ? '👦'
              : '🧑'}
          </div>
        )}

        {/* Level Badge in bottom corner */}
        <span className="absolute bottom-0 inset-x-0 bg-black/75 text-center text-[9px] font-black text-amber-300 tracking-wider py-0.5">
          Lv. {level}
        </span>
      </div>

      {/* Gift Box Icon Attachment (Bottom-Right of Avatar) */}
      <div className="absolute -bottom-1 -right-1.5 w-5 h-5 rounded-md bg-gradient-to-tr from-amber-500 to-yellow-300 border border-amber-600 shadow flex items-center justify-center text-[10px] pointer-events-none">
        🎁
      </div>
    </div>
  );

  // Dice block matching exact screenshot styling
  const diceBlock = (
    <div className="relative flex flex-col items-center">
      {/* Yellow Animated Indicator Arrow (when it's your turn to roll) */}
      {isCurrentTurn && isMyTurn && canRoll && !isRolling && (
        <div className="absolute -right-7 top-1/2 -translate-y-1/2 z-30 pointer-events-none animate-bounce flex items-center">
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.9)]">
            <polygon points="18,5 8,12 18,19" />
          </svg>
        </div>
      )}

      {/* Dice Frame Container */}
      <div
        className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl p-1.5 transition-all flex flex-col items-center justify-center relative ${
          isCurrentTurn
            ? 'bg-[#18345C] border-2 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.7)]'
            : 'bg-[#0E1B33]/90 border border-slate-700/60 shadow-inner opacity-75'
        }`}
      >
        {/* Perimeter countdown timer bar when turn is active */}
        {isCurrentTurn && turnRemainSec !== null && turnRemainSec !== undefined && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none -rotate-90 rounded-2xl"
            viewBox="0 0 100 100"
          >
            <rect
              x="3"
              y="3"
              width="94"
              height="94"
              rx="18"
              fill="none"
              stroke="#22D3EE"
              strokeWidth="5"
              strokeDasharray="360"
              strokeDashoffset={360 * (1 - timerRatio)}
              className="transition-all duration-300"
            />
          </svg>
        )}

        {/* 3D Rolling Dice */}
        <Ludo3DDice
          value={diceValue}
          isRolling={isRolling}
          canRoll={canRoll && isCurrentTurn}
          onRoll={onRoll}
          size={isCurrentTurn ? 48 : 42}
          variant="classic" // Clean white die with black pips matching screenshot
        />
      </div>

      {/* Auto-Play Pill Button (Shown below active dice) */}
      {isMe && (
        <button
          type="button"
          onClick={onToggleAutoPlay}
          className={`mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-colors shadow ${
            autoPlay
              ? 'bg-[#22C55E] text-slate-950 ring-1 ring-white'
              : 'bg-[#0099E5] text-white hover:bg-sky-400'
          }`}
        >
          {autoPlay ? 'AUTO: ON' : 'AUTO-PLAY'}
        </button>
      )}
    </div>
  );

  return (
    <div
      className={`flex items-center gap-2.5 sm:gap-3.5 select-none ${
        align === 'right' ? 'flex-row' : 'flex-row'
      }`}
    >
      {align === 'left' ? (
        <>
          {avatarBlock}
          {diceBlock}
        </>
      ) : (
        <>
          {diceBlock}
          {avatarBlock}
        </>
      )}
    </div>
  );
};
