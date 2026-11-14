import React, { useState } from 'react';
import { useI18nStore } from '../../../stores/i18nStore';
import {
  Clock,
  Flag,
  RotateCw,
  Coins,
  Bot,
  User,
  WifiOff,
  AlertTriangle,
  Volume2,
  VolumeX,
  Vibrate,
  VibrateOff,
} from 'lucide-react';

interface DamaMatchHeaderProps {
  isPractice: boolean;
  playerColor: 'W' | 'B';
  currentTurn: 'W' | 'B';
  whitePlayer: { id?: string; username?: string; avatarUrl?: string } | null;
  blackPlayer: { id?: string; username?: string; avatarUrl?: string } | null;
  whiteTimeMs: number;
  blackTimeMs: number;
  stakeEtb: number;
  flipped: boolean;
  onFlipBoard: () => void;
  onResign: () => void;
  disconnectedPlayerId?: string | null;
  disconnectGraceMs?: number | null;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  hapticsEnabled?: boolean;
  onToggleHaptics?: () => void;
}

export const DamaMatchHeader: React.FC<DamaMatchHeaderProps> = ({
  isPractice,
  playerColor,
  currentTurn,
  whitePlayer,
  blackPlayer,
  whiteTimeMs,
  blackTimeMs,
  stakeEtb,
  flipped,
  onFlipBoard,
  onResign,
  disconnectedPlayerId,
  disconnectGraceMs,
  soundEnabled,
  onToggleSound,
  hapticsEnabled,
  onToggleHaptics,
}) => {
  const { t } = useI18nStore();
  const [showResignModal, setShowResignModal] = useState(false);

  const formatTime = (ms: number) => {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalPot = stakeEtb * 2;
  const rake = totalPot * 0.05;
  const winnerPayout = totalPot - rake;

  const opponentColor = playerColor === 'W' ? 'B' : 'W';
  const opponentInfo = opponentColor === 'W' ? whitePlayer : blackPlayer;
  const opponentTimeMs = opponentColor === 'W' ? whiteTimeMs : blackTimeMs;
  const yourTimeMs = playerColor === 'W' ? whiteTimeMs : blackTimeMs;

  const isOpponentTurn = currentTurn === opponentColor;
  const isYourTurn = currentTurn === playerColor;

  const isOpponentLowTime = opponentTimeMs <= 30000;
  const isYourLowTime = yourTimeMs <= 30000;

  return (
    <div className="w-full max-w-[460px] mx-auto space-y-1.5 sm:space-y-2">
      {/* Financial Pot Banner or Friendly Match Badge (in PvP mode) */}
      {!isPractice && (
        stakeEtb === 0 ? (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs shadow-sm">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Free Friendly Match</span>
            </div>
            <span className="text-[10px] text-stone-400 font-medium">0.00 ETB Stake (0% Rake)</span>
          </div>
        ) : (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-stone-900/90 border border-amber-600/30 text-xs shadow-md">
            <div className="flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-stone-400 text-[11px] sm:text-xs">Pot:</span>
              <strong className="text-amber-400 font-mono font-bold text-xs sm:text-sm">
                {totalPot.toFixed(2)} ETB
              </strong>
            </div>
            <div className="text-[10px] sm:text-[11px] text-stone-400">
              Winner: <strong className="text-emerald-400 font-mono">{winnerPayout.toFixed(2)} ETB</strong> (5% Rake)
            </div>
          </div>
        )
      )}

      {/* Disconnect Alert Banner */}
      {disconnectedPlayerId && (
        <div className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-red-950/90 border border-red-500/50 text-red-200 text-xs animate-pulse">
          <WifiOff className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span className="text-[11px] leading-tight">
            Opponent disconnected! Reconnect grace window active...
          </span>
        </div>
      )}

      {/* Top Player (Opponent) Card */}
      <div
        className={`flex items-center justify-between p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border transition-all ${
          isOpponentTurn
            ? 'bg-amber-950/40 border-amber-500/50 shadow-md ring-1 ring-amber-500/20'
            : 'bg-stone-900/80 border-stone-800'
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs border ${
              opponentColor === 'W'
                ? 'bg-amber-100 text-stone-900 border-amber-300'
                : 'bg-stone-950 text-amber-300 border-stone-700'
            }`}
          >
            {isPractice ? <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" /> : <User className="w-4 h-4 sm:w-5 sm:h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[120px] sm:max-w-[180px]">
                {isPractice ? 'Computer' : opponentInfo?.username || 'Opponent'}
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${
                  opponentColor === 'W'
                    ? 'bg-amber-100 text-stone-900'
                    : 'bg-stone-950 text-stone-300 border border-stone-800'
                }`}
              >
                {opponentColor === 'W' ? 'White' : 'Black'}
              </span>
            </div>
            {isOpponentTurn && (
              <span className="text-[10px] text-amber-400 font-bold block animate-pulse leading-none mt-0.5">
                Thinking...
              </span>
            )}
          </div>
        </div>

        {/* Opponent Clock */}
        {!isPractice && (
          <div
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-xl font-mono text-xs sm:text-sm font-bold transition-all ${
              isOpponentLowTime
                ? 'bg-red-950 text-red-400 border border-red-500 animate-pulse'
                : 'bg-stone-950 text-stone-200 border border-stone-800'
            }`}
          >
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-400" />
            <span>{formatTime(opponentTimeMs)}</span>
          </div>
        )}
      </div>

      {/* Action Toolbar (Flip Board, Audio, Haptics, Resign) */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={onFlipBoard}
            className="flex items-center gap-1 text-[11px] text-stone-300 hover:text-white px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 transition-colors min-h-[34px] touch-manipulation"
          >
            <RotateCw className="w-3 h-3" />
            <span>Flip {flipped ? '(F)' : ''}</span>
          </button>

          {onToggleSound && (
            <button
              type="button"
              onClick={onToggleSound}
              className={`p-1.5 rounded-lg border transition-colors min-h-[34px] min-w-[34px] flex items-center justify-center touch-manipulation ${
                soundEnabled
                  ? 'bg-stone-900 border-stone-800 text-amber-400 hover:text-amber-300'
                  : 'bg-stone-950 border-stone-800 text-stone-500 hover:text-stone-400'
              }`}
              title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          )}

          {onToggleHaptics && (
            <button
              type="button"
              onClick={onToggleHaptics}
              className={`p-1.5 rounded-lg border transition-colors min-h-[34px] min-w-[34px] flex items-center justify-center touch-manipulation ${
                hapticsEnabled
                  ? 'bg-stone-900 border-stone-800 text-amber-400 hover:text-amber-300'
                  : 'bg-stone-950 border-stone-800 text-stone-500 hover:text-stone-400'
              }`}
              title={hapticsEnabled ? 'Disable Vibration' : 'Enable Vibration'}
            >
              {hapticsEnabled ? <Vibrate className="w-3.5 h-3.5" /> : <VibrateOff className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowResignModal(true)}
          className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 px-2.5 py-1 rounded-lg bg-red-950/40 hover:bg-red-950/70 border border-red-500/30 transition-colors min-h-[34px] touch-manipulation"
        >
          <Flag className="w-3 h-3" />
          {t.games.dama.resign}
        </button>
      </div>

      {/* Resign Confirmation Modal */}
      {showResignModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-red-500/40 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Confirm Resignation</h3>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              {t.games.dama.resignConfirm}
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResignModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResignModal(false);
                  onResign();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider"
              >
                Resign Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

