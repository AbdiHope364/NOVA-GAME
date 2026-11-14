import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../../services/api';
import { getGameSocket } from '../../../services/socket';
import { useAuthStore } from '../../../stores/authStore';
import { useWalletStore } from '../../../stores/walletStore';
import { LettiMatchPublicView, LettiMultiplayerConfigDTO } from '@nova/types';

export interface LettiPvpHistoryItem {
  roomId: string;
  roomCode: string;
  roomType: string;
  stakeEtb: number;
  totalPotEtb: number;
  platformFeeEtb: number;
  winnerPayoutEtb: number;
  winnerId: string | null;
  resultType: string | null;
  completedAt: string | null;
  totalFlips: number;
  opponent: {
    userId: string;
    username: string;
    avatarUrl?: string | null;
  } | null;
  didWin: boolean;
  isDraw: boolean;
}

const DEFAULT_CONFIG: LettiMultiplayerConfigDTO = {
  enabled: true,
  quickMatchEnabled: true,
  privateRoomsEnabled: true,
  minStakeEtb: 10,
  maxStakeEtb: 5000,
  platformFeePercent: 5,
  reconnectGraceSeconds: 45,
  maxDisconnects: 3,
  roomExpiryMinutes: 15,
  turnTimeoutSeconds: 30,
  allowBonusBalance: false,
};

