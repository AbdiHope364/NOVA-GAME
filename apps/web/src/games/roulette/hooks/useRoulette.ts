import { useState } from 'react';
import { api } from '../../../services/api';
import { useWalletStore } from '../../../stores/walletStore';
import { RED_NUMBERS } from '@nova/game-roulette';

export interface RouletteResultData {
  game: string;
  selection: 'RED' | 'BLACK' | 'GREEN' | number;
  number: number;
  color: 'RED' | 'BLACK' | 'GREEN';
  won: boolean;
  payout: number;
  multiplier: number;
  betAmount: number;
  createdAt: string;
}

export function useRoulette() {
  const [selection, setSelection] = useState<'RED' | 'BLACK' | 'GREEN'>('RED');
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<RouletteResultData | null>(null);
  const [history, setHistory] = useState<{ number: number; color: 'RED' | 'BLACK' | 'GREEN' }[]>([
    { number: 18, color: 'RED' },
    { number: 22, color: 'BLACK' },
    { number: 0, color: 'GREEN' },
    { number: 7, color: 'RED' },
  ]);
  const [error, setError] = useState<string | null>(null);

  const { balance, updateBalance } = useWalletStore();

  const play = async () => {
    if (betAmount > balance) {
      setError('Insufficient balance in wallet');
      return;
    }
    setError(null);
    setIsSpinning(true);
    setLastResult(null);

    const startTime = Date.now();

    try {
      let resultData: RouletteResultData;

      try {
        const res = await api.post('/games/play/roulette', {
          amount: betAmount,
          params: { selection },
        });
        const d = res.data.data;
        resultData = {
          game: 'roulette',
          selection,
          number: d.outcome?.number || 18,
          color: d.outcome?.color || 'RED',
          won: d.won,
          payout: d.payout,
          multiplier: d.multiplier,
          betAmount,
          createdAt: new Date().toISOString(),
        };
        updateBalance(d.newBalance);
      } catch {
        // Fallback demo evaluation mode
        const rolledNum = Math.floor(Math.random() * 37);
        const rolledColor: 'RED' | 'BLACK' | 'GREEN' = rolledNum === 0 ? 'GREEN' : RED_NUMBERS.includes(rolledNum) ? 'RED' : 'BLACK';
        const won = selection === rolledColor;
        const rawMult = selection === 'GREEN' ? 36.0 : 2.0;
        const multiplier = won ? Math.floor(rawMult * 0.973 * 100) / 100 : 0;
        const payout = won ? Math.floor(betAmount * multiplier) : 0;
        const newBal = won ? balance + (payout - betAmount) : balance - betAmount;

        resultData = {
          game: 'roulette',
          selection,
          number: rolledNum,
          color: rolledColor,
          won,
          payout,
          multiplier,
          betAmount,
          createdAt: new Date().toISOString(),
        };
        updateBalance(newBal);
      }

      // Ensure full 1.2s spin animation for visual satisfaction
      const elapsedTime = Date.now() - startTime;
      const remainingSpin = Math.max(0, 1200 - elapsedTime);

      setTimeout(() => {
        setIsSpinning(false);
        setLastResult(resultData);
        setHistory((prev) => [{ number: resultData.number, color: resultData.color }, ...prev.slice(0, 7)]);
      }, remainingSpin);

    } catch {
      setIsSpinning(false);
      setError('Failed to spin roulette wheel. Please try again.');
    }
  };

  return {
    selection,
    setSelection,
    betAmount,
    setBetAmount,
    isSpinning,
    lastResult,
    history,
    error,
    balance,
    play,
  };
}
