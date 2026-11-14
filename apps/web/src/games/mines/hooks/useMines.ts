import { useState, useRef, useEffect } from 'react';
import { api } from '../../../services/api';
import { useWalletStore } from '../../../stores/walletStore';
import { MinesEngine } from '@nova/game-mines';
import { MinesParams } from '@nova/types';

export interface MinesResultData {
  game: string;
  mineCount: number;
  revealedTiles: number[];
  minePositions?: number[];
  isBombHit: boolean;
  won: boolean;
  payout: number;
  multiplier: number;
  betAmount: number;
  createdAt: string;
}

export interface LiveStats {
  profit: number;
  wagered: number;
  wins: number;
  losses: number;
}

export function useMines() {
  const [mineCount, setMineCount] = useState<number>(3);
  const [betAmount, setBetAmount] = useState<number>(100);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [revealedTiles, setRevealedTiles] = useState<number[]>([]);
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [hitTile, setHitTile] = useState<number | null>(null);
  const [busted, setBusted] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<MinesResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [roundNonce, setRoundNonce] = useState<number>(() => Math.floor(Math.random() * 100000));
  const [liveStats, setLiveStats] = useState<LiveStats>({
    profit: 0,
    wagered: 0,
    wins: 0,
    losses: 0,
  });

  const { balance, updateBalance, fetchWallet } = useWalletStore();
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const gemsRevealedCount = revealedTiles.length;
  const currentMultiplier =
    gemsRevealedCount === 0 ? 1.0 : MinesEngine.calculateMultiplier(gemsRevealedCount, mineCount);
  const nextMultiplier = MinesEngine.calculateMultiplier(gemsRevealedCount + 1, mineCount);
  const currentPayout = Number((betAmount * currentMultiplier).toFixed(2));

  const playSound = (type: 'gem' | 'bomb' | 'cashout') => {
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

      if (type === 'gem') {
        osc.type = 'sine';
        const pitch = 520 + revealedTiles.length * 45;
        osc.frequency.setValueAtTime(pitch, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(pitch * 1.35, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.16, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      } else if (type === 'bomb') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(38, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.24, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.38);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.38);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(990, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch {
      // ignore audio context errors
    }
  };

  useEffect(() => {
    return () => {
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  const startGame = () => {
    if (betAmount <= 0) {
      setError('Bet amount must be greater than 0 ETB');
      return;
    }
    if (betAmount > balance) {
      setError('Insufficient wallet balance');
      return;
    }
    setError(null);
    setIsPlaying(true);
    setRevealedTiles([]);
    setMinePositions([]);
    setHitTile(null);
    setBusted(false);
    setGameOver(false);
    setLastResult(null);
    setRoundNonce(Math.floor(Math.random() * 1000000));
  };

  const revealTile = async (index: number) => {
    if (!isPlaying || gameOver || revealedTiles.includes(index)) return;

    const nextRevealed = [...revealedTiles, index];
    setRevealedTiles(nextRevealed);

    try {
      let resultData: MinesResultData;

      try {
        const res = await api.post('/games/play/mines', {
          amount: betAmount,
          params: { mineCount, revealedTiles: nextRevealed, action: 'REVEAL', tileIndex: index } as MinesParams,
        });
        const d = res.data.data;
        const isBombHit = d.outcome?.isBombHit || false;
        resultData = {
          game: 'mines',
          mineCount,
          revealedTiles: nextRevealed,
          minePositions: d.outcome?.minePositions,
          isBombHit,
          won: d.won,
          payout: d.payout,
          multiplier: d.multiplier,
          betAmount,
          createdAt: new Date().toISOString(),
        };
        if (d.newBalance !== undefined) {
          updateBalance(d.newBalance);
        }
      } catch {
        const generatedMines = MinesEngine.generateMinePositions(
          'demo-server-seed',
          'demo-client-seed',
          roundNonce,
          mineCount
        );
        const isBombHit = generatedMines.includes(index);
        let won = false;
        let mult = 0;
        let payout = 0;

        if (isBombHit) {
          won = false;
          mult = 0;
          payout = 0;
          setHitTile(index);
          setBusted(true);
          setGameOver(true);
          setIsPlaying(false);
          setMinePositions(generatedMines);
          playSound('bomb');
          const newBal = Math.max(0, balance - betAmount);
          updateBalance(newBal);
          setLiveStats((s) => ({
            profit: Number((s.profit - betAmount).toFixed(2)),
            wagered: Number((s.wagered + betAmount).toFixed(2)),
            wins: s.wins,
            losses: s.losses + 1,
          }));
        } else {
          mult = MinesEngine.calculateMultiplier(nextRevealed.length, mineCount);
          payout = Number((betAmount * mult).toFixed(2));
          playSound('gem');
          if (nextRevealed.length === 25 - mineCount) {
            won = true;
            setGameOver(true);
            setIsPlaying(false);
            setMinePositions(generatedMines);
            playSound('cashout');
            const newBal = balance + (payout - betAmount);
            updateBalance(newBal);
            setLiveStats((s) => ({
              profit: Number((s.profit + (payout - betAmount)).toFixed(2)),
              wagered: Number((s.wagered + betAmount).toFixed(2)),
              wins: s.wins + 1,
              losses: s.losses,
            }));
          }
        }

        resultData = {
          game: 'mines',
          mineCount,
          revealedTiles: nextRevealed,
          minePositions: generatedMines,
          isBombHit,
          won,
          payout,
          multiplier: mult,
          betAmount,
          createdAt: new Date().toISOString(),
        };
      }

      setLastResult(resultData);
      if (resultData.isBombHit) {
        setHitTile(index);
        setBusted(true);
        setGameOver(true);
        setIsPlaying(false);
        if (resultData.minePositions) setMinePositions(resultData.minePositions);
      }
    } catch {
      setError('Failed to reveal tile. Please try again.');
    }
  };

  const pickRandomTile = () => {
    if (!isPlaying || gameOver) return;
    const unrevealed = Array.from({ length: 25 }, (_, i) => i).filter(
      (i) => !revealedTiles.includes(i)
    );
    if (unrevealed.length === 0) return;
    const randomIdx = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    revealTile(randomIdx);
  };

  const cashout = async () => {
    if (!isPlaying || gemsRevealedCount === 0 || gameOver) return;

    try {
      let resultData: MinesResultData;

      try {
        const res = await api.post('/games/play/mines', {
          amount: betAmount,
          params: { mineCount, revealedTiles, action: 'CASHOUT' } as MinesParams,
        });
        const d = res.data.data;
        resultData = {
          game: 'mines',
          mineCount,
          revealedTiles,
          minePositions: d.outcome?.minePositions,
          isBombHit: false,
          won: true,
          payout: d.payout,
          multiplier: d.multiplier,
          betAmount,
          createdAt: new Date().toISOString(),
        };
        if (d.newBalance !== undefined) {
          updateBalance(d.newBalance);
        }
      } catch {
        const generatedMines = MinesEngine.generateMinePositions(
          'demo-server-seed',
          'demo-client-seed',
          roundNonce,
          mineCount
        );
        const mult = MinesEngine.calculateMultiplier(gemsRevealedCount, mineCount);
        const payout = Number((betAmount * mult).toFixed(2));
        const newBal = balance + (payout - betAmount);

        resultData = {
          game: 'mines',
          mineCount,
          revealedTiles,
          minePositions: generatedMines,
          isBombHit: false,
          won: true,
          payout,
          multiplier: mult,
          betAmount,
          createdAt: new Date().toISOString(),
        };
        updateBalance(newBal);
      }

      playSound('cashout');
      setLiveStats((s) => ({
        profit: Number((s.profit + (resultData.payout - betAmount)).toFixed(2)),
        wagered: Number((s.wagered + betAmount).toFixed(2)),
        wins: s.wins + 1,
        losses: s.losses,
      }));

      setLastResult(resultData);
      setGameOver(true);
      setIsPlaying(false);
      if (resultData.minePositions) setMinePositions(resultData.minePositions);
    } catch {
      setError('Failed to cash out. Please try again.');
    }
  };

  const playAutoBatch = async (
    selectedTiles: number[],
    customAmount: number
  ): Promise<MinesResultData | null> => {
    if (selectedTiles.length === 0 || customAmount > balance || customAmount <= 0) {
      return null;
    }

    const nonce = Math.floor(Math.random() * 1000000);
    const generatedMines = MinesEngine.generateMinePositions(
      'demo-server-seed',
      'demo-client-seed',
      nonce,
      mineCount
    );

    const hitMine = selectedTiles.find((t) => generatedMines.includes(t));
    const isBombHit = hitMine !== undefined;
    const won = !isBombHit;
    const mult = won ? MinesEngine.calculateMultiplier(selectedTiles.length, mineCount) : 0;
    const payout = won ? Number((customAmount * mult).toFixed(2)) : 0;
    const newBal = won ? balance + (payout - customAmount) : Math.max(0, balance - customAmount);
    updateBalance(newBal);

    if (isBombHit) {
      playSound('bomb');
      setHitTile(hitMine!);
      setBusted(true);
    } else {
      playSound('cashout');
      setHitTile(null);
      setBusted(false);
    }

    setRevealedTiles(selectedTiles);
    setMinePositions(generatedMines);
    setGameOver(true);
    setIsPlaying(false);

    setLiveStats((s) => ({
      profit: Number((s.profit + (won ? payout - customAmount : -customAmount)).toFixed(2)),
      wagered: Number((s.wagered + customAmount).toFixed(2)),
      wins: s.wins + (won ? 1 : 0),
      losses: s.losses + (won ? 0 : 1),
    }));

    const resultData: MinesResultData = {
      game: 'mines',
      mineCount,
      revealedTiles: selectedTiles,
      minePositions: generatedMines,
      isBombHit,
      won,
      payout,
      multiplier: mult,
      betAmount: customAmount,
      createdAt: new Date().toISOString(),
    };
    setLastResult(resultData);
    return resultData;
  };

  const resetStats = () => {
    setLiveStats({ profit: 0, wagered: 0, wins: 0, losses: 0 });
  };

  return {
    mineCount,
    setMineCount,
    betAmount,
    setBetAmount,
    isPlaying,
    revealedTiles,
    minePositions,
    hitTile,
    busted,
    gameOver,
    lastResult,
    error,
    balance,
    currentMultiplier,
    nextMultiplier,
    currentPayout,
    soundEnabled,
    setSoundEnabled,
    liveStats,
    resetStats,
    startGame,
    revealTile,
    pickRandomTile,
    cashout,
    playAutoBatch,
  };
}
