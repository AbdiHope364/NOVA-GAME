import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, RefreshCw, Swords, Trophy, Users } from 'lucide-react';
import { api } from '../../services/api';
import { MultiplayerCard } from '../../components/dashboard/MultiplayerCard';

export const MultiplayerPage: React.FC = () => {
  const [lettiRooms, setLettRooms] = useState<any[]>([]);
  const [damaLobby, setDamaLobby] = useState<any[]>([]);
  const [chessWaiting, setChessWaiting] = useState<any[]>([]);
  const [ludoWaiting, setLudoWaiting] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLobby = async () => {
    setLoading(true);
    try {
      const [lettiRes, damaRes, chessRes, ludoRes] = await Promise.all([
        api.get('/letti-pvp/lobby').catch(() => ({ data: { data: [] } })),
        api.get('/matches/lobby').catch(() => ({ data: { data: [] } })),
        api.get('/chess/lobby').catch(() => ({ data: { data: { waitingRooms: [] } } })),
        api.get('/ludo/lobby').catch(() => ({ data: { data: { rooms: [] } } })),
      ]);
      setLettRooms(Array.isArray(lettiRes.data?.data) ? lettiRes.data.data : []);
      setDamaLobby(Array.isArray(damaRes.data?.data) ? damaRes.data.data : []);
      setChessWaiting(
        Array.isArray(chessRes.data?.data?.waitingRooms) ? chessRes.data.data.waitingRooms : []
      );
      setLudoWaiting(Array.isArray(ludoRes.data?.data?.rooms) ? ludoRes.data.data.rooms : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLobby();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-[#111827] border border-slate-800/80 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400">
            <Swords className="w-4 h-4" /> Real-Time PvP Arena
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Multiplayer Rooms</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Compete against live NOVA GAMING players in Letti Card 1v1, Ethiopian Dama, and 75-Ball Bingo rooms.
          </p>
        </div>

        <button
          type="button"
          onClick={loadLobby}
          className="px-4 py-2 rounded-xl bg-[#0b101b] hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Tables
        </button>
      </div>

      <MultiplayerCard
        lettiWaitingCount={lettiRooms.length}
        lettiWaitingRooms={lettiRooms}
        damaWaitingCount={damaLobby.length}
        chessWaitingCount={chessWaiting.length}
        ludoWaitingCount={ludoWaiting.length}
      />

      {/* Open Waiting Tables List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-[#111827] border border-slate-800/80 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-400" /> Open Letti 1v1 Tables ({lettiRooms.length})
            </h2>
            <Link to="/games/letti" className="text-xs font-bold text-violet-400 hover:underline">
              Create Room
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-12 rounded-xl bg-slate-800/50 animate-pulse" />
              ))}
            </div>
          ) : lettiRooms.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No waiting Letti tables right now. Start Quick Match or Create a Private Room!
            </p>
          ) : (
            <div className="space-y-2">
              {lettiRooms.map((room) => (
                <div
                  key={room.roomId}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#0b101b] border border-slate-800/80 text-xs"
                >
                  <div>
                    <div className="font-bold text-white">{room.hostUsername}</div>
                    <div className="text-slate-400 font-mono text-[11px]">
                      {room.roomCode} · {room.roomType}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-cyan-300">
                      {room.stakeEtb} ETB
                    </span>
                    <Link
                      to={`/games/letti?room=${encodeURIComponent(room.roomCode)}`}
                      className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold"
                    >
                      Join
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-[#111827] border border-slate-800/80 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Crown className="w-4 h-4 text-cyan-400" /> Open Ethiopian Dama Matches ({damaLobby.length})
            </h2>
            <Link to="/games/dama" className="text-xs font-bold text-cyan-400 hover:underline">
              Open Dama Lobby
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-12 rounded-xl bg-slate-800/50 animate-pulse" />
              ))}
            </div>
          ) : damaLobby.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No public Dama challenges open right now. Visit Dama Arena to create one!
            </p>
          ) : (
            <div className="space-y-2">
              {damaLobby.slice(0, 6).map((m: any) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#0b101b] border border-slate-800/80 text-xs"
                >
                  <div>
                    <div className="font-bold text-white">{m.whiteUsername || 'Challenger'}</div>
                    <div className="text-slate-400 text-[11px]">Ethiopian Dama 1v1</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-cyan-300">
                      {(Number(m.stakeMinor || 0) / 100).toLocaleString()} ETB
                    </span>
                    <Link
                      to="/games/dama"
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                    >
                      Challenge
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 75-Ball Bingo Room Banner */}
      <div className="rounded-2xl bg-[#111827] border border-slate-800/80 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">75-Ball Cartella Bingo Room</h3>
            <p className="text-xs text-slate-400">
              Join live community Bingo rounds with automatic number draws and pattern prizes.
            </p>
          </div>
        </div>
        <Link
          to="/games/bingo"
          className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold"
        >
          Enter Bingo Room
        </Link>
      </div>
    </div>
  );
};
