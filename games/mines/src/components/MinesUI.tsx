import React, { useState } from 'react';
import { Button, Card, Badge } from '@nova/ui';
import { MinesParams } from '@nova/types';
import { MinesEngine } from '../engine.js';

export interface MinesUIProps {
  onPlay: (amount: number, params: MinesParams) => Promise<any>;
  isLoading?: boolean;
}

export const MinesUI: React.FC<MinesUIProps> = ({ onPlay, isLoading = false }) => {
  const [mineCount, setMineCount] = useState<number>(3);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [revealedTiles, setRevealedTiles] = useState<number[]>([]);
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [busted, setBusted] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const gemsRevealed = revealedTiles.length;
  const currentMultiplier = MinesEngine.calculateMultiplier(gemsRevealed, mineCount);
  const nextMultiplier = MinesEngine.calculateMultiplier(gemsRevealed + 1, mineCount);
  const currentPayout = Math.floor(betAmount * currentMultiplier);

  const handleStartGame = () => {
    setIsPlaying(true);
    setRevealedTiles([]);
    setMinePositions([]);
    setGameOver(false);
    setBusted(false);
    setLastResult(null);
  };

  const handleTileClick = async (index: number) => {
    if (!isPlaying || gameOver || revealedTiles.includes(index)) return;

    const nextRevealed = [...revealedTiles, index];
    setRevealedTiles(nextRevealed);

    try {
      const res = await onPlay(betAmount, { mineCount, revealedTiles: nextRevealed });
      setLastResult(res);

      if (res.outcome?.isBombHit) {
        setBusted(true);
        setGameOver(true);
        setIsPlaying(false);
        setMinePositions(res.outcome.minePositions || []);
      } else if (nextRevealed.length === 25 - mineCount) {
        // Uncovered all safe gems!
        setGameOver(true);
        setIsPlaying(false);
        setMinePositions(res.outcome.minePositions || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCashout = async () => {
    if (!isPlaying || gemsRevealed === 0 || gameOver) return;
    try {
      const res = await onPlay(betAmount, { mineCount, revealedTiles, action: 'CASHOUT' });
      setLastResult(res);
      setGameOver(true);
      setIsPlaying(false);
      setMinePositions(res.outcome?.minePositions || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card className="max-w-xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            💣 Mines Sweeper
          </h2>
          <p className="text-xs text-slate-400">Uncover gems, avoid hidden mines, and cash out anytime!</p>
        </div>
        <Badge variant="info">Provably Fair</Badge>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-center font-mono">
        <div>
          <div className="text-[10px] text-slate-500 font-bold uppercase">Mines</div>
          <div className="text-base font-extrabold text-rose-400">💣 {mineCount}</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 font-bold uppercase">Multiplier</div>
          <div className="text-base font-extrabold text-cyan-400">{currentMultiplier.toFixed(2)}x</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 font-bold uppercase">Next Tile</div>
          <div className="text-base font-extrabold text-emerald-400">{nextMultiplier.toFixed(2)}x</div>
        </div>
      </div>

      {/* 5x5 Mines Tile Grid */}
      <div className="grid grid-cols-5 gap-2.5 p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
        {Array.from({ length: 25 }, (_, i) => i).map((tileIndex) => {
          const isRevealed = revealedTiles.includes(tileIndex);
          const isMine = minePositions.includes(tileIndex);
          const isExplodedBomb = busted && isRevealed && isMine;

          let tileContent = '❓';
          let tileStyle = 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400';

          if (isRevealed && !isMine) {
            tileContent = '💎';
            tileStyle = 'bg-emerald-600/30 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/40 scale-95';
          } else if (gameOver && isMine) {
            tileContent = '💣';
            tileStyle = isExplodedBomb
              ? 'bg-rose-600 border-rose-400 text-white ring-4 ring-rose-500/80 scale-105 animate-pulse'
              : 'bg-rose-950/60 border-rose-800 text-rose-400';
          }

          return (
            <button
              key={tileIndex}
              type="button"
              disabled={!isPlaying || isRevealed || gameOver || isLoading}
              onClick={() => handleTileClick(tileIndex)}
              className={`h-14 sm:h-16 rounded-xl font-bold text-2xl flex items-center justify-center border transition-all transform active:scale-90 ${tileStyle} disabled:cursor-not-allowed`}
            >
              {tileContent}
            </button>
          );
        })}
      </div>

      {/* Bet Configuration / Action Controls */}
      {!isPlaying ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-semibold text-slate-400 uppercase">
              <span>Mine Count</span>
              <span className="text-amber-400 font-bold">{mineCount} Mines ({25 - mineCount} Gems)</span>
            </div>
            <input
              type="range"
              min={1}
              max={24}
              value={mineCount}
              onChange={(e) => setMineCount(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-950 rounded-lg cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-400 uppercase">Bet Amount (ETB)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
              <Button variant="secondary" size="sm" onClick={() => setBetAmount((prev: number) => Math.max(1, Math.floor(prev / 2)))}>½</Button>
              <Button variant="secondary" size="sm" onClick={() => setBetAmount((prev: number) => prev * 2)}>2x</Button>
            </div>
          </div>

          <Button variant="accent" size="lg" onClick={handleStartGame} isLoading={isLoading}>
            START MINES GAME
          </Button>
        </div>
      ) : (
        <Button
          variant="secondary"
          size="lg"
          disabled={gemsRevealed === 0 || isLoading}
          onClick={handleCashout}
          className="w-full py-4 text-lg font-black tracking-wider uppercase bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950"
        >
          {gemsRevealed === 0
            ? 'SELECT A TILE TO BEGIN'
            : `CASHOUT ${currentPayout} ETB (${currentMultiplier.toFixed(2)}x)`}
        </Button>
      )}

      {/* Result Display */}
      {lastResult && (
        <div
          className={`p-4 rounded-xl border text-sm font-semibold flex items-center justify-between ${
            lastResult.won
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <span>{lastResult.won ? '🎉 CASHED OUT!' : '💥 BOMB HIT!'}</span>
          <span>
            {lastResult.won
              ? `+${lastResult.payout} ETB (${lastResult.multiplier}x)`
              : `-${betAmount} ETB`}
          </span>
        </div>
      )}
    </Card>
  );
};
