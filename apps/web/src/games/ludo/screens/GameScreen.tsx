import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  History,
  Pause,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  LudoColor,
  LudoDifficulty,
  LudoMatchState,
  applyLudoMove,
  applyLudoRoll,
  chooseLudoAiMove,
  getLegalLudoMoves,
} from '@nova/game-ludo';
import {
  LUDO_COLORS,
  LudoMoveLogEntry,
  LudoPlayerConfig,
  LudoTheme,
  LudoUiSettings,
  LUDO_TRANSLATIONS,
} from '../types';
import { playSound, triggerHaptic } from '../audio';
import { Board } from '../components/Board';
import { PlayerPanel } from '../components/PlayerPanel';
import { CoinBalance } from '../components/CoinBalance';
import { PauseModal } from '../components/Dialogs/PauseModal';
import { WinnerModal } from '../components/Dialogs/WinnerModal';
import { RulesModal } from '../components/Dialogs/RulesModal';
import { SettingsModal } from '../components/Dialogs/SettingsModal';

export interface GameScreenProps {
  initialState: LudoMatchState;
  playerConfigs: Record<number, LudoPlayerConfig>;
  settings: LudoUiSettings;
  userBalance?: number;
  stakeEtb?: number;
  onUpdateSettings: (settings: Partial<LudoUiSettings>) => void;
  onSaveMatchState: (state: LudoMatchState) => void;
  onRestartMatch: () => void;
  onQuitToHome: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  initialState,
  playerConfigs,
  settings,
  userBalance = 10400,
  stakeEtb = 0,
  onUpdateSettings,
  onSaveMatchState,
  onRestartMatch,
  onQuitToHome,
}) => {
  const [state, setState] = useState<LudoMatchState>(initialState);
  const [diceRolling, setDiceRolling] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [moveHistory, setMoveHistory] = useState<LudoMoveLogEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);

  // Chat & Reaction popover states
  const [chatOpen, setChatOpen] = useState(false);
  const [localChatBubble, setLocalChatBubble] = useState<string | null>(null);

  // Dialog states
  const [pauseOpen, setPauseOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const activeSeatNumber = state.currentTurnSeat;
  const activePlayer = playerConfigs[activeSeatNumber];
  const isHumanTurn = activePlayer?.type === 'HUMAN';
  const isMyTurn = isHumanTurn && state.turnPhase !== 'FINISHED';
  const strings = LUDO_TRANSLATIONS[settings.language] || LUDO_TRANSLATIONS.en;

  // Persist state updates
  useEffect(() => {
    onSaveMatchState(state);
  }, [state, onSaveMatchState]);

  // Compute legal moves
  const legalMoves = useMemo(() => {
    if (state.turnPhase !== 'MOVE' || state.currentDice === null) return [];
    return getLegalLudoMoves(state, state.currentDice);
  }, [state]);

  const legalTokenIndices = useMemo(
    () => legalMoves.map((m) => m.tokenIndex),
    [legalMoves]
  );

  // Auto-play / Auto-move logic
  useEffect(() => {
    if (!isMyTurn) return;

    if (autoPlayEnabled && state.turnPhase === 'ROLL' && !diceRolling) {
      const rollTimer = setTimeout(() => {
        handleRollDice();
      }, 500);
      return () => clearTimeout(rollTimer);
    }

    if ((autoPlayEnabled || settings.autoMoveSingle) && state.turnPhase === 'MOVE') {
      if (legalMoves.length === 1 || autoPlayEnabled) {
        if (legalMoves.length > 0 && !diceRolling && !aiThinking) {
          const moveTimer = setTimeout(() => {
            handleMoveToken(legalMoves[0].tokenIndex);
          }, 400);
          return () => clearTimeout(moveTimer);
        }
      }
    }
  }, [
    legalMoves,
    isMyTurn,
    state.turnPhase,
    autoPlayEnabled,
    settings.autoMoveSingle,
    diceRolling,
    aiThinking,
  ]);

  // AI bot automated turns
  useEffect(() => {
    if (state.turnPhase === 'FINISHED' || isHumanTurn) return;

    const botDifficulty: LudoDifficulty =
      activePlayer?.type === 'BOT_EASY' ? 'EASY' : 'HARD';

    setAiThinking(true);
    const delay = settings.animationSpeed === 'FAST' ? 450 : 750;

    const timer = setTimeout(() => {
      if (state.turnPhase === 'ROLL') {
        const rolledDie = Math.floor(Math.random() * 6) + 1;
        playSound.diceRoll(settings.soundEnabled);
        const rolled = applyLudoRoll(state, rolledDie);

        logAction({
          turnNumber: state.turnNumber,
          seat: activeSeatNumber,
          color: activePlayer.color,
          playerName: activePlayer.name,
          dice: rolledDie,
          fromProgress: -1,
          toProgress: -1,
          action: rolled.tripleSixCancelled ? 'TRIPLE_SIX' : 'ROLL',
          text: `${activePlayer.name} rolled a ${rolledDie}${
            rolled.tripleSixCancelled ? ' (Triple 6 cancelled!)' : ''
          }`,
        });

        if (rolled.tripleSixCancelled) {
          showToast('Three 6s! 3rd move cancelled.');
        }

        setState(rolled.nextState);
        setAiThinking(false);
        return;
      }

      if (state.turnPhase === 'MOVE') {
        const chosen = chooseLudoAiMove(state, botDifficulty);
        if (chosen) {
          handleMoveToken(chosen.tokenIndex, true);
        } else {
          setAiThinking(false);
        }
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [state, isHumanTurn, activePlayer, settings.soundEnabled, settings.animationSpeed]);

  const logAction = (entry: Omit<LudoMoveLogEntry, 'id' | 'timestamp'>) => {
    setMoveHistory((prev) => [
      {
        ...entry,
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
      },
      ...prev.slice(0, 40),
    ]);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage((prev) => (prev === msg ? null : prev)), 2000);
  };

  // Roll dice handler
  const handleRollDice = () => {
    if (!isMyTurn || state.turnPhase !== 'ROLL' || diceRolling) return;

    setDiceRolling(true);
    setTimeout(() => {
      const rolledDie = Math.floor(Math.random() * 6) + 1;
      const res = applyLudoRoll(state, rolledDie);

      logAction({
        turnNumber: state.turnNumber,
        seat: activeSeatNumber,
        color: activePlayer.color,
        playerName: activePlayer.name,
        dice: rolledDie,
        fromProgress: -1,
        toProgress: -1,
        action: res.tripleSixCancelled ? 'TRIPLE_SIX' : 'ROLL',
        text: `${activePlayer.name} rolled a ${rolledDie}${
          res.tripleSixCancelled ? ' (Triple 6 cancelled!)' : ''
        }`,
      });

      if (res.tripleSixCancelled) {
        showToast('Three 6s! Turn forfeited.');
      } else if (res.autoPassed) {
        showToast(`Rolled ${rolledDie} - No moves available.`);
      }

      setState(res.nextState);
      setDiceRolling(false);
    }, 400);
  };

  // Move token handler
  const handleMoveToken = (tokenIndex: number, isBot: boolean = false) => {
    try {
      const moved = applyLudoMove(state, tokenIndex);
      const rec = moved.move;

      let actionType: LudoMoveLogEntry['action'] = 'MOVE';
      if (rec.fromProgress === -1) actionType = 'LEAVE_BASE';
      else if (rec.captured.length > 0) actionType = 'CAPTURE';
      else if (rec.reachedHome) actionType = 'FINISH';

      const actorName = isBot ? activePlayer.name : activePlayer.name;
      logAction({
        turnNumber: state.turnNumber,
        seat: activeSeatNumber,
        color: activePlayer.color,
        playerName: actorName,
        dice: rec.dice,
        fromProgress: rec.fromProgress,
        toProgress: rec.toProgress,
        action: actionType,
        text: `${actorName} moved Token ${rec.tokenIndex + 1} (${rec.fromProgress} → ${rec.toProgress})${
          rec.captured.length > 0 ? ' ⚔️ Captured!' : ''
        }`,
      });

      if (rec.captured.length > 0) {
        showToast('⚔️ Token Captured!');
        triggerHaptic('capture', settings.vibrationEnabled);
      } else if (rec.extraTurnGranted && !moved.gameEnded) {
        showToast('🎲 Extra Turn Granted! Roll Again.');
      }

      setState(moved.nextState);
      if (isBot) setAiThinking(false);
    } catch {}
  };

  // Send quick chat reaction
  const handleSendReaction = (text: string) => {
    setLocalChatBubble(text);
    showToast(`Sent: ${text}`);
    setChatOpen(false);
    playSound.hopTick(1, settings.soundEnabled);
    setTimeout(() => {
      setLocalChatBubble((cur) => (cur === text ? null : cur));
    }, 2800);
  };

  // Pre-filter seats according to colors
  const seat1 = Object.values(playerConfigs).find((p) => p.color === 'RED') || playerConfigs[1];
  const seat2 = Object.values(playerConfigs).find((p) => p.color === 'GREEN') || playerConfigs[2];
  const seat3 = Object.values(playerConfigs).find((p) => p.color === 'YELLOW') || playerConfigs[3];
  const seat4 = Object.values(playerConfigs).find((p) => p.color === 'BLUE') || playerConfigs[4];

  const getFinishedCount = (color: LudoColor) => {
    const s = state.seats.find((seat) => seat.color === color);
    return s ? s.tokens.filter((t) => t.progress === 56).length : 0;
  };

  // Repeating diamond-patterned Ludo board wallpaper (matching reference image)
  const diamondLudoPatternSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 70 70"><g transform="rotate(45 35 35)"><rect x="12" y="12" width="21" height="21" fill="%23e52b2b" opacity="0.35"/><rect x="37" y="12" width="21" height="21" fill="%2300b050" opacity="0.35"/><rect x="12" y="37" width="21" height="21" fill="%230088e8" opacity="0.35"/><rect x="37" y="37" width="21" height="21" fill="%23f5c518" opacity="0.35"/><rect x="30" y="12" width="10" height="46" fill="%23ffffff" opacity="0.22"/><rect x="12" y="30" width="46" height="10" fill="%23ffffff" opacity="0.22"/></g><path d="M0 0h70v70H0z" fill="none" stroke="%2338bdf8" stroke-width="0.75" opacity="0.18"/></svg>`;

  const screenBgStyle: React.CSSProperties = {
    backgroundColor: '#0c3559',
    backgroundImage: `url("${diamondLudoPatternSvg}"), radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.28) 0%, rgba(5, 23, 44, 0.98) 100%)`,
    backgroundRepeat: 'repeat',
  };

  return (
    <div
      style={screenBgStyle}
      className="min-h-screen w-full flex flex-col items-center justify-between p-2 select-none relative overflow-hidden"
    >
      {/* Subtle Floating Game Controls (Top corners, keeping arena clean) */}
      <div className="w-full max-w-[460px] flex items-center justify-between px-2 pt-1 z-30 pointer-events-auto">
        <button
          type="button"
          onClick={() => setPauseOpen(true)}
          className="w-7 h-7 rounded-lg bg-black/40 hover:bg-black/60 text-white flex items-center justify-center border border-white/15 shadow-sm active:scale-95 transition-all cursor-pointer opacity-70 hover:opacity-100"
          aria-label="Pause menu"
        >
          <Pause className="w-3.5 h-3.5 fill-white" />
        </button>

        <div className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
            className="w-7 h-7 rounded-lg bg-black/40 hover:bg-black/60 text-amber-300 flex items-center justify-center border border-white/15 shadow-sm active:scale-95 transition-all cursor-pointer"
            aria-label="Toggle sound"
          >
            {settings.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setShowHistory((h) => !h)}
            className="w-7 h-7 rounded-lg bg-black/40 hover:bg-black/60 text-purple-300 flex items-center justify-center border border-white/15 shadow-sm active:scale-95 transition-all cursor-pointer"
            aria-label="Toggle history"
          >
            <History className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setRulesOpen(true)}
            className="w-7 h-7 rounded-lg bg-black/40 hover:bg-black/60 text-emerald-300 flex items-center justify-center border border-white/15 shadow-sm active:scale-95 transition-all cursor-pointer"
            aria-label="View rules"
          >
            <BookOpen className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Action Toast */}
      {toastMessage && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-2xl animate-bounce pointer-events-none border border-amber-200">
          {toastMessage}
        </div>
      )}

      {/* MAIN GAMEPLAY ARENA (MATCHING REFERENCE SCREENSHOT) */}
      <main className="w-full max-w-[460px] flex-1 flex flex-col items-center justify-center my-auto relative">
        {/* TOP PODS ROW */}
        <div className="w-full flex items-end justify-between px-1 mb-2 z-20 relative">
          {/* Faded Background Slot Above Top-Left */}
          <div className="absolute -top-7 left-3 w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-white/20 text-xs font-bold pointer-events-none">
            ?
          </div>

          {/* Top-Left: Red Player Station (Align Left: [Avatar | Inactive Dice]) */}
          {seat1 && (
            <PlayerPanel
              player={seat1}
              isCurrentTurn={state.currentTurnSeat === seat1.seat}
              isMyTurn={isMyTurn && state.currentTurnSeat === seat1.seat}
              canRoll={state.turnPhase === 'ROLL'}
              isRolling={diceRolling && state.currentTurnSeat === seat1.seat}
              diceValue={state.currentDice}
              finishedCount={getFinishedCount(seat1.color)}
              theme={settings.theme}
              align="left"
              onRoll={handleRollDice}
            />
          )}

          {/* Faded Background Slot Above Top-Right */}
          <div className="absolute -top-7 right-3 w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-white/20 text-xs font-bold pointer-events-none">
            ?
          </div>

          {/* Top-Right: Green Player Station (Align Right: [Inactive Dice | Avatar]) */}
          {seat2 && (
            <PlayerPanel
              player={seat2}
              isCurrentTurn={state.currentTurnSeat === seat2.seat}
              isMyTurn={isMyTurn && state.currentTurnSeat === seat2.seat}
              canRoll={state.turnPhase === 'ROLL'}
              isRolling={diceRolling && state.currentTurnSeat === seat2.seat}
              diceValue={state.currentDice}
              finishedCount={getFinishedCount(seat2.color)}
              theme={settings.theme}
              align="right"
              onRoll={handleRollDice}
            />
          )}
        </div>

        {/* CENTER: 15x15 LUDO BOARD */}
        <div className="w-full relative z-10 flex items-center justify-center px-0.5">
          <Board
            state={state}
            activeSeat={activeSeatNumber}
            isMyTurn={isMyTurn}
            legalTokenIndices={legalTokenIndices}
            playerConfigs={playerConfigs}
            theme={settings.theme}
            animationSpeed={settings.animationSpeed}
            soundEnabled={settings.soundEnabled}
            onMoveToken={handleMoveToken}
          />
        </div>

        {/* BOTTOM PODS ROW */}
        <div className="w-full flex items-start justify-between px-1 mt-2 z-20 relative">
          {/* Faded Background Slot Below Bottom-Left */}
          <div className="absolute -bottom-7 left-3 w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-white/20 text-xs font-bold pointer-events-none">
            ?
          </div>

          {/* Bottom-Left: LOCAL Active Player (Blue - Align Left: [Avatar | Active Cyan Dice + AUTO-PLAY]) */}
          {seat4 ? (
            <div className="relative">
              <PlayerPanel
                player={seat4}
                isCurrentTurn={state.currentTurnSeat === seat4.seat}
                isMyTurn={isMyTurn && state.currentTurnSeat === seat4.seat}
                canRoll={state.turnPhase === 'ROLL'}
                isRolling={diceRolling && state.currentTurnSeat === seat4.seat}
                diceValue={state.currentDice}
                finishedCount={getFinishedCount(seat4.color)}
                theme={settings.theme}
                align="left"
                onRoll={handleRollDice}
                onToggleAutoPlay={() => setAutoPlayEnabled((v) => !v)}
                autoPlayActive={autoPlayEnabled}
                showChatButton={true}
                onOpenChat={() => setChatOpen((v) => !v)}
                chatBubbleText={localChatBubble}
                topElement={
                  <CoinBalance
                    balance={userBalance}
                    stakeEtb={stakeEtb}
                  />
                }
              />

              {/* Quick Chat Popover */}
              {chatOpen && (
                <div
                  className="absolute bottom-full mb-3 left-0 z-50 w-64 p-2.5 rounded-2xl bg-[#0f1a30]/98 border border-white/20 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
                  role="dialog"
                  aria-label="Quick chat and reactions"
                >
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10">
                    <span className="text-[11px] font-black text-white flex items-center gap-1">
                      💬 Quick Chat
                    </span>
                    <button
                      type="button"
                      onClick={() => setChatOpen(false)}
                      className="text-slate-400 hover:text-white text-xs font-bold p-0.5 rounded cursor-pointer"
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-1 mb-2">
                    {['😀', '😂', '🔥', '👍', '🎲', '👏', '😎', '💔'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleSendReaction(emoji)}
                        className="text-lg p-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-90 transition-all flex items-center justify-center cursor-pointer shadow-sm hover:scale-105"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-1">
                    {[
                      'Good luck! 🍀',
                      'Well played! 👏',
                      'Hurry up! ⏳',
                      'Oops! 😅',
                      'Nice move! 🎯',
                      'Rematch? ⚔️',
                    ].map((phrase) => (
                      <button
                        key={phrase}
                        type="button"
                        onClick={() => handleSendReaction(phrase)}
                        className="text-[10px] font-bold text-left px-2 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-200 hover:text-white truncate active:scale-95 transition-all cursor-pointer border border-white/5"
                      >
                        {phrase}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div />
          )}

          {/* Faded Background Slot Below Bottom-Right */}
          <div className="absolute -bottom-7 right-3 w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-white/20 text-xs font-bold pointer-events-none">
            ?
          </div>

          {/* Bottom-Right: Yellow Player (Seat 3 - Align Right: [Inactive Dice | Avatar]) */}
          {seat3 && (
            <PlayerPanel
              player={seat3}
              isCurrentTurn={state.currentTurnSeat === seat3.seat}
              isMyTurn={isMyTurn && state.currentTurnSeat === seat3.seat}
              canRoll={state.turnPhase === 'ROLL'}
              isRolling={diceRolling && state.currentTurnSeat === seat3.seat}
              diceValue={state.currentDice}
              finishedCount={getFinishedCount(seat3.color)}
              theme={settings.theme}
              align="right"
              onRoll={handleRollDice}
            />
          )}
        </div>

        {/* Move History Drawer */}
        {showHistory && (
          <div className="w-full mt-2 rounded-2xl bg-[#0d162b]/95 border border-white/15 p-2.5 max-h-40 overflow-y-auto text-left shadow-2xl backdrop-blur-md z-30">
            <div className="flex items-center justify-between text-[11px] font-black text-slate-400 border-b border-white/10 pb-1 mb-1">
              <span>Move History</span>
              <span>Turn #{state.turnNumber}</span>
            </div>
            {moveHistory.length === 0 ? (
              <div className="text-[10px] text-slate-400 py-1 text-center">
                Match actions will appear here.
              </div>
            ) : (
              <div className="space-y-1">
                {moveHistory.slice(0, 8).map((log) => (
                  <div
                    key={log.id}
                    className="text-[10px] text-slate-300 font-mono flex items-center justify-between"
                  >
                    <span className="truncate max-w-[240px]">{log.text}</span>
                    <span className="text-amber-400 font-bold shrink-0">🎲 {log.dice}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODALS */}
      <PauseModal
        isOpen={pauseOpen}
        onResume={() => setPauseOpen(false)}
        onRestart={() => {
          setPauseOpen(false);
          onRestartMatch();
        }}
        onOpenSettings={() => {
          setPauseOpen(false);
          setSettingsOpen(true);
        }}
        onQuitToHome={() => {
          setPauseOpen(false);
          onQuitToHome();
        }}
      />

      <WinnerModal
        isOpen={state.turnPhase === 'FINISHED'}
        state={state}
        playerConfigs={playerConfigs}
        soundEnabled={settings.soundEnabled}
        vibrationEnabled={settings.vibrationEnabled}
        onPlayAgain={onRestartMatch}
        onBackHome={onQuitToHome}
      />

      <RulesModal isOpen={rulesOpen} onClose={() => setRulesOpen(false)} />

      <SettingsModal
        isOpen={settingsOpen}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
};
