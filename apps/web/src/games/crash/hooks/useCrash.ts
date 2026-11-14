import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../../../services/api';
import { getGameSocket } from '../../../services/socket';
import { useWalletStore } from '../../../stores/walletStore';
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

// Multiplier growth exponential constant k
export const CRASH_GROWTH_K = 0.065;

export function useCrash() {
  const [betAmount, setBetAmount] = useState<number>(10);
  const [autoCashoutEnabled, setAutoCashoutEnabled] = useState<boolean>(false);
  const [autoCashout, setAutoCashout] = useState<number>(2.0);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [isFlying, setIsFlying] = useState<boolean>(false);
  const [isCrashed, setIsCrashed] = useState<boolean>(false);
  const [isCashedOut, setIsCashedOut] = useState<boolean>(false);
  const [isBetting, setIsBetting] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [hasPlacedBet, setHasPlacedBet] = useState<boolean>(false);
  const [queuedNextRound, setQueuedNextRound] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<CrashResultData | null>(null);
  const [history, setHistory] = useState<number[]>([2.45, 1.88, 12.30, 1.15, 4.20, 1.95, 8.50]);
  const [error, setError] = useState<string | null>(null);

  const { balance, fetchWallet } = useWalletStore();

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

  // Track socket server round to prevent wiping bet on every countdown second
  const currentRoundIdRef = useRef<number | null>(null);
  const isSocketConnectedRef = useRef<boolean>(false);

  const animationFrameRef = useRef<number | null>(null);
  const nextRoundTimerRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(null);

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

  const launchRef = useRef<() => void>(() => {});
  const manualCashoutRef = useRef<() => void>(() => {});

  /**
   * Cash Out Action - Immediate, deterministic payout settlement
   */
  const manualCashout = useCallback(() => {
    // Only valid while flying, not already cashed out, and not crashed
    if (!isFlyingRef.current || isCrashedRef.current || isCashedOutRef.current || cashedOutThisRoundRef.current) {
      return;
    }

    // 1. Instantly transition UI to cashed out state
    cashedOutThisRoundRef.current = true;
    flightStateRef.current.cashedOut = true;
    setIsCashedOut(true);
    isCashedOutRef.current = true;

    const mult = Math.max(1.0, currentMultiplierRef.current || 1.0);
    const activeStake = flightStateRef.current.betAmount || betAmountRef.current || 10;
    const payout = Math.floor(activeStake * mult);

    // 2. Exactly-once wallet credit (bet was debited when placed)
    const currentBal = useWalletStore.getState().balance;
    useWalletStore.getState().updateBalance(currentBal + payout);

    // 3. Set confirmed victorious last result
    setLastResult({
      game: 'crash',
      crashPoint: flightStateRef.current.finalCrashPoint || mult,
      multiplier: mult,
      won: true,
      payout,
      betAmount: activeStake,
      createdAt: new Date().toISOString(),
    });

    // 4. Dispatch cashout to server socket if connected
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('CRASH_MANUAL_CASHOUT');
    }
  }, []);

  useEffect(() => {
    manualCashoutRef.current = manualCashout;
  }, [manualCashout]);

  /**
   * Standalone Flight Engine (Smooth, deterministic flight with live physics)
   */
  const launch = useCallback(async () => {
    if (isFlyingRef.current) return;

    setError(null);
    setIsFlying(true);
    isFlyingRef.current = true;
    setIsBetting(false);
    setIsCrashed(false);
    isCrashedRef.current = false;
    setIsCashedOut(false);
    isCashedOutRef.current = false;
    cashedOutThisRoundRef.current = false;
    flightStateRef.current.cashedOut = false;
    setCurrentMultiplier(1.0);
    currentMultiplierRef.current = 1.0;

    let finalCrashPoint = 2.45;
    let wonData = false;
    let multiplierData = 0;
    let payoutData = 0;

    const hasBet = hasPlacedBetRef.current || queuedNextRoundRef.current;
    if (hasBet) {
      setHasPlacedBet(true);
      hasPlacedBetRef.current = true;
      setQueuedNextRound(false);
      queuedNextRoundRef.current = false;
    }

    if (hasBet) {
      try {
        const res = await api.post('/games/play/crash', {
          amount: betAmountRef.current,
          params: {
            autoCashoutEnabled: autoCashoutEnabledRef.current,
            autoCashoutMultiplier: autoCashoutRef.current,
          },
        });
        const d = res.data.data;
        finalCrashPoint = d.outcome?.crashPoint || 2.45;
        wonData = d.won;
        multiplierData = d.multiplier;
        payoutData = d.payout;
      } catch {
        const r = Math.random();
        finalCrashPoint = Math.max(1.00, Math.floor((0.99 / (1 - r)) * 100) / 100);
        const isAutoWin = autoCashoutEnabledRef.current && autoCashoutRef.current <= finalCrashPoint;
        wonData = isAutoWin;
        multiplierData = wonData ? autoCashoutRef.current : 0;
        payoutData = wonData ? Math.floor(betAmountRef.current * autoCashoutRef.current) : 0;
      }
    } else {
      const r = Math.random();
      finalCrashPoint = Math.max(1.00, Math.floor((0.99 / (1 - r)) * 100) / 100);
    }

    const startTime = performance.now();
    flightStateRef.current = {
      finalCrashPoint,
      won: wonData,
      cashedOut: false,
      betAmount: hasBet ? betAmountRef.current : 0,
      multiplier: multiplierData,
      payout: payoutData,
      startTime,
      autoEnabled: autoCashoutEnabledRef.current,
      autoTarget: autoCashoutRef.current,
    };

    const animateFlight = (now: number) => {
      // If server socket has taken over flight, abort local animation
      if (isSocketConnectedRef.current && socketRef.current?.connected) {
        return;
      }

      const elapsedSec = (now - startTime) / 1000;
      // Exponential flight curve M(t) = e^(k * t)
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
        // Multiplier freezes at crash value and triggers plane explosion
        setCurrentMultiplier(finalCrashPoint);
        currentMultiplierRef.current = finalCrashPoint;
        setIsFlying(false);
        isFlyingRef.current = false;
        setIsCrashed(true);
        isCrashedRef.current = true;

        // Sequence Step 4: Show player's result (WON, CASHED OUT or LOST)
        if (!cashedOutThisRoundRef.current) {
          // Player did not cash out before plane crashed -> BET LOST
          if (hasPlacedBetRef.current && flightStateRef.current.betAmount > 0) {
            setLastResult({
              game: 'crash',
              crashPoint: finalCrashPoint,
              multiplier: 0,
              won: false,
              payout: 0,
              betAmount: betAmountRef.current,
              createdAt: new Date().toISOString(),
            });
          }
        } else {
          // Player cashed out before crash -> Update final crashPoint for display while preserving confirmed payout
          setLastResult((prev) =>
            prev
              ? { ...prev, crashPoint: finalCrashPoint }
              : {
                  game: 'crash',
                  crashPoint: finalCrashPoint,
                  multiplier: flightStateRef.current.multiplier,
                  won: true,
                  payout: flightStateRef.current.payout,
                  betAmount: betAmountRef.current,
                  createdAt: new Date().toISOString(),
                }
          );
        }

        setHistory((prev) => [finalCrashPoint, ...prev.slice(0, 7)]);

        // Sequence Step 5: After showing PLANE CRASHED! and player result for 2.8s, prepare for next round
        if (nextRoundTimerRef.current) clearTimeout(nextRoundTimerRef.current);
        nextRoundTimerRef.current = setTimeout(() => {
          setIsCrashed(false);
          isCrashedRef.current = false;
          setIsCashedOut(false);
          isCashedOutRef.current = false;
          cashedOutThisRoundRef.current = false;
          flightStateRef.current.cashedOut = false;
          setCurrentMultiplier(1.0);
          currentMultiplierRef.current = 1.0;

          // If player queued a bet for next round, start countdown and takeoff!
          if (queuedNextRoundRef.current) {
            setIsBetting(true);
            setHasPlacedBet(true);
            hasPlacedBetRef.current = true;
            setQueuedNextRound(false);
            queuedNextRoundRef.current = false;
            setCountdown(3);

            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = setInterval(() => {
              setCountdown((prev) => {
                if (prev <= 1) {
                  clearInterval(countdownIntervalRef.current);
                  launchRef.current();
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
          } else {
            // Idle on runway ready for player's next bet!
            setHasPlacedBet(false);
            hasPlacedBetRef.current = false;
            setIsBetting(false);
            setCountdown(0);
          }
        }, 2800);
      } else {
        setCurrentMultiplier(currentVal);
        currentMultiplierRef.current = currentVal;
        animationFrameRef.current = requestAnimationFrame(animateFlight);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animateFlight);
  }, []);

  useEffect(() => {
    launchRef.current = launch;
  }, [launch]);

  /**
   * Place Bet Action (Works both pre-flight and in-flight for next flight)
   */
  const placeBet = () => {
    const currentBal = useWalletStore.getState().balance;
    if (betAmountRef.current > currentBal) {
      setError('Insufficient balance in wallet');
      return;
    }

    // If currently flying, queue bet for next flight
    if (isFlyingRef.current) {
      if (queuedNextRoundRef.current) return;
      setError(null);
      useWalletStore.getState().updateBalance(currentBal - betAmountRef.current);
      setQueuedNextRound(true);
      queuedNextRoundRef.current = true;

      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('CRASH_QUEUE_BET', {
          userId: 'demo-guest',
          username: 'Player',
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
        userId: 'demo-guest',
        username: 'Player',
        amount: betAmountRef.current,
        autoCashoutMultiplier: autoCashoutEnabledRef.current ? autoCashoutRef.current : undefined,
      });
      return;
    }

    // Standalone mode: Start countdown (3s) and then launch plane
    setIsBetting(true);
    setCountdown(3);

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          launchRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
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
      }
      return;
    }

    if (hasPlacedBetRef.current) {
      setHasPlacedBet(false);
      hasPlacedBetRef.current = false;
      setIsBetting(false);
      setCountdown(0);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      const currentBal = useWalletStore.getState().balance;
      useWalletStore.getState().updateBalance(currentBal + betAmountRef.current);
    }
  };

  // Synchronize WebSocket listeners cleanly on component mount (runs strictly once)
  useEffect(() => {
    try {
      const socket = getGameSocket();
      socketRef.current = socket;

      socket.on('connect', () => {
        isSocketConnectedRef.current = true;
        // Stop local standalone timers so server drives authoritative loop
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        if (nextRoundTimerRef.current) clearTimeout(nextRoundTimerRef.current);
      });

      socket.on('disconnect', () => {
        isSocketConnectedRef.current = false;
      });

      const handleState = (data: any) => {
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

        // Initialize current round on first packet without resetting any placed bet
        if (currentRoundIdRef.current === null && data.roundId !== undefined) {
          currentRoundIdRef.current = data.roundId;
        } else if (data.roundId !== undefined && data.roundId !== currentRoundIdRef.current) {
          // Genuinely new round initiated from server
          currentRoundIdRef.current = data.roundId;
          // Never clear bet if currently in-flight
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
                  userId: 'demo-guest',
                  username: 'Player',
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

          // If player placed bet but didn't cash out -> BET LOST
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
            // Cash-out already succeeded -> update final crashPoint display while keeping win 100% intact
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
          setError(data.pauseReason || 'Game temporarily paused for maintenance. Any active bets refunded.');
        }
      };

      const handleTick = (data: any) => {
        if (data.multiplier) {
          setCurrentMultiplier(data.multiplier);
          currentMultiplierRef.current = data.multiplier;

          // Client-side auto cashout trigger
          if (
            hasPlacedBetRef.current &&
            !cashedOutThisRoundRef.current &&
            autoCashoutEnabledRef.current &&
            data.multiplier >= autoCashoutRef.current
          ) {
            manualCashoutRef.current();
          }
        }
      };

      const handleCashoutSuccess = (data: any) => {
        if (!data || !data.payout) return;

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
      socket.on('CRASH_ROUND_REFUNDED', handleRoundRefunded);

      return () => {
        socket.off('CRASH_STATE', handleState);
        socket.off('CRASH_TICK', handleTick);
        socket.off('CRASH_CASHOUT_SUCCESS', handleCashoutSuccess);
        socket.off('CRASH_ROUND_REFUNDED', handleRoundRefunded);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
        if (nextRoundTimerRef.current) {
          clearTimeout(nextRoundTimerRef.current);
        }
      };
    } catch {
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, []);

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
    launch,
    placeBet,
    manualCashout,
    cancelBet,
  };
}
