import React from 'react';
import { HeadsCoinSvg, TailsCoinSvg } from '../CoinArtwork';
import { CoinFlipRoom } from '../../hooks/useCoinFlipMultiplayer';
import {
  Zap,
  Lock,
  Users,
  Trophy,
  Swords,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export interface MultiplayerLobbyProps {
  availableRooms: CoinFlipRoom[];
  recentWinners: any[];
  userStats: any;
  config: any;
  onOpenQuickMatch: () => void;
  onCreatePrivateRoom: () => void;
  onJoinPrivateRoom: () => void;
  onDirectJoinRoom: (code: string) => void;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  availableRooms,
  recentWinners,
  userStats,
  config,
  onOpenQuickMatch,
  onCreatePrivateRoom,
  onJoinPrivateRoom,
  onDirectJoinRoom,
}) => {
  return (
    <div className="w-full flex flex-col gap-4 select-none">
      {/* ==================================================================== */}
      {/* ARENA HERO BANNER                                                    */}
      {/* ==================================================================== */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#141a29] via-[#0d121f] to-[#080b13] border border-slate-800/90 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl overflow-hidden">
        {/* Overhead Spotlights */}
        <div className="absolute top-0 right-1/4 w-80 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-xl text-center md:text-left space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
            <Swords className="w-3.5 h-3.5" />
            <span>P2P Synchronized Head-to-Head</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
            COIN FLIP ARENA
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            Challenge players. Choose your side. Win the match. Real-time provably fair 1v1 flipping.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
          <button
            type="button"
            onClick={onOpenQuickMatch}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.45)] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Quick Match</span>
          </button>

          <button
            type="button"
            onClick={onCreatePrivateRoom}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#141b2b] hover:bg-[#1a2338] text-amber-300 border border-amber-500/30 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>Create Private Room</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* REGULATORY COMPLIANCE DISCLOSURE (Constraint 11)                     */}
      {/* ==================================================================== */}
      <div className="rounded-2xl bg-[#0e1320]/70 border border-slate-800/80 px-4 py-2.5 flex items-center gap-3 text-xs text-slate-400 font-mono">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="leading-snug">
          {config?.regulatoryNotice ||
            'Coin Flip 1v1 Arena operates in certified Provably Fair demo and sandbox mode pending local gaming license verification.'}
        </span>
      </div>

      {/* ==================================================================== */}
      {/* STATS STRIP                                                          */}
      {/* ==================================================================== */}
      {userStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#0c101c]/80 border border-slate-800 font-mono">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Matches</span>
            <span className="text-base sm:text-lg font-black text-white">{userStats.totalMatches}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#0c101c]/80 border border-slate-800 font-mono">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Wins / Losses</span>
            <span className="text-base sm:text-lg font-black text-emerald-400">
              {userStats.wins}W <span className="text-slate-600 font-normal">/</span> {userStats.losses}L
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#0c101c]/80 border border-slate-800 font-mono">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Win Rate</span>
            <span className="text-base sm:text-lg font-black text-amber-400">{userStats.winRate}%</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#0c101c]/80 border border-slate-800 font-mono">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Arena Earnings</span>
            <span className="text-base sm:text-lg font-black text-emerald-400">
              +{userStats.totalEarnings} ETB
            </span>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* OPEN ROOMS & RECENT WINNERS GRID                                     */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Open Challenges Column */}
        <div className="lg:col-span-7 xl:col-span-8 rounded-2xl bg-[#0c101c]/90 border border-slate-800/90 p-4 sm:p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                Open 1v1 Challenges
              </h3>
            </div>
            <button
              type="button"
              onClick={onJoinPrivateRoom}
              className="text-xs font-mono font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
            >
              Enter Code &rarr;
            </button>
          </div>

          {availableRooms.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <span className="text-xs text-slate-500 font-mono">
                No open challenges waiting at the moment.
              </span>
              <button
                type="button"
                onClick={onOpenQuickMatch}
                className="px-5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Start Quick Match
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar font-mono text-xs">
              {availableRooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#070b14] border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 p-0.5 shrink-0">
                      <div className="w-full h-full bg-[#070b14] rounded-[10px] flex items-center justify-center font-bold text-amber-400">
                        {room.playerOne.username.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <span className="font-bold text-white block">{room.playerOne.username}</span>
                      <span className="text-[10px] text-slate-500">
                        Plays: <strong className="text-amber-400">{room.playerOne.choice}</strong> · Pot: {room.pot} ETB
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDirectJoinRoom(room.roomCode)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
                  >
                    Accept ({room.stake} ETB)
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Winners Column */}
        <div className="lg:col-span-5 xl:col-span-4 rounded-2xl bg-[#0c101c]/90 border border-slate-800/90 p-4 sm:p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                Recent Champions
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Live Payouts</span>
          </div>

          {recentWinners.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 font-mono">
              Completed matches will appear here.
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar font-mono text-xs">
              {recentWinners.map((winner) => (
                <div
                  key={winner.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#070b14] border border-slate-800/80"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-4 h-4 inline-block">
                      {winner.winningSide === 'HEADS' ? (
                        <HeadsCoinSvg className="w-full h-full" />
                      ) : (
                        <TailsCoinSvg className="w-full h-full" />
                      )}
                    </span>
                    <div>
                      <span className="font-bold text-white block">{winner.winnerName}</span>
                      <span className="text-[10px] text-slate-500">Room #{winner.roomCode}</span>
                    </div>
                  </div>

                  <span className="text-emerald-400 font-extrabold text-xs">
                    +{winner.payout.toFixed(0)} ETB
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
