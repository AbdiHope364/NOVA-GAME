import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  GameState,
  LegalMove,
  Pos,
  Result,
  RuleOptions,
  DEFAULT_OPTIONS,
  createInitialState,
  getLegalMoves,
  applyMove,
  findBestMove,
  isDarkSquare,
  DamaDifficulty,
} from '@nova/game-dama';
import { api } from '../../services/api';
import { getGameSocket } from '../../services/socket';
import { useWalletStore } from '../../stores/walletStore';
import { useAuthStore } from '../../stores/authStore';
import { DamaBoard } from './components/DamaBoard';
import { DamaLobby } from './components/DamaLobby';
import { DamaMatchHeader } from './components/DamaMatchHeader';
import { DamaGameOverModal } from './components/DamaGameOverModal';
import { CartellaDamaHeader } from './components/CartellaDamaHeader';
import { CartellaDamaStats } from './components/CartellaDamaStats';
import { CartellaDamaVersus } from './components/CartellaDamaVersus';
import { CartellaDamaActions } from './components/CartellaDamaActions';
import { CartellaDamaBanner } from './components/CartellaDamaBanner';
import { useDamaAudio } from './hooks/useDamaAudio';
import { Sparkles, ArrowLeft, Bot, Clock } from 'lucide-react';

export const DamaPage: React.FC = () => {
  const { fetchWallet } = useWalletStore();
  const { user } = useAuthStore();
  const audio = useDamaAudio();

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  // Mode: 'lobby' | 'practice' | 'pvp'
  const [viewMode, setViewMode] = useState<'lobby' | 'practice' | 'pvp'>('lobby');

  // PvP Match State
  const [activeMatch, setActiveMatch] = useState<any | null>(null);
  const [whiteTimeMs, setWhiteTimeMs] = useState<number>(300000);
  const [blackTimeMs, setBlackTimeMs] = useState<number>(300000);
  const [disconnectedPlayerId, setDisconnectedPlayerId] = useState<string | null>(null);

  // Local / Game Board State
  const [gameState, setGameState] = useState<GameState>(() => createInitialState('W'));
  const [selectedPos, setSelectedPos] = useState<Pos | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Pos; to: Pos } | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [gameOverResult, setGameOverResult] = useState<any | null>(null);

  // Practice Mode State
  const [practiceDifficulty, setPracticeDifficulty] = useState<DamaDifficulty>('medium');
  const [isAiThinking, setIsAiThinking] = useState(false);

  const socketRef = useRef(getGameSocket());
  const effectiveUserId = user?.id || 'demo-guest';

  // Determine current player's assigned color in PvP
  const playerColor: 'W' | 'B' = useMemo(() => {
    if (viewMode === 'practice') return 'W';
    if (!activeMatch) return 'W';
    if (activeMatch.whitePlayer?.id === effectiveUserId || activeMatch.whiteUserId === effectiveUserId) return 'W';
    if (activeMatch.blackPlayer?.id === effectiveUserId || activeMatch.blackUserId === effectiveUserId) return 'B';
    return 'W';
  }, [viewMode, activeMatch, effectiveUserId]);

  useEffect(() => {
    if (viewMode === 'pvp') {
      setFlipped(playerColor === 'B');
    } else {
      setFlipped(false);
    }
  }, [playerColor, viewMode]);

  // All legal moves for current turn
  const legalMoves = useMemo(() => {
    return getLegalMoves(gameState, DEFAULT_OPTIONS);
  }, [gameState]);

  // Pieces with compulsory captures
  const compulsoryPieces = useMemo(() => {
    const hasCaptures = legalMoves.some((m) => m.captured.length > 0);
    if (!hasCaptures) return [];
    const set = new Set<string>();
    const res: Pos[] = [];
    for (const m of legalMoves) {
      if (m.captured.length > 0) {
        const k = `${m.from[0]},${m.from[1]}`;
        if (!set.has(k)) {
          set.add(k);
          res.push(m.from);
        }
      }
    }
    return res;
  }, [legalMoves]);

  // Legal moves originating from the currently selected square
  const validMovesForSelected = useMemo(() => {
    if (!selectedPos) return [];
    return legalMoves.filter(
      (m) => m.from[0] === selectedPos[0] && m.from[1] === selectedPos[1]
    );
  }, [selectedPos, legalMoves]);

  // Initialize socket listeners for PvP
  useEffect(() => {
    const socket = socketRef.current;

    const onMatchState = (matchData: any) => {
      setActiveMatch(matchData);
      setGameState(matchData.state);
      if (matchData.clocks) {
        setWhiteTimeMs(matchData.clocks.whiteTimeMs);
        setBlackTimeMs(matchData.clocks.blackTimeMs);
      }
      if (matchData.status === 'FINISHED') {
        handleGameOver(matchData);
      }
    };

    const onMatchUpdate = (data: { state: GameState; lastMove: any; clocks: any; ply: number }) => {
      setGameState(data.state);
      if (data.lastMove) {
        const dest = data.lastMove.path[data.lastMove.path.length - 1];
        setLastMove({
          from: data.lastMove.from,
          to: dest,
        });

        // Audio & haptic feedback on accepted move
        if (data.lastMove.captured && data.lastMove.captured.length > 0) {
          audio.playCapture();
        } else {
          const destPiece = data.state.board[dest[0]][dest[1]];
          if (destPiece?.king && (dest[0] === 0 || dest[0] === 7)) {
            audio.playCrown();
          } else {
            audio.playMove();
          }
        }
      }
      if (data.clocks) {
        setWhiteTimeMs(data.clocks.whiteTimeMs);
        setBlackTimeMs(data.clocks.blackTimeMs);
      }
      setSelectedPos(null);
    };

    const onClockTick = (data: { whiteTimeMs: number; blackTimeMs: number }) => {
      setWhiteTimeMs(data.whiteTimeMs);
      setBlackTimeMs(data.blackTimeMs);
    };

    const onMatchResult = (resultData: any) => {
      handleGameOver(resultData);
      fetchWallet();
    };

    const onPlayerDisconnected = (data: { userId: string; gracePeriodMs: number }) => {
      setDisconnectedPlayerId(data.userId);
    };

    const onPlayerReconnected = () => {
      setDisconnectedPlayerId(null);
    };

    const onMatchError = (err: { message: string }) => {
      console.error('[Socket Error]:', err.message);
    };

    socket.on('MATCH_STATE', onMatchState);
    socket.on('MATCH_UPDATE', onMatchUpdate);
    socket.on('MATCH_CLOCK_TICK', onClockTick);
    socket.on('MATCH_RESULT', onMatchResult);
    socket.on('MATCH_PLAYER_DISCONNECTED', onPlayerDisconnected);
    socket.on('MATCH_PLAYER_RECONNECTED', onPlayerReconnected);
    socket.on('MATCH_ERROR', onMatchError);

    return () => {
      socket.off('MATCH_STATE', onMatchState);
      socket.off('MATCH_UPDATE', onMatchUpdate);
      socket.off('MATCH_CLOCK_TICK', onClockTick);
      socket.off('MATCH_RESULT', onMatchResult);
      socket.off('MATCH_PLAYER_DISCONNECTED', onPlayerDisconnected);
      socket.off('MATCH_PLAYER_RECONNECTED', onPlayerReconnected);
      socket.off('MATCH_ERROR', onMatchError);
    };
  }, [fetchWallet]);

  const handleGameOver = (resultData: any) => {
    const isWinner = resultData.winnerId === effectiveUserId;
    const isDraw = resultData.result === 'DRAW';

    if (isWinner) {
      audio.playVictory();
    } else if (!isDraw) {
      audio.playDefeat();
    }

    setGameOverResult({
      isWinner,
      isDraw,
      resultReason: resultData.reason || resultData.result,
      payoutEtb: Number(resultData.payoutMinor || 0) / 100,
      rakeEtb: Number(resultData.rakeMinor || 0) / 100,
      totalPotEtb: activeMatch ? activeMatch.stakeEtb * 2 : 0,
    });
  };

  // PvP Actions: Create, Join, Join by Code
  const handleCreateMatch = async (stakeMinor: bigint, isPrivate: boolean) => {
    const res = await api.post('/matches', {
      stakeMinor: stakeMinor.toString(),
      isPrivate,
    });
    fetchWallet();
    return res.data.data;
  };

  const handleJoinMatch = async (matchId: string) => {
    const res = await api.post(`/matches/${matchId}/join`);
    setActiveMatch(res.data.data);
    setGameState(res.data.data.state);
    if (res.data.data.clocks) {
      setWhiteTimeMs(res.data.data.clocks.whiteTimeMs);
      setBlackTimeMs(res.data.data.clocks.blackTimeMs);
    }
    setViewMode('pvp');
    fetchWallet();

    // Join Socket room
    socketRef.current.emit('JOIN_MATCH', { matchId });
  };

  const handleJoinByCode = async (code: string) => {
    const matchRes = await api.get(`/matches/${code}`);
    const matchId = matchRes.data.data.id;
    await handleJoinMatch(matchId);
  };

  const handleResign = async () => {
    if (viewMode === 'pvp' && activeMatch) {
      socketRef.current.emit('MATCH_RESIGN', { matchId: activeMatch.id });
    } else if (viewMode === 'practice') {
      setGameOverResult({
        isWinner: false,
        isDraw: false,
        resultReason: 'resignation',
        payoutEtb: 0,
        rakeEtb: 0,
        totalPotEtb: 0,
      });
    }
  };

  // Practice Mode Starter
  const handleStartPractice = (difficulty: DamaDifficulty) => {
    setPracticeDifficulty(difficulty);
    setGameState(createInitialState('W'));
    setSelectedPos(null);
    setLastMove(null);
    setGameOverResult(null);
    setIsAiThinking(false);
    setViewMode('practice');
  };

  // Square Click & Move Dispatcher
  const handleSquareClick = useCallback(
    (r: number, c: number) => {
      if (gameOverResult || isAiThinking) return;

      // In PvP mode: check that it is your turn
      if (viewMode === 'pvp') {
        const isMyTurn = gameState.turn === playerColor;
        if (!isMyTurn) return;
      }

      // Ignore light squares unless deselecting
      if (!isDarkSquare(r, c)) {
        setSelectedPos(null);
        return;
      }

      const piece = gameState.board[r][c];

      // Select own piece
      if (piece && piece.color === gameState.turn) {
        if (compulsoryPieces.length > 0) {
          const canCapture = compulsoryPieces.some((p) => p[0] === r && p[1] === c);
          if (!canCapture) return;
        }
        audio.playSelect();
        setSelectedPos([r, c]);
        return;
      }

      // If already selected, check if this is a valid target square
      if (selectedPos) {
        const candidate = validMovesForSelected.find((m) => {
          const dest = m.path[m.path.length - 1];
          return dest[0] === r && dest[1] === c;
        });

        if (candidate) {
          const dest = candidate.path[candidate.path.length - 1];
          if (viewMode === 'pvp' && activeMatch) {
            // Local optimistic audio feedback
            if (candidate.captured && candidate.captured.length > 0) {
              audio.playCapture();
            } else if (dest[0] === 0 || dest[0] === 7) {
              audio.playCrown();
            } else {
              audio.playMove();
            }

            // Send authoritative move to server via Socket.IO
            socketRef.current.emit('MATCH_MOVE', {
              matchId: activeMatch.id,
              from: candidate.from,
              path: candidate.path,
              ply: activeMatch?.moveCount,
            });
            setSelectedPos(null);
          } else {
            // Local Practice Mode
            const res = applyMove(gameState, candidate, DEFAULT_OPTIONS);
            setGameState(res.state);
            setLastMove({
              from: candidate.from,
              to: dest,
            });
            setSelectedPos(null);

            if (candidate.captured && candidate.captured.length > 0) {
              audio.playCapture();
            } else if (res.state.board[dest[0]][dest[1]]?.king && (dest[0] === 0 || dest[0] === 7)) {
              audio.playCrown();
            } else {
              audio.playMove();
            }

            if (res.result.status !== 'ongoing') {
              const isWin = res.result.status === 'win' && res.result.winner === 'W';
              if (isWin) {
                audio.playVictory();
              } else if (res.result.status === 'win') {
                audio.playDefeat();
              }
              setGameOverResult({
                isWinner: isWin,
                isDraw: res.result.status === 'draw',
                resultReason: res.result.reason,
                payoutEtb: 0,
                rakeEtb: 0,
                totalPotEtb: 0,
              });
            }
          }
        } else {
          setSelectedPos(null);
        }
      }
    },
    [
      gameOverResult,
      isAiThinking,
      viewMode,
      gameState,
      playerColor,
      activeMatch,
      compulsoryPieces,
      selectedPos,
      validMovesForSelected,
    ]
  );

  // AI response loop for Practice Mode
  useEffect(() => {
    if (
      viewMode === 'practice' &&
      gameState.turn === 'B' &&
      !gameOverResult &&
      !isAiThinking
    ) {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        const aiMove = findBestMove(gameState, practiceDifficulty, DEFAULT_OPTIONS);
        if (aiMove) {
          const res = applyMove(gameState, aiMove, DEFAULT_OPTIONS);
          const dest = aiMove.path[aiMove.path.length - 1];
          setGameState(res.state);
          setLastMove({
            from: aiMove.from,
            to: dest,
          });

          // Audio & haptic feedback for AI move
          if (aiMove.captured && aiMove.captured.length > 0) {
            audio.playCapture();
          } else if (res.state.board[dest[0]][dest[1]]?.king && (dest[0] === 0 || dest[0] === 7)) {
            audio.playCrown();
          } else {
            audio.playMove();
          }

          if (res.result.status !== 'ongoing') {
            const isWin = res.result.status === 'win' && res.result.winner === 'W';
            if (isWin) {
              audio.playVictory();
            } else if (res.result.status === 'win') {
              audio.playDefeat();
            }
            setGameOverResult({
              isWinner: isWin,
              isDraw: res.result.status === 'draw',
              resultReason: res.result.reason,
              payoutEtb: 0,
              rakeEtb: 0,
              totalPotEtb: 0,
            });
          }
        }
        setIsAiThinking(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [viewMode, gameState, gameOverResult, practiceDifficulty, isAiThinking, audio]);

  return (
    <div className="w-full bg-gradient-to-b from-[#110224] via-[#1d083d] to-[#0c011a] text-white min-h-[calc(100dvh-120px)] sm:min-h-screen py-1 sm:py-4 px-1 sm:px-4 flex flex-col items-center">
      <div className="max-w-4xl mx-auto flex flex-col items-center w-full">
        {/* Render Lobby View */}
        {viewMode === 'lobby' ? (
          <DamaLobby
            onStartPractice={handleStartPractice}
            onJoinMatch={handleJoinMatch}
            onCreateMatch={handleCreateMatch}
            onJoinByCode={handleJoinByCode}
          />
        ) : (
          /* Render NovaGame Dama Mobile Match View */
          <div className="w-full max-w-[460px] flex flex-col items-center gap-2 sm:gap-3 animate-in fade-in duration-200 select-none pb-8">
            {/* 1. Header: Live Viewer Badge, NovaGame Dama Royal Crown Logo, Floating 3D Checkers */}
            <CartellaDamaHeader onMenuToggle={() => setFlipped((prev) => !prev)} />

            {/* Quick Actions Drawer (Flip, Sound, Resign, Return to Lobby) */}
            <div className="flex items-center justify-between w-full px-2 py-1 bg-[#1c0836]/90 border border-purple-900/60 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => {
                  if (viewMode === 'pvp' && activeMatch?.status === 'ACTIVE' && !gameOverResult) {
                    if (!confirm('Leave active match? You can rejoin from the lobby.')) return;
                  }
                  setViewMode('lobby');
                  setActiveMatch(null);
                  setGameOverResult(null);
                }}
                className="flex items-center gap-1 text-slate-300 hover:text-white font-bold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Lobby</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFlipped((prev) => !prev)}
                  className="text-amber-300 hover:text-amber-200 font-bold"
                >
                  Flip Board
                </button>
                <button
                  type="button"
                  onClick={audio.toggleSound}
                  className="text-purple-300 hover:text-white"
                >
                  {audio.soundEnabled ? '🔊 Sound On' : '🔇 Mute'}
                </button>
                <button
                  type="button"
                  onClick={handleResign}
                  className="text-rose-400 hover:text-rose-300 font-bold"
                >
                  Resign
                </button>
              </div>
            </div>

            {/* 2. Dynamic Stat Cards (Stake, Prize, Players) */}
            <CartellaDamaStats
              stake={activeMatch ? activeMatch.stakeEtb : 50}
              prize={activeMatch ? Math.round(activeMatch.stakeEtb * 2 * 0.95) : 200}
              playersCount="2 / 2"
            />

            {/* 3. Player Turn / VS Header (Abdi vs Biniam + Clock) */}
            <CartellaDamaVersus
              player1Name={user?.username || 'Abdi'}
              player2Name={
                viewMode === 'practice'
                  ? 'Biniam'
                  : (activeMatch?.blackPlayer?.username || activeMatch?.whitePlayer?.username || 'Biniam')
              }
              isPlayer1Turn={gameState.turn === playerColor}
              timeFormatted={(() => {
                const ms = gameState.turn === 'W' ? whiteTimeMs : blackTimeMs;
                const totalSec = Math.max(0, Math.floor(ms / 1000));
                const mins = Math.floor(totalSec / 60);
                const secs = totalSec % 60;
                return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
              })()}
            />

            {/* 4. Complete 8x8 Wooden Checkered Board */}
            <DamaBoard
              board={gameState.board}
              turn={gameState.turn}
              selectedPos={selectedPos}
              validMovesForSelected={validMovesForSelected}
              compulsoryPieces={compulsoryPieces}
              lastMove={lastMove}
              onSquareClick={handleSquareClick}
              playerColor={playerColor}
              disabled={
                Boolean(gameOverResult) ||
                (viewMode === 'pvp' && gameState.turn !== playerColor) ||
                (viewMode === 'practice' && isAiThinking)
              }
              flipped={flipped}
            />

            {/* 5. Action Buttons (Undo, Move, Hint) */}
            <CartellaDamaActions
              onUndo={() => {
                // Reset selected pos or restart if in practice
                setSelectedPos(null);
              }}
              canUndo={viewMode === 'practice'}
              onConfirmMove={() => {
                if (selectedPos && validMovesForSelected.length > 0) {
                  const targetMove = validMovesForSelected[0];
                  const dest = targetMove.path[targetMove.path.length - 1];
                  handleSquareClick(dest[0], dest[1]);
                } else if (legalMoves.length > 0) {
                  setSelectedPos(legalMoves[0].from);
                  audio.playMove();
                }
              }}
              canMove={Boolean(selectedPos && validMovesForSelected.length > 0)}
              onHint={() => {
                const best = findBestMove(gameState, practiceDifficulty);
                if (best) {
                  setSelectedPos(best.from);
                  audio.playMove();
                }
              }}
              disabled={
                Boolean(gameOverResult) ||
                (viewMode === 'pvp' && gameState.turn !== playerColor) ||
                (viewMode === 'practice' && isAiThinking)
              }
            />

            {/* 6. Winner Condition & Good Luck Banners */}
            <CartellaDamaBanner />

            {/* Game Over Modal Overlay */}
            {gameOverResult && (
              <DamaGameOverModal
                isPractice={viewMode === 'practice'}
                isWinner={gameOverResult.isWinner}
                isDraw={gameOverResult.isDraw}
                resultReason={gameOverResult.resultReason}
                payoutEtb={gameOverResult.payoutEtb}
                rakeEtb={gameOverResult.rakeEtb}
                totalPotEtb={gameOverResult.totalPotEtb}
                onReturnToLobby={() => {
                  setViewMode('lobby');
                  setActiveMatch(null);
                  setGameOverResult(null);
                  fetchWallet();
                }}
                onRestartPractice={() => handleStartPractice(practiceDifficulty)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
