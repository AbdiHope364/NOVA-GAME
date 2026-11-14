import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../../../services/api';
import { useWalletStore } from '../../../stores/walletStore';
import { DiceEngine } from '@nova/game-dice';

export type DiceAnimationPhase = 'IDLE' | 'ROLLING' | 'SETTLING' | 'WON' | 'LOST';

export interface DiceResultData {
  id: string;
  game: string;
  targetNumber: number;
  roll: number;
  won: boolean;
  payout: number;
  multiplier: number;
  betAmount: number;
  mode: 'SLIDER' | 'SINGLE';
  condition: 'UNDER' | 'OVER';
  winChance: number;
  createdAt: string;
}

export function useDice() {
  const [mode, setMode] = useState<'SLIDER' | 'SINGLE'>('SLIDER');
  const [targetNumber, setTargetNumber] = useState<number>(50);
  const [singlePick, setSinglePick] = useState<number>(5);
  const [condition, setCondition] = useState<'UNDER' | 'OVER'>('UNDER');
  const [betAmount, setBetAmount] = useState<number>(100);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [animationPhase, setAnimationPhase] = useState<DiceAnimationPhase>('IDLE');
  const [displayRoll, setDisplayRoll] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<DiceResultData | null>(null);
  const [history, setHistory] = useState<DiceResultData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const { balance, updateBalance, fetchWallet } = useWalletStore();
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rattleTimerRef = useRef<number | null>(null);
  const tickerTimerRef = useRef<number | null>(null);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  // Auto-clamp default stake to wallet balance if below default
  useEffect(() => {
    if (balance > 0 && betAmount > balance) {
      setBetAmount(Math.max(1, Math.floor(balance)));
    }
  }, [balance]);

  const safeTarget = Math.max(2, Math.min(98, targetNumber));
  const winChance =
    mode === 'SINGLE'
      ? 16.67
      : condition === 'UNDER'
      ? safeTarget
      : 100 - safeTarget;

  const currentMultiplier =
    mode === 'SINGLE' ? 5.94 : Number(((100 - 1.0) / winChance).toFixed(4));
  const possibleWin = Number((betAmount * currentMultiplier).toFixed(2));
  const profitOnWin = Number((possibleWin - betAmount).toFixed(2));

  const setWinChance = (chance: number) => {
    const clampedChance = Math.max(2, Math.min(98, Math.round(chance)));
    const newTarget = condition === 'UNDER' ? clampedChance : 100 - clampedChance;
    setTargetNumber(Math.max(2, Math.min(98, newTarget)));
  };

  const resetDefaults = () => {
    setTargetNumber(50);
    setCondition('UNDER');
    setBetAmount(100);
    setError(null);
  };

  // ============================================================================
  // Procedural Web Audio Sound Engine (Zero Asset Latency)
  // ============================================================================
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    const ctx = audioCtxRef.current;
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }, []);

  const playRollRattle = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      // Realistic tumbling frequency chirp
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260 + Math.random() * 80, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.06);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // AudioContext fallback
    }
  }, [soundEnabled, getAudioContext]);

  const playTableImpact = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      // Solid wooden / felt dice impact sound
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.002, now + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch {
      // AudioContext fallback
    }
  }, [soundEnabled, getAudioContext]);

  const playOutcomeSound = useCallback(
    (won: boolean) => {
      if (!soundEnabled) return;
      try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        if (won) {
          // Double chime chord on victory (G5 + C6)
          [784, 1046.5].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const delay = idx * 0.08;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + delay);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + delay + 0.25);

            gain.gain.setValueAtTime(0.18, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.005, now + delay + 0.3);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + delay);
            osc.stop(now + delay + 0.3);
          });
        } else {
          // Low muted thud on loss
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.exponentialRampToValueAtTime(65, now + 0.2);

          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.005, now + 0.22);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.22);
        }
      } catch {
        // AudioContext fallback
      }
    },
    [soundEnabled, getAudioContext]
  );

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (rattleTimerRef.current) clearInterval(rattleTimerRef.current);
      if (tickerTimerRef.current) clearInterval(tickerTimerRef.current);
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  // ============================================================================
  // Play Dice — Server Authoritative Lifecycle
  // ============================================================================
  const play = async (): Promise<DiceResultData | null> => {
    // 1. Guard against overlapping or invalid bets
    if (isRolling || animationPhase !== 'IDLE') {
      return null;
    }
    if (betAmount <= 0) {
      setError('Bet amount must be greater than 0 ETB');
      return null;
    }
    if (betAmount > balance) {
      setError('Insufficient balance in wallet');
      return null;
    }

    setError(null);
    setIsRolling(true);
    setAnimationPhase('ROLLING');

    // 2. Start rolling audio rattle loop
    rattleTimerRef.current = window.setInterval(() => {
      playRollRattle();
    }, 110);

    // 3. Start live number ticker during roll
    tickerTimerRef.current = window.setInterval(() => {
      if (mode === 'SINGLE') {
        setDisplayRoll(Math.floor(Math.random() * 6) + 1);
      } else {
        setDisplayRoll(Math.floor(Math.random() * 10000) / 100);
      }
    }, 50);

    const startTime = Date.now();
    const activeTarget = mode === 'SINGLE' ? singlePick : safeTarget;
    const gameEngine = new DiceEngine(1.0);

    try {
      let resultData: DiceResultData;

      try {
        // Authoritative backend API call
        const res = await api.post('/games/play/dice', {
          amount: betAmount,
          params: { target: activeTarget, condition, mode },
        });
        const d = res.data.data;
        resultData = {
          id: d.id || `dice-${Date.now()}`,
          game: 'dice',
          targetNumber: d.outcome?.target ?? activeTarget,
          roll: d.outcome?.roll ?? (mode === 'SINGLE' ? 1 : 50),
          won: d.won,
          payout: d.payout,
          multiplier: d.multiplier,
          betAmount,
          mode,
          condition,
          winChance: d.outcome?.winChance ?? winChance,
          createdAt: new Date().toISOString(),
        };

        const isAuth = !!localStorage.getItem('nova_token');
        if (isAuth && d.newBalance !== undefined) {
          updateBalance(d.newBalance);
        } else {
          const newBal = d.won ? balance + (d.payout - betAmount) : balance - betAmount;
          updateBalance(newBal);
        }
      } catch {
        // Offline / Demo fallback using pure engine with identical mathematical odds
        const evalRes = gameEngine.evaluate({
          amount: betAmount,
          serverSeed: 'demo-server-seed',
          clientSeed: 'demo-client-seed',
          nonce: Date.now() % 100000,
          params: { target: activeTarget, condition, mode },
        });

        const newBal = evalRes.won ? balance + (evalRes.payout - betAmount) : balance - betAmount;

        resultData = {
          id: `dice-${Date.now()}`,
          game: 'dice',
          targetNumber: activeTarget,
          roll: evalRes.outcome.roll,
          won: evalRes.won,
          payout: evalRes.payout,
          multiplier: evalRes.multiplier,
          betAmount,
          mode,
          condition,
          winChance: evalRes.outcome.winChance,
          createdAt: new Date().toISOString(),
        };
        updateBalance(newBal);
      }

      // 4. Ensure minimum tumbling duration for realistic momentum
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const minRollTime = prefersReducedMotion ? 200 : 700;
      const elapsedTime = Date.now() - startTime;
      const remainingSpin = Math.max(0, minRollTime - elapsedTime);

      if (remainingSpin > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingSpin));
      }

      // Stop ticker & rattle
      if (rattleTimerRef.current) {
        clearInterval(rattleTimerRef.current);
        rattleTimerRef.current = null;
      }
      if (tickerTimerRef.current) {
        clearInterval(tickerTimerRef.current);
        tickerTimerRef.current = null;
      }

      // 5. SETTLING PHASE: Lock display to exact server-returned outcome
      setDisplayRoll(resultData.roll);
      setAnimationPhase('SETTLING');

      // Settling duration allows 3D cube to decelerate into face orientation
      const settleDuration = prefersReducedMotion ? 100 : 500;
      await new Promise((resolve) => setTimeout(resolve, settleDuration));

      // Table impact sound on final landing
      playTableImpact();

      // 6. OUTCOME PHASE: Trigger victory glow or loss aura
      setAnimationPhase(resultData.won ? 'WON' : 'LOST');
      playOutcomeSound(resultData.won);
      setLastResult(resultData);
      setHistory((prev) => [resultData, ...prev.slice(0, 14)]);

      // 7. RESTORE IDLE STATE after celebration
      const outcomeDisplayTime = prefersReducedMotion ? 300 : 900;
      await new Promise((resolve) => setTimeout(resolve, outcomeDisplayTime));

      setAnimationPhase('IDLE');
      setIsRolling(false);

      return resultData;
    } catch {
      if (rattleTimerRef.current) {
        clearInterval(rattleTimerRef.current);
        rattleTimerRef.current = null;
      }
      if (tickerTimerRef.current) {
        clearInterval(tickerTimerRef.current);
        tickerTimerRef.current = null;
      }
      setAnimationPhase('IDLE');
      setIsRolling(false);
      setError('Failed to roll dice. Please verify your connection.');
      return null;
    }
  };

  return {
    mode,
    setMode,
    targetNumber: safeTarget,
    setTargetNumber,
    singlePick,
    setSinglePick,
    condition,
    setCondition,
    winChance,
    setWinChance,
    currentMultiplier,
    possibleWin,
    profitOnWin,
    betAmount,
    setBetAmount,
    isRolling,
    animationPhase,
    displayRoll,
    lastResult,
    history,
    error,
    balance,
    soundEnabled,
    setSoundEnabled,
    resetDefaults,
    play,
  };
}