const createIdempotencyKey = (prefix: string) => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}:${crypto.randomUUID()}`;
  }
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
};

export function useLettiMultiplayer(initialRoomCode?: string | null) {
  const { user, isAuthenticated } = useAuthStore();
  const { balance, cashBalance, bonusBalance, fetchWallet, fetchTransactions } = useWalletStore();

  const [config, setConfig] = useState<LettiMultiplayerConfigDTO>(DEFAULT_CONFIG);
  const [stakeEtb, setStakeEtb] = useState<number>(50);
  const [roomCodeInput, setRoomCodeInput] = useState<string>(initialRoomCode || '');
  const [activeRoom, setActiveRoom] = useState<LettiMatchPublicView | null>(null);
  const [history, setHistory] = useState<LettiPvpHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [turnCountdown, setTurnCountdown] = useState<number | null>(null);
  const [opponentDisconnectCountdown, setOpponentDisconnectCountdown] = useState<number | null>(null);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);

  const activeRoomRef = useRef<LettiMatchPublicView | null>(null);
  activeRoomRef.current = activeRoom;
  const autoJoinAttemptedRef = useRef<string | null>(null);

  const refreshConfig = useCallback(async () => {
    try {
      const res = await api.get('/letti-pvp/config');
      if (res.data?.data) {
        const cfg: LettiMultiplayerConfigDTO = res.data.data;
        setConfig(cfg);
        setStakeEtb((prev) =>
          Math.min(Math.max(prev, cfg.minStakeEtb), cfg.maxStakeEtb)
        );
      }
    } catch {
      // Fall back to default config cleanly
    }
  }, []);

  const refreshHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/letti-pvp/history');
      if (Array.isArray(res.data?.data)) {
        setHistory(res.data.data);
      }
    } catch {
      // Ignore transient errors
    }
  }, [isAuthenticated]);

  const refreshActiveRoom = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await api.get('/letti-pvp/active');
      const roomView: LettiMatchPublicView | null = res.data?.data || null;
      setActiveRoom(roomView);
      if (roomView) {
        const socket = getGameSocket();
        if (socket.connected) {
          socket.emit('letti:request-state', { roomId: roomView.roomId });
        }
      }
    } catch {
      // Ignore if unauthenticated
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  useEffect(() => {
    if (!isAuthenticated) {
      setActiveRoom(null);
      setHistory([]);
      return;
    }
    refreshActiveRoom();
    refreshHistory();
  }, [isAuthenticated, refreshActiveRoom, refreshHistory]);

  // Ensure socket auth token stays fresh and register Letti PvP listeners
  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getGameSocket();
    const currentToken = localStorage.getItem('nova_token') || 'demo-guest-token';
    if ((socket.auth as any)?.token !== currentToken) {
      socket.auth = { token: currentToken };
      socket.disconnect().connect();
    }

    setSocketConnected(socket.connected);

    const handleConnect = () => {
      setSocketConnected(true);
      const current = activeRoomRef.current;
      if (current?.roomId) {
        socket.emit('letti:request-state', { roomId: current.roomId });
      }
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    const applyRoomUpdate = (view: LettiMatchPublicView) => {
      setActiveRoom(view);
      setBusyAction(null);
      setError(null);
    };

    const handleRoomCreated = (view: LettiMatchPublicView) => {
      applyRoomUpdate(view);
      setBannerMessage(
        view.roomType === 'PRIVATE'
          ? `Private room ${view.roomCode} created. Share the code or invite link!`
          : `Searching for a ${view.stakeEtb.toLocaleString()} ETB opponent...`
      );
    };

    const handlePlayerJoined = (view: LettiMatchPublicView) => {
      applyRoomUpdate(view);
      setBannerMessage('Opponent joined! Pick your secret card to begin.');
      fetchWallet();
    };

    const handleMatchFound = (view: LettiMatchPublicView) => {
      const prevId = activeRoomRef.current?.roomId;
      applyRoomUpdate(view);
      setBannerMessage(`Match found! Room ${view.roomCode} — choose your secret card.`);
      fetchWallet();
      if (prevId && prevId !== view.roomId) {
        socket.emit('letti:request-state', { roomId: view.roomId });
      }
    };

    const handleGameStarted = (view: LettiMatchPublicView) => {
      applyRoomUpdate(view);
      setBannerMessage('Both players ready! Player 1 flips first.');
      setTurnCountdown(config.turnTimeoutSeconds);
      fetchWallet();
    };

    const handleTurnChanged = (view: LettiMatchPublicView) => {
      applyRoomUpdate(view);
      setTurnCountdown(config.turnTimeoutSeconds);
    };

    const handleGameStateUpdated = (view: LettiMatchPublicView) => {
      applyRoomUpdate(view);
      if (view.phase === 'PLAYING') {
        setTurnCountdown(config.turnTimeoutSeconds);
      } else {
        setTurnCountdown(null);
      }
      if (view.roomStatus === 'CANCELLED' || view.roomStatus === 'EXPIRED') {
        fetchWallet();
        fetchTransactions();
      }
    };

    const handleOpponentDisconnected = (payload: { graceSeconds?: number }) => {
      const grace = payload?.graceSeconds || config.reconnectGraceSeconds;
      setOpponentDisconnectCountdown(grace);
      setBannerMessage(`Opponent disconnected. Waiting ${grace}s for reconnect...`);
    };

    const handleOpponentReconnected = () => {
      setOpponentDisconnectCountdown(null);
      setBannerMessage('Opponent reconnected!');
    };

    const handleGameCompleted = (view: LettiMatchPublicView) => {
      applyRoomUpdate(view);
      setTurnCountdown(null);
      setOpponentDisconnectCountdown(null);
      fetchWallet();
      fetchTransactions();
      refreshHistory();

      if (view.resultType === 'DRAW') {
        setBannerMessage('All 50 deck cards flipped with no match — Draw! Stakes refunded.');
      } else if (view.resultType === 'FORFEIT') {
        setBannerMessage('Match settled by forfeit.');
      } else if (view.winnerId && user?.id && view.winnerId === user.id) {
        setBannerMessage(`You won ${view.winnerPayoutEtb.toLocaleString()} ETB!`);
      } else {
        setBannerMessage('Match completed!');
      }
    };

    const handleError = (payload: { message?: string }) => {
      setBusyAction(null);
      setError(payload?.message || 'Multiplayer action failed');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('letti:room-created', handleRoomCreated);
    socket.on('letti:player-joined', handlePlayerJoined);
    socket.on('letti:match-found', handleMatchFound);
    socket.on('letti:game-started', handleGameStarted);
    socket.on('letti:turn-changed', handleTurnChanged);
    socket.on('letti:game-state-updated', handleGameStateUpdated);
    socket.on('letti:opponent-disconnected', handleOpponentDisconnected);
    socket.on('letti:opponent-reconnected', handleOpponentReconnected);
    socket.on('letti:game-completed', handleGameCompleted);
    socket.on('letti:error', handleError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('letti:room-created', handleRoomCreated);
      socket.off('letti:player-joined', handlePlayerJoined);
      socket.off('letti:match-found', handleMatchFound);
      socket.off('letti:game-started', handleGameStarted);
      socket.off('letti:turn-changed', handleTurnChanged);
      socket.off('letti:game-state-updated', handleGameStateUpdated);
      socket.off('letti:opponent-disconnected', handleOpponentDisconnected);
      socket.off('letti:opponent-reconnected', handleOpponentReconnected);
      socket.off('letti:game-completed', handleGameCompleted);
      socket.off('letti:error', handleError);
    };
  }, [
    isAuthenticated,
    user?.id,
    config.turnTimeoutSeconds,
    config.reconnectGraceSeconds,
    fetchWallet,
    fetchTransactions,
    refreshHistory,
  ]);

  // Countdown tick for turn timer & disconnect grace indicator
  useEffect(() => {
    if (turnCountdown === null && opponentDisconnectCountdown === null) return;
    const timer = window.setInterval(() => {
      setTurnCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
      setOpponentDisconnectCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [turnCountdown !== null, opponentDisconnectCountdown !== null]);

  const joinRoom = useCallback(
    async (codeOrId: string) => {
      const normalized = codeOrId.trim().toUpperCase();
      if (!normalized) {
        setError('Please enter a room code');
        return;
      }
      setError(null);
      setBusyAction('JOIN');
      const socket = getGameSocket();
      if (socket.connected) {
        socket.emit('letti:join-room', { roomCode: normalized });
        return;
      }
      try {
        const res = await api.post('/letti-pvp/rooms/join', { roomCode: normalized });
        setActiveRoom(res.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to join room');
      } finally {
        setBusyAction(null);
      }
    },
    []
  );

  // Auto-join from ?room=CODE invite URL once logged in & no active room
  useEffect(() => {
    if (!initialRoomCode || !isAuthenticated || loading || activeRoom) return;
    const clean = initialRoomCode.trim().toUpperCase();
    if (!clean || autoJoinAttemptedRef.current === clean) return;
    autoJoinAttemptedRef.current = clean;
    joinRoom(clean);
  }, [initialRoomCode, isAuthenticated, loading, activeRoom, joinRoom]);

  const startQuickMatch = useCallback(async () => {
    setError(null);
    setBusyAction('QUICK_MATCH');
    const socket = getGameSocket();
    if (socket.connected) {
      socket.emit('letti:quick-match', { stakeEtb });
      return;
    }
    try {
      const res = await api.post('/letti-pvp/quick-match', { stakeEtb });
      setActiveRoom(res.data.data.view);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Quick match failed');
    } finally {
      setBusyAction(null);
    }
  }, [stakeEtb]);

  const createPrivateRoom = useCallback(async () => {
    setError(null);
    setBusyAction('CREATE');
    const socket = getGameSocket();
    if (socket.connected) {
      socket.emit('letti:create-room', { stakeEtb });
      return;
    }
    try {
      const res = await api.post('/letti-pvp/rooms', { stakeEtb });
      setActiveRoom(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create room');
    } finally {
      setBusyAction(null);
    }
  }, [stakeEtb]);

  const pickSecretCard = useCallback(async (cardIndex: number) => {
    const room = activeRoomRef.current;
    if (!room?.matchId) return;
    setError(null);
    setBusyAction('PICK');
    const key = createIdempotencyKey(`pick:${room.matchId}`);
    const socket = getGameSocket();
    if (socket.connected) {
      socket.emit('letti:player-action', {
        matchId: room.matchId,
        actionType: 'PICK_CARD',
        pickedCardIndex: cardIndex,
        idempotencyKey: key,
      });
      return;
    }
    try {
      const res = await api.post(`/letti-pvp/matches/${room.matchId}/action`, {
        actionType: 'PICK_CARD',
        pickedCardIndex: cardIndex,
        idempotencyKey: key,
      });
      setActiveRoom(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to pick card');
    } finally {
      setBusyAction(null);
    }
  }, []);

  const markReady = useCallback(async () => {
    const room = activeRoomRef.current;
    if (!room?.matchId) return;
    setError(null);
    setBusyAction('READY');
    const key = createIdempotencyKey(`ready:${room.matchId}`);
    const socket = getGameSocket();
    if (socket.connected) {
      socket.emit('letti:player-ready', {
        matchId: room.matchId,
        idempotencyKey: key,
      });
      return;
    }
    try {
      const res = await api.post(`/letti-pvp/matches/${room.matchId}/action`, {
        actionType: 'PLAYER_READY',
        idempotencyKey: key,
      });
      setActiveRoom(res.data.data);
      fetchWallet();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to ready up');
    } finally {
      setBusyAction(null);
    }
  }, [fetchWallet]);

  const flipCard = useCallback(async () => {
    const room = activeRoomRef.current;
    if (!room?.matchId) return;
    setError(null);
    setBusyAction('FLIP');
    const key = createIdempotencyKey(`flip:${room.matchId}`);
    const socket = getGameSocket();
    if (socket.connected) {
      socket.emit('letti:player-action', {
        matchId: room.matchId,
        actionType: 'FLIP_CARD',
        idempotencyKey: key,
      });
      return;
    }
    try {
      const res = await api.post(`/letti-pvp/matches/${room.matchId}/action`, {
        actionType: 'FLIP_CARD',
        idempotencyKey: key,
      });
      setActiveRoom(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to flip card');
    } finally {
      setBusyAction(null);
    }
  }, []);

  const leaveOrForfeitRoom = useCallback(async () => {
    const room = activeRoomRef.current;
    if (!room) return;
    setError(null);
    setBusyAction('LEAVE');
    const socket = getGameSocket();
    if (socket.connected) {
      socket.emit('letti:leave-room', { roomId: room.roomId });
      if (room.roomStatus === 'WAITING') {
        setActiveRoom(null);
      }
      fetchWallet();
      return;
    }
    try {
      await api.post(`/letti-pvp/rooms/${room.roomId}/leave`);
      setActiveRoom(null);
      fetchWallet();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to leave room');
    } finally {
      setBusyAction(null);
    }
  }, [fetchWallet]);

  const requestRematch = useCallback(async () => {
    const room = activeRoomRef.current;
    if (!room) return;
    setError(null);
    setBusyAction('REMATCH');
    const socket = getGameSocket();
    if (socket.connected) {
      socket.emit('letti:rematch', { roomId: room.roomId });
      return;
    }
    try {
      const res = await api.post(`/letti-pvp/rooms/${room.roomId}/rematch`);
      if (res.data.data?.rematchReady && res.data.data?.newRoomId) {
        await refreshActiveRoom();
      } else {
        setBannerMessage('Rematch requested — waiting for opponent.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Rematch request failed');
    } finally {
      setBusyAction(null);
    }
  }, [refreshActiveRoom]);

  const dismissFinishedRoom = useCallback(() => {
    setActiveRoom(null);
    setBannerMessage(null);
    setError(null);
    refreshHistory();
  }, [refreshHistory]);

  return {
    user,
    isAuthenticated,
    cashBalance,
    bonusBalance,
    balance,
    config,
    stakeEtb,
    setStakeEtb,
    roomCodeInput,
    setRoomCodeInput,
    activeRoom,
    history,
    loading,
    busyAction,
    error,
    setError,
    bannerMessage,
    setBannerMessage,
    turnCountdown,
    opponentDisconnectCountdown,
    socketConnected,
    startQuickMatch,
    createPrivateRoom,
    joinRoom,
    pickSecretCard,
    markReady,
    flipCard,
    leaveOrForfeitRoom,
    requestRematch,
    dismissFinishedRoom,
    refreshActiveRoom,
  };
}
