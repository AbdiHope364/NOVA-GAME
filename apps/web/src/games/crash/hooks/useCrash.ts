import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../../../services/api';
import { getGameSocket } from '../../../services/socket';
import { useWalletStore } from '../../../stores/walletStore';
import { useAuthStore } from '../../../stores/authStore';
import { Socket } from 'socket.io-client';

export interface CrashResultData {
  game: string;
  crashPoint: number;
  multiplier: number;
  won: boolean;
  payout: number;
  betAmount: number;
  createdAt: string;
}

// Multiplier growth exponential constant k: M(t) = e^(k * t)
export const CRASH_GROWTH_K = 0.065;

export function useCrash() {
  const [betAmount, setBetAmount] = useState<number>(10);
  const [autoCashoutEnabled, setAutoCashoutEnabled] = useState<boolean>(false);
  const [autoCashout, setAutoCashout] = useState<number>(2.0);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [isFlying, setIsFlying] = useState<boolean>(false);
  const [isCrashed, setIsCrashed] = useState<boolean>(false);
  const [isCashedOut, setIsCashedOut] = useState<boolean>(false);
  const [isBetting, setIsBetting] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number>(5);
  const [hasPlacedBet, setHasPlacedBet] = useState<boolean>(false);
  const [queuedNextRound, setQueuedNextRound] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<CrashResultData | null>(null);
  const [history, setHistory] = useState<number[]>([2.45, 1.88, 12.30, 1.15, 4.20, 1.95, 8.50, 3.12, 1.45, 5.80]);
  const [error, setError] = useState<string | null>(null);

  const { balance, fetchWallet } = useWalletStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  // Stable references for high-frequency streaming & animations
  const betAmountRef = useRef<number>(betAmount);
  useEffect(() => { betAmountRef.current = betAmount; }, [betAmount]);

  const autoCashoutEnabledRef = useRef<boolean>(autoCashoutEnabled);
  useEffect(() => { autoCashoutEnabledRef.current = autoCashoutEnabled; }, [autoCashoutEnabled]);

  const autoCashoutRef = useRef<number>(autoCashout);
  useEffect(() => { autoCashoutRef.current = autoCashout; }, [autoCashout]);

  const currentMultiplierRef = useRef<number>(currentMultiplier);
  useEffect(() => { currentMultiplierRef.current = currentMultiplier; }, [currentMultiplier]);

  const hasPlacedBetRef = useRef<boolean>(hasPlacedBet);
  useEffect(() => { hasPlacedBetRef.current = hasPlacedBet; }, [hasPlacedBet]);

  const queuedNextRoundRef = useRef<boolean>(queuedNextRound);
  useEffect(() => { queuedNextRoundRef.current = queuedNextRound; }, [queuedNextRound]);

  const isFlyingRef = useRef<boolean>(isFlying);
  useEffect(() => { isFlyingRef.current = isFlying; }, [isFlying]);

  const isCrashedRef = useRef<boolean>(isCrashed);
  useEffect(() => { isCrashedRef.current = isCrashed; }, [isCrashed]);

  const isCashedOutRef = useRef<boolean>(isCashedOut);
  useEffect(() => { isCashedOutRef.current = isCashedOut; }, [isCashedOut]);

  // Protects against double-crediting
  const cashedOutThisRoundRef = useRef<boolean>(false);

  // Track socket server round
  const currentRoundIdRef = useRef<number | null>(null);
  const isSocketConnectedRef = useRef<boolean>(false);
  const lastSocketPacketTimeRef = useRef<number>(0);

  const animationFrameRef = useRef<number | null>(null);
  const loopTimerRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const flightStateRef = useRef<{
    finalCrashPoint: number;
    won: boolean;
    cashedOut: boolean;
    betAmount: number;
    multiplier: number;
    payout: number;
    startTime: number;
    autoEnabled: boolean;
    autoTarget: number;
  }>({
    finalCrashPoint: 2.0,
    won: false,
    cashedOut: false,
    betAmount: 10,
    multiplier: 0,
    payout: 0,
    startTime: 0,
    autoEnabled: false,
    autoTarget: 2.0,
  });

  // ============================================================================
  // Procedural Web Audio Aviation Sound Engine (Zero Asset Latency)
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

  const playTakeoffSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 1.2);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.2);
    } catch {}
  }, [getAudioContext]);

  const playCashoutSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Victorious ascending chord: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const delay = idx * 0.07;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + delay);

        gain.gain.setValueAtTime(0.18, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.005, now + delay + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.45);
      });
    } catch {}
  }, [getAudioContext]);

  const playCrashSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }, [getAudioContext]);

  // Clean up Web Audio on unmount
  useEffect(() => {
    return () => {
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  // ============================================================================
  // Autonomous Continuous Flight Engine (Guaranteed 100% Uptime in all modes)
  // ============================================================================
  const runAutonomousBettingPhaseRef = useRef<() => void>(() => {});
  const runAutonomousFlightPhaseRef = useRef<() => void>(() => {});

  const generateCrashPoint = (): number => {
    const r = Math.random();
    if (r < 0.03) return 1.00; // 3% instant crash at 1.00x
    const mult = 0.99 / (1 - r);
    return Math.min(100.0, Math.max(1.01, Math.floor(mult * 100) / 100));
  };

  /**
   * Cash Out Action - Immediate, deterministic payout settlement
   */
  const manualCashout = useCallback(() => {
    if (!isFlyingRef.current || isCrashedRef.current || isCashedOutRef.current || cashedOutThisRoundRef.current) {
      return;
    }

    cashedOutThisRoundRef.current = true;
    flightStateRef.current.cashedOut = true;
    setIsCashedOut(true);
    isCashedOutRef.current = true;

    const mult = Math.max(1.0, currentMultiplierRef.current || 1.0);
    const activeStake = flightStateRef.current.betAmount || betAmountRef.current || 10;
    const payout = Math.floor(activeStake * mult);

    playCashoutSound();

    // 1. Immediately credit wallet
    const currentBal = useWalletStore.getState().balance;
    useWalletStore.getState().updateBalance(currentBal + payout);

    // 2. Set confirmed victorious last result
    setLastResult({
      game: 'crash',
      crashPoint: flightStateRef.current.finalCrashPoint || mult,
      multiplier: mult,
      won: true,
      payout,
      betAmount: activeStake,
      createdAt: new Date().toISOString(),
    });

    // 3. Dispatch to server socket if connected
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('CRASH_MANUAL_CASHOUT');
    }

    // 4. If logged in, record win with API ledger in background
    if (localStorage.getItem('nova_token')) {
      api.post('/games/play/crash', {
        amount: activeStake,
        params: {
          cashedOutMultiplier: mult,
        },
      }).catch(() => {});
    }
  }, [playCashoutSound]);

  const manualCashoutRef = useRef<() => void>(manualCashout);
  useEffect(() => {
    manualCashoutRef.current = manualCashout;
  }, [manualCashout]);

  /**
   * Run Autonomous Flight Phase
   */
  const runAutonomousFlightPhase = useCallback(() => {
    // If live server socket packets are driving, let socket handle it
    const isSocketDriving = isSocketConnectedRef.current && (Date.now() - lastSocketPacketTimeRef.current < 2500);
    if (isSocketDriving) return;

    setIsBetting(false);
    setIsFlying(true);
    isFlyingRef.current = true;
    setIsCrashed(false);
    isCrashedRef.current = false;
    setIsCashedOut(false);
    isCashedOutRef.current = false;
    cashedOutThisRoundRef.current = false;
    setCurrentMultiplier(1.0);
    currentMultiplierRef.current = 1.0;

    playTakeoffSound();

    const finalCrashPoint = generateCrashPoint();
    const hasBet = hasPlacedBetRef.current;
    const activeStake = hasBet ? betAmountRef.current : 0;
    const startTime = performance.now();

    flightStateRef.current = {
      finalCrashPoint,
      won: false,
      cashedOut: false,
      betAmount: activeStake,
      multiplier: 0,
      payout: 0,
      startTime,
      autoEnabled: autoCashoutEnabledRef.current,
      autoTarget: autoCashoutRef.current,
    };

    const animateFlight = (now: number) => {
      // If socket took over, stop local RAF
      if (isSocketConnectedRef.current && (Date.now() - lastSocketPacketTimeRef.current < 2500)) {
        return;
      }

      const elapsedSec = (now - startTime) / 1000;
      const calculatedMult = Math.exp(CRASH_GROWTH_K * elapsedSec);
      const currentVal = Math.floor(calculatedMult * 100) / 100;

      // Auto Cash-Out Check
      if (
        hasPlacedBetRef.current &&
        !flightStateRef.current.cashedOut &&
        flightStateRef.current.autoEnabled &&
        currentVal >= flightStateRef.current.autoTarget &&
        flightStateRef.current.autoTarget <= finalCrashPoint
      ) {
        manualCashoutRef.current();
      }

      if (currentVal >= finalCrashPoint) {
        // Multiplier freezes at crash point
        setCurrentMultiplier(finalCrashPoint);
        currentMultiplierRef.current = finalCrashPoint;
        setIsFlying(false);
        isFlyingRef.current = false;
        setIsCrashed(true);
        isCrashedRef.current = true;

        playCrashSound();

        // Evaluate bet outcome
        if (hasPlacedBetRef.current) {
          if (!cashedOutThisRoundRef.current) {
            // Bet lost
            setLastResult({
              game: 'crash',
              crashPoint: finalCrashPoint,
              multiplier: 0,
              won: false,
              payout: 0,
              betAmount: activeStake,
              createdAt: new Date().toISOString(),
            });

            // If logged in, record loss with API ledger
            if (localStorage.getItem('nova_token') && activeStake > 0) {
              api.post('/games/play/crash', {
                amount: activeStake,
                params: {
                  cashedOutMultiplier: 0,
                },
              }).catch(() => {});
            }
          } else {
            // Player cashed out before crash -> update crash point
            setLastResult((prev) =>
              prev ? { ...prev, crashPoint: finalCrashPoint } : null
            );
          }
        }

        setHistory((prev) => [finalCrashPoint, ...prev.slice(0, 9)]);

        // Cooldown for 3 seconds, then start next betting countdown
        if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
        loopTimerRef.current = setTimeout(() => {
          runAutonomousBettingPhaseRef.current();
        }, 3000);
      } else {
        setCurrentMultiplier(currentVal);
        currentMultiplierRef.current = currentVal;
        animationFrameRef.current = requestAnimationFrame(animateFlight);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animateFlight);
  }, [playTakeoffSound, playCrashSound]);

  /**
   * Run Autonomous Betting Phase
   */
  const runAutonomousBettingPhase = useCallback(() => {
    const isSocketDriving = isSocketConnectedRef.current && (Date.now() - lastSocketPacketTimeRef.current < 2500);
    if (isSocketDriving) return;

    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setIsBetting(true);
    setIsFlying(false);
    isFlyingRef.current = false;
    setIsCrashed(false);
    isCrashedRef.current = false;
    setIsCashedOut(false);
    isCashedOutRef.current = false;
    cashedOutThisRoundRef.current = false;
    setCurrentMultiplier(1.0);
    currentMultiplierRef.current = 1.0;

    // Check if player had queued a bet during previous flight
    if (queuedNextRoundRef.current) {
      setQueuedNextRound(false);
      queuedNextRoundRef.current = false;
      setHasPlacedBet(true);
      hasPlacedBetRef.current = true;
    } else {
      setHasPlacedBet(false);
      hasPlacedBetRef.current = false;
    }

    let count = 5;
    setCountdown(count);

    countdownIntervalRef.current = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(countdownIntervalRef.current);
        runAutonomousFlightPhaseRef.current();
      }
    }, 1000);
  }, []);

  useEffect(() => {
    runAutonomousFlightPhaseRef.current = runAutonomousFlightPhase;
    runAutonomousBettingPhaseRef.current = runAutonomousBettingPhase;
  }, [runAutonomousFlightPhase, runAutonomousBettingPhase]);

  // Start autonomous loop immediately on mount if no server socket is active
  useEffect(() => {
    const initTimer = setTimeout(() => {
      if (!isSocketConnectedRef.current || (Date.now() - lastSocketPacketTimeRef.current > 3000)) {
        runAutonomousBettingPhase();
      }
    }, 800);

    return () => {
      clearTimeout(initTimer);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
    };
  }, [runAutonomousBettingPhase]);

  /**
   * Place Bet Action (Works pre-flight and in-flight for next flight)
   */
  const placeBet = () => {
    const currentBal = useWalletStore.getState().balance;
    if (betAmountRef.current > currentBal) {
      setError('Insufficient balance in wallet');
      return;
    }

    const effectiveUserId = user?.id || 'demo-guest';
    const effectiveUsername = user?.username || 'Player';

    // If currently flying, queue bet for next flight
    if (isFlyingRef.current) {
      if (queuedNextRoundRef.current) return;
      setError(null);
      useWalletStore.getState().updateBalance(currentBal - betAmountRef.current);
      setQueuedNextRound(true);
      queuedNextRoundRef.current = true;

      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('CRASH_QUEUE_BET', {
          userId: effectiveUserId,
          username: effectiveUsername,
          amount: betAmountRef.current,
          autoCashoutMultiplier: autoCashoutEnabledRef.current ? autoCashoutRef.current : undefined,
        });
      }
      return;
    }

    if (hasPlacedBetRef.current) return;

    setError(null);
    useWalletStore.getState().updateBalance(currentBal - betAmountRef.current);

    setHasPlacedBet(true);
    hasPlacedBetRef.current = true;
    setIsCashedOut(false);
    isCashedOutRef.current = false;
    cashedOutThisRoundRef.current = false;
    flightStateRef.current.cashedOut = false;
    flightStateRef.current.betAmount = betAmountRef.current;
    setLastResult(null);

    // If socket connected to live server, emit bet
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('CRASH_PLACE_BET', {
        userId: effectiveUserId,
        username: effectiveUsername,
        amount: betAmountRef.current,
        autoCashoutMultiplier: autoCashoutEnabledRef.current ? autoCashoutRef.current : undefined,
      });
    }
  };

  /**
   * Cancel Bet Action (Before takeoff)
   */
  const cancelBet = () => {
    if (isFlyingRef.current) {
      if (queuedNextRoundRef.current) {
        setQueuedNextRound(false);
        queuedNextRoundRef.current = false;
        const currentBal = useWalletStore.getState().balance;
        useWalletStore.getState().updateBalance(currentBal + betAmountRef.current);
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('CRASH_CANCEL_BET');
        }
      }
      return;
    }

    if (hasPlacedBetRef.current) {
      setHasPlacedBet(false);
      hasPlacedBetRef.current = false;
      const currentBal = useWalletStore.getState().balance;
      useWalletStore.getState().updateBalance(currentBal + betAmountRef.current);
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('CRASH_CANCEL_BET');
      }
    }
  };

  /**
   * Synchronize WebSocket listeners cleanly on component mount
   */
  useEffect(() => {
    try {
      const socket = getGameSocket();
      socketRef.current = socket;

      if (socket.connected) {
        isSocketConnectedRef.current = true;
      }

      socket.on('connect', () => {
        isSocketConnectedRef.current = true;
      });

      socket.on('disconnect', () => {
        isSocketConnectedRef.current = false;
        // Resume autonomous loop seamlessly if disconnected
        runAutonomousBettingPhaseRef.current();
      });

      const handleState = (data: any) => {
        if (!data) return;
        lastSocketPacketTimeRef.current = Date.now();
        isSocketConnectedRef.current = true;

        if (data.history && Array.isArray(data.history)) {
          setHistory(data.history);
        }
        if (data.countdown !== undefined) {
          setCountdown(data.countdown);
        }
        if (data.currentMultiplier !== undefined) {
          setCurrentMultiplier(data.currentMultiplier);
          currentMultiplierRef.current = data.currentMultiplier;
        }

        // Initialize current round
        if (currentRoundIdRef.current === null && data.roundId !== undefined) {
          currentRoundIdRef.current = data.roundId;
        } else if (data.roundId !== undefined && data.roundId !== currentRoundIdRef.current) {
          currentRoundIdRef.current = data.roundId;
          if (!isFlyingRef.current) {
            setIsCashedOut(false);
            isCashedOutRef.current = false;
            cashedOutThisRoundRef.current = false;
            flightStateRef.current.cashedOut = false;

            if (queuedNextRoundRef.current) {
              setQueuedNextRound(false);
              queuedNextRoundRef.current = false;
              setHasPlacedBet(true);
              hasPlacedBetRef.current = true;
              if (socket.connected) {
                socket.emit('CRASH_PLACE_BET', {
                  userId: user?.id || 'demo-guest',
                  username: user?.username || 'Player',
                  amount: betAmountRef.current,
                  autoCashoutMultiplier: autoCashoutEnabledRef.current ? autoCashoutRef.current : undefined,
                });
              }
            } else {
              setHasPlacedBet(false);
              hasPlacedBetRef.current = false;
            }
          }
        }

        if (data.state === 'BETTING') {
          setIsBetting(true);
          setIsFlying(false);
          isFlyingRef.current = false;
          setIsCrashed(false);
          isCrashedRef.current = false;
        } else if (data.state === 'FLYING') {
          setIsBetting(false);
          setIsFlying(true);
          isFlyingRef.current = true;
          setIsCrashed(false);
          isCrashedRef.current = false;
        } else if (data.state === 'CRASHED') {
          setIsBetting(false);
          setIsFlying(false);
          isFlyingRef.current = false;
          setIsCrashed(true);
          isCrashedRef.current = true;

          const crashMult = data.currentMultiplier || currentMultiplierRef.current;
          setCurrentMultiplier(crashMult);
          currentMultiplierRef.current = crashMult;
          flightStateRef.current.finalCrashPoint = crashMult;

          if (hasPlacedBetRef.current && !cashedOutThisRoundRef.current) {
            setLastResult({
              game: 'crash',
              crashPoint: crashMult,
              multiplier: 0,
              won: false,
              payout: 0,
              betAmount: betAmountRef.current,
              createdAt: new Date().toISOString(),
            });
          } else if (cashedOutThisRoundRef.current) {
            setLastResult((prev) =>
              prev ? { ...prev, crashPoint: crashMult } : null
            );
          }
        } else if (data.state === 'PAUSED') {
          setIsBetting(false);
          setIsFlying(false);
          isFlyingRef.current = false;
          setIsCrashed(false);
          isCrashedRef.current = false;
          setHasPlacedBet(false);
          hasPlacedBetRef.current = false;
          setError(data.pauseReason || 'Game temporarily paused for maintenance.');
        }
      };

      const handleTick = (data: any) => {
        if (!data || data.multiplier === undefined) return;
        lastSocketPacketTimeRef.current = Date.now();
        isSocketConnectedRef.current = true;

        setCurrentMultiplier(data.multiplier);
        currentMultiplierRef.current = data.multiplier;

        // Auto cashout trigger in socket mode
        if (
          hasPlacedBetRef.current &&
          !cashedOutThisRoundRef.current &&
          autoCashoutEnabledRef.current &&
          data.multiplier >= autoCashoutRef.current
        ) {
          manualCashoutRef.current();
        }
      };

      const handleCashoutSuccess = (data: any) => {
        if (!data || !data.payout) return;

        playCashoutSound();
        setIsCashedOut(true);
        isCashedOutRef.current = true;
        flightStateRef.current.cashedOut = true;

        if (!cashedOutThisRoundRef.current) {
          cashedOutThisRoundRef.current = true;
          const currentBal = useWalletStore.getState().balance;
          useWalletStore.getState().updateBalance(currentBal + data.payout);
        }

        setLastResult((prev) => ({
          game: 'crash',
          crashPoint: prev?.crashPoint || currentMultiplierRef.current,
          multiplier: data.multiplier || prev?.multiplier || currentMultiplierRef.current,
          won: true,
          payout: data.payout,
          betAmount: betAmountRef.current,
          createdAt: new Date().toISOString(),
        }));
      };

      const handleBetError = (data: any) => {
        setError(data?.message || 'Bet placement error');
        // Restore bet state and balance if rejected by server
        if (hasPlacedBetRef.current) {
          setHasPlacedBet(false);
          hasPlacedBetRef.current = false;
          const currentBal = useWalletStore.getState().balance;
          useWalletStore.getState().updateBalance(currentBal + betAmountRef.current);
        }
      };

      const handleRoundRefunded = (data: any) => {
        setHasPlacedBet(false);
        hasPlacedBetRef.current = false;
        setIsFlying(false);
        isFlyingRef.current = false;
        if (data && data.amount) {
          const currentBal = useWalletStore.getState().balance;
          useWalletStore.getState().updateBalance(currentBal + data.amount);
        }
        setError(data.reason || 'Round was halted for maintenance. Your bet was 100% refunded.');
      };

      socket.on('CRASH_STATE', handleState);
      socket.on('CRASH_TICK', handleTick);
      socket.on('CRASH_CASHOUT_SUCCESS', handleCashoutSuccess);
      socket.on('CRASH_BET_ERROR', handleBetError);
      socket.on('CRASH_ROUND_REFUNDED', handleRoundRefunded);

      return () => {
        socket.off('CRASH_STATE', handleState);
        socket.off('CRASH_TICK', handleTick);
        socket.off('CRASH_CASHOUT_SUCCESS', handleCashoutSuccess);
        socket.off('CRASH_BET_ERROR', handleBetError);
        socket.off('CRASH_ROUND_REFUNDED', handleRoundRefunded);
      };
    } catch {
      return () => {};
    }
  }, [playCashoutSound, user]);

  return {
    betAmount,
    setBetAmount,
    autoCashoutEnabled,
    setAutoCashoutEnabled,
    autoCashout,
    setAutoCashout,
    currentMultiplier,
    isFlying,
    isCrashed,
    isCashedOut,
    isBetting,
    countdown,
    hasPlacedBet,
    queuedNextRound,
    lastResult,
    history,
    error,
    balance,
    launch: runAutonomousFlightPhase,
    placeBet,
    manualCashout,
    cancelBet,
  };
}
