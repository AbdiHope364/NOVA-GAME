import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../stores/authStore';
import { useWalletStore } from '../../../stores/walletStore';

export interface CoinFlipPlayer {
  userId: string;
  username: string;
  avatar?: string;
  choice: 'HEADS' | 'TAILS';
  ready: boolean;
  connected: boolean;
  stake: number;
}

export interface CoinFlipRoom {
  id: string;
  roomCode: string;
  type: 'QUICK_MATCH' | 'PRIVATE';
  status: 'WAITING' | 'COUNTDOWN' | 'FLIPPING' | 'COMPLETED' | 'CANCELLED';
  stake: number;
  pot: number;
  platformFeeBps: number;
  creatorId: string;
  playerOne: CoinFlipPlayer;
  playerTwo: CoinFlipPlayer | null;
  winnerId: string | null;
  winningSide: 'HEADS' | 'TAILS' | null;
  serverSeedHash: string;
  countdown: number;
  createdAt: string;
  settledAt?: string;
}

export function useCoinFlipMultiplayer() {
  const { user, token } = useAuthStore();
  const { balance, updateBalance, fetchWallet } = useWalletStore();

  const [activeRoom, setActiveRoom] = useState<CoinFlipRoom | null>(null);
  const [availableRooms, setAvailableRooms] = useState<CoinFlipRoom[]>([]);
  const [recentWinners, setRecentWinners] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);

  const [isQueuing, setIsQueuing] = useState(false);
  const [queueStake, setQueueStake] = useState<number>(100);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [settledMatch, setSettledMatch] = useState<CoinFlipRoom | null>(null);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // Load lobby data from API
  const refreshLobby = useCallback(async () => {
    fetchWallet();
    try {
      const [cfgRes, roomsRes, winnersRes, lbRes, statsRes] = await Promise.allSettled([
        api.get('/coin-flip-pvp/config'),
        api.get('/coin-flip-pvp/rooms'),
        api.get('/coin-flip-pvp/winners'),
        api.get('/coin-flip-pvp/leaderboard'),
        api.get('/coin-flip-pvp/stats'),
      ]);

      if (cfgRes.status === 'fulfilled') setConfig(cfgRes.value.data.data);
      if (roomsRes.status === 'fulfilled') setAvailableRooms(roomsRes.value.data.data || []);
      if (winnersRes.status === 'fulfilled') setRecentWinners(winnersRes.value.data.data || []);
      if (lbRes.status === 'fulfilled') setLeaderboard(lbRes.value.data.data || []);
      if (statsRes.status === 'fulfilled') setUserStats(statsRes.value.data.data || null);
    } catch {
      // Fallback
    }
  }, []);

  useEffect(() => {
    refreshLobby();
  }, [refreshLobby]);

  // Connect to Socket.IO
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socket = io(socketUrl, {
      auth: { token: token || 'demo-guest-token' },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('coinflip:queued', (data) => {
      setIsQueuing(true);
      setQueueStake(data.stake);
    });

    socket.on('coinflip:queue-left', () => {
      setIsQueuing(false);
    });

    socket.on('coinflip:matched', (room: CoinFlipRoom) => {
      setIsQueuing(false);
      setActiveRoom(room);
      setCountdown(3);
      setSettledMatch(null);
    });

    socket.on('coinflip:countdown', (data: { countdown: number; roomId: string }) => {
      setCountdown(data.countdown);
    });

    socket.on('coinflip:flipping', () => {
      setCountdown(0);
      setIsFlipping(true);
    });

    socket.on('coinflip:resolved', (room: CoinFlipRoom) => {
      setIsFlipping(false);
      setActiveRoom(room);
      setSettledMatch(room);

      // Refresh balance and lobby stats
      if (user && room.winnerId === user.id) {
        const netWin = room.pot * 0.975 - room.stake;
        updateBalance(balance + netWin);
      }
      refreshLobby();
    });

    socket.on('coinflip:error', (err: { message: string }) => {
      setError(err.message);
      setIsQueuing(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user, balance, updateBalance, refreshLobby]);

  // Actions
  const queueQuickMatch = (stake: number, choice: 'HEADS' | 'TAILS') => {
    setError(null);
    setIsQueuing(true);
    setQueueStake(stake);
    socketRef.current?.emit('coinflip:queue-quick-match', { stake, choice });
  };

  const leaveQueue = () => {
    setIsQueuing(false);
    socketRef.current?.emit('coinflip:leave-queue');
  };

  const createPrivateRoom = async (stake: number, choice: 'HEADS' | 'TAILS'): Promise<CoinFlipRoom | null> => {
    setError(null);
    try {
      const res = await api.post('/coin-flip-pvp/room/create', { stake, choice });
      const room = res.data.data;
      setActiveRoom(room);
      socketRef.current?.emit('coinflip:join-room-channel', { roomId: room.id });
      return room;
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to create room');
      return null;
    }
  };

  const joinPrivateRoom = async (code: string): Promise<CoinFlipRoom | null> => {
    setError(null);
    try {
      const res = await api.post('/coin-flip-pvp/room/join', { code });
      const room = res.data.data;
      setActiveRoom(room);
      socketRef.current?.emit('coinflip:join-room-channel', { roomId: room.id });
      socketRef.current?.emit('coinflip:player-ready', { roomId: room.id });
      return room;
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to join room');
      return null;
    }
  };

  const resetMatch = () => {
    setActiveRoom(null);
    setSettledMatch(null);
    setCountdown(null);
    setIsFlipping(false);
    refreshLobby();
  };

  return {
    activeRoom,
    availableRooms,
    recentWinners,
    leaderboard,
    userStats,
    config,
    isQueuing,
    queueStake,
    countdown,
    isFlipping,
    settledMatch,
    error,
    balance,
    refreshLobby,
    queueQuickMatch,
    leaveQueue,
    createPrivateRoom,
    joinPrivateRoom,
    resetMatch,
  };
}
