import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Swords,
  Bot,
  Zap,
  Lock,
  Trophy,
  Flame,
  Flag,
  RotateCcw,
  ShieldAlert,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useTicTacToe } from './hooks/useTicTacToe';
import { GameHeader } from './components/GameHeader';
import { GameBoard } from './components/GameBoard';
import { PlayerCard } from './components/PlayerCard';
import { TurnIndicator } from './components/TurnIndicator';
import { GameModeCard } from './components/GameModeCard';
import { MatchmakingPanel } from './components/MatchmakingPanel';
import { PrivateRoom } from './components/PrivateRoom';
import { MatchResult } from './components/MatchResult';
import { Leaderboard } from './components/Leaderboard';
import { ticTacToeApi } from './services/ticTacToeApi';
import {
  AiDifficulty,
  GameViewMode,
  LeaderboardEntry,
  TttGameMode,
} from './types/ticTacToe.types';

export const TicTacToePage: React.FC = () => {
  const navigate = useNavigate();

  const {
    gameMode,
    setGameMode,
    aiDifficulty,
    setAiDifficulty,
    unifiedMatch,
    currentSymbol,
    isMyTurn,
    isAiThinking,
    userStats,
    makeMove,
    startPracticeMatch,
    isQueuing,
    queueStatusMessage,
    joinQueue,
    leaveQueue,
    createRoom,
    joinRoom,
    resign,
    sendReaction,
    reactionBubble,
    clearMatch,
    errorMessage,
  } = useTicTacToe();

  const [viewMode, setViewMode] = useState<GameViewMode>('HOME');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isPrivateRoomOpen, setIsPrivateRoomOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [difficultyModalOpen, setDifficultyModalOpen] = useState(false);

  // Remaining turn countdown timer
  const [remainingSeconds, setRemainingSeconds] = useState(15);

  useEffect(() => {
    if (!unifiedMatch || unifiedMatch.status !== 'IN_PROGRESS') return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - unifiedMatch.turnStartedAt) / 1000;
      const left = Math.max(0, Math.ceil(unifiedMatch.turnTimeoutSeconds - elapsed));
      setRemainingSeconds(left);
    }, 500);

    return () => clearInterval(interval);
  }, [unifiedMatch?.turnStartedAt, unifiedMatch?.status, unifiedMatch?.turnTimeoutSeconds]);

  // Sync viewMode when match starts or finishes
  useEffect(() => {
    if (unifiedMatch) {
      if (unifiedMatch.status === 'IN_PROGRESS') {
        setViewMode('PLAYING');
      } else if (unifiedMatch.status === 'FINISHED') {
        setViewMode('RESULT');
      }
    } else if (isQueuing) {
      setViewMode('MATCHMAKING');
    } else if (viewMode === 'PLAYING' || viewMode === 'MATCHMAKING') {
      setViewMode('HOME');
    }
  }, [unifiedMatch?.status, isQueuing]);

  // Load leaderboard when opened
  const handleOpenLeaderboard = async () => {
    setIsLeaderboardOpen(true);
    try {
      const data = await ticTacToeApi.getLeaderboard(50);
      setLeaderboardData(data);
    } catch {
      // Fallback local mock if offline
      setLeaderboardData([
        { rank: 1, userId: 'u1', username: 'NeonStriker', rating: 1640, wins: 42, losses: 8, draws: 10, winRate: 70 },
        { rank: 2, userId: 'u2', username: 'CipherBlade', rating: 1520, wins: 35, losses: 12, draws: 8, winRate: 64 },
        { rank: 3, userId: 'u3', username: 'NovaGladiator', rating: 1480, wins: 28, losses: 14, draws: 6, winRate: 58 },
      ]);
    }
  };

  const handleStartPractice = (difficulty: AiDifficulty) => {
    setDifficultyModalOpen(false);
    startPracticeMatch(difficulty);
    setViewMode('PLAYING');
  };

  const handleStartQuickMatch = () => {
    setGameMode('FREE');
    joinQueue('FREE');
    setViewMode('MATCHMAKING');
  };

  const handleStartRanked = () => {
    setGameMode('RANKED');
    joinQueue('RANKED');
    setViewMode('MATCHMAKING');
  };

  const handleRematch = () => {
    if (gameMode === 'PRACTICE') {
      startPracticeMatch(aiDifficulty);
      setViewMode('PLAYING');
    } else {
      clearMatch();
      handleStartQuickMatch();
    }
  };

  const handleReturnToHome = () => {
    clearMatch();
    setViewMode('HOME');
  };

  return (
    <div className="min-h-screen w-full bg-[#070b14] text-white flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background Cyberpunk Ambient Lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00e5ff]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#d946ef]/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header */}
      <GameHeader
        onBack={viewMode !== 'HOME' ? handleReturnToHome : () => navigate('/games')}
        onOpenLeaderboard={handleOpenLeaderboard}
        userStats={userStats}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((v) => !v)}
        matchId={unifiedMatch?.id}
      />

      {/* Error banner */}
      {errorMessage && (
        <div className="w-full max-w-[440px] mx-auto mt-2 px-4 py-2 bg-rose-500/20 border border-rose-500/50 rounded-xl text-rose-300 text-xs font-bold text-center animate-bounce">
          {errorMessage}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 1. HOME SCREEN / ARENA HUB                                           */}
      {/* ==================================================================== */}
      {viewMode === 'HOME' && (
        <main className="w-full max-w-[480px] mx-auto flex-1 flex flex-col justify-between p-4 space-y-6">
          {/* Hero Banner */}
          <div className="text-center pt-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-black tracking-widest uppercase mb-3 shadow-[0_0_15px_rgba(0,229,255,0.2)]">
              <Swords className="w-3.5 h-3.5" />
              COMPETITIVE TACTICAL ARENA
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              THINK FAST. PLAY SMART.
            </h2>
            <p className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-emerald-400 mt-1">
              WIN THE ARENA.
            </p>
          </div>

          {/* Quick Play CTA */}
          <button
            type="button"
            onClick={handleStartQuickMatch}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 hover:brightness-110 text-slate-950 font-black text-base sm:text-lg tracking-wider shadow-[0_0_30px_rgba(0,229,255,0.5)] flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            PLAY NOW (QUICK MATCH)
          </button>

          {/* Game Modes Stack */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
              SELECT GAME MODE
            </h3>

            {/* Practice vs AI */}
            <GameModeCard
              mode="PRACTICE"
              title="Practice vs AI"
              subtitle="Sharpen your skills against Easy, Medium, or Hard Minimax AI"
              badge="SOLO"
              iconName="bot"
              onClick={() => setDifficultyModalOpen(true)}
            />

            {/* Free Multiplayer */}
            <GameModeCard
              mode="FREE"
              title="Free Multiplayer"
              subtitle="Instant matchmaking with real online players"
              badge="POPULAR"
              iconName="zap"
              onClick={handleStartQuickMatch}
            />

            {/* Ranked Arena */}
            <GameModeCard
              mode="RANKED"
              title="Ranked Arena"
              subtitle="Skill-based matchmaking with seasonal Elo rating progression"
              badge="ELO RANKED"
              iconName="flame"
              onClick={handleStartRanked}
            />

            {/* Private Challenge */}
            <GameModeCard
              mode="PRIVATE"
              title="Private Challenge"
              subtitle="Duel a friend directly with a 6-character room code"
              badge="1V1 FRIEND"
              iconName="lock"
              onClick={() => setIsPrivateRoomOpen(true)}
            />

            {/* Competitive Match (Staging Feature Flag) */}
            <GameModeCard
              mode="COMPETITIVE"
              title="Competitive Stakes"
              subtitle="Play with entry stakes and 100% draw refund (Pending regulatory activation)"
              badge="STAGING"
              iconName="swords"
              isLocked={true}
              onClick={() => {}}
            />
          </div>

          {/* Player Quick Stats Footer */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-around text-center">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">RATING</span>
              <span className="text-amber-400 font-black text-sm font-mono">{userStats.rating} ELO</span>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">MATCHES</span>
              <span className="text-white font-black text-sm">{userStats.totalMatches}</span>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">WIN RATE</span>
              <span className="text-emerald-400 font-black text-sm">{userStats.winRate}%</span>
            </div>
          </div>
        </main>
      )}

      {/* ==================================================================== */}
      {/* 2. MATCHMAKING SCREEN                                                */}
      {/* ==================================================================== */}
      {viewMode === 'MATCHMAKING' && (
        <main className="flex-1 flex items-center justify-center p-4">
          <MatchmakingPanel
            mode={gameMode}
            username={userStats.username}
            userRating={userStats.rating}
            onCancel={leaveQueue}
            statusMessage={queueStatusMessage}
          />
        </main>
      )}

      {/* ==================================================================== */}
      {/* 3. GAMEPLAY ARENA                                                    */}
      {/* ==================================================================== */}
      {viewMode === 'PLAYING' && unifiedMatch && (
        <main className="w-full max-w-[440px] mx-auto flex-1 flex flex-col justify-between p-4 space-y-4">
          {/* Opponents Versus Bar */}
          <div className="grid grid-cols-2 gap-2.5">
            <PlayerCard
              player={unifiedMatch.playerX}
              isCurrentTurn={unifiedMatch.currentTurn === 'X'}
              isLocalPlayer={currentSymbol === 'X'}
              remainingSeconds={unifiedMatch.currentTurn === 'X' ? remainingSeconds : undefined}
            />
            <PlayerCard
              player={unifiedMatch.playerO}
              isCurrentTurn={unifiedMatch.currentTurn === 'O'}
              isLocalPlayer={currentSymbol === 'O'}
              remainingSeconds={unifiedMatch.currentTurn === 'O' ? remainingSeconds : undefined}
            />
          </div>

          {/* Turn Indicator */}
          <div className="flex justify-center">
            <TurnIndicator
              currentTurn={unifiedMatch.currentTurn}
              isMyTurn={isMyTurn}
              isAiThinking={isAiThinking}
            />
          </div>

          {/* Floating Reaction Bubble */}
          {reactionBubble && (
            <div className="text-center animate-bounce">
              <span className="text-3xl p-2 rounded-2xl bg-slate-900/90 border border-cyan-400 shadow-xl inline-block">
                {reactionBubble.reaction}
              </span>
            </div>
          )}

          {/* Interactive 3x3 Neon Glass Board */}
          <div className="my-auto">
            <GameBoard
              board={unifiedMatch.board}
              winningLine={unifiedMatch.winningLine}
              isMyTurn={isMyTurn}
              onCellClick={makeMove}
            />
          </div>

          {/* Bottom Actions: Emote reactions, resign, restart */}
          <div className="flex items-center justify-between pt-2 px-1">
            {/* Quick Reactions */}
            <div className="flex items-center gap-1.5">
              {['🔥', '😎', '🤯', '👏'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => sendReaction(emoji)}
                  className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-sm flex items-center justify-center hover:scale-110 active:scale-90 transition-all cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Surrender Button */}
            {gameMode !== 'PRACTICE' ? (
              <button
                type="button"
                onClick={resign}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/50 text-slate-400 hover:text-rose-400 text-xs font-bold transition-all active:scale-95"
              >
                <Flag className="w-3.5 h-3.5" />
                RESIGN
              </button>
            ) : (
              <button
                type="button"
                onClick={() => startPracticeMatch(aiDifficulty)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 text-xs font-bold transition-all active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                RESTART
              </button>
            )}
          </div>
        </main>
      )}

      {/* ==================================================================== */}
      {/* 4. RESULT MODAL                                                      */}
      {/* ==================================================================== */}
      {viewMode === 'RESULT' && unifiedMatch && (
        <MatchResult
          match={unifiedMatch}
          mySymbol={currentSymbol}
          onRematch={handleRematch}
          onReturnToHome={handleReturnToHome}
        />
      )}

      {/* ==================================================================== */}
      {/* MODALS                                                               */}
      {/* ==================================================================== */}

      {/* Private Room Modal */}
      {isPrivateRoomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <PrivateRoom
            onCreateRoom={(stake) => createRoom('FREE', stake)}
            onJoinRoom={(code) => {
              joinRoom(code);
              setIsPrivateRoomOpen(false);
            }}
            onClose={() => setIsPrivateRoomOpen(false)}
          />
        </div>
      )}

      {/* Leaderboard Modal */}
      {isLeaderboardOpen && (
        <Leaderboard
          entries={leaderboardData}
          onClose={() => setIsLeaderboardOpen(false)}
        />
      )}

      {/* AI Difficulty Selector Modal */}
      {difficultyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
          <div className="w-full max-w-[360px] p-6 rounded-3xl bg-slate-950/95 border border-slate-800 shadow-2xl text-center space-y-4">
            <h3 className="text-white text-base font-black tracking-wide">
              CHOOSE AI DIFFICULTY
            </h3>
            <p className="text-xs text-slate-400">
              Select your practice challenge level:
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleStartPractice('EASY')}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-400 text-emerald-300 font-bold text-xs sm:text-sm flex items-center justify-between px-4 transition-all"
              >
                <span>EASY</span>
                <span className="text-[10px] text-slate-400">Random Moves</span>
              </button>

              <button
                type="button"
                onClick={() => handleStartPractice('MEDIUM')}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 text-amber-300 font-bold text-xs sm:text-sm flex items-center justify-between px-4 transition-all"
              >
                <span>MEDIUM</span>
                <span className="text-[10px] text-slate-400">Tactical Blocking</span>
              </button>

              <button
                type="button"
                onClick={() => handleStartPractice('HARD')}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-950 to-blue-950 hover:brightness-125 border border-cyan-400 text-cyan-300 font-black text-xs sm:text-sm flex items-center justify-between px-4 shadow-[0_0_15px_rgba(0,229,255,0.2)] transition-all"
              >
                <span>HARD (MINIMAX)</span>
                <span className="text-[10px] text-cyan-400 font-mono">Unbeatable</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setDifficultyModalOpen(false)}
              className="w-full py-2 text-xs font-bold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicTacToePage;
