import React from 'react';

export interface CurrentBallProps {
  currentBall: { letter: string; number: number } | null;
  drawnHistory: { letter: string; number: number }[];
  isDrawing: boolean;
}

const get3DHistoryBallStyle = (num: number) => {
  if (num <= 15) {
    // B - Orange / Red
    return 'bg-[radial-gradient(circle_at_35%_25%,#ffffff_0%,#ff5e00_28%,#b81400_85%)] shadow-[inset_0_-2px_3px_rgba(0,0,0,0.4),0_2px_4px_rgba(0,0,0,0.3)] text-white';
  }
  if (num <= 30) {
    // I - Blue
    return 'bg-[radial-gradient(circle_at_35%_25%,#ffffff_0%,#0077ff_28%,#002b80_85%)] shadow-[inset_0_-2px_3px_rgba(0,0,0,0.4),0_2px_4px_rgba(0,0,0,0.3)] text-white';
  }
  if (num <= 45) {
    // N - Red or Green
    return num % 2 === 0
      ? 'bg-[radial-gradient(circle_at_35%_25%,#ffffff_0%,#00c853_28%,#00591f_85%)] shadow-[inset_0_-2px_3px_rgba(0,0,0,0.4),0_2px_4px_rgba(0,0,0,0.3)] text-white'
      : 'bg-[radial-gradient(circle_at_35%_25%,#ffffff_0%,#ff2b2b_28%,#8b0000_85%)] shadow-[inset_0_-2px_3px_rgba(0,0,0,0.4),0_2px_4px_rgba(0,0,0,0.3)] text-white';
  }
  if (num <= 60) {
    // G - Emerald Green
    return 'bg-[radial-gradient(circle_at_35%_25%,#ffffff_0%,#00c853_28%,#00591f_85%)] shadow-[inset_0_-2px_3px_rgba(0,0,0,0.4),0_2px_4px_rgba(0,0,0,0.3)] text-white';
  }
  // O - Violet / Purple
  return 'bg-[radial-gradient(circle_at_35%_25%,#ffffff_0%,#8a2be2_28%,#3d0070_85%)] shadow-[inset_0_-2px_3px_rgba(0,0,0,0.4),0_2px_4px_rgba(0,0,0,0.3)] text-white';
};

export const CurrentBall: React.FC<CurrentBallProps> = ({ currentBall, drawnHistory, isDrawing }) => {
  // If drawing and there's a history, show drawn history. If empty, show a sample reel or placeholder
  const displayBalls =
    drawnHistory.length > 0
      ? drawnHistory.slice(0, 16)
      : [
          { letter: 'B', number: 5 },
          { letter: 'I', number: 18 },
          { letter: 'N', number: 33 },
          { letter: 'G', number: 49 },
          { letter: 'O', number: 71 },
          { letter: 'B', number: 12 },
          { letter: 'I', number: 20 },
          { letter: 'N', number: 31 },
        ];

  return (
    <div className="relative flex flex-col items-center w-full pt-2 select-none">
      {/* Centered Floating Pill Badge: Called Numbers */}
      <div className="absolute -top-1.5 z-10 px-4 py-0.5 rounded-full bg-[#3b126d] border border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.4)] text-white text-xs font-black tracking-wider uppercase">
        Called Numbers
      </div>

      {/* Tray of 3D Glossy Called Balls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 w-full bg-[#130526] border border-purple-900/70 rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 overflow-x-auto no-scrollbar shadow-inner justify-center min-h-[58px]">
        {displayBalls.map((b, idx) => (
          <div
            key={idx}
            className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full shrink-0 flex items-center justify-center font-black text-xs sm:text-base font-sans relative transition-transform ${get3DHistoryBallStyle(
              b.number
            )} ${idx === 0 && isDrawing ? 'scale-110 ring-2 ring-amber-400 animate-pulse' : ''}`}
            title={`${b.letter}-${b.number}`}
          >
            {/* Top-left Gloss Specular Reflection */}
            <div className="absolute top-[10%] left-[20%] w-[35%] h-[24%] rounded-full bg-white/60 blur-[0.6px] pointer-events-none" />
            <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] z-10">{b.number}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
