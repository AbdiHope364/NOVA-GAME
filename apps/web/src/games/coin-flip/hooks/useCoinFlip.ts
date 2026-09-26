import { useState } from 'react';
import { api } from '../../../services/api';
import { useWalletStore } from '../../../stores/walletStore';

export interface FlipResultData {
  game: string;
  choice: 'HEADS' | 'TAILS';
  result: 'HEADS' | 'TAILS';
  won: boolean;
  payout: number;
  multiplier: number;
  betAmount: number;
  createdAt: string;
}

export function useCoinFlip() {
  const [choice, setChoice] = useState<'HEADS' | 'TAILS'>('HEADS');
  const [betAmount, setBetAmount] = useState<number>(100);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<FlipResultData | null>(null);
  const [history, setHistory] = useState<FlipResultData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { balance, updateBalance } = useWalletStore();

  const play = async () => {
    if (betAmount > balance) {
      setError('Insufficient balance in wallet');
      return;
    }
    setError(null);
    setIsFlipping(true);
    setLastResult(null);

    const startTime = Date.now();

    try {
      let resultData: FlipResultData;

      try {
        const res = await api.post('/games/play/coin-flip', {
          amount: betAmount,
          params: { choice },
        });
        const d = res.data.data;
        resultData = {
          game: 'coin-flip',
          choice: d.outcome?.choice || choice,
          result: d.outcome?.result || choice,
          won: d.won,
          payout: d.payout,
          multiplier: d.multiplier,
          betAmount,
          createdAt: new Date().toISOString(),
        };
        updateBalance(d.newBalance);
      } catch (err: any) {
        // Fallback demo evaluation mode if offline / local standalone
        const randomFloat = Math.random();
        const rolledResult: 'HEADS' | 'TAILS' = randomFloat < 0.5 ? 'HEADS' : 'TAILS';
        const won = rolledResult === choice;
        const payout = won ? Math.floor(betAmount * 1.96) : 0;
        const newBal = won ? balance + (payout - betAmount) : balance - betAmount;

        resultData = {
          game: 'coin-flip',
          choice,
          result: rolledResult,
          won,
          payout,
          multiplier: won ? 1.96 : 0,
          betAmount,
          createdAt: new Date().toISOString(),
        };
        updateBalance(newBal);
      }

      // Ensure full 1.2s spin animation for visual satisfaction
      const elapsedTime = Date.now() - startTime;
      const remainingSpin = Math.max(0, 1200 - elapsedTime);

      setTimeout(() => {
        setIsFlipping(false);
        setLastResult(resultData);
        setHistory((prev) => [resultData, ...prev.slice(0, 9)]);
      }, remainingSpin);

    } catch (err: any) {
      setIsFlipping(false);
      setError('Failed to flip coin. Please try again.');
    }
  };

  return {
    choice,
    setChoice,
    betAmount,
    setBetAmount,
    isFlipping,
    lastResult,
    history,
    error,
    balance,
    play,
  };
}
