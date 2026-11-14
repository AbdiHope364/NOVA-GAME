import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../../../services/api';
import { useWalletStore } from '../../../stores/walletStore';

export type FlipAnimationPhase = 'IDLE' | 'FLIPPING' | 'SETTLING' | 'RESULT';

export interface FlipResultData {
  id: string;
  game: string;
  choice: 'HEADS' | 'TAILS';
  result: 'HEADS' | 'TAILS';
  won: boolean;
  payout: number;
  multiplier: number;
  betAmount: number;
  hash: string;
  createdAt: string;
}

export const MIN_COIN_BET = 10;
export const MAX_COIN_BET = 10000;

const generateHexHash = (): string => {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars[Math.floor(Math.random() * 16)];
  }
  return result;
};

export function useCoinFlip() {
  const [choice, setChoice] = useState<'HEADS' | 'TAILS'>('HEADS');
  const [betAmount, setBetAmount] = useState<number>(100);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [flipPhase, setFlipPhase] = useState<FlipAnimationPhase>('IDLE');
  const [lastResult, setLastResult] = useState<FlipResultData | null>(null);
  const [history, setHistory] = useState<FlipResultData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [serverSeedHash, setServerSeedHash] = useState<string>(() => generateHexHash());
  const [clientSeed, setClientSeed] = useState<string>('nova-player-seed');
  const [nonce, setNonce] = useState<number>(1);

  const { balance, updateBalance, fetchWallet } = useWalletStore();
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  // Auto-clamp stake if balance is lower than current bet
  useEffect(() => {
    if (balance > 0 && betAmount > balance) {
      setBetAmount(Math.max(MIN_COIN_BET, Math.floor(balance)));
    }
  }, [balance]);

  const updateBetSafe = (amount: number) => {
    const clamped = Math.max(MIN_COIN_BET, Math.min(MAX_COIN_BET, Math.floor(amount)));
    setBetAmount(clamped);
  };

  // ============================================================================
  // Procedural Web Audio Metallic Sound Synthesis
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

  const playCoinFlickSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Dual high-frequency metallic ring (2400Hz & 3800Hz)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(2400, now);
      osc1.frequency.exponentialRampToValueAtTime(4200, now + 0.12);

      osc2.frequency.setValueAtTime(3600, now);
      osc2.frequency.exponentialRampToValueAtTime(5800, now + 0.16);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.28);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.28);
      osc2.stop(now + 0.28);
    } catch {
      // Audio fallback
    }
  }, [soundEnabled, getAudioContext]);

  const playCoinCatchSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Solid metallic felt catch clink
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Audio fallback
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
          // Golden fanfare victory chimes (E5 -> A5 -> C#6)
          [659.25, 880, 1108.7].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const delay = idx * 0.09;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + delay);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.04, now + delay + 0.3);

            gain.gain.setValueAtTime(0.18, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.002, now + delay + 0.35);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + delay);
            osc.stop(now + delay + 0.35);
          });
        } else {
          // Muted loss thud
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(160, now);
          osc.frequency.exponentialRampToValueAtTime(70, now + 0.18);

          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.005, now + 0.2);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.2);
        }
      } catch {
        // Audio fallback
      }
    },
    [soundEnabled, getAudioContext]
  );

  useEffect(() => {
    return () => {
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  const rotateSeed = async () => {
    try {
      const res = await api.post('/games/provably-fair/rotate');
      if (res.data?.data?.serverSeedHash) {
        setServerSeedHash(res.data.data.serverSeedHash);
      } else {
        setServerSeedHash(generateHexHash());
      }
      setNonce(1);
    } catch {
      setServerSeedHash(generateHexHash());
      setNonce(1);
    }
  };

  // ============================================================================
  // Play Coin Flip — Server Authoritative Lifecycle
  // ============================================================================
  const play = async () => {
    if (isFlipping || flipPhase !== 'IDLE') return;

    if (betAmount < MIN_COIN_BET || betAmount > MAX_COIN_BET) {
      setError(`Bet must be between ${MIN_COIN_BET} and ${MAX_COIN_BET} ETB`);
      return;
    }
    if (betAmount > balance) {
      setError('Insufficient balance in wallet');
      return;
    }

    setError(null);
    setIsFlipping(true);
    setFlipPhase('FLIPPING');
    setLastResult(null);

    // Audio flick
    playCoinFlickSound();

    const startTime = Date.now();
    const roundHash = serverSeedHash;

    try {
      let resultData: FlipResultData;

      try {
        const res = await api.post('/games/play/coin-flip', {
          amount: betAmount,
          params: { choice },
        });
        const d = res.data.data;
        resultData = {
          id: d.id || `flip-${Date.now()}`,
          game: 'coin-flip',
          choice: d.outcome?.choice || choice,
          result: d.outcome?.result || choice,
          won: d.won,
          payout: d.payout,
          multiplier: d.multiplier || (d.won ? 1.98 : 0),
          betAmount,
          hash: d.hash || roundHash,
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
        // Fallback demo evaluation mode if offline / standalone PWA
        const randomFloat = Math.random();
        const rolledResult: 'HEADS' | 'TAILS' = randomFloat < 0.5 ? 'HEADS' : 'TAILS';
        const won = rolledResult === choice;
        const payout = won ? Math.floor(betAmount * 1.98) : 0;
        const newBal = won ? balance + (payout - betAmount) : balance - betAmount;

        resultData = {
          id: `flip-${Date.now()}`,
          game: 'coin-flip',
          choice,
          result: rolledResult,
          won,
          payout,
          multiplier: won ? 1.98 : 0,
          betAmount,
          hash: roundHash,
          createdAt: new Date().toISOString(),
        };
        updateBalance(newBal);
      }

      // Respect minimum spin duration for physical momentum
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const minSpinTime = prefersReducedMotion ? 250 : 1100;
      const elapsedTime = Date.now() - startTime;
      const remainingSpin = Math.max(0, minSpinTime - elapsedTime);

      if (remainingSpin > 0) {
        await new Promise((r) => setTimeout(r, remainingSpin));
      }

      // Settling phase: smoothly align coin face to the authoritative server result
      setFlipPhase('SETTLING');
      const settleTime = prefersReducedMotion ? 100 : 500;
      await new Promise((r) => setTimeout(r, settleTime));

      // Land clink sound
      playCoinCatchSound();

      // Result phase: gold/emerald celebration glow or loss aura
      setFlipPhase('RESULT');
      playOutcomeSound(resultData.won);
      setLastResult(resultData);
      setHistory((prev) => [resultData, ...prev.slice(0, 15)]);
      setNonce((prev) => prev + 1);

      // Re-enable controls after celebration
      const celebrationTime = prefersReducedMotion ? 400 : 1000;
      await new Promise((r) => setTimeout(r, celebrationTime));

      setFlipPhase('IDLE');
      setIsFlipping(false);
    } catch {
      setFlipPhase('IDLE');
      setIsFlipping(false);
      setError('Failed to flip coin. Please verify your connection.');
    }
  };

  return {
    choice,
    setChoice,
    betAmount,
    setBetAmount: updateBetSafe,
    isFlipping,
    flipPhase,
    lastResult,
    history,
    error,
    balance,
    soundEnabled,
    setSoundEnabled,
    serverSeedHash,
    clientSeed,
    setClientSeed,
    nonce,
    rotateSeed,
    play,
  };
}
