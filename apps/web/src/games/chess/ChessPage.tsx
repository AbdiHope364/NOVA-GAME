import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Award,
  Bot,
  Check,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Crown,
  Flag,
  FlipVertical,
  Handshake,
  History,
  KeyRound,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Swords,
  Trophy,
  UserPlus,
  Users,
  Zap,
  Wallet,
  Plus,
  HelpCircle,
} from 'lucide-react';
import { HowToPlayModal } from '../../components/common/HowToPlayModal';
import {
  CHESS_TIME_CONTROLS,
  ChessDifficulty,
  ChessEngine,
  ChessMoveRecord,
  ChessTermination,
  ChessTimeControlKey,
  PieceColor,
  PieceType,
  PromotionPiece,
  STARTING_FEN,
  chooseChessAiMove,
} from '@nova/game-chess';
import { api } from '../../services/api';
import { getGameSocket } from '../../services/socket';
import { useAuthStore } from '../../stores/authStore';
import { useWalletStore } from '../../stores/walletStore';
import { ChessPieceSvg } from './components/ChessPieceSvg';

type LobbyTab = 'ROOMS' | 'LIVE' | 'LEADERBOARD' | 'HISTORY';

const FILES_ASC = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS_DESC = ['8', '7', '6', '5', '4', '3', '2', '1'];

