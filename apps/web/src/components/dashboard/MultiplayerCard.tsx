import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Crown, KeyRound, Swords, UserPlus, Users, Zap } from 'lucide-react';

interface WaitingRoomSummary {
  roomId: string;
  roomCode: string;
  stakeEtb: number;
  hostUsername: string;
}

interface MultiplayerCardProps {
  lettiWaitingCount?: number;
  lettiWaitingRooms?: WaitingRoomSummary[];
  damaWaitingCount?: number;
  chessWaitingCount?: number;
  ludoWaitingCount?: number;
}

export const MultiplayerCard: React.FC<MultiplayerCardProps> = ({
  lettiWaitingCount = 0,
  lettiWaitingRooms = [],
  damaWaitingCount = 0,
  chessWaitingCount = 0,
  ludoWaitingCount = 0,
}) => {
  const [joinCode, setJoinCode] = useState('');
  const [chessJoinCode, setChessJoinCode] = useState('');
  const [ludoJoinCode, setLudoJoinCode] = useState('');
  const navigate = useNavigate();

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = joinCode.trim().toUpperCase();
    if (!clean) return;
    navigate(`/games/letti?room=${encodeURIComponent(clean)}`);
  };

  const handleJoinChessByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = chessJoinCode.trim().toUpperCase();
    if (!clean) return;
    navigate(`/games/chess?room=${encodeURIComponent(clean)}`);
  };

  const handleJoinLudoByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = ludoJoinCode.trim().toUpperCase();
    if (!clean) return;
    navigate(`/games/ludo?room=${encodeURIComponent(clean)}`);
  };

  return (
    <section className="space-y-3" aria-label="Multiplayer Play With Friends">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white">Play With Friends (1v1 Arena)</h2>
          <p className="text-xs text-[#A8A3BC]">Quick Match, Create Room, Join by Code, or Invite Friends</p>
        </div>
        <Link to="/multiplayer" className="text-xs font-bold text-[#22D3EE] hover:underline">
          Open Arena
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Letti Card — Face-to-Face */}
        <div className="rounded-2xl bg-[#24213A] border border-[#8B5CF6]/35 p-5 flex flex-col justify-between gap-4 shadow-lg">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 text-[#8B5CF6] flex items-center justify-center shrink-0">
                  <Swords className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Letti Card — Face-to-Face</h3>
                  <p className="text-xs text-[#A8A3BC]">
                    1v1 secret card duel · Alternating flips from a 50-card deck
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#22C55E]/15 text-[#22C55E] text-[11px] font-bold shrink-0">
                <Users className="w-3 h-3" /> {lettiWaitingCount} Waiting
              </span>
            </div>

            {lettiWaitingRooms.length > 0 && (
              <div className="rounded-xl bg-[#11101D] border border-white/[0.06] p-2.5 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#A8A3BC]">
                  Open Tables Ready to Join
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {lettiWaitingRooms.slice(0, 3).map((room) => (
                    <Link
                      key={room.roomId}
                      to={`/games/letti?room=${encodeURIComponent(room.roomCode)}`}
                      className="px-2.5 py-1 rounded-lg bg-[#24213A] hover:bg-[#8B5CF6]/25 border border-white/10 text-xs text-white transition-colors"
                    >
                      {room.hostUsername} · <strong className="text-[#22D3EE]">{room.stakeEtb} ETB</strong>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleJoinByCode} className="flex gap-2">
              <div className="relative flex-1">
                <KeyRound className="w-3.5 h-3.5 text-[#A8A3BC] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter Room Code (e.g. LT-4F8A)"
                  aria-label="Letti room code"
                  className="w-full bg-[#11101D] border border-white/10 focus:border-[#22D3EE] rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-white placeholder:text-[#A8A3BC]/60 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={!joinCode.trim()}
                className="px-3.5 py-2 rounded-xl bg-[#22D3EE] hover:bg-cyan-300 disabled:opacity-40 text-[#11101D] text-xs font-bold transition-colors cursor-pointer"
              >
                Join Room
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Link
              to="/games/letti"
              className="py-2.5 px-2 rounded-xl bg-[#8B5CF6] hover:bg-violet-500 text-white text-xs font-bold inline-flex items-center justify-center gap-1 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" /> Quick Match
            </Link>
            <Link
              to="/games/letti"
              className="py-2.5 px-2 rounded-xl bg-[#11101D] hover:bg-[#1B1930] border border-white/10 text-white text-xs font-bold inline-flex items-center justify-center gap-1 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#22D3EE]" /> Create Room
            </Link>
            <Link
              to="/games/letti"
              className="py-2.5 px-2 rounded-xl bg-[#11101D] hover:bg-[#1B1930] border border-white/10 text-white text-xs font-bold inline-flex items-center justify-center gap-1 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#8B5CF6]" /> Join Room
            </Link>
            <Link
              to="/friends"
              className="py-2.5 px-2 rounded-xl bg-[#11101D] hover:bg-[#1B1930] border border-white/10 text-[#22C55E] text-xs font-bold inline-flex items-center justify-center gap-1 transition-colors"
            >
              <Users className="w-3.5 h-3.5" /> Invite
            </Link>
          </div>
        </div>

        {/* 2. Dama — Multiplayer */}
        <div className="rounded-2xl bg-[#24213A] border border-[#22D3EE]/30 p-5 flex flex-col justify-between gap-4 shadow-lg">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/15 text-[#22D3EE] flex items-center justify-center shrink-0">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Ethiopian Dama — Multiplayer</h3>
                  <p className="text-xs text-[#A8A3BC]">
                    1v1 traditional draughts with compulsory jumps &amp; live timers
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#22D3EE]/15 text-[#22D3EE] text-[11px] font-bold shrink-0">
                <Users className="w-3 h-3" /> {damaWaitingCount} Open
              </span>
            </div>

            <div className="rounded-xl bg-[#11101D] border border-white/[0.06] p-3 text-xs text-[#A8A3BC] space-y-1">
              <div className="text-white font-semibold">Head-to-Head Arena Features</div>
              <p>
                Challenge public lobby players, generate private invite codes, join open rooms, or send direct friend challenges.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Link
              to="/games/dama"
              className="py-2.5 px-2 rounded-xl bg-[#22D3EE] hover:bg-cyan-300 text-[#11101D] text-xs font-bold inline-flex items-center justify-center gap-1 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" /> Quick Match
            </Link>
            <Link
              to="/games/dama"
              className="py-2.5 px-2 rounded-xl bg-[#11101D] hover:bg-[#1B1930] border border-white/10 text-white text-xs font-bold inline-flex items-center justify-center gap-1 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#8B5CF6]" /> Create Room
            </Link>
            <Link
              to="/games/dama"
              className="py-2.5 px-2 rounded-xl bg-[#11101D] hover:bg-[#1B1930] border border-white/10 text-white text-xs font-bold inline-flex items-center justify-center gap-1 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#22D3EE]" /> Join Room
            </Link>
            <Link
              to="/friends"
              className="py-2.5 px-2 rounded-xl bg-[#11101D] hover:bg-[#1B1930] border border-white/10 text-[#22C55E] text-xs font-bold inline-flex items-center justify-center gap-1 transition-colors"
            >
              <Users className="w-3.5 h-3.5" /> Invite
            </Link>
          </div>
        </div>

        {/* 3. NOVA Chess — Ranked 1v1 & AI */}
        <div className="lg:col-span-2 rounded-2xl bg-[#24213A] border border-[#22C55E]/30 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg">
          <div className="space-y-3 flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#22C55E]/15 text-[#22C55E] flex items-center justify-center shrink-0">
                  <Crown className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-base text-white truncate">
                    NOVA Chess — Ranked 1v1 &amp; Computer AI
                  </h3>
                  <p className="text-xs text-[#A8A3BC]">
                    Free competitive ELO matches · Bullet (1+0), Blitz (3+2 / 5+0), Rapid (10+0 / 15+10)
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#22C55E]/15 text-[#22C55E] text-[11px] font-bold shrink-0">
                <Users className="w-3 h-3" /> {chessWaitingCount} Open
              </span>
            </div>

            <form onSubmit={handleJoinChessByCode} className="flex gap-2 max-w-md">
              <div className="relative flex-1">
                <KeyRound className="w-3.5 h-3.5 text-[#A8A3BC] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={chessJoinCode}
                  onChange={(e) => setChessJoinCode(e.target.value.toUpperCase())}
                  placeholder="Chess Room Code (e.g. CH-8A2C)"
                  aria-label="Chess room code"
                  className="w-full bg-[#11101D] border border-white/10 focus:border-[#22C55E] rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-white placeholder:text-[#A8A3BC]/60 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={!chessJoinCode.trim()}
                className="px-3.5 py-2 rounded-xl bg-[#22C55E] hover:bg-emerald-400 disabled:opacity-40 text-[#11101D] text-xs font-bold transition-colors cursor-pointer"
              >
                Join Code
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0 lg:w-[430px]">
            <Link
              to="/games/chess"
              className="py-2.5 px-2 rounded-xl bg-[#22C55E] hover:bg-emerald-400 text-[#11101D] text-xs font-bold inline-flex items-center justify-center gap-1 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" /> Quick Match
            </Link>
            <Link
              to="/games/chess"
              className="py-2.5 px-2 rounded-xl bg-[#11101D] hover:bg-[#1B1930] border border-white/10 text-white text-xs font-bold inline-flex items-center justify-center gap-1 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#8B5CF6]" /> Private
            </Link>
            <Link
              to="/games/chess"
              className="py-2.5 px-2 rounded-xl bg-[#11101D] hover:bg-[#1B1930] border border-white/10 text-white text-xs font-bold inline-flex items-center justify-center gap-1 transition-colors"
            >
              <Swords className="w-3.5 h-3.5 text-[#22D3EE]" /> vs AI
            </Link>
            <Link
              to="/friends"
              className="py-2.5 px-2 rounded-xl bg-[#11101D] hover:bg-[#1B1930] border border-white/10 text-[#22C55E] text-xs font-bold inline-flex items-center justify-center gap-1 transition-colors"
            >
              <Users className="w-3.5 h-3.5" /> Invite
            </Link>
          </div>
        </div>

        {/* 4. NOVA Ludo — 2-4 Player Multiplayer & Free AI */}
        <div className="lg:col-span-2 rounded-2xl bg-[#24213A] border border-amber-400/30 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg">
          <div className="space-y-3 flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-400/15 text-amber-300 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-base text-white truncate">
                    NOVA Ludo — 2–4 Player Classic &amp; Free AI
                  </h3>
                  <p className="text-xs text-[#A8A3BC]">
                    15×15 cross board · Provably Fair LUDO_HMAC_V1 dice · Friendly &amp; AI practice
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/15 text-amber-300 text-[11px] font-bold shrink-0">
                <Users className="w-3 h-3" /> {ludoWaitingCount} Open
              </span>
            </div>

            <form onSubmit={handleJoinLudoByCode} className="flex gap-2 max-w-md">
              <div className="relative flex-1">
                <KeyRound className="w-3.5 h-3.5 text-[#A8A3BC] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={ludoJoinCode}
                  onChange={(e) => setLudoJoinCode(e.target.value.toUpperCase())}
                  placeholder="Ludo Room Code (e.g. LD-4A9F)"
                  aria-label="Ludo room code"
                  className="w-full bg-[#11101D] border border-white/10 focus:border-amber-400 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-white placeholder:text-[#A8A3BC]/60 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={!ludoJoinCode.trim()}
                className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-[#11101D] text-xs font-bold transition-colors cursor-pointer"
              >
                Join Code
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0 lg:w-[430px]">
            <Link
              to="/games/ludo"
              className="py-2.5 px-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#11101D] text-xs font-bold inline-flex items-center justify-center gap-1 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" /> Quick Match
            </Link>
            <Link
              to="/games/ludo"
              className="py-2.5 px-2 rounded-xl bg-[#11101D] hover:bg-[#1B1930] border border-white/10 text-white text-xs font-bold inline-flex items-center justify-center gap-1 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#8B5CF6]" /> Private
            </Link>
            <Link
              to="/games/ludo"
              className="py-2.5 px-2 rounded-xl bg-[#11101D] hover:bg-[#1B1930] border border-white/10 text-white text-xs font-bold inline-flex items-center justify-center gap-1 transition-colors"
            >
              <Swords className="w-3.5 h-3.5 text-[#22C55E]" /> Free AI
            </Link>
            <Link
              to="/friends"
              className="py-2.5 px-2 rounded-xl bg-[#11101D] hover:bg-[#1B1930] border border-white/10 text-[#22C55E] text-xs font-bold inline-flex items-center justify-center gap-1 transition-colors"
            >
              <Users className="w-3.5 h-3.5" /> Invite
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
