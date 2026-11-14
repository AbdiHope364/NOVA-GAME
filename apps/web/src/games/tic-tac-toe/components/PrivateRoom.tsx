import React, { useState } from 'react';
import { Copy, Check, KeyRound, Plus, ArrowRight, ShieldAlert } from 'lucide-react';
import { FrontendTttMatch } from '../types/ticTacToe.types';

export interface PrivateRoomProps {
  activeRoom?: FrontendTttMatch | null;
  onCreateRoom: (stake?: number) => void;
  onJoinRoom: (roomCode: string) => void;
  onClose: () => void;
  realMoneyEnabled?: boolean;
}

export const PrivateRoom: React.FC<PrivateRoomProps> = ({
  activeRoom,
  onCreateRoom,
  onJoinRoom,
  onClose,
  realMoneyEnabled = false,
}) => {
  const [tab, setTab] = useState<'CREATE' | 'JOIN'>('CREATE');
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!activeRoom?.roomCode) return;
    navigator.clipboard.writeText(activeRoom.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-[420px] mx-auto p-6 rounded-3xl bg-slate-950/95 border border-slate-800 shadow-2xl backdrop-blur-2xl select-none animate-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-white text-base font-black tracking-wide">PRIVATE CHALLENGE</h3>
          <p className="text-xs text-slate-400">Play with friends anywhere using room codes</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white text-sm font-bold"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-slate-900 p-1 my-5 border border-slate-800">
        <button
          type="button"
          onClick={() => setTab('CREATE')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-black tracking-wider transition-all ${
            tab === 'CREATE'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          CREATE ROOM
        </button>
        <button
          type="button"
          onClick={() => setTab('JOIN')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-black tracking-wider transition-all ${
            tab === 'JOIN'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          JOIN ROOM
        </button>
      </div>

      {tab === 'CREATE' ? (
        activeRoom && activeRoom.status === 'WAITING' ? (
          /* Waiting for Friend to Join */
          <div className="space-y-5 text-center">
            <p className="text-xs text-slate-400">Share this 6-character room code with your friend:</p>

            <div className="p-4 rounded-2xl bg-cyan-950/40 border-2 border-dashed border-cyan-400/60 flex items-center justify-between">
              <span className="text-2xl font-black tracking-widest text-[#00e5ff] font-mono">
                {activeRoom.roomCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-1 active:scale-95 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'COPIED' : 'COPY'}
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-amber-300 font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Waiting for player to connect...
            </div>
          </div>
        ) : (
          /* Create Room Form */
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Generate a unique challenge room and invite anyone to a 1v1 duel.
            </p>

            <button
              type="button"
              onClick={() => onCreateRoom(0)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm tracking-wider shadow-[0_0_20px_rgba(0,229,255,0.4)] flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              CREATE FREE ROOM
            </button>
          </div>
        )
      ) : (
        /* Join Room Form */
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Enter Room Code
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                maxLength={8}
                placeholder="e.g. TTT-4921"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-sm tracking-wider uppercase focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={inputCode.trim().length < 5}
            onClick={() => onJoinRoom(inputCode)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 disabled:opacity-50 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm tracking-wider shadow-[0_0_20px_rgba(0,229,255,0.4)] flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            JOIN ARENA
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
