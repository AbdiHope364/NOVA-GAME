import React, { useState } from 'react';
import { HeadsCoinSvg, TailsCoinSvg } from '../CoinArtwork';
import { X, Zap, Loader2, Play } from 'lucide-react';

export interface QuickMatchModalProps {
  isOpen: boolean;
  isQueuing: boolean;
  balance: number;
  onClose: () => void;
  onQueue: (stake: number, choice: 'HEADS' | 'TAILS') => void;
  onCancelQueue: () => void;
}

export const QuickMatchModal: React.FC<QuickMatchModalProps> = ({
  isOpen,
  isQueuing,
  balance,
  onClose,
  onQueue,
  onCancelQueue,
}) => {
  const [stake, setStake] = useState<number>(100);
  const [choice, setChoice] = useState<'HEADS' | 'TAILS'>('HEADS');
  const quickStakes = [25, 50, 100, 250, 500, 1000];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[#0e131f] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black text-white uppercase tracking-wider">
              Quick 1v1 Matchmaking
            </h3>
          </div>
          <button
            type="button"
            onClick={isQueuing ? onCancelQueue : onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isQueuing ? (
          /* Searching Radar State */
          <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full border-2 border-emerald-500/40 animate-ping" />
              <span className="absolute inset-2 rounded-full border border-amber-500/30 animate-pulse" />
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
              </div>
            </div>

            <div>
              <h4 className="text-base font-black text-white uppercase">
                Searching for Opponent...
              </h4>
              <p className="text-xs font-mono text-slate-400 mt-1">
                Matching with player at stake: <strong className="text-amber-400">{stake} ETB</strong> ({choice})
              </p>
            </div>

            <button
              type="button"
              onClick={onCancelQueue}
              className="px-6 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cancel Matchmaking
            </button>
          </div>
        ) : (
          /* Match Configuration State */
          <div className="space-y-4">
            {/* 1. Pick Side */}
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                1. Select Side
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setChoice('HEADS')}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                    choice === 'HEADS'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/40'
                      : 'bg-[#070b14] border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-8 h-8">
                    <HeadsCoinSvg dimmed={choice !== 'HEADS'} />
                  </span>
                  <div className="text-left font-mono">
                    <span className="font-black text-xs block">HEADS</span>
                    <span className="text-[10px] text-slate-500">1.98x</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setChoice('TAILS')}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                    choice === 'TAILS'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/40'
                      : 'bg-[#070b14] border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-8 h-8">
                    <TailsCoinSvg dimmed={choice !== 'TAILS'} />
                  </span>
                  <div className="text-left font-mono">
                    <span className="font-black text-xs block">TAILS</span>
                    <span className="text-[10px] text-slate-500">1.98x</span>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Select Entry Stake */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-slate-400 uppercase tracking-wider">2. Entry Stake</span>
                <span className="text-emerald-400 font-mono font-bold">{balance.toFixed(0)} ETB Available</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {quickStakes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStake(s)}
                    className={`py-2 rounded-xl text-xs font-mono font-black border transition-all cursor-pointer ${
                      stake === s
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400/40'
                        : 'bg-[#070b14] border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {s} ETB
                  </button>
                ))}
              </div>
            </div>

            {/* Potential Pot Summary */}
            <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800 text-xs font-mono flex items-center justify-between">
              <span className="text-slate-400">Total Match Pot:</span>
              <span className="text-emerald-400 font-extrabold text-sm">{stake * 2} ETB</span>
            </div>

            {/* Start Searching Button */}
            <button
              type="button"
              disabled={stake > balance}
              onClick={() => onQueue(stake, choice)}
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-black text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Find Match ({stake} ETB)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
