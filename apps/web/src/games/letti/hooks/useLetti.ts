import { useState, useRef, useEffect } from 'react';
import { api } from '../../../services/api';
import { useWalletStore } from '../../../stores/walletStore';
import { LettiEngine } from '@nova/game-letti';
import {
  LettiCard,
  LettiConfirmResponse,
  LettiPrepareResponse,
  LettiRoundHistoryItem,
  LettiStep,
  LettiVerifyResponse,
} from '@nova/types';

export type LettiPhase =
  | 'PICKING'
  | 'MIXING'
  | 'AWAITING_PERMISSION'
  | 'DEALING'
  | 'RESULT';

export interface LettiRoundOutcomeSummary {
  roundId: string;
  roundCode: string;
  won: boolean;
  betAmount: number;
  payout: number;
  multiplier: number;
  winnerSide: 'USER' | 'SYSTEM';
  matchedCard: LettiCard;
  totalFlips: number;
  serverSeedHash: string;
  serverSeed?: string;
  clientSeed: string;
  nonce: number;
}

const SESSION_ROUND_KEY = 'nova_letti_last_round_id';

const createVisualMysteryDeck = (): number[] => {
  const arr = Array.from({ length: 52 }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
};

const create51VisualSlots = (seedOffset = 0): number[] => {
  const arr = Array.from({ length: 51 }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (i * 7 + seedOffset + Math.floor(Math.random() * (i + 1))) % (i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
};

const makeIdempotencyKey = (roundId: string): string => {
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `letti-${roundId}-${rand}`;
};

export function useLetti() {
  const [phase, setPhase] = useState<LettiPhase>('PICKING');
  const [mysteryDeckIndices, setMysteryDeckIndices] = useState<number[]>(() => createVisualMysteryDeck());
  const [remainingVisualSlots, setRemainingVisualSlots] = useState<number[]>([]);
  const [mixTick, setMixTick] = useState<number>(0);

  const [pickedCard, setPickedCard] = useState<LettiCard | null>(null);
  const [preparedRound, setPreparedRound] = useState<LettiPrepareResponse | null>(null);
  const [showSecretToUser, setShowSecretToUser] = useState<boolean>(true);
  const [betAmount, setBetAmount] = useState<number>(100);

  const [isPreparing, setIsPreparing] = useState<boolean>(false);
  const [fastMode, setFastMode] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const [revealedSteps, setRevealedSteps] = useState<LettiStep[]>([]);
  const [currentTurnSide, setCurrentTurnSide] = useState<'USER' | 'SYSTEM' | null>(null);
  const [roundOutcome, setRoundOutcome] = useState<LettiRoundOutcomeSummary | null>(null);

  const [history, setHistory] = useState<LettiRoundHistoryItem[]>([]);
  const [selectedHistoryRound, setSelectedHistoryRound] = useState<LettiRoundHistoryItem | null>(null);
  const [verifyResult, setVerifyResult] = useState<LettiVerifyResponse | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const [pendingReplaceCardIndex, setPendingReplaceCardIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { balance, updateBalance, fetchWallet } = useWalletStore();
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timersRef = useRef<number[]>([]);
  const confirmingRef = useRef<boolean>(false);
  const roundIdemKeyRef = useRef<string | null>(null);
  const pendingFinalRef = useRef<{
    allSteps: LettiStep[];
    confirmData: LettiConfirmResponse;
  } | null>(null);

  const clearTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/games/letti/history?limit=20');
      if (Array.isArray(res.data?.data)) {
        setHistory(res.data.data);
      }
    } catch {
      // Ignore silent history fetch failure on mount
    }
  };

  // Reconnection recovery & initial history fetch
  useEffect(() => {
    fetchWallet();
    let cancelled = false;

    const recoverActiveState = async () => {
      try {
        const lastRoundId = sessionStorage.getItem(SESSION_ROUND_KEY) || '';
        const res = await api.get(`/games/letti/active?lastRoundId=${encodeURIComponent(lastRoundId)}`);
        if (cancelled) return;
        const payload = res.data?.data;

        if (payload?.mode === 'PREPARED' && payload.round) {
          const prep = payload.round as LettiPrepareResponse;
          setPreparedRound(prep);
          setPickedCard(prep.pickedCard);
          setRemainingVisualSlots(create51VisualSlots());
          roundIdemKeyRef.current = makeIdempotencyKey(prep.roundId);
          setPhase('AWAITING_PERMISSION');
        } else if (payload?.mode === 'SETTLED' && payload.round) {
          const settled = payload.round as LettiConfirmResponse;
          setPickedCard(settled.outcome.pickedCard);
          setRevealedSteps(settled.outcome.steps);
          setRoundOutcome({
            roundId: settled.roundId,
            roundCode: settled.roundCode,
            won: settled.won,
            betAmount: settled.amount,
            payout: settled.payout,
            multiplier: settled.multiplier,
            winnerSide: settled.outcome.winnerSide,
            matchedCard: settled.outcome.matchedCard,
            totalFlips: settled.outcome.totalFlips,
            serverSeedHash: settled.provablyFair.serverSeedHash,
            serverSeed: settled.provablyFair.serverSeed,
            clientSeed: settled.provablyFair.clientSeed,
            nonce: settled.provablyFair.nonce,
          });
          if (typeof settled.newBalance === 'number') {
            updateBalance(settled.newBalance);
          }
          setPhase('RESULT');
        }
      } catch {
        // Ignore silent recovery error
      }
    };

    recoverActiveState();
    fetchHistory();

    return () => {
      cancelled = true;
      clearTimers();
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  const playSound = (type: 'flip' | 'shuffle' | 'match' | 'win' | 'loss') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'shuffle') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } else if (type === 'match') {
        // Distinct sharp two-tone alert for matching-rank card reveal
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.07);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.19);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.19);
      } else if (type === 'flip') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(420, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.06);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.07);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.07);
      } else if (type === 'win') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1046, ctx.currentTime + 0.22);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.28);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.14, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.28);
      }
    } catch {}
  };

  const isMixing = phase === 'MIXING';
  const isDealing = phase === 'DEALING';

  const runVisualMixAnimation = () => {
    clearTimers();
    setPhase('MIXING');
    setMixTick(1);
    setRemainingVisualSlots(create51VisualSlots(1));
    playSound('shuffle');

    const totalPasses = 4;
    const passInterval = fastMode ? 160 : 300;

    for (let pass = 1; pass <= totalPasses; pass++) {
      const tId = window.setTimeout(() => {
        if (pass < totalPasses) {
          setRemainingVisualSlots(create51VisualSlots(pass + 1));
          setMixTick(pass + 1);
          playSound('shuffle');
        } else {
          setRemainingVisualSlots(create51VisualSlots(totalPasses + 1));
          setMixTick(0);
          setPhase('AWAITING_PERMISSION');
        }
      }, pass * passInterval);
      timersRef.current.push(tId);
    }
  };

  /**
   * Authoritative Step 1 & 2: Sends selected card to backend to commit SHA-256 serverSeedHash
   * and prepare the single authoritative 51-card shuffle order before mixing animation completes.
   */
  const prepareServerRound = async (cardIndex: number) => {
    if (isPreparing || isMixing || isDealing) return;

    // Enforce post-loss rule: cannot reuse same lost card unless picking fresh from picker
    if (phase === 'RESULT' && roundOutcome && !roundOutcome.won && cardIndex === pickedCard?.index) {
      backToPicker();
      return;
    }

    setError(null);
    setIsPreparing(true);
    setRoundOutcome(null);
    setRevealedSteps([]);
    setCurrentTurnSide(null);

    const chosen = LettiEngine.cardFromIndex(cardIndex);
    setPickedCard(chosen);

    try {
      const res = await api.post('/games/letti/prepare', { pickedCardIndex: cardIndex });
      const prep = res.data.data as LettiPrepareResponse;
      setPreparedRound(prep);
      roundIdemKeyRef.current = makeIdempotencyKey(prep.roundId);
      sessionStorage.setItem(SESSION_ROUND_KEY, prep.roundId);
      setIsPreparing(false);
      runVisualMixAnimation();
    } catch (err: any) {
      setIsPreparing(false);
      setPickedCard(null);
      setPreparedRound(null);
      setPhase('PICKING');
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          'Failed to prepare provably fair Letti round. Please try again.'
      );
    }
  };

  const selectCardByIndex = (cardIndex: number) => {
    if (isPreparing || isMixing || isDealing) return;
    if (phase === 'AWAITING_PERMISSION' && pickedCard && pickedCard.index !== cardIndex) {
      setPendingReplaceCardIndex(cardIndex);
      return;
    }
    prepareServerRound(cardIndex);
  };

  const pickRandomSecretCard = () => {
    if (isPreparing || isMixing || isDealing) return;
    const randIdx = Math.floor(Math.random() * 52);
    if (phase === 'AWAITING_PERMISSION' && pickedCard) {
      setPendingReplaceCardIndex(randIdx);
      return;
    }
    prepareServerRound(randIdx);
  };

  const confirmReplaceCard = () => {
    if (pendingReplaceCardIndex === null) return;
    const targetIdx = pendingReplaceCardIndex;
    setPendingReplaceCardIndex(null);
    if (targetIdx === -1) {
      backToPicker();
    } else {
      prepareServerRound(targetIdx);
    }
  };

  const cancelReplaceCard = () => {
    setPendingReplaceCardIndex(null);
  };

  const requestBackToPicker = () => {
    if (isPreparing || isMixing || isDealing) return;
    if (phase === 'AWAITING_PERMISSION' && pickedCard) {
      setPendingReplaceCardIndex(-1);
      return;
    }
    backToPicker();
  };

  const mixRemainingCards = (targetCardIndex?: number) => {
    if (targetCardIndex === undefined && phase === 'RESULT' && roundOutcome && !roundOutcome.won) {
      backToPicker();
      return;
    }
    const idxToUse = targetCardIndex ?? pickedCard?.index;
    if (idxToUse === undefined) return;
    prepareServerRound(idxToUse);
  };

  const backToPicker = () => {
    if (isPreparing || isMixing || isDealing) return;
    clearTimers();
    sessionStorage.removeItem(SESSION_ROUND_KEY);
    setMysteryDeckIndices(createVisualMysteryDeck());
    setRemainingVisualSlots([]);
    setPickedCard(null);
    setPreparedRound(null);
    roundIdemKeyRef.current = null;
    setRoundOutcome(null);
    setRevealedSteps([]);
    setCurrentTurnSide(null);
    setError(null);
    setMixTick(0);
    setPendingReplaceCardIndex(null);
    setPhase('PICKING');
  };

  const finalizeRound = (data: NonNullable<typeof pendingFinalRef.current>) => {
    const c = data.confirmData;
    setPhase('RESULT');
    setCurrentTurnSide(null);
    setRevealedSteps(data.allSteps);
    setRoundOutcome({
      roundId: c.roundId,
      roundCode: c.roundCode,
      won: c.won,
      betAmount: c.amount,
      payout: c.payout,
      multiplier: c.multiplier,
      winnerSide: c.outcome.winnerSide,
      matchedCard: c.outcome.matchedCard,
      totalFlips: c.outcome.totalFlips,
      serverSeedHash: c.provablyFair.serverSeedHash,
      serverSeed: c.provablyFair.serverSeed,
      clientSeed: c.provablyFair.clientSeed,
      nonce: c.provablyFair.nonce,
    });
    updateBalance(c.newBalance);
    playSound(c.won ? 'win' : 'loss');

    const newHistItem: LettiRoundHistoryItem = {
      roundId: c.roundId,
      roundCode: c.roundCode,
      pickedCard: c.outcome.pickedCard,
      matchedCard: c.outcome.matchedCard,
      winnerSide: c.outcome.winnerSide,
      winningFlip: `${c.outcome.winnerSide} #${c.outcome.totalFlips}`,
      totalFlips: c.outcome.totalFlips,
      betAmount: c.amount,
      payout: c.payout,
      multiplier: c.multiplier,
      won: c.won,
      serverSeedHash: c.provablyFair.serverSeedHash,
      serverSeed: c.provablyFair.serverSeed || '',
      clientSeed: c.provablyFair.clientSeed,
      nonce: c.provablyFair.nonce,
      outcome: c.outcome,
      createdAt: new Date().toISOString(),
    };
    setHistory((prev) => [newHistItem, ...prev.filter((h) => h.roundId !== c.roundId).slice(0, 19)]);
    setPreparedRound(null);
    pendingFinalRef.current = null;
  };

  const skipToResult = () => {
    if (!isDealing || !pendingFinalRef.current) return;
    clearTimers();
    finalizeRound(pendingFinalRef.current);
  };

  /**
   * Authoritative Step 3 & 4: Confirms wager using unique idempotencyKey and animates
   * the exact server-committed alternating flip sequence.
   */
  const grantPermissionAndStartFlip = async () => {
    if (confirmingRef.current || isPreparing || isMixing || isDealing) return;
    if (!pickedCard || !preparedRound) {
      setError('Please pick 1 secret card from the 52-card deck first.');
      return;
    }
    if (phase !== 'AWAITING_PERMISSION') {
      mixRemainingCards(pickedCard.index);
      return;
    }
    if (betAmount <= 0) {
      setError('Bet amount must be greater than 0 ETB.');
      return;
    }
    if (betAmount > balance) {
      setError('Insufficient wallet balance.');
      return;
    }

    confirmingRef.current = true;
    clearTimers();
    setError(null);
    setPhase('DEALING');
    setRoundOutcome(null);
    setRevealedSteps([]);
    setCurrentTurnSide('USER');

    try {
      const idemKey = roundIdemKeyRef.current || makeIdempotencyKey(preparedRound.roundId);
      roundIdemKeyRef.current = idemKey;

      const res = await api.post('/games/letti/confirm', {
        roundId: preparedRound.roundId,
        amount: betAmount,
        idempotencyKey: idemKey,
      });

      const confirmData = res.data.data as LettiConfirmResponse;
      const allSteps = confirmData.outcome.steps;

      const finalSnapshot = { allSteps, confirmData };
      pendingFinalRef.current = finalSnapshot;

      const stepDelay = fastMode ? 230 : 540;

      allSteps.forEach((stepItem, idx) => {
        const timerId = window.setTimeout(() => {
          setCurrentTurnSide(stepItem.side);
          setRevealedSteps((prev) => [...prev, stepItem]);
          playSound(stepItem.matched ? 'match' : 'flip');

          if (idx === allSteps.length - 1) {
            const endTimer = window.setTimeout(() => {
              finalizeRound(finalSnapshot);
            }, 420);
            timersRef.current.push(endTimer);
          }
        }, (idx + 1) * stepDelay);

        timersRef.current.push(timerId);
      });
    } catch (err: any) {
      setPhase('AWAITING_PERMISSION');
      setCurrentTurnSide(null);
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          'Failed to confirm Letti round. Please check your connection and try again.'
      );
    } finally {
      confirmingRef.current = false;
    }
  };

  const openRoundVerifier = async (item: LettiRoundHistoryItem) => {
    setSelectedHistoryRound(item);
    setVerifyResult(null);
    setIsVerifying(true);
    try {
      const res = await api.post('/games/letti/verify', { roundId: item.roundId });
      setVerifyResult(res.data.data as LettiVerifyResponse);
    } catch {
      setVerifyResult(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const closeRoundVerifier = () => {
    setSelectedHistoryRound(null);
    setVerifyResult(null);
  };

  const userSideCards = revealedSteps.filter((s) => s.side === 'USER');
  const systemSideCards = revealedSteps.filter((s) => s.side === 'SYSTEM');
  const latestRevealedStep = revealedSteps.length > 0 ? revealedSteps[revealedSteps.length - 1].step : null;
  const remainingUnflippedCount = Math.max(0, 51 - revealedSteps.length);

  return {
    phase,
    mysteryDeckIndices,
    remainingVisualSlots,
    mixTick,
    pickedCard,
    preparedRound,
    showSecretToUser,
    setShowSecretToUser,
    betAmount,
    setBetAmount,
    isPreparing,
    isMixing,
    isDealing,
    fastMode,
    setFastMode,
    soundEnabled,
    setSoundEnabled,
    revealedSteps,
    userSideCards,
    systemSideCards,
    latestRevealedStep,
    remainingUnflippedCount,
    currentTurnSide,
    roundOutcome,
    history,
    selectedHistoryRound,
    verifyResult,
    isVerifying,
    pendingReplaceCardIndex,
    error,
    balance,
    selectCardByIndex,
    pickRandomSecretCard,
    confirmReplaceCard,
    cancelReplaceCard,
    requestBackToPicker,
    mixRemainingCards,
    backToPicker,
    grantPermissionAndStartFlip,
    skipToResult,
    openRoundVerifier,
    closeRoundVerifier,
  };
}
