import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useWalletStore } from '../../../stores/walletStore';
import { RouletteEngine, POCKET_MAP } from '@nova/game-roulette';
import { AfricanRouletteSelection } from '../components/BetTypeSelector';

export interface RouletteResultData {
  game: string;
  selection: AfricanRouletteSelection;
  number: number;
  color: 'RED' | 'BLACK' | 'GREEN';
  won: boolean;
  payout: number;
  multiplier: number;
  betAmount: number;
  createdAt: string;
}

export function useRoulette() {
  const [selection, setSelection] = useState<AfricanRouletteSelection>('RED');
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<RouletteResultData | null>(null);
  const [history, setHistory] = useState<{ number: number; color: 'RED' | 'BLACK' | 'GREEN' }[]>([
    { number: 7, color: 'RED' },
    { number: 12, color: 'BLACK' },
    { number: 0, color: 'GREEN' },
    { number: 3, color: 'RED' },
  ]);
  const [error, setError] = useState<string | null>(null);

  const { balance, updateBalance, fetchWallet } = useWalletStore();
  const rouletteEngine = new RouletteEngine(7.69);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

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
        const pocket = d.outcome?.number !== undefined ? d.outcome.number : 0;
        const color = POCKET_MAP[pocket]?.color || 'GREEN';

        resultData = {
          game: 'roulette',
          selection,
          number: pocket,
          color,
          won: d.won,
          payout: d.payout,
          multiplier: d.multiplier,
          betAmount,
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
        // Fallback local engine evaluation mode
        const evalRes = rouletteEngine.evaluate({
          amount: betAmount,
          serverSeed: 'demo-server-seed',
          clientSeed: 'demo-client-seed',
          nonce: Date.now() % 1000,
          params: { selection },
        });

        const newBal = evalRes.won ? balance + (evalRes.payout - betAmount) : balance - betAmount;

        resultData = {
          game: 'roulette',
          selection,
          number: evalRes.outcome.number,
          color: evalRes.outcome.color,
          won: evalRes.won,
          payout: evalRes.payout,
          multiplier: evalRes.multiplier,
          betAmount,
          createdAt: new Date().toISOString(),
        };
        updateBalance(newBal);
      }

      // Ensure 1.4s spin animation for visual satisfaction
      const elapsedTime = Date.now() - startTime;
      const remainingSpin = Math.max(0, 1400 - elapsedTime);

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
