import React, { useState, useEffect, useMemo } from 'react';
import {
  createInitialState,
  applyMove,
  type GameState,
  type Move,
  type Pos,
  DEFAULT_OPTIONS,
} from '@nova/game-dama';
import { DamaBoard } from './DamaBoard';
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Trophy,
  History,
  Clock,
  Swords,
} from 'lucide-react';

interface ReplayMove {
  ply: number;
  userId: string;
  from: Pos;
  path: Pos[];
  createdAt: string;
}

interface DamaReplayModalProps {
  match: {
    id: string;
    result: string;
    winnerId?: string | null;
    isFreePlay?: boolean;
    stakeEtb?: number;
    playerColor?: 'W' | 'B';
    whitePlayer?: { id: string; username: string };
    blackPlayer?: { id: string; username: string };
    opponent?: { id: string; username: string };
    rulesetVersion?: string;
    ruleOptions?: any;
    moves: ReplayMove[];
  };
  onClose: () => void;
}

export const DamaReplayModal: React.FC<DamaReplayModalProps> = ({ match, onClose }) => {
  const [currentPly, setCurrentPly] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const moves = match.moves || [];
  const totalPlies = moves.length;

  // Reconstruct board history deterministically using the pure rules engine
  const boardStates = useMemo(() => {
    const states: GameState[] = [];
    const options = match.ruleOptions || DEFAULT_OPTIONS;

    let currentState = createInitialState('W');
    states.push(currentState);

    for (const move of moves) {
      try {
        const res = applyMove(
          currentState,
          { from: move.from, path: move.path },
          options
        );
        const nextState = res.state;
        states.push(nextState);
        currentState = nextState;
      } catch (err) {
        console.warn(`[Replay] Failed to apply ply ${move.ply}:`, err);
        // Fall back to current state if a move cannot be applied
        states.push(currentState);
      }
    }

    return states;
  }, [moves, match.ruleOptions]);

  const currentGameState = boardStates[currentPly] || boardStates[0];

  // Autoplay timer
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = window.setInterval(() => {
        setCurrentPly((prev) => {
          if (prev >= totalPlies) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1200);
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [isPlaying, totalPlies]);

  const handleFirst = () => {
    setIsPlaying(false);
    setCurrentPly(0);
  };

  const handlePrev = () => {
    setIsPlaying(false);
    setCurrentPly((prev) => Math.max(0, prev - 1));
  };

  const handlePlayToggle = () => {
    if (currentPly >= totalPlies) {
      setCurrentPly(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    setIsPlaying(false);
    setCurrentPly((prev) => Math.min(totalPlies, prev + 1));
  };

  const handleLast = () => {
    setIsPlaying(false);
    setCurrentPly(totalPlies);
  };

  const lastAppliedMove = currentPly > 0 ? moves[currentPly - 1] : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-md">
      <div className="relative w-full h-full sm:h-auto sm:max-h-[92vh] max-w-4xl bg-stone-950 sm:bg-stone-900 border-0 sm:border-2 sm:border-amber-500/30 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col justify-between">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-6 sm:py-4 bg-stone-950/90 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <History className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="text-sm sm:text-lg font-bold text-white">Match Replay</h3>
                <span className="px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full bg-white/10 text-stone-300">
                  v{match.rulesetVersion || '1.0.0'}
                </span>
                {match.isFreePlay ? (
                  <span className="px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Free
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {match.stakeEtb} ETB
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-stone-400">
                {match.result} • {totalPlies} total plies
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-2.5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6 items-center">
          {/* Board Container */}
          <div className="md:col-span-2 flex flex-col items-center justify-center">
            <div className="w-full max-w-[min(calc(100vw-20px),420px,calc(100dvh-260px))] aspect-square rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border-2 sm:border-4 border-amber-950/80 bg-stone-950 mx-auto">
              <DamaBoard
                board={currentGameState.board}
                turn={currentGameState.turn}
                selectedPos={null}
                validMovesForSelected={[]}
                compulsoryPieces={[]}
                lastMove={
                  lastAppliedMove
                    ? {
                        from: lastAppliedMove.from,
                        to: lastAppliedMove.path[lastAppliedMove.path.length - 1],
                      }
                    : null
                }
                onSquareClick={() => {}}
                playerColor="W"
                disabled={true}
              />
            </div>
          </div>

          {/* Replay Controls & Move History Sidebar */}
          <div className="flex flex-col h-full justify-between space-y-2 sm:space-y-4 w-full max-w-[420px] mx-auto">
            {/* Status Card */}
            <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 space-y-1.5 sm:space-y-3">
              <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-stone-400">
                <span>Move Progress</span>
                <span className="text-amber-400 font-bold">
                  Ply {currentPly} / {totalPlies}
                </span>
              </div>

              {/* Progress Slider */}
              <input
                type="range"
                min={0}
                max={totalPlies}
                value={currentPly}
                onChange={(e) => {
                  setIsPlaying(false);
                  setCurrentPly(Number(e.target.value));
                }}
                className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500 touch-manipulation"
              />

              {lastAppliedMove && (
                <div className="p-2 rounded-lg sm:rounded-xl bg-black/40 text-[11px] sm:text-xs font-mono text-stone-300">
                  <span className="text-amber-400 font-bold">Move #{currentPly}:</span> [
                  {lastAppliedMove.from.join(',')}] &rarr;{' '}
                  {lastAppliedMove.path.map((p) => `[${p.join(',')}]`).join(' ')}
                </div>
              )}
            </div>

            {/* VCR Step Controls */}
            <div className="p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-1.5 sm:gap-2">
              <button
                onClick={handleFirst}
                disabled={currentPly === 0}
                title="First Ply"
                className="p-2.5 sm:p-3 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 disabled:pointer-events-none text-white transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center touch-manipulation"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={handlePrev}
                disabled={currentPly === 0}
                title="Previous Ply"
                className="p-2.5 sm:p-3 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 disabled:pointer-events-none text-white transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center touch-manipulation"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={handlePlayToggle}
                title={isPlaying ? 'Pause' : 'Autoplay'}
                className="p-2.5 sm:p-3 px-4 sm:px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 min-w-[50px] min-h-[40px] justify-center touch-manipulation"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              </button>

              <button
                onClick={handleNext}
                disabled={currentPly >= totalPlies}
                title="Next Ply"
                className="p-2.5 sm:p-3 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 disabled:pointer-events-none text-white transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center touch-manipulation"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <button
                onClick={handleLast}
                disabled={currentPly >= totalPlies}
                title="Last Ply"
                className="p-2.5 sm:p-3 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 disabled:pointer-events-none text-white transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center touch-manipulation"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Move List Preview (visible on desktop or larger screens) */}
            <div className="hidden sm:block flex-1 max-h-48 overflow-y-auto space-y-1 p-2 rounded-xl bg-black/30 border border-white/5 text-xs font-mono">
              {moves.length === 0 ? (
                <div className="text-center py-6 text-stone-500">No moves recorded</div>
              ) : (
                moves.map((m, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentPly(idx + 1);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                      currentPly === idx + 1
                        ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                        : 'text-stone-400 hover:bg-white/5'
                    }`}
                  >
                    <span>Ply #{m.ply}</span>
                    <span>
                      [{m.from.join(',')}] &rarr; {m.path.map((p) => `[${p.join(',')}]`).join('')}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