function formatClock(ms: number): string {
  const clamped = Math.max(0, ms);
  if (clamped < 10_000) {
    return `${(clamped / 1000).toFixed(1)}s`;
  }
  const totalSec = Math.floor(clamped / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatTermination(term: ChessTermination | string | null | undefined): string {
  switch (term) {
    case 'CHECKMATE':
      return 'Checkmate';
    case 'RESIGNATION':
      return 'Resignation';
    case 'TIMEOUT':
      return 'Time Out';
    case 'STALEMATE':
      return 'Draw by Stalemate';
    case 'THREEFOLD':
      return 'Draw by Threefold Repetition';
    case 'FIVEFOLD':
      return 'Draw by Fivefold Repetition';
    case 'FIFTY_MOVE':
      return 'Draw by 50-Move Rule';
    case 'SEVENTY_FIVE_MOVE':
      return 'Draw by 75-Move Rule';
    case 'INSUFFICIENT_MATERIAL':
      return 'Draw by Insufficient Material';
    case 'DRAW_AGREEMENT':
      return 'Draw by Mutual Agreement';
    case 'ABANDONED':
      return 'Match Aborted / Disconnect Forfeit';
    case 'ADMIN_ABORTED':
      return 'Aborted by Moderator';
    default:
      return 'Game Over';
  }
}

export const ChessPage: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { balance, fetchWallet } = useWalletStore();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  // Lobby Setup State
  const [selectedTimeControl, setSelectedTimeControl] = useState<ChessTimeControlKey>('BLITZ_5_0');
  const [isRanked, setIsRanked] = useState<boolean>(true);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState<ChessDifficulty>('MEDIUM');
  const [aiPlayerSide, setAiPlayerSide] = useState<'w' | 'b' | 'random'>('w');

  // Lobby Data
  const [lobbyTab, setLobbyTab] = useState<LobbyTab>('ROOMS');
  const [waitingRooms, setWaitingRooms] = useState<any[]>([]);
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [categoryRatings, setCategoryRatings] = useState<any[]>([]);
  const [chessConfig, setChessConfig] = useState<any>(null);
  const [myHistory, setMyHistory] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loadingLobby, setLoadingLobby] = useState(false);

  // Active Match State (PvP via server view OR local AI state)
  const [mode, setMode] = useState<'LOBBY' | 'PVP' | 'AI'>('LOBBY');
  const [pvpRoom, setPvpRoom] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [copiedRoom, setCopiedRoom] = useState(false);
  const [copiedPgn, setCopiedPgn] = useState(false);
  const [opponentDisconnectSec, setOpponentDisconnectSec] = useState<number | null>(null);

  // AI Mode State
  const [aiFen, setAiFen] = useState<string>(STARTING_FEN);
  const [aiMoves, setAiMoves] = useState<ChessMoveRecord[]>([]);
  const [aiHumanColor, setAiHumanColor] = useState<PieceColor>('w');
  const [aiThinking, setAiThinking] = useState(false);
  const [aiClocks, setAiClocks] = useState<{ w: number; b: number }>({ w: 300_000, b: 300_000 });
  const [aiLastTickAt, setAiLastTickAt] = useState<number>(Date.now());
  const [aiResult, setAiResult] = useState<{
    isOver: boolean;
    winnerColor: PieceColor | null;
    termination: ChessTermination | null;
  }>({ isOver: false, winnerColor: null, termination: null });

  // Board Interaction & UI Controls
  const [selectedSq, setSelectedSq] = useState<string | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: string; to: string } | null>(null);
  const [boardFlipped, setBoardFlipped] = useState<boolean>(false);
  const [confirmResign, setConfirmResign] = useState<boolean>(false);
  const [reviewPly, setReviewPly] = useState<number | null>(null); // null = live board
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  // Opponent Report Modal
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Suspected Engine / Cheating');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const aiSavedRef = useRef(false);
  const autoJoinedParamRef = useRef<string | null>(null);

  const loadLobbyData = useCallback(async () => {
    setLoadingLobby(true);
    try {
      const [lobbyRes, lbRes, ratingsRes, histRes, friendsRes] = await Promise.all([
        api.get('/chess/lobby').catch(() => null),
        api.get('/chess/leaderboard?category=BLITZ').catch(() => null),
        isAuthenticated ? api.get('/chess/ratings').catch(() => null) : Promise.resolve(null),
        isAuthenticated ? api.get('/chess/history').catch(() => null) : Promise.resolve(null),
        isAuthenticated ? api.get('/social/friends').catch(() => null) : Promise.resolve(null),
      ]);
      if (lobbyRes?.data?.data) {
        setChessConfig(lobbyRes.data.data.config || null);
        setWaitingRooms(lobbyRes.data.data.waitingRooms || []);
        setLiveMatches(lobbyRes.data.data.liveMatches || []);
      }
      if (lbRes?.data?.data) {
        setLeaderboard(lbRes.data.data || []);
      }
      if (ratingsRes?.data?.data) {
        setCategoryRatings(ratingsRes.data.data || []);
      }
      if (histRes?.data?.data) {
        setMyHistory(histRes.data.data || []);
      }
      if (friendsRes?.data?.data?.friends) {
        setFriends(friendsRes.data.data.friends || []);
      }
    } finally {
      setLoadingLobby(false);
    }
  }, [isAuthenticated]);

  // Socket.IO bindings
  useEffect(() => {
    const socket = getGameSocket();

    const onConnect = () => {
      const token = localStorage.getItem('nova_token');
      if (token) {
        socket.emit('WALLET_SUBSCRIBE', { token });
      }
    };

    const onChessState = (view: any) => {
      if (!view) return;
      setPvpRoom(view);
      setMode('PVP');
      setSelectedSq(null);
      setPendingPromotion(null);
      setReviewPly(null);
      setErrorMsg(null);
      setConfirmResign(false);
      setOpponentDisconnectSec(null);
      if (view.match?.myColor === 'b') {
        setBoardFlipped(true);
      } else if (view.match?.myColor === 'w') {
        setBoardFlipped(false);
      }
    };

    const onChessError = (err: { message?: string }) => {
      setErrorMsg(err?.message || 'Chess action failed.');
    };

    const onOpponentDisconnected = (payload: { graceSeconds?: number }) => {
      setOpponentDisconnectSec(payload?.graceSeconds ?? 45);
    };

    const onOpponentReconnected = () => {
      setOpponentDisconnectSec(null);
    };

    socket.on('connect', onConnect);
    socket.on('chess:state', onChessState);
    socket.on('chess:error', onChessError);
    socket.on('chess:opponent-disconnected', onOpponentDisconnected);
    socket.on('chess:opponent-reconnected', onOpponentReconnected);
    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('chess:state', onChessState);
      socket.off('chess:error', onChessError);
      socket.off('chess:opponent-disconnected', onOpponentDisconnected);
      socket.off('chess:opponent-reconnected', onOpponentReconnected);
    };
  }, []);

  // Load initial lobby + resume any active PvP game + handle ?room=CH-XXXX
  useEffect(() => {
    loadLobbyData();

    const roomParam = searchParams.get('room');
    if (roomParam && isAuthenticated && autoJoinedParamRef.current !== roomParam) {
      autoJoinedParamRef.current = roomParam;
      api
        .post('/chess/rooms/join', { roomCode: roomParam })
        .then((res) => {
          if (res.data?.data) {
            setPvpRoom(res.data.data);
            setMode('PVP');
            if (res.data.data.match?.myColor === 'b') setBoardFlipped(true);
          }
        })
        .catch((err) => {
          setErrorMsg(err?.response?.data?.error || 'Could not join invited chess room.');
        });
      return;
    }

    if (isAuthenticated && mode === 'LOBBY') {
      api
        .get('/chess/active')
        .then((res) => {
          if (res.data?.data) {
            const view = res.data.data;
            setPvpRoom(view);
            setMode('PVP');
            if (view.match?.myColor === 'b') setBoardFlipped(true);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, searchParams, loadLobbyData]);

  // Polling fallback when waiting in room in case socket event missed
  useEffect(() => {
    if (mode !== 'PVP' || !pvpRoom?.roomId) return;
    if (pvpRoom.status !== 'WAITING' && !pvpRoom.rematchNextRoomId) return;

    const timer = setInterval(() => {
      api
        .get(`/chess/rooms/${pvpRoom.roomId}`)
        .then((res) => {
          const view = res.data?.data;
          if (!view) return;
          if (view.rematchNextRoomId) {
            api.get(`/chess/rooms/${view.rematchNextRoomId}`).then((nextRes) => {
              if (nextRes.data?.data) {
                setPvpRoom(nextRes.data.data);
                setBoardFlipped(nextRes.data.data.match?.myColor === 'b');
              }
            });
          } else {
            setPvpRoom(view);
          }
        })
        .catch(() => {});
    }, 2500);

    return () => clearInterval(timer);
  }, [mode, pvpRoom?.roomId, pvpRoom?.status, pvpRoom?.rematchNextRoomId]);

  // Tick timer every 150ms for live smooth countdown clocks
  useEffect(() => {
    if (mode === 'LOBBY') return;
    const interval = setInterval(() => setNowMs(Date.now()), 150);
    return () => clearInterval(interval);
  }, [mode]);

  // Compute live clocks for PvP
  const livePvpClocks = useMemo(() => {
    const m = pvpRoom?.match;
    if (!m) return { w: 300_000, b: 300_000 };
    if (m.status !== 'ACTIVE' || m.moveCount < 1) {
      return { w: m.whiteTimeMs, b: m.blackTimeMs };
    }
    const baseClientReceived = m.serverNow || Date.now();
    const elapsedSinceSync = Math.max(0, nowMs - baseClientReceived);
    return {
      w: m.turnColor === 'w' ? Math.max(0, m.whiteTimeMs - elapsedSinceSync) : m.whiteTimeMs,
      b: m.turnColor === 'b' ? Math.max(0, m.blackTimeMs - elapsedSinceSync) : m.blackTimeMs,
    };
  }, [pvpRoom, nowMs]);

  // Trigger server timeout check when PvP clock hits 0
  useEffect(() => {
    const m = pvpRoom?.match;
    if (mode !== 'PVP' || !m || m.status !== 'ACTIVE' || m.moveCount < 1) return;
    if ((m.turnColor === 'w' && livePvpClocks.w <= 0) || (m.turnColor === 'b' && livePvpClocks.b <= 0)) {
      const socket = getGameSocket();
      socket.emit('chess:claim-timeout', { matchId: m.matchId });
    }
  }, [mode, pvpRoom?.match, livePvpClocks.w, livePvpClocks.b]);

  // Compute live clocks for AI mode + timeout termination
  const liveAiClocks = useMemo(() => {
    if (mode !== 'AI' || aiResult.isOver || aiMoves.length < 1) return aiClocks;
    const engine = new ChessEngine(aiFen);
    const turn = engine.getTurn();
    const elapsed = Math.max(0, nowMs - aiLastTickAt);
    return {
      w: turn === 'w' ? Math.max(0, aiClocks.w - elapsed) : aiClocks.w,
      b: turn === 'b' ? Math.max(0, aiClocks.b - elapsed) : aiClocks.b,
    };
  }, [mode, aiResult.isOver, aiMoves.length, aiFen, aiClocks, aiLastTickAt, nowMs]);

  useEffect(() => {
    if (mode !== 'AI' || aiResult.isOver || aiMoves.length < 1) return;
    const engine = new ChessEngine(aiFen);
    const turn = engine.getTurn();
    if ((turn === 'w' && liveAiClocks.w <= 0) || (turn === 'b' && liveAiClocks.b <= 0)) {
      setAiResult({
        isOver: true,
        winnerColor: turn === 'w' ? 'b' : 'w',
        termination: 'TIMEOUT',
      });
    }
  }, [mode, aiResult.isOver, aiMoves.length, aiFen, liveAiClocks.w, liveAiClocks.b]);

  // Persist completed AI game once
  useEffect(() => {
    if (mode !== 'AI' || !aiResult.isOver || aiSavedRef.current || !isAuthenticated) return;
    aiSavedRef.current = true;
    api
      .post('/chess/ai-complete', {
        playerColor: aiHumanColor,
        difficulty: aiDifficulty,
        timeControl: selectedTimeControl,
        fen: aiFen,
        moves: aiMoves,
        winnerColor: aiResult.winnerColor,
        termination: aiResult.termination,
      })
      .then(() => loadLobbyData())
      .catch(() => {});
  }, [
    mode,
    aiResult,
    isAuthenticated,
    aiHumanColor,
    aiDifficulty,
    selectedTimeControl,
    aiFen,
    aiMoves,
    loadLobbyData,
  ]);

  // Non-blocking Web Worker AI automated reply
  useEffect(() => {
    if (mode !== 'AI' || aiResult.isOver) return;
    const engine = ChessEngine.fromMoves(aiMoves.map((m) => m.uci));
    const currentTurn = engine.getTurn();
    if (currentTurn === aiHumanColor) return;

    let cancelled = false;
    setAiThinking(true);
    const tc = CHESS_TIME_CONTROLS[selectedTimeControl];
    const fen = engine.getFen();

    const applyAiChoice = (choice: { from: string; to: string; promotion?: PromotionPiece } | null) => {
      if (cancelled) return;
      if (choice) {
        const elapsed = Math.max(0, Date.now() - aiLastTickAt);
        const rec = engine.makeMove(choice);
        if (rec) {
          setAiClocks((prev) => ({
            w:
              currentTurn === 'w'
                ? Math.max(0, prev.w - elapsed) + (aiMoves.length >= 1 ? tc.incrementMs : 0)
                : prev.w,
            b:
              currentTurn === 'b'
                ? Math.max(0, prev.b - elapsed) + (aiMoves.length >= 1 ? tc.incrementMs : 0)
                : prev.b,
          }));
          setAiLastTickAt(Date.now());
          setAiMoves((prev) => [...prev, rec]);
          setAiFen(rec.fenAfter);
          const over = engine.getGameOverResult();
          if (over.isOver) {
            setAiResult(over);
          }
        }
      }
      setAiThinking(false);
    };

    let worker: Worker | null = null;
    try {
      worker = new Worker(new URL('./workers/chessAi.worker.ts', import.meta.url), {
        type: 'module',
      });
      const reqId = `${Date.now()}-${aiMoves.length}`;
      worker.onmessage = (ev) => {
        if (ev.data?.requestId === reqId) {
          setTimeout(() => applyAiChoice(ev.data.move), 180);
        }
      };
      worker.onerror = () => {
        setTimeout(() => applyAiChoice(chooseChessAiMove(fen, aiDifficulty)), 200);
      };
      worker.postMessage({ requestId: reqId, fen, difficulty: aiDifficulty });
    } catch {
      const timer = setTimeout(() => applyAiChoice(chooseChessAiMove(fen, aiDifficulty)), 250);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }

    return () => {
      cancelled = true;
      worker?.terminate();
    };
  }, [mode, aiResult.isOver, aiMoves, aiHumanColor, aiDifficulty, selectedTimeControl, aiLastTickAt]);

  // Active Chess Engine derived state
  const activeMoves: ChessMoveRecord[] = useMemo(() => {
    if (mode === 'PVP') return pvpRoom?.match?.moves || [];
    if (mode === 'AI') return aiMoves;
    return [];
  }, [mode, pvpRoom, aiMoves]);

  const displayedEngine = useMemo(() => {
    const sliceCount = reviewPly !== null ? reviewPly : activeMoves.length;
    if (sliceCount === 0) return new ChessEngine(STARTING_FEN);
    return ChessEngine.fromMoves(activeMoves.slice(0, sliceCount).map((m) => m.uci));
  }, [activeMoves, reviewPly]);

  const liveEngine = useMemo(() => {
    return ChessEngine.fromMoves(activeMoves.map((m) => m.uci));
  }, [activeMoves]);

  const myColor: PieceColor | null =
    mode === 'PVP' ? pvpRoom?.match?.myColor || null : mode === 'AI' ? aiHumanColor : null;

  const isGameActive =
    mode === 'PVP'
      ? pvpRoom?.match?.status === 'ACTIVE'
      : mode === 'AI'
      ? !aiResult.isOver
      : false;

  const canInteractWithBoard =
    isGameActive &&
    reviewPly === null &&
    myColor !== null &&
    liveEngine.getTurn() === myColor &&
    !aiThinking;

  const legalMovesForSelected = useMemo(() => {
    if (!selectedSq || !canInteractWithBoard) return [];
    return liveEngine.getLegalMoves(selectedSq);
  }, [selectedSq, canInteractWithBoard, liveEngine]);

  const legalTargetSet = useMemo(() => {
    return new Set(legalMovesForSelected.map((m) => m.to));
  }, [legalMovesForSelected]);

  const lastMove = useMemo(() => {
    const idx = reviewPly !== null ? reviewPly - 1 : activeMoves.length - 1;
    return idx >= 0 ? activeMoves[idx] : null;
  }, [activeMoves, reviewPly]);

  const capturedSummary = useMemo(() => displayedEngine.getCapturedSummary(), [displayedEngine]);

  // Action Handlers
  const handleStartQuickMatch = async () => {
    setErrorMsg(null);
    if (!isAuthenticated) {
      setErrorMsg('Please sign in to join 1v1 ranked Quick Match, or try Computer AI practice below!');
      return;
    }
    try {
      const res = await api.post('/chess/quick-match', {
        timeControl: selectedTimeControl,
        isRanked,
      });
      if (res.data?.data) {
        const view = res.data.data;
        setPvpRoom(view);
        setMode('PVP');
        getGameSocket().emit('chess:spectate', { roomId: view.roomId });
        if (view.match?.myColor === 'b') setBoardFlipped(true);
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || 'Could not start Quick Match.');
    }
  };

  const handleCreatePrivateRoom = async () => {
    setErrorMsg(null);
    if (!isAuthenticated) {
      setErrorMsg('Please sign in to create a Private Chess Room.');
      return;
    }
    try {
      const res = await api.post('/chess/rooms', {
        timeControl: selectedTimeControl,
        isRanked,
      });
      if (res.data?.data) {
        setPvpRoom(res.data.data);
        setMode('PVP');
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || 'Failed to create private room.');
    }
  };

  const handleJoinRoomCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    if (!isAuthenticated) {
      setErrorMsg('Please sign in to join a room.');
      return;
    }
    try {
      const res = await api.post('/chess/rooms/join', {
        roomCode: joinCodeInput.trim().toUpperCase(),
      });
      if (res.data?.data) {
        const view = res.data.data;
        setPvpRoom(view);
        setMode('PVP');
        setBoardFlipped(view.match?.myColor === 'b');
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || 'Room not found or unavailable.');
    }
  };

  const handleStartAiMatch = () => {
    setErrorMsg(null);
    setInfoMsg(null);
    const tc = CHESS_TIME_CONTROLS[selectedTimeControl];
    const side: PieceColor =
      aiPlayerSide === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : aiPlayerSide;

    aiSavedRef.current = false;
    setAiHumanColor(side);
    setAiFen(STARTING_FEN);
    setAiMoves([]);
    setAiClocks({ w: tc.baseTimeMs, b: tc.baseTimeMs });
    setAiLastTickAt(Date.now());
    setAiResult({ isOver: false, winnerColor: null, termination: null });
    setBoardFlipped(side === 'b');
    setSelectedSq(null);
    setPendingPromotion(null);
    setReviewPly(null);
    setMode('AI');
  };

  const handleInviteFriend = async (friendUserId: string) => {
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      const res = await api.post('/social/invites', {
        recipientId: friendUserId,
        gameType: 'CHESS_PVP',
        stakeEtb: 0,
      });
      const roomCode = res.data?.data?.invite?.roomCode;
      if (roomCode) {
        const roomRes = await api.post('/chess/rooms/join', { roomCode }).catch(() => null);
        if (roomRes?.data?.data) {
          setPvpRoom(roomRes.data.data);
          setMode('PVP');
        }
        setInfoMsg(`Chess challenge sent! Share room ${roomCode} or wait for your friend.`);
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || 'Could not send friend challenge.');
    }
  };

  const executePlayerMove = async (from: string, to: string, promotion?: PromotionPiece) => {
    setSelectedSq(null);
    setPendingPromotion(null);

    if (mode === 'AI') {
      const tc = CHESS_TIME_CONTROLS[selectedTimeControl];
      const engine = ChessEngine.fromMoves(aiMoves.map((m) => m.uci));
      const elapsed = Math.max(0, Date.now() - aiLastTickAt);
      const rec = engine.makeMove({ from, to, promotion });
      if (!rec) return;

      setAiClocks((prev) => ({
        w:
          aiHumanColor === 'w'
            ? Math.max(0, prev.w - elapsed) + (aiMoves.length >= 1 ? tc.incrementMs : 0)
            : prev.w,
        b:
          aiHumanColor === 'b'
            ? Math.max(0, prev.b - elapsed) + (aiMoves.length >= 1 ? tc.incrementMs : 0)
            : prev.b,
      }));
      setAiLastTickAt(Date.now());
      setAiMoves((prev) => [...prev, rec]);
      setAiFen(rec.fenAfter);
      const over = engine.getGameOverResult();
      if (over.isOver) {
        setAiResult(over);
      }
      return;
    }

    if (mode === 'PVP' && pvpRoom?.match?.matchId) {
      const expectedPly = activeMoves.length + 1;
      const idempotencyKey = `${pvpRoom.match.matchId}-${expectedPly}-${from}${to}${promotion || ''}`;
      const socket = getGameSocket();
      if (socket.connected) {
        socket.emit('chess:move', {
          matchId: pvpRoom.match.matchId,
          from,
          to,
          promotion,
          expectedPly,
          idempotencyKey,
        });
      } else {
        try {
          const res = await api.post(`/chess/matches/${pvpRoom.match.matchId}/move`, {
            from,
            to,
            promotion,
            expectedPly,
            idempotencyKey,
          });
          if (res.data?.data) setPvpRoom(res.data.data);
        } catch (err: any) {
          setErrorMsg(err?.response?.data?.error || 'Move failed.');
        }
      }
    }
  };

  const handleSquareClick = (sq: string) => {
    if (!canInteractWithBoard) return;

    if (selectedSq && legalTargetSet.has(sq)) {
      const matching = legalMovesForSelected.filter((m) => m.to === sq);
      if (matching.some((m) => m.promotion)) {
        setPendingPromotion({ from: selectedSq, to: sq });
        return;
      }
      executePlayerMove(selectedSq, sq);
      return;
    }

    const piece = liveEngine.getPieceAt(sq);
    if (piece && piece.color === myColor) {
      setSelectedSq(sq === selectedSq ? null : sq);
    } else {
      setSelectedSq(null);
    }
  };

  const handleLeaveToLobby = async () => {
    if (mode === 'PVP' && pvpRoom?.roomId && pvpRoom?.status === 'WAITING') {
      await api.post(`/chess/rooms/${pvpRoom.roomId}/leave`).catch(() => {});
    }
    setPvpRoom(null);
    setMode('LOBBY');
    setSearchParams({}, { replace: true });
    loadLobbyData();
  };

  const handleResign = async () => {
    if (!confirmResign) {
      setConfirmResign(true);
      setTimeout(() => setConfirmResign(false), 4000);
      return;
    }
    setConfirmResign(false);
    if (mode === 'AI') {
      setAiResult({
        isOver: true,
        winnerColor: aiHumanColor === 'w' ? 'b' : 'w',
        termination: 'RESIGNATION',
      });
      return;
    }
    if (mode === 'PVP' && pvpRoom?.match?.matchId) {
      const res = await api.post(`/chess/matches/${pvpRoom.match.matchId}/resign`).catch(() => null);
      if (res?.data?.data) setPvpRoom(res.data.data);
      getGameSocket().emit('chess:resign', { matchId: pvpRoom.match.matchId });
    }
  };

  const handleOfferDraw = async () => {
    if (mode === 'PVP' && pvpRoom?.match?.matchId) {
      const res = await api
        .post(`/chess/matches/${pvpRoom.match.matchId}/draw`, { action: 'OFFER' })
        .catch(() => null);
      if (res?.data?.data) setPvpRoom(res.data.data);
      getGameSocket().emit('chess:offer-draw', { matchId: pvpRoom.match.matchId });
      setInfoMsg('Draw offer sent to opponent.');
    }
  };

  const handleRespondDraw = async (accept: boolean) => {
    if (mode === 'PVP' && pvpRoom?.match?.matchId) {
      const res = await api
        .post(`/chess/matches/${pvpRoom.match.matchId}/draw`, {
          action: accept ? 'ACCEPT' : 'DECLINE',
        })
        .catch(() => null);
      if (res?.data?.data) setPvpRoom(res.data.data);
      getGameSocket().emit('chess:respond-draw', {
        matchId: pvpRoom.match.matchId,
        accept,
      });
    }
  };

  const handleRematch = async () => {
    if (mode === 'AI') {
      handleStartAiMatch();
      return;
    }
    if (mode === 'PVP' && pvpRoom?.roomId) {
      const res = await api.post(`/chess/rooms/${pvpRoom.roomId}/rematch`).catch(() => null);
      if (res?.data?.data) setPvpRoom(res.data.data);
      getGameSocket().emit('chess:rematch', { roomId: pvpRoom.roomId });
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    const opp =
      myColor === 'w' ? pvpRoom?.match?.blackPlayer : pvpRoom?.match?.whitePlayer;
    if (!opp?.id || opp.id === 'nova-chess-ai') return;
    setReportSubmitting(true);
    try {
      await api.post(`/social/report/${opp.id}`, {
        reason: `[Chess] ${reportReason}`,
        details: reportDetails || `Reported from Chess match ${pvpRoom?.match?.matchId || ''}`,
      });
      setInfoMsg('Opponent report submitted to NOVA Fair-Play Moderation.');
      setReportOpen(false);
      setReportDetails('');
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || 'Could not submit report.');
    } finally {
      setReportSubmitting(false);
    }
  };

  const copyRoomInvite = async () => {
    if (!pvpRoom?.roomCode) return;
    const link = `${window.location.origin}/games/chess?room=${pvpRoom.roomCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedRoom(true);
      setTimeout(() => setCopiedRoom(false), 2000);
    } catch {}
  };

  // Board Orientation Helpers
  const topColor: PieceColor = boardFlipped ? 'w' : 'b';
  const bottomColor: PieceColor = boardFlipped ? 'b' : 'w';

  const displayRanks = boardFlipped ? [...RANKS_DESC].reverse() : RANKS_DESC;
  const displayFiles = boardFlipped ? [...FILES_ASC].reverse() : FILES_ASC;

  const displayedTurn = displayedEngine.getTurn();
  const displayedInCheck = displayedEngine.isInCheck(displayedTurn);
  const displayedCheckKingSq = displayedInCheck ? displayedEngine.getKingSquare(displayedTurn) : null;

  // Player Metadata for Top & Bottom Bars
  const getPlayerCardData = (color: PieceColor) => {
    if (mode === 'AI') {
      const isHuman = color === aiHumanColor;
      const matDiff =
        color === 'w' ? capturedSummary.whiteAdvantage : -capturedSummary.whiteAdvantage;
      return {
        id: isHuman ? user?.id || 'you' : 'ai',
        username: isHuman ? user?.username || 'You' : `Nova Chess AI (${aiDifficulty})`,
        elo: isHuman ? (user as any)?.chessElo ?? 1200 : aiDifficulty === 'HARD' ? 1650 : aiDifficulty === 'MEDIUM' ? 1350 : 950,
        eloDelta: 0,
        timeMs: color === 'w' ? liveAiClocks.w : liveAiClocks.b,
        captured: color === 'w' ? capturedSummary.whiteCaptured : capturedSummary.blackCaptured,
        matDiff,
        isTurn: !aiResult.isOver && liveEngine.getTurn() === color,
      };
    }

    const m = pvpRoom?.match;
    const pObj = color === 'w' ? m?.whitePlayer : m?.blackPlayer;
    const eloBefore = color === 'w' ? m?.whiteEloBefore : m?.blackEloBefore;
    const eloAfter = color === 'w' ? m?.whiteEloAfter : m?.blackEloAfter;
    const matDiff =
      color === 'w' ? capturedSummary.whiteAdvantage : -capturedSummary.whiteAdvantage;

    return {
      id: pObj?.id || color,
      username: pObj?.username || (color === 'w' ? 'White' : 'Black'),
      elo: eloAfter ?? pObj?.chessElo ?? eloBefore ?? 1200,
      eloDelta:
        eloAfter !== null && eloAfter !== undefined && eloBefore !== undefined
          ? eloAfter - eloBefore
          : 0,
      timeMs: color === 'w' ? livePvpClocks.w : livePvpClocks.b,
      captured: color === 'w' ? capturedSummary.whiteCaptured : capturedSummary.blackCaptured,
      matDiff,
      isTurn: m?.status === 'ACTIVE' && liveEngine.getTurn() === color,
    };
  };

  // Format move pairs for standard 2-column chess score sheet
  const movePairs = useMemo(() => {
    const pairs: Array<{ num: number; white?: ChessMoveRecord; black?: ChessMoveRecord }> = [];
    for (let i = 0; i < activeMoves.length; i += 2) {
      pairs.push({
        num: Math.floor(i / 2) + 1,
        white: activeMoves[i],
        black: activeMoves[i + 1],
      });
    }
    return pairs;
  }, [activeMoves]);

  // ============================================================================
  // RENDER: LOBBY VIEW
  // ============================================================================
  if (mode === 'LOBBY') {
    return (
      <div className="space-y-6 w-full max-w-full">
        {/* Hero Banner */}
        <div className="rounded-2xl bg-[#24213A] border border-white/[0.06] p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] text-[11px] font-bold">
                <Crown className="w-3.5 h-3.5" /> Free Competitive Strategy · Rated ELO
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#22D3EE]/20 hover:bg-[#22D3EE]/30 text-[#22D3EE] text-[11px] font-bold border border-[#22D3EE]/40 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3 h-3" />
                <span>How to Play &amp; FIDE Rules</span>
              </button>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              NOVA Chess Arena
            </h1>
            <p className="text-xs sm:text-sm text-[#A8A3BC] max-w-2xl">
              Challenge players worldwide in real-time Bullet, Blitz, and Rapid chess, invite friends to private boards, or sharpen your tactics against Nova AI.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="rounded-xl bg-[#11101D] border border-white/[0.06] px-4 py-2.5 text-center">
              <div className="text-[10px] uppercase tracking-wider text-[#A8A3BC]">Your ELO</div>
              <div className="text-lg font-mono font-black text-[#22D3EE]">
                {(user as any)?.chessElo ?? 1200}
              </div>
            </div>
            <div className="rounded-xl bg-[#11101D] border border-white/[0.06] px-4 py-2.5 text-center">
              <div className="text-[10px] uppercase tracking-wider text-[#A8A3BC]">Entry Fee</div>
              <div className="text-lg font-mono font-black text-[#22C55E]">FREE</div>
            </div>
          </div>
        </div>

        {categoryRatings.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categoryRatings.map((r) => (
              <div
                key={r.category}
                className="rounded-xl bg-[#24213A] border border-white/[0.06] px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#A8A3BC]">
                    {r.category} Rating
                  </div>
                  <div className="text-base font-mono font-black text-white mt-0.5">
                    {r.rating}
                  </div>
                </div>
                <div className="text-right text-[10px] font-mono text-[#A8A3BC]">
                  <span className="text-[#22C55E]">{r.wins}W</span> · {r.draws}D ·{' '}
                  <span className="text-rose-400">{r.losses}L</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {errorMsg && (
          <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-xs font-semibold text-rose-300">
            {errorMsg}
          </div>
        )}
        {infoMsg && (
          <div className="rounded-2xl bg-[#22C55E]/10 border border-[#22C55E]/30 px-4 py-3 text-xs font-semibold text-[#22C55E]">
            {infoMsg}
          </div>
        )}

        {/* Matchmaking Controls & Mode Cards */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Left 2 Columns: Time Control & Play Modes */}
          <div className="xl:col-span-2 space-y-5">
            {/* Time Control + Ranked Selector */}
            <div className="rounded-2xl bg-[#24213A] border border-white/[0.06] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#22D3EE]" />
                  <h2 className="text-sm font-bold text-white">Select Chess Clock &amp; Match Type</h2>
                </div>

                <div className="flex items-center gap-1.5 bg-[#11101D] p-1 rounded-xl border border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setIsRanked(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      isRanked ? 'bg-[#8B5CF6] text-white' : 'text-[#A8A3BC] hover:text-white'
                    }`}
                  >
                    Ranked (ELO)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRanked(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      !isRanked ? 'bg-[#22D3EE] text-[#11101D]' : 'text-[#A8A3BC] hover:text-white'
                    }`}
                  >
                    Casual
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {Object.values(CHESS_TIME_CONTROLS)
                  .filter(
                    (tc) =>
                      !chessConfig?.enabledTimeControls ||
                      chessConfig.enabledTimeControls.includes(tc.key)
                  )
                  .map((tc) => {
                    const active = selectedTimeControl === tc.key;
                    return (
                      <button
                        key={tc.key}
                        type="button"
                        onClick={() => setSelectedTimeControl(tc.key)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] shadow-[0_0_18px_rgba(139,92,246,0.2)]'
                            : 'bg-[#11101D] border-white/[0.06] hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-mono font-black text-white">{tc.label}</span>
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/[0.06] text-[#22D3EE]">
                            {tc.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#A8A3BC] mt-1">{tc.description}</div>
                      </button>
                    );
                  })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleStartQuickMatch}
                  className="py-3 px-4 rounded-xl bg-[#8B5CF6] hover:bg-violet-500 text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors shadow-[0_0_24px_rgba(139,92,246,0.3)] cursor-pointer"
                >
                  <Zap className="w-4 h-4" /> Quick Match ({CHESS_TIME_CONTROLS[selectedTimeControl].label})
                </button>
                <button
                  type="button"
                  onClick={handleCreatePrivateRoom}
                  className="py-3 px-4 rounded-xl bg-[#11101D] hover:bg-[#1B1930] border border-white/10 text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-[#22D3EE]" /> Create Private Room
                </button>
              </div>
            </div>

            {/* Private Code + Play with Friends Strip */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Join Private Code */}
              <div className="rounded-2xl bg-[#24213A] border border-white/[0.06] p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#22D3EE]" />
                  <h3 className="text-sm font-bold text-white">Join Room by Code</h3>
                </div>
                <p className="text-xs text-[#A8A3BC]">
                  Enter a friend&apos;s room code (e.g. <span className="font-mono text-white">CH-9A4B</span>) to jump directly onto their board.
                </p>
                <form onSubmit={handleJoinRoomCode} className="flex gap-2">
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="CH-XXXX"
                    className="flex-1 bg-[#11101D] border border-white/10 focus:border-[#22D3EE] rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-[#A8A3BC]/60 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!joinCodeInput.trim()}
                    className="px-4 py-2 rounded-xl bg-[#22D3EE] hover:bg-cyan-300 disabled:opacity-40 text-[#11101D] text-xs font-bold cursor-pointer"
                  >
                    Join
                  </button>
                </form>
              </div>

              {/* Play with Friends */}
              <div className="rounded-2xl bg-[#24213A] border border-white/[0.06] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#22C55E]" />
                    <h3 className="text-sm font-bold text-white">Play With Friends</h3>
                  </div>
                  <Link to="/friends" className="text-xs font-bold text-[#22D3EE] hover:underline">
                    Manage Friends
                  </Link>
                </div>

                {!isAuthenticated ? (
                  <p className="text-xs text-[#A8A3BC]">Sign in to challenge friends directly.</p>
                ) : friends.length === 0 ? (
                  <p className="text-xs text-[#A8A3BC]">
                    Add friends in your social hub to send instant 1v1 Chess invitations.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                    {friends.slice(0, 4).map((f) => (
                      <div
                        key={f.userId}
                        className="flex items-center justify-between rounded-xl bg-[#11101D] border border-white/[0.06] px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              f.online ? 'bg-[#22C55E]' : 'bg-slate-600'
                            }`}
                          />
                          <span className="text-xs font-semibold text-white truncate">
                            {f.username}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleInviteFriend(f.userId)}
                          className="px-2.5 py-1 rounded-lg bg-[#8B5CF6]/20 hover:bg-[#8B5CF6] text-[#8B5CF6] hover:text-white text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Invite
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Practice vs Computer AI */}
          <div className="rounded-2xl bg-[#24213A] border border-[#22D3EE]/30 p-5 flex flex-col justify-between gap-4 shadow-lg">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/15 text-[#22D3EE] flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Play with Computer AI</h3>
                  <p className="text-xs text-[#A8A3BC]">
                    Practice openings, tactics &amp; earn XP offline or online
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#A8A3BC]">
                  AI Difficulty
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {(['BEGINNER', 'EASY', 'MEDIUM', 'HARD', 'EXPERT'] as ChessDifficulty[]).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setAiDifficulty(diff)}
                      className={`py-2 px-1.5 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                        aiDifficulty === diff
                          ? 'bg-[#22D3EE] text-[#11101D] border-[#22D3EE]'
                          : 'bg-[#11101D] border-white/10 text-[#A8A3BC] hover:text-white'
                      }`}
                    >
                      {diff.charAt(0) + diff.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#A8A3BC]">
                  Your Color
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'w' as const, label: 'White' },
                    { id: 'b' as const, label: 'Black' },
                    { id: 'random' as const, label: 'Random' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setAiPlayerSide(s.id)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        aiPlayerSide === s.id
                          ? 'bg-[#8B5CF6] text-white border-[#8B5CF6]'
                          : 'bg-[#11101D] border-white/10 text-[#A8A3BC] hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartAiMatch}
              className="w-full py-3 px-4 rounded-xl bg-[#22D3EE] hover:bg-cyan-300 text-[#11101D] text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" /> Start Practice Game
            </button>
          </div>
        </div>

        {/* Lobby Tables, Spectate Live, ELO Leaderboard & History */}
        <div className="rounded-2xl bg-[#24213A] border border-white/[0.06] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 bg-[#11101D] p-1 rounded-xl border border-white/[0.06]">
              {[
                { id: 'ROOMS' as LobbyTab, label: `Open Tables (${waitingRooms.length})`, icon: Swords },
                { id: 'LIVE' as LobbyTab, label: `Watch Live (${liveMatches.length})`, icon: Users },
                { id: 'LEADERBOARD' as LobbyTab, label: 'ELO Leaderboard', icon: Trophy },
                { id: 'HISTORY' as LobbyTab, label: 'My Chess History', icon: History },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setLobbyTab(t.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                      lobbyTab === t.id
                        ? 'bg-[#8B5CF6] text-white'
                        : 'text-[#A8A3BC] hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" /> {t.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={loadLobbyData}
              className="px-3 py-1.5 rounded-xl bg-[#11101D] border border-white/10 text-xs font-bold text-[#A8A3BC] hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLobby ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          {lobbyTab === 'ROOMS' && (
            <div className="space-y-2">
              {waitingRooms.length === 0 ? (
                <div className="rounded-xl bg-[#11101D] border border-white/[0.06] p-6 text-center text-xs text-[#A8A3BC]">
                  No open tables waiting right now. Click Quick Match or Create Private Room above!
                </div>
              ) : (
                waitingRooms.map((r) => (
                  <div
                    key={r.roomId}
                    className="rounded-xl bg-[#11101D] border border-white/[0.06] px-4 py-3 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-[#22D3EE]">{r.roomCode}</span>
                      <span className="text-xs font-bold text-white">
                        {r.hostUsername} <span className="text-[#A8A3BC] font-normal">({r.hostElo})</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-[10px] font-bold text-white">
                        {CHESS_TIME_CONTROLS[r.timeControl as ChessTimeControlKey]?.label || r.timeControl}
                      </span>
                      <span className="text-[10px] font-bold text-[#22C55E]">
                        {r.isRanked ? 'Ranked ELO' : 'Casual'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        api
                          .post('/chess/rooms/join', { roomId: r.roomId })
                          .then((res) => {
                            if (res.data?.data) {
                              setPvpRoom(res.data.data);
                              setMode('PVP');
                              setBoardFlipped(res.data.data.match?.myColor === 'b');
                            }
                          })
                          .catch((err) =>
                            setErrorMsg(err?.response?.data?.error || 'Could not join room.')
                          )
                      }
                      className="px-4 py-1.5 rounded-lg bg-[#8B5CF6] hover:bg-violet-500 text-white text-xs font-bold cursor-pointer"
                    >
                      Join Board
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {lobbyTab === 'LIVE' && (
            <div className="space-y-2">
              {liveMatches.length === 0 ? (
                <div className="rounded-xl bg-[#11101D] border border-white/[0.06] p-6 text-center text-xs text-[#A8A3BC]">
                  No active PvP chess boards running at this moment.
                </div>
              ) : (
                liveMatches.map((m) => (
                  <div
                    key={m.matchId}
                    className="rounded-xl bg-[#11101D] border border-white/[0.06] px-4 py-3 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="text-xs text-white font-semibold">
                      {m.whiteUsername} ({m.whiteElo}) <span className="text-[#A8A3BC]">vs</span>{' '}
                      {m.blackUsername} ({m.blackElo}) ·{' '}
                      <span className="text-[#22D3EE]">{m.moveCount} plies</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        getGameSocket().emit('chess:spectate', { roomId: m.roomId });
                        api.get(`/chess/rooms/${m.roomId}`).then((res) => {
                          if (res.data?.data) {
                            setPvpRoom(res.data.data);
                            setMode('PVP');
                          }
                        });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#24213A] hover:bg-[#8B5CF6] text-white text-xs font-bold cursor-pointer"
                    >
                      Spectate
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {lobbyTab === 'LEADERBOARD' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[#A8A3BC] border-b border-white/[0.06]">
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">Player</th>
                    <th className="py-2 pr-3">ELO Rating</th>
                    <th className="py-2 pr-3">W / D / L</th>
                    <th className="py-2">Games</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {leaderboard.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2.5 pr-3 font-mono font-bold text-[#22D3EE]">#{p.rank}</td>
                      <td className="py-2.5 pr-3 font-bold text-white">{p.username}</td>
                      <td className="py-2.5 pr-3 font-mono font-black text-[#8B5CF6]">
                        {p.chessElo}
                      </td>
                      <td className="py-2.5 pr-3 text-[#A8A3BC]">
                        <span className="text-[#22C55E]">{p.chessWins}</span> / {p.chessDraws} /{' '}
                        <span className="text-rose-400">{p.chessLosses}</span>
                      </td>
                      <td className="py-2.5 text-[#A8A3BC]">{p.chessGamesPlayed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {lobbyTab === 'HISTORY' && (
            <div className="space-y-2">
              {!isAuthenticated ? (
                <div className="rounded-xl bg-[#11101D] border border-white/[0.06] p-6 text-center text-xs text-[#A8A3BC]">
                  Sign in to view your saved Chess match history.
                </div>
              ) : myHistory.length === 0 ? (
                <div className="rounded-xl bg-[#11101D] border border-white/[0.06] p-6 text-center text-xs text-[#A8A3BC]">
                  No completed Chess matches yet.
                </div>
              ) : (
                myHistory.map((h) => (
                  <div
                    key={h.matchId}
                    className="rounded-xl bg-[#11101D] border border-white/[0.06] px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          h.outcome === 'WIN'
                            ? 'bg-[#22C55E]/15 text-[#22C55E]'
                            : h.outcome === 'DRAW'
                            ? 'bg-[#22D3EE]/15 text-[#22D3EE]'
                            : 'bg-rose-500/15 text-rose-400'
                        }`}
                      >
                        {h.outcome}
                      </span>
                      <span className="font-bold text-white">vs {h.opponentUsername}</span>
                      <span className="text-[#A8A3BC]">{formatTermination(h.termination)}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px] text-[#A8A3BC]">
                      <span>{h.moveCount} plies</span>
                      {h.isRanked && (
                        <span
                          className={
                            h.eloDelta >= 0 ? 'text-[#22C55E] font-bold' : 'text-rose-400 font-bold'
                          }
                        >
                          {h.eloDelta >= 0 ? `+${h.eloDelta}` : h.eloDelta} ELO
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: WAITING ROOM FOR PRIVATE / QUICK MATCH OPPONENT
  // ============================================================================
  if (mode === 'PVP' && pvpRoom?.status === 'WAITING') {
    return (
      <div className="max-w-xl mx-auto py-8 space-y-5">
        <div className="rounded-2xl bg-[#24213A] border border-[#8B5CF6]/40 p-6 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/20 text-[#8B5CF6] flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">
              {pvpRoom.roomType === 'QUICK_MATCH'
                ? 'Searching for Opponent...'
                : 'Waiting for Opponent to Join'}
            </h2>
            <p className="text-xs text-[#A8A3BC] mt-1">
              {pvpRoom.timeControl?.description || 'Blitz Chess'} ·{' '}
              {pvpRoom.isRanked ? 'Ranked ELO' : 'Casual'}
            </p>
          </div>

          <div className="rounded-xl bg-[#11101D] border border-white/[0.08] p-4 space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-[#A8A3BC]">Room Code</div>
            <div className="text-2xl font-mono font-black text-[#22D3EE] tracking-widest">
              {pvpRoom.roomCode}
            </div>
            <button
              type="button"
              onClick={copyRoomInvite}
              className="mt-1 px-4 py-2 rounded-xl bg-[#24213A] hover:bg-[#2f2b4a] border border-white/10 text-xs font-bold text-white inline-flex items-center gap-1.5 cursor-pointer"
            >
              {copiedRoom ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedRoom ? 'Invite Link Copied!' : 'Copy Invite Link'}
            </button>
          </div>

          <button
            type="button"
            onClick={handleLeaveToLobby}
            className="px-5 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold cursor-pointer"
          >
            Cancel &amp; Return to Lobby
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: ACTIVE / FINISHED CHESS ARENA
  // ============================================================================
  const topPlayer = getPlayerCardData(topColor);
  const bottomPlayer = getPlayerCardData(bottomColor);
  const incomingDrawOffer =
    mode === 'PVP' &&
    pvpRoom?.match?.status === 'ACTIVE' &&
    pvpRoom?.match?.drawOfferedBy &&
    pvpRoom?.match?.drawOfferedBy !== user?.id &&
    pvpRoom?.match?.isParticipant;

  const gameOverSummary =
    mode === 'PVP' && pvpRoom?.match?.status === 'COMPLETED'
      ? {
          winnerColor: pvpRoom.match.winnerColor as PieceColor | null,
          termination: pvpRoom.match.termination as ChessTermination,
        }
      : mode === 'AI' && aiResult.isOver
      ? aiResult
      : null;

  return (
    <div className="space-y-4 w-full max-w-full">
      {/* Top Utility Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleLeaveToLobby}
            className="px-3 py-1.5 rounded-xl bg-[#24213A] hover:bg-[#2f2b4a] border border-white/10 text-xs font-bold text-white cursor-pointer"
          >
            ← Back to Chess Lobby
          </button>
          <span className="px-2.5 py-1 rounded-lg bg-[#24213A] border border-white/[0.06] text-xs font-mono text-[#22D3EE] font-bold">
            {mode === 'AI'
              ? `AI (${aiDifficulty}) · ${CHESS_TIME_CONTROLS[selectedTimeControl].label}`
              : `${pvpRoom?.roomCode || ''} · ${pvpRoom?.timeControl?.label || '5+0'} ${
                  pvpRoom?.isRanked ? 'Ranked' : 'Casual'
                }`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/wallet"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#24213A] hover:bg-[#2f2b4a] border border-white/10 text-xs font-mono font-black text-emerald-400 hover:text-emerald-300 transition-colors"
            title="Wallet Balance"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span>{balance.toFixed(0)} ETB</span>
          </Link>
          <Link
            to="/wallet?tab=deposit"
            className="w-7 h-7 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center justify-center active:scale-95 transition-all shadow-md"
            title="Deposit funds"
          >
            <Plus className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => setBoardFlipped((v) => !v)}
            className="px-3 py-1.5 rounded-xl bg-[#24213A] hover:bg-[#2f2b4a] border border-white/10 text-xs font-semibold text-[#A8A3BC] hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
          >
            <FlipVertical className="w-3.5 h-3.5" /> Flip Board
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-2.5 text-xs font-semibold text-rose-300">
          {errorMsg}
        </div>
      )}
      {infoMsg && (
        <div className="rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 px-4 py-2.5 text-xs font-semibold text-[#22C55E]">
          {infoMsg}
        </div>
      )}

      {opponentDisconnectSec !== null && isGameActive && (
        <div className="rounded-xl bg-amber-500/15 border border-amber-500/40 px-4 py-2.5 text-xs font-semibold text-amber-200 flex items-center gap-2">
          <Clock className="w-4 h-4 animate-pulse shrink-0" />
          <span>
            Opponent disconnected. Match awards win automatically if they do not reconnect within{' '}
            {opponentDisconnectSec}s.
          </span>
        </div>
      )}

      {incomingDrawOffer && (
        <div className="rounded-2xl bg-[#8B5CF6]/15 border border-[#8B5CF6] p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-bold text-white flex items-center gap-2">
            <Handshake className="w-4 h-4 text-[#22D3EE]" /> Opponent offered a draw.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleRespondDraw(true)}
              className="px-3.5 py-1.5 rounded-lg bg-[#22C55E] text-[#11101D] text-xs font-bold cursor-pointer"
            >
              Accept Draw
            </button>
            <button
              type="button"
              onClick={() => handleRespondDraw(false)}
              className="px-3.5 py-1.5 rounded-lg bg-[#11101D] text-white text-xs font-bold border border-white/10 cursor-pointer"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Arena Grid: Board Left + Move History & Controls Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Chess Board Column */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col items-center gap-2.5 w-full">
          {/* Top Opponent Bar */}
          <div className="w-full max-w-[560px] rounded-2xl bg-[#24213A] border border-white/[0.06] px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full border border-white/30 shrink-0 ${
                    topColor === 'w' ? 'bg-slate-100' : 'bg-[#11101D]'
                  }`}
                />
                <span className="text-sm font-bold text-white truncate">{topPlayer.username}</span>
                <span className="text-[11px] font-mono text-[#22D3EE]">({topPlayer.elo})</span>
                {topPlayer.eloDelta !== 0 && (
                  <span
                    className={`text-[10px] font-mono font-bold ${
                      topPlayer.eloDelta > 0 ? 'text-[#22C55E]' : 'text-rose-400'
                    }`}
                  >
                    {topPlayer.eloDelta > 0 ? `+${topPlayer.eloDelta}` : topPlayer.eloDelta}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1 min-h-[16px] flex-wrap">
                {topPlayer.captured.map((pt, i) => (
                  <ChessPieceSvg
                    key={`${pt}-${i}`}
                    type={pt}
                    color={topColor === 'w' ? 'b' : 'w'}
                    className="w-4 h-4"
                  />
                ))}
                {topPlayer.matDiff > 0 && (
                  <span className="text-[10px] font-mono font-bold text-[#22C55E] ml-1">
                    +{topPlayer.matDiff}
                  </span>
                )}
              </div>
            </div>

            <div
              className={`px-3.5 py-2 rounded-xl font-mono text-base sm:text-lg font-black border shrink-0 transition-colors ${
                topPlayer.isTurn
                  ? topPlayer.timeMs < 15_000
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                    : 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-white'
                  : 'bg-[#11101D] border-white/[0.06] text-[#A8A3BC]'
              }`}
            >
              {formatClock(topPlayer.timeMs)}
            </div>
          </div>

          {/* Interactive 8x8 Board */}
          <div className="relative w-full max-w-[560px] aspect-square rounded-2xl overflow-hidden border-2 border-[#24213A] shadow-[0_18px_50px_rgba(0,0,0,0.55)] bg-[#1B1930] select-none">
            <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
              {displayRanks.map((rank, rIdx) =>
                displayFiles.map((file, fIdx) => {
                  const sq = `${file}${rank}`;
                  const isLight = (FILES_ASC.indexOf(file) + RANKS_DESC.indexOf(rank)) % 2 === 0;
                  const piece = displayedEngine.getPieceAt(sq);
                  const isSelected = selectedSq === sq;
                  const isLegalDest = legalTargetSet.has(sq);
                  const isLastMoveSq = lastMove && (lastMove.from === sq || lastMove.to === sq);
                  const isCheckSq = displayedCheckKingSq === sq;

                  return (
                    <button
                      key={sq}
                      type="button"
                      onClick={() => handleSquareClick(sq)}
                      aria-label={`Square ${sq}`}
                      className={`relative flex items-center justify-center transition-colors focus:outline-none ${
                        isLight ? 'bg-[#DDD6F3]' : 'bg-[#5B4E8A]'
                      } ${isLastMoveSq ? 'after:absolute after:inset-0 after:bg-[#22D3EE]/30 after:pointer-events-none' : ''} ${
                        isSelected ? 'ring-inset ring-4 ring-[#8B5CF6] bg-[#8B5CF6]/45' : ''
                      } ${isCheckSq ? 'bg-rose-600/75 ring-inset ring-2 ring-rose-300' : ''} ${
                        canInteractWithBoard ? 'cursor-pointer' : 'cursor-default'
                      }`}
                    >
                      {/* Coordinate Labels along left file and bottom rank */}
                      {fIdx === 0 && (
                        <span
                          className={`absolute top-0.5 left-1 text-[9px] font-bold leading-none pointer-events-none ${
                            isLight ? 'text-[#5B4E8A]' : 'text-[#DDD6F3]'
                          }`}
                        >
                          {rank}
                        </span>
                      )}
                      {rIdx === 7 && (
                        <span
                          className={`absolute bottom-0.5 right-1 text-[9px] font-bold leading-none pointer-events-none ${
                            isLight ? 'text-[#5B4E8A]' : 'text-[#DDD6F3]'
                          }`}
                        >
                          {file}
                        </span>
                      )}

                      {piece && (
                        <ChessPieceSvg
                          type={piece.type}
                          color={piece.color}
                          className="w-[82%] h-[82%] relative z-10 transition-transform"
                        />
                      )}

                      {isLegalDest && !piece && (
                        <span className="w-3.5 h-3.5 rounded-full bg-[#11101D]/45 z-20 pointer-events-none" />
                      )}
                      {isLegalDest && piece && (
                        <span className="absolute inset-1 rounded-full border-[3.5px] border-[#11101D]/55 z-20 pointer-events-none" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Pawn Promotion Overlay */}
            {pendingPromotion && myColor && (
              <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="rounded-2xl bg-[#24213A] border border-[#8B5CF6] p-4 space-y-3 text-center shadow-2xl">
                  <div className="text-xs font-bold text-white uppercase tracking-wider">
                    Promote Pawn To
                  </div>
                  <div className="flex items-center gap-2">
                    {(['q', 'r', 'b', 'n'] as PromotionPiece[]).map((promo) => (
                      <button
                        key={promo}
                        type="button"
                        onClick={() =>
                          executePlayerMove(pendingPromotion.from, pendingPromotion.to, promo)
                        }
                        className="w-14 h-14 rounded-xl bg-[#11101D] hover:bg-[#8B5CF6]/30 border border-white/10 p-2 cursor-pointer transition-colors"
                      >
                        <ChessPieceSvg type={promo} color={myColor} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Player Bar */}
          <div className="w-full max-w-[560px] rounded-2xl bg-[#24213A] border border-white/[0.06] px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full border border-white/30 shrink-0 ${
                    bottomColor === 'w' ? 'bg-slate-100' : 'bg-[#11101D]'
                  }`}
                />
                <span className="text-sm font-bold text-white truncate">{bottomPlayer.username}</span>
                <span className="text-[11px] font-mono text-[#22D3EE]">({bottomPlayer.elo})</span>
                {bottomPlayer.eloDelta !== 0 && (
                  <span
                    className={`text-[10px] font-mono font-bold ${
                      bottomPlayer.eloDelta > 0 ? 'text-[#22C55E]' : 'text-rose-400'
                    }`}
                  >
                    {bottomPlayer.eloDelta > 0 ? `+${bottomPlayer.eloDelta}` : bottomPlayer.eloDelta}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1 min-h-[16px] flex-wrap">
                {bottomPlayer.captured.map((pt, i) => (
                  <ChessPieceSvg
                    key={`${pt}-${i}`}
                    type={pt}
                    color={bottomColor === 'w' ? 'b' : 'w'}
                    className="w-4 h-4"
                  />
                ))}
                {bottomPlayer.matDiff > 0 && (
                  <span className="text-[10px] font-mono font-bold text-[#22C55E] ml-1">
                    +{bottomPlayer.matDiff}
                  </span>
                )}
              </div>
            </div>

            <div
              className={`px-3.5 py-2 rounded-xl font-mono text-base sm:text-lg font-black border shrink-0 transition-colors ${
                bottomPlayer.isTurn
                  ? bottomPlayer.timeMs < 15_000
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                    : 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-white'
                  : 'bg-[#11101D] border-white/[0.06] text-[#A8A3BC]'
              }`}
            >
              {formatClock(bottomPlayer.timeMs)}
            </div>
          </div>
        </div>

        {/* Right Side Panel: Result Banner, Move History, & Controls */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-4 w-full">
          {gameOverSummary && (
            <div className="rounded-2xl bg-[#24213A] border border-[#22C55E]/40 p-5 space-y-3 shadow-lg">
              <div className="flex items-center gap-2.5">
                <Award className="w-6 h-6 text-[#22C55E]" />
                <div>
                  <div className="text-base font-black text-white">
                    {gameOverSummary.winnerColor === null
                      ? 'Match Drawn'
                      : gameOverSummary.winnerColor === myColor
                      ? 'Victory!'
                      : gameOverSummary.winnerColor === 'w'
                      ? 'White Wins'
                      : 'Black Wins'}
                  </div>
                  <div className="text-xs text-[#A8A3BC]">
                    {formatTermination(gameOverSummary.termination)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleRematch}
                  className="py-2.5 px-2.5 rounded-xl bg-[#8B5CF6] hover:bg-violet-500 text-white text-xs font-bold inline-flex items-center justify-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Rematch
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const pgn =
                      pvpRoom?.match?.pgn ||
                      liveEngine.getPgn({
                        white: topColor === 'w' ? topPlayer.username : bottomPlayer.username,
                        black: topColor === 'b' ? topPlayer.username : bottomPlayer.username,
                        result:
                          gameOverSummary.winnerColor === 'w'
                            ? '1-0'
                            : gameOverSummary.winnerColor === 'b'
                            ? '0-1'
                            : '1/2-1/2',
                      });
                    navigator.clipboard?.writeText(pgn).then(() => {
                      setCopiedPgn(true);
                      setTimeout(() => setCopiedPgn(false), 2000);
                    });
                  }}
                  className="py-2.5 px-2.5 rounded-xl bg-[#11101D] hover:bg-[#1B1930] border border-white/10 text-[#22D3EE] text-xs font-bold inline-flex items-center justify-center gap-1 cursor-pointer"
                >
                  {copiedPgn ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedPgn ? 'Copied' : 'Copy PGN'}
                </button>
                <button
                  type="button"
                  onClick={handleLeaveToLobby}
                  className="py-2.5 px-2.5 rounded-xl bg-[#11101D] hover:bg-[#1B1930] border border-white/10 text-white text-xs font-bold cursor-pointer"
                >
                  New Match
                </button>
              </div>
            </div>
          )}

          {/* Move History Panel */}
          <div className="rounded-2xl bg-[#24213A] border border-white/[0.06] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#22D3EE]" />
                <h3 className="text-sm font-bold text-white">Move History</h3>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setReviewPly(0)}
                  aria-label="First move"
                  className="w-7 h-7 rounded-lg bg-[#11101D] text-[#A8A3BC] hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <ChevronFirst className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setReviewPly((p) => {
                      const cur = p === null ? activeMoves.length : p;
                      return Math.max(0, cur - 1);
                    })
                  }
                  aria-label="Previous move"
                  className="w-7 h-7 rounded-lg bg-[#11101D] text-[#A8A3BC] hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setReviewPly((p) => {
                      if (p === null) return null;
                      return p + 1 >= activeMoves.length ? null : p + 1;
                    })
                  }
                  aria-label="Next move"
                  className="w-7 h-7 rounded-lg bg-[#11101D] text-[#A8A3BC] hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setReviewPly(null)}
                  aria-label="Jump to live position"
                  className="w-7 h-7 rounded-lg bg-[#11101D] text-[#A8A3BC] hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <ChevronLast className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {reviewPly !== null && (
              <div className="rounded-lg bg-[#22D3EE]/15 border border-[#22D3EE]/30 px-3 py-1.5 flex items-center justify-between text-[11px] text-[#22D3EE] font-semibold">
                <span>Viewing move #{reviewPly}</span>
                <button
                  type="button"
                  onClick={() => setReviewPly(null)}
                  className="underline font-bold cursor-pointer"
                >
                  Back to Live
                </button>
              </div>
            )}

            <div className="rounded-xl bg-[#11101D] border border-white/[0.06] h-64 overflow-y-auto p-2 space-y-1">
              {movePairs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-[#A8A3BC]">
                  White to open the game...
                </div>
              ) : (
                movePairs.map((pair) => {
                  const wPly = (pair.num - 1) * 2 + 1;
                  const bPly = (pair.num - 1) * 2 + 2;
                  return (
                    <div
                      key={pair.num}
                      className="grid grid-cols-12 items-center text-xs font-mono py-1 px-2 rounded-lg hover:bg-white/[0.03]"
                    >
                      <span className="col-span-2 text-[#A8A3BC]">{pair.num}.</span>
                      <button
                        type="button"
                        onClick={() => setReviewPly(wPly === activeMoves.length ? null : wPly)}
                        className={`col-span-5 text-left px-2 py-0.5 rounded cursor-pointer ${
                          reviewPly === wPly || (reviewPly === null && wPly === activeMoves.length)
                            ? 'bg-[#8B5CF6]/30 text-white font-bold'
                            : 'text-white hover:bg-white/[0.06]'
                        }`}
                      >
                        {pair.white?.san}
                      </button>
                      <button
                        type="button"
                        disabled={!pair.black}
                        onClick={() =>
                          pair.black && setReviewPly(bPly === activeMoves.length ? null : bPly)
                        }
                        className={`col-span-5 text-left px-2 py-0.5 rounded ${
                          pair.black ? 'cursor-pointer' : ''
                        } ${
                          reviewPly === bPly || (reviewPly === null && bPly === activeMoves.length)
                            ? 'bg-[#8B5CF6]/30 text-white font-bold'
                            : 'text-[#A8A3BC] hover:bg-white/[0.06] hover:text-white'
                        }`}
                      >
                        {pair.black?.san || ''}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Game Controls Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {mode === 'PVP' && isGameActive && pvpRoom?.match?.isParticipant && (
                <button
                  type="button"
                  onClick={handleOfferDraw}
                  className="py-2.5 px-3 rounded-xl bg-[#11101D] hover:bg-[#1B1930] border border-white/10 text-xs font-bold text-white inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Handshake className="w-3.5 h-3.5 text-[#22D3EE]" /> Offer Draw
                </button>
              )}

              {isGameActive && (mode === 'AI' || pvpRoom?.match?.isParticipant) && (
                <button
                  type="button"
                  onClick={handleResign}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                    confirmResign
                      ? 'bg-rose-500 text-white border-rose-500'
                      : 'bg-[#11101D] hover:bg-rose-500/15 border-white/10 text-rose-300'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" /> {confirmResign ? 'Confirm Resign?' : 'Resign'}
                </button>
              )}

              {mode === 'PVP' && pvpRoom?.match?.isParticipant && isAuthenticated && (
                <button
                  type="button"
                  onClick={() => setReportOpen((v) => !v)}
                  className="py-2.5 px-3 rounded-xl bg-[#11101D] hover:bg-orange-500/15 border border-white/10 text-xs font-bold text-orange-300 inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5" /> Report
                </button>
              )}
            </div>

            {reportOpen && (
              <form
                onSubmit={handleSubmitReport}
                className="rounded-xl bg-[#11101D] border border-orange-500/30 p-3 space-y-2.5"
              >
                <div className="text-xs font-bold text-orange-300">Report Opponent to Fair Play</div>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-[#24213A] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white"
                >
                  <option value="Suspected Engine / Cheating">Suspected Engine / Cheating</option>
                  <option value="Stalling / Abandonment">Stalling / Abandonment</option>
                  <option value="Abusive Behavior">Abusive Behavior</option>
                </select>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Optional details..."
                  rows={2}
                  className="w-full bg-[#24213A] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Submit Report
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-[#24213A] text-[#A8A3BC] text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Comprehensive How to Play Modal */}
      <HowToPlayModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        defaultGameId="chess"
      />
    </div>
  );
};
