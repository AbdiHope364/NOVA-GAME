import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../../../stores/authStore';
import {
  FrontendTttMatch,
  TttGameMode,
  TttSymbol,
} from '../types/ticTacToe.types';
import { tttSound } from '../utils/boardHelpers';

export function useTicTacToeSocket() {
  const { user, token } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isQueuing, setIsQueuing] = useState(false);
  const [queueStatusMessage, setQueueStatusMessage] = useState<string | null>(null);
  const [activeMatch, setActiveMatch] = useState<FrontendTttMatch | null>(null);
  const [mySymbol, setMySymbol] = useState<TttSymbol | null>(null);
  const [reactionBubble, setReactionBubble] = useState<{ userId: string; reaction: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize Socket connection
  useEffect(() => {
    const wsUrl = window.location.origin;
    const socket = io(wsUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: { token: token || 'demo-guest-token' },
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('ttt:queue:waiting', (data: { message: string }) => {
      setIsQueuing(true);
      setQueueStatusMessage(data.message);
    });

    socket.on('ttt:queue:left', () => {
      setIsQueuing(false);
      setQueueStatusMessage(null);
    });

    socket.on('ttt:room:created', (data: { match: FrontendTttMatch; assignedSymbol: TttSymbol }) => {
      setActiveMatch(data.match);
      setMySymbol(data.assignedSymbol);
    });

    socket.on('ttt:match:found', (data: { match: FrontendTttMatch; assignedSymbol: TttSymbol }) => {
      setIsQueuing(false);
      setActiveMatch(data.match);
      setMySymbol(data.assignedSymbol);
    });

    socket.on('ttt:match:started', (data: { match: FrontendTttMatch; assignedSymbol?: TttSymbol }) => {
      setIsQueuing(false);
      setActiveMatch(data.match);
      if (data.assignedSymbol) {
        setMySymbol(data.assignedSymbol);
      }
    });

    socket.on('ttt:move:accepted', (data: { match: FrontendTttMatch }) => {
      setActiveMatch(data.match);
      const lastPlayer = data.match.currentTurn === 'X' ? 'O' : 'X';
      tttSound.playMove(lastPlayer);
    });

    socket.on('ttt:turn:changed', (data: { currentTurn: TttSymbol; turnStartedAt: number }) => {
      setActiveMatch((prev) => (prev ? { ...prev, currentTurn: data.currentTurn, turnStartedAt: data.turnStartedAt } : null));
    });

    socket.on('ttt:match:finished', (data: { match: FrontendTttMatch }) => {
      setActiveMatch(data.match);
      if (data.match.winnerSymbol === 'DRAW') {
        tttSound.playDraw();
      } else if (data.match.winnerId === user?.id) {
        tttSound.playWin();
      } else {
        tttSound.playLoss();
      }
    });

    socket.on('ttt:match:resumed', (data: { match: FrontendTttMatch }) => {
      setActiveMatch(data.match);
      const symbol: TttSymbol = data.match.playerX.userId === user?.id ? 'X' : 'O';
      setMySymbol(symbol);
    });

    socket.on('ttt:reaction', (data: { userId: string; reaction: string }) => {
      setReactionBubble(data);
      setTimeout(() => setReactionBubble(null), 3000);
    });

    socket.on('ttt:error', (data: { message: string }) => {
      setErrorMessage(data.message);
      setTimeout(() => setErrorMessage(null), 5000);
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user?.id]);

  // Actions
  const joinQueue = useCallback((mode: TttGameMode = 'FREE', stake = 0) => {
    if (!socketRef.current) return;
    setIsQueuing(true);
    socketRef.current.emit('ttt:queue:join', { mode, stake });
  }, []);

  const leaveQueue = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('ttt:queue:leave');
    setIsQueuing(false);
    setQueueStatusMessage(null);
  }, []);

  const createRoom = useCallback((mode: TttGameMode = 'FREE', stake = 0) => {
    if (!socketRef.current) return;
    socketRef.current.emit('ttt:room:create', { mode, stake });
  }, []);

  const joinRoom = useCallback((roomCode: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('ttt:room:join', { roomCode: roomCode.trim().toUpperCase() });
  }, []);

  const makeMove = useCallback((cellIndex: number) => {
    if (!socketRef.current || !activeMatch) return;
    socketRef.current.emit('ttt:move', {
      matchId: activeMatch.id,
      cellIndex,
      version: activeMatch.version,
    });
  }, [activeMatch]);

  const resign = useCallback(() => {
    if (!socketRef.current || !activeMatch) return;
    socketRef.current.emit('ttt:match:resign', { matchId: activeMatch.id });
  }, [activeMatch]);

  const sendReaction = useCallback((reaction: string) => {
    if (!socketRef.current || !activeMatch) return;
    socketRef.current.emit('ttt:reaction', { matchId: activeMatch.id, reaction });
  }, [activeMatch]);

  const clearMatch = useCallback(() => {
    setActiveMatch(null);
    setMySymbol(null);
  }, []);

  return {
    isConnected,
    isQueuing,
    queueStatusMessage,
    activeMatch,
    mySymbol,
    reactionBubble,
    errorMessage,
    joinQueue,
    leaveQueue,
    createRoom,
    joinRoom,
    makeMove,
    resign,
    sendReaction,
    clearMatch,
  };
}
