import { useState, useCallback, useEffect, useRef } from 'react';
import {
  TttBoard,
  TttSymbol,
  TttWinner,
  WinningLine,
  AiDifficulty,
  createInitialBoard,
  applyMove,
  computeAiMove,
} from '@nova/game-tic-tac-toe';
import {
  FrontendTttMatch,
  TttGameMode,
  UserTttStats,
} from '../types/ticTacToe.types';
import { useTicTacToeSocket } from './useTicTacToeSocket';
import { useAuthStore } from '../../../stores/authStore';
import { useWalletStore } from '../../../stores/walletStore';
import { tttSound } from '../utils/boardHelpers';

export function useTicTacToe() {
  const { user } = useAuthStore();
  const { balance: walletBalance, fetchWallet } = useWalletStore();
  const socketState = useTicTacToeSocket();

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  // Mode and view management
  const [gameMode, setGameMode] = useState<TttGameMode>('PRACTICE');
  const [aiDifficulty, setAiDifficulty] = useState<AiDifficulty>('HARD');

  // Local Practice Match state
  const [practiceBoard, setPracticeBoard] = useState<TttBoard>(() => createInitialBoard());
  const [practiceTurn, setPracticeTurn] = useState<TttSymbol>('X');
  const [practiceWinner, setPracticeWinner] = useState<TttWinner>(null);
  const [practiceWinningLine, setPracticeWinningLine] = useState<WinningLine>(null);
  const [practiceMoveCount, setPracticeMoveCount] = useState(0);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // User Stats (local or backend)
  const [userStats, setUserStats] = useState<UserTttStats>({
    userId: user?.id || 'local-user',
    username: user?.username || 'Player',
    rating: 1000,
    totalMatches: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winRate: 0,
    streak: 0,
  });

  // Start new local practice match
  const startPracticeMatch = useCallback((difficulty: AiDifficulty = 'HARD') => {
    setGameMode('PRACTICE');
    setAiDifficulty(difficulty);
    setPracticeBoard(createInitialBoard());
    setPracticeTurn('X');
    setPracticeWinner(null);
    setPracticeWinningLine(null);
    setPracticeMoveCount(0);
    setIsAiThinking(false);
  }, []);

  // Practice Move handler
  const handlePracticeMove = useCallback(
    (cellIndex: number) => {
      if (practiceWinner !== null || isAiThinking) return;
      if (practiceBoard[cellIndex] !== null) return;
      if (practiceTurn !== 'X') return; // Human is always X in Practice mode

      const res = applyMove(practiceBoard, 'X', cellIndex, 'X', practiceMoveCount);
      if (!res.valid) return;

      setPracticeBoard(res.board);
      setPracticeMoveCount(res.moveNumber);
      tttSound.playMove('X');

      if (res.isGameOver) {
        setPracticeWinner(res.winner);
        setPracticeWinningLine(res.winningLine);
        if (res.isDraw) {
          tttSound.playDraw();
        } else {
          tttSound.playWin();
        }
        return;
      }

      // Next turn: AI (O)
      setPracticeTurn('O');
      setIsAiThinking(true);

      // AI response with subtle human delay (400ms)
      setTimeout(() => {
        const aiMoveIndex = computeAiMove(res.board, 'O', aiDifficulty);
        if (aiMoveIndex !== -1) {
          const aiRes = applyMove(res.board, 'O', aiMoveIndex, 'O', res.moveNumber);
          if (aiRes.valid) {
            setPracticeBoard(aiRes.board);
            setPracticeMoveCount(aiRes.moveNumber);
            tttSound.playMove('O');

            if (aiRes.isGameOver) {
              setPracticeWinner(aiRes.winner);
              setPracticeWinningLine(aiRes.winningLine);
              if (aiRes.isDraw) {
                tttSound.playDraw();
              } else {
                tttSound.playLoss();
              }
            } else {
              setPracticeTurn('X');
            }
          }
        }
        setIsAiThinking(false);
      }, 400);
    },
    [practiceBoard, practiceTurn, practiceWinner, practiceMoveCount, isAiThinking, aiDifficulty]
  );

  // Active match adapter (unifies local Practice with remote Multiplayer match)
  const unifiedMatch: FrontendTttMatch | null =
    gameMode === 'PRACTICE'
      ? {
          id: 'practice-match',
          mode: 'PRACTICE',
          status: practiceWinner ? 'FINISHED' : 'IN_PROGRESS',
          board: practiceBoard,
          currentTurn: practiceTurn,
          moveCount: practiceMoveCount,
          version: 1,
          winningLine: practiceWinningLine,
          winnerSymbol: practiceWinner,
          winnerId: practiceWinner === 'X' ? (user?.id || 'local') : practiceWinner === 'O' ? 'ai' : null,
          playerX: {
            userId: user?.id || 'local',
            username: user?.username || 'You',
            symbol: 'X',
            rating: userStats.rating,
            isConnected: true,
          },
          playerO: {
            userId: 'ai',
            username: `NOVA AI (${aiDifficulty})`,
            symbol: 'O',
            rating: aiDifficulty === 'HARD' ? 1800 : aiDifficulty === 'MEDIUM' ? 1200 : 800,
            isConnected: true,
          },
          turnStartedAt: Date.now(),
          turnTimeoutSeconds: 15,
          entryStake: 0,
          pot: 0,
        }
      : socketState.activeMatch;

  const currentSymbol: TttSymbol =
    gameMode === 'PRACTICE' ? 'X' : socketState.mySymbol || 'X';

  const isMyTurn =
    unifiedMatch?.status === 'IN_PROGRESS' &&
    unifiedMatch?.currentTurn === currentSymbol &&
    !isAiThinking;

  const makeMove = useCallback(
    (cellIndex: number) => {
      if (gameMode === 'PRACTICE') {
        handlePracticeMove(cellIndex);
      } else {
        socketState.makeMove(cellIndex);
      }
    },
    [gameMode, handlePracticeMove, socketState]
  );

  return {
    gameMode,
    setGameMode,
    aiDifficulty,
    setAiDifficulty,
    unifiedMatch,
    currentSymbol,
    isMyTurn,
    isAiThinking,
    userStats,
    walletBalance,
    ...socketState,
    makeMove,
    startPracticeMatch,
  };
}
