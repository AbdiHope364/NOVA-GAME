import React, { useState } from 'react';
import { HeadsCoinSvg, TailsCoinSvg } from '../CoinArtwork';
import { X, Lock, KeyRound, Copy, Check, Users } from 'lucide-react';

export interface PrivateRoomModalProps {
  isOpen: boolean;
  balance: number;
  onClose: () => void;
  onCreateRoom: (stake: number, choice: 'HEADS' | 'TAILS') => Promise<any>;
  onJoinRoom: (code: string) => Promise<any>;
}

export const PrivateRoomModal: React.FC<PrivateRoomModalProps> = ({
  isOpen,
  balance,
  onClose,
  onCreateRoom,
  onJoinRoom,
}) => {
  const [tab, setTab] = useState<'CREATE' | 'JOIN'>('CREATE');
  const [stake, setStake] = useState<number>(100);
  const [choice, setChoice] = useState<'HEADS' | 'TAILS'>('HEADS');
  const [joinCode, setJoinCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async () => {
    setIsSubmitting(true);
    setError(null);
    const room = await onCreateRoom(stake, choice);
    setIsSubmitting(false);
    if (!room) {
      setError('Could not create room. Please try again.');
    } else {
      onClose();
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) {
      setError('Please enter a valid room code.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const room = await onJoinRoom(joinCode.trim().toUpperCase());
    setIsSubmitting(false);
    if (!room) {
      setError('Room not found or no longer available.');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[#0e131f] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black text-white uppercase tracking-wider">
              Private 1v1 Room
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher: CREATE vs JOIN */}
        <div className="grid grid-cols-2 gap-2 bg-[#070b14] p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setTab('CREATE')}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              tab === 'CREATE'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Room
          </button>
          <button
            type="button"
            onClick={() => setTab('JOIN')}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              tab === 'JOIN'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Join by Code
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold">
            {error}
          </div>
        )}

        {tab === 'CREATE' ? (
          <div className="space-y-4">
            {/* Pick Side */}
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Your Side
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setChoice('HEADS')}
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer ${
                    choice === 'HEADS'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/40'
                      : 'bg-[#070b14] border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="w-7 h-7">
                    <HeadsCoinSvg dimmed={choice !== 'HEADS'} />
                  </span>
                  <span className="font-mono font-bold text-xs">HEADS</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChoice('TAILS')}
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer ${
                    choice === 'TAILS'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/40'
                      : 'bg-[#070b14] border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="w-7 h-7">
                    <TailsCoinSvg dimmed={choice !== 'TAILS'} />
                  </span>
                  <span className="font-mono font-bold text-xs">TAILS</span>
                </button>
              </div>
            </div>

            {/* Stake Input */}
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Stake per Player (ETB)
              </span>
              <input
                type="number"
                min={10}
                max={Math.min(10000, Math.floor(balance))}
                value={stake}
                onChange={(e) => setStake(Math.max(10, Number(e.target.value)))}
                className="w-full bg-[#070b14] border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="button"
              disabled={isSubmitting || stake > balance}
              onClick={handleCreate}
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Creating Room...' : `Create Room (${stake} ETB)`}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Enter Room Code
              </span>
              <div className="flex items-center gap-2 bg-[#070b14] border border-slate-800 rounded-xl px-3.5 py-2.5 focus-within:border-amber-400">
                <KeyRound className="w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. CF-7281"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full bg-transparent text-white font-mono font-bold text-base focus:outline-none uppercase placeholder:text-slate-600"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting || !joinCode.trim()}
              onClick={handleJoin}
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Joining...' : 'Enter Arena'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
