import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../../../services/api';
import { useWalletStore } from '../../../stores/walletStore';
import { BingoCardData, BingoPattern, BingoRoomData, NovaRoundConfig, CartellaRoundConfig } from '@nova/types';
import { BingoCardGenerator } from '@nova/game-bingo';

export function useBingo() {
  const [roundConfig, setRoundConfig] = useState<NovaRoundConfig>({
    roundId: 'NOVA-1024',
    stake: 50,
    prize: 350,
    adminFee: 150,
    maxSlots: 10,
    activePlayers: 10,
    pattern: 'FULL_HOUSE',
    patternName: 'Full House',
    patternDescription: 'Get all numbers in the card!',
    status: 'ON_GOING',
    nextNumberCountdown: 45,
    gameName: 'NovaGame',
  });

  const [countdown, setCountdown] = useState<number>(45);

  const [room, setRoom] = useState<BingoRoomData>({
    id: 'NOVA-1024',
    name: 'NovaGame Live Bingo #1024',
    entryFee: 50,
    prizePool: 350,
    playersCount: 10,
    pattern: 'FULL_HOUSE',
    status: 'STARTING',
    drawnNumbers: [],
  });

  // Card & Marks
  const [card, setCard] = useState<BingoCardData>(() =>
    BingoCardGenerator.generateCard('seed_novagame_1', 'client1', 1)
  );

  const [userMarks, setUserMarks] = useState<boolean[][]>(() => {
    const initial = Array(5)
      .fill(false)
      .map(() => Array(5).fill(false));
    initial[2][2] = true; // FREE center space
    return initial;
  });

  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentBall, setCurrentBall] = useState<{ letter: string; number: number } | null>(null);
  const [drawnHistory, setDrawnHistory] = useState<{ letter: string; number: number }[]>([]);
  const [lastResult, setLastResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { balance, updateBalance, fetchWallet } = useWalletStore();
  const drawTimerRef = useRef<any>(null);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  // Fetch dynamic round configuration from the backend API
  const fetchRoundConfig = useCallback(async () => {
    try {
      const res = await api.get('/games/bingo/round-config');
      if (res.data?.success && res.data?.data) {
        const data = res.data.data as CartellaRoundConfig;
        setRoundConfig(data);
        setRoom((prev) => ({
          ...prev,
          entryFee: data.stake,
          prizePool: data.prize,
          playersCount: data.activePlayers,
          pattern: data.pattern,
        }));
      }
    } catch {
      // Keep existing default Cartella configuration
    }
  }, []);

  useEffect(() => {
    fetchRoundConfig();
    const interval = setInterval(fetchRoundConfig, 8000);
    return () => clearInterval(interval);
  }, [fetchRoundConfig]);

  // Live countdown to next number call
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return roundConfig.nextNumberCountdown || 45;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [roundConfig.nextNumberCountdown]);

  const toggleMarkTile = (r: number, c: number) => {
    if (r === 2 && c === 2) return; // FREE center space is permanent
    setUserMarks((prev) => {
      const copy = prev.map((row) => [...row]);
      copy[r][c] = !copy[r][c];
      return copy;
    });
  };

  const getBallLetter = (num: number) => {
    if (num <= 15) return 'B';
    if (num <= 30) return 'I';
    if (num <= 45) return 'N';
    if (num <= 60) return 'G';
    return 'O';
  };

  const buyTicketAndStart = async () => {
    const ticketPrice = roundConfig.stake;
    if (ticketPrice > balance) {
      setError(`Insufficient balance. Stake is ${ticketPrice} ETB.`);
      return;
    }
    if (isDrawing) return;

    setError(null);
    setLastResult(null);
    setDrawnHistory([]);
    setCurrentBall(null);
    setIsDrawing(true);
    setRoundConfig((prev) => ({ ...prev, status: 'ON_GOING' }));

    // Generate new card
    const newCard = BingoCardGenerator.generateCard(
      'seed_' + Date.now(),
      'client_' + Date.now(),
      Math.floor(Math.random() * 100)
    );
    setCard(newCard);

    // Reset marks with FREE center
    const initialMarks = Array(5)
      .fill(false)
      .map(() => Array(5).fill(false));
    initialMarks[2][2] = true;
    setUserMarks(initialMarks);

    // Deduct stake upfront
    const newBal = balance - ticketPrice;
    updateBalance(newBal);

    try {
      const res = await api.post('/games/play/bingo', {
        amount: ticketPrice,
        params: { claimPattern: roundConfig.pattern },
      });

      const data = res.data.data;
      const outcome = data.outcome;
      const drawnBalls = outcome?.drawnBalls || [];

      let step = 0;
      drawTimerRef.current = setInterval(() => {
        if (step >= drawnBalls.length) {
          clearInterval(drawTimerRef.current);
          setIsDrawing(false);

          const winBal = data.won ? newBal + roundConfig.prize : newBal;
          updateBalance(winBal);

          setLastResult({
            won: data.won,
            multiplier: data.multiplier || (roundConfig.prize / ticketPrice),
            payout: data.won ? roundConfig.prize : 0,
            patternAchieved: outcome?.patternAchieved,
            betAmount: ticketPrice,
          });
        } else {
          const ball = drawnBalls[step];
          setCurrentBall(ball);
          setDrawnHistory((prev) => [ball, ...prev]);

          // Auto-mark matching tiles on the card
          for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
              if (newCard.grid[r][c] === ball.number) {
                setUserMarks((prev) => {
                  const copy = prev.map((row) => [...row]);
                  copy[r][c] = true;
                  return copy;
                });
              }
            }
          }
          step++;
        }
      }, 1100);
    } catch {
      // Resilient fallback offline simulation
      const sampleNumbers = Array.from({ length: 75 }, (_, i) => i + 1)
        .sort(() => Math.random() - 0.5)
        .slice(0, 24);

      let step = 0;
      drawTimerRef.current = setInterval(() => {
        if (step >= sampleNumbers.length) {
          clearInterval(drawTimerRef.current);
          setIsDrawing(false);
          setLastResult({
            won: false,
            multiplier: 0,
            payout: 0,
            betAmount: ticketPrice,
          });
        } else {
          const num = sampleNumbers[step];
          const ball = { letter: getBallLetter(num), number: num };
          setCurrentBall(ball);
          setDrawnHistory((prev) => [ball, ...prev]);

          for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
              if (newCard.grid[r][c] === num) {
                setUserMarks((prev) => {
                  const copy = prev.map((row) => [...row]);
                  copy[r][c] = true;
                  return copy;
                });
              }
            }
          }
          step++;
        }
      }, 1100);
    }
  };

  const claimBingo = () => {
    if (!isDrawing) return;
    setLastResult({
      won: true,
      multiplier: Number((roundConfig.prize / roundConfig.stake).toFixed(1)),
      payout: roundConfig.prize,
      patternAchieved: roundConfig.patternName,
      betAmount: roundConfig.stake,
    });
    updateBalance(balance + roundConfig.prize);
    setIsDrawing(false);
    if (drawTimerRef.current) clearInterval(drawTimerRef.current);
  };

  const setPattern = (newPattern: BingoPattern) => {
    setRoundConfig((prev) => ({
      ...prev,
      pattern: newPattern,
    }));
  };

  useEffect(() => {
    return () => {
      if (drawTimerRef.current) clearInterval(drawTimerRef.current);
    };
  }, []);

  return {
    roundConfig,
    countdown,
    setRoundConfig,
    ticketPrice: roundConfig.stake,
    pattern: roundConfig.pattern,
    setPattern,
    room,
    card,
    userMarks,
    toggleMarkTile,
    isDrawing,
    currentBall,
    drawnHistory,
    lastResult,
    error,
    balance,
    buyTicketAndStart,
    claimBingo,
  };
}
