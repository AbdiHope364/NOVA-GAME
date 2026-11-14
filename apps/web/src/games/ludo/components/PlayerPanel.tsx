import React from 'react';
import { LudoColor } from '@nova/game-ludo';
import { LUDO_COLORS, LudoPlayerConfig, LudoTheme } from '../types';
import { Dice } from './Dice';

export interface PlayerPanelProps {
  player: LudoPlayerConfig;
  isCurrentTurn: boolean;
  isMyTurn: boolean;
  canRoll: boolean;
  isRolling: boolean;
  diceValue: number | null;
  finishedCount: number; // 0..4
  theme: LudoTheme;
  align?: 'left' | 'right';
  onRoll: () => void;
  onToggleAutoPlay?: () => void;
  autoPlayActive?: boolean;
  showChatButton?: boolean;
  onOpenChat?: () => void;
  chatBubbleText?: string | null;
  topElement?: React.ReactNode;
}

export const PlayerPanel: React.FC<PlayerPanelProps> = ({
  player,
  isCurrentTurn,
  isMyTurn,
  canRoll,
  isRolling,
  diceValue,
  finishedCount,
  theme,
  align = 'left',
  onRoll,
  onToggleAutoPlay,
  autoPlayActive = false,
  showChatButton = false,
  onOpenChat,
  chatBubbleText = null,
  topElement = null,
}) => {
  const meta = LUDO_COLORS[player.color];

  // Colors customized to match reference image
  const borderColor =
    player.color === 'RED'
      ? '#E52B2B'
      : player.color === 'GREEN'
      ? '#00B050'
      : player.color === 'BLUE'
      ? '#0088E8'
      : '#F5C518';

  // Render the Dice Sub-Box
  const renderDiceBox = () => {
    if (isCurrentTurn) {
      // ACTIVE DICE POD: Thick glowing cyan border with timer arc, white 3D die, yellow pointing arrow & AUTO-PLAY
      return (
        <div className="relative flex flex-col items-center">
          {/* Yellow Pointing Arrow pointing LEFT directly at the die */}
          <div className="absolute -right-7 top-1/2 -translate-y-1/2 z-30 pointer-events-none animate-pulse drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            <svg width="26" height="22" viewBox="0 0 26 22" fill="none">
              <path
                d="M9 2L2 11L9 20V15H25V7H9V2Z"
                fill="#FFDD00"
                stroke="#C67D00"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Glowing Cyan Dice Box with subtle timer arc on top */}
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl p-1 transition-all duration-300 flex items-center justify-center bg-[#0d223f] border-4 border-[#00e5ff] shadow-[0_0_22px_rgba(0,229,255,0.75)] relative overflow-visible cursor-pointer"
            onClick={canRoll && isMyTurn ? onRoll : undefined}
          >
            {/* Top Border Turn Timer Highlight */}
            <div className="absolute top-0 inset-x-2 h-1 bg-[#a5f3fc] rounded-full blur-[0.4px] pointer-events-none" />

            <Dice
              value={diceValue}
              isRolling={isRolling}
              disabled={!canRoll || !isMyTurn}
              canRoll={canRoll && isMyTurn}
              onRoll={onRoll}
              size="normal"
              themeVariant="active"
            />
          </div>

          {/* AUTO-PLAY Pill directly centered under the active cyan box */}
          <button
            type="button"
            onClick={onToggleAutoPlay}
            className={`mt-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-lg transition-all active:scale-95 border border-white/20 ${
              autoPlayActive
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white ring-2 ring-emerald-300'
                : 'bg-gradient-to-r from-[#0284c7] to-[#06b6d4] hover:brightness-110 text-white'
            }`}
          >
            {autoPlayActive ? 'AUTO: ON' : 'AUTO-PLAY'}
          </button>
        </div>
      );
    }

    // INACTIVE DICE POD: Dark recessed square box with dark grey 3D die
    return (
      <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-b from-[#182337] to-[#0c1322] border-2 border-[#2b3c58] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] flex items-center justify-center p-1">
        <Dice
          value={diceValue ?? 5}
          isRolling={false}
          disabled={true}
          canRoll={false}
          onRoll={() => {}}
          size="compact"
          themeVariant="inactive"
        />
      </div>
    );
  };

  // Render the Avatar Card Sub-Box
  const renderAvatarBox = () => {
    return (
      <div className="relative flex flex-col items-center">
        {/* Rounded Avatar Frame with Player's Color Border */}
        <div
          className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl border-3 flex items-center justify-center text-xl sm:text-2xl shadow-lg relative overflow-hidden transition-all bg-[#121c2e]`}
          style={{
            borderColor: isCurrentTurn ? '#00e5ff' : borderColor,
            boxShadow: isCurrentTurn
              ? '0 0 16px rgba(0,229,255,0.6)'
              : `0 0 10px ${meta.glow}`,
          }}
        >
          {/* Custom Avatar content matching the reference */}
          {player.color === 'GREEN' ? (
            <span className="text-2xl drop-shadow select-none">🍔</span>
          ) : player.color === 'YELLOW' ? (
            <span className="text-2xl drop-shadow select-none">👧</span>
          ) : (
            <span className="text-2xl opacity-40 select-none">👤</span>
          )}

          {/* Level Badge Pill at Bottom */}
          <span className="absolute bottom-0 inset-x-0 bg-black/85 text-center text-[8px] font-black text-[#FACC15] tracking-wider py-0.2">
            Lv. {player.level || (player.color === 'GREEN' ? 24 : player.color === 'YELLOW' ? 8 : 1)}
          </span>
        </div>

        {/* Chat Speech Bubble overlapping Bottom-Left corner (for local active player) */}
        {showChatButton && (
          <button
            type="button"
            onClick={onOpenChat}
            className="absolute -bottom-1.5 -left-2 z-30 transition-transform active:scale-90 cursor-pointer pointer-events-auto hover:brightness-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            aria-label="Open chat"
          >
            {/* White speech bubble with 3 black dots */}
            <svg width="24" height="20" viewBox="0 0 24 20" fill="none">
              <path
                d="M3 2C1.34 2 0 3.34 0 5V13C0 14.66 1.34 16 3 16H5V19.5L9.5 16H21C22.66 16 24 14.66 24 13V5C24 3.34 22.66 2 21 2H3Z"
                fill="#FFFFFF"
                stroke="#1E293B"
                strokeWidth="1.2"
              />
              <circle cx="6.5" cy="9" r="1.3" fill="#0F172A" />
              <circle cx="12" cy="9" r="1.3" fill="#0F172A" />
              <circle cx="17.5" cy="9" r="1.3" fill="#0F172A" />
            </svg>
          </button>
        )}

        {/* 3D Gift Box Mascot Icon on corner (unless chat button is there) */}
        {!showChatButton && (
          <div
            className={`absolute -bottom-1 ${
              align === 'right' ? '-left-1' : '-right-1'
            } w-5 h-5 rounded-md bg-gradient-to-tr from-amber-500 to-yellow-300 border border-amber-600 shadow-md flex items-center justify-center text-[10px] pointer-events-none drop-shadow`}
          >
            🎁
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative flex flex-col items-start select-none">
      {/* Top Element: e.g. Coin Balance placed directly 6px above the avatar */}
      {topElement && (
        <div className="absolute bottom-full mb-1.5 left-0 z-20 pointer-events-none">
          {topElement}
        </div>
      )}

      {/* Floating Chat Bubble when reaction sent */}
      {chatBubbleText && (
        <div className="absolute bottom-full mb-9 left-6 -translate-x-1/2 z-40 bg-white text-slate-950 px-2.5 py-1 rounded-xl text-xs font-black shadow-2xl border-2 border-slate-900 animate-bounce pointer-events-none whitespace-nowrap">
          {chatBubbleText}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
        </div>
      )}

      {/* Outer Integrated Pod Container */}
      <div
        className={`flex items-center gap-2 p-1.5 rounded-3xl transition-all duration-300 ${
          isCurrentTurn
            ? 'bg-transparent'
            : 'bg-gradient-to-b from-[#101b2d] to-[#0a111e] border-2 border-[#1c2c47] shadow-[0_4px_12px_rgba(0,0,0,0.6)]'
        }`}
      >
        {align === 'right' ? (
          <>
            {renderDiceBox()}
            {renderAvatarBox()}
          </>
        ) : (
          <>
            {renderAvatarBox()}
            {renderDiceBox()}
          </>
        )}
      </div>
    </div>
  );
};
