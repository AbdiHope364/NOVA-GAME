import React, { useState } from 'react';
import {
  ArrowLeft,
  Bot,
  Play,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  LudoColor,
  LudoPlayerCount,
  LudoRulesetOptions,
} from '@nova/game-ludo';
import {
  LUDO_COLORS,
  LudoLanguage,
  LudoPlayerConfig,
  LudoPlayerType,
  LudoTheme,
  LUDO_TRANSLATIONS,
} from '../types';

export interface SetupScreenProps {
  initialPlayerCount?: LudoPlayerCount;
  initialMode?: 'AI' | 'LOCAL';
  theme: LudoTheme;
  language: LudoLanguage;
  onBack: () => void;
  onStartGame: (
    playerCount: LudoPlayerCount,
    playerConfigs: Record<number, LudoPlayerConfig>,
    rules: LudoRulesetOptions
  ) => void;
}

const DEFAULT_AVATARS = ['🧑', '👧', '👦', '🧔', '🦁', '🚀', '⭐', '🤖'];

export const SetupScreen: React.FC<SetupScreenProps> = ({
  initialPlayerCount = 2,
  initialMode = 'LOCAL',
  theme,
  language,
  onBack,
  onStartGame,
}) => {
  const strings = LUDO_TRANSLATIONS[language] || LUDO_TRANSLATIONS.en;
  const [playerCount, setPlayerCount] = useState<LudoPlayerCount>(initialPlayerCount);

  // House rule states
  const [rules, setRules] = useState<LudoRulesetOptions>({
    blockadesEnabled: false,
    extraTurnOnCapture: true,
    mustRollSixToStart: true,
    exactFinishRequired: true,
  });

  // Seat configurations
  const [playerConfigs, setPlayerConfigs] = useState<Record<number, LudoPlayerConfig>>({
    1: {
      seat: 1,
      color: 'RED',
      name: 'Player 1',
      type: 'HUMAN',
      avatar: '🧑',
      level: 1,
    },
    2: {
      seat: 2,
      color: 'GREEN',
      name: initialMode === 'AI' ? 'Nova Bot 1' : 'Player 2',
      type: initialMode === 'AI' ? 'BOT_HARD' : 'HUMAN',
      avatar: initialMode === 'AI' ? '🤖' : '👧',
      level: 12,
    },
    3: {
      seat: 3,
      color: 'YELLOW',
      name: initialMode === 'AI' ? 'Nova Bot 2' : 'Player 3',
      type: initialMode === 'AI' ? 'BOT_HARD' : 'HUMAN',
      avatar: initialMode === 'AI' ? '🤖' : '👦',
      level: 8,
    },
    4: {
      seat: 4,
      color: 'BLUE',
      name: initialMode === 'AI' ? 'Nova Bot 3' : 'Player 4',
      type: initialMode === 'AI' ? 'BOT_EASY' : 'HUMAN',
      avatar: initialMode === 'AI' ? '🤖' : '🧔',
      level: 5,
    },
  });

  const getSeatColor = (seatNum: number): LudoColor => {
    if (playerCount === 2) {
      return seatNum === 1 ? 'RED' : 'YELLOW';
    }
    if (playerCount === 3) {
      return seatNum === 1 ? 'RED' : seatNum === 2 ? 'GREEN' : 'YELLOW';
    }
    return seatNum === 1
      ? 'RED'
      : seatNum === 2
      ? 'GREEN'
      : seatNum === 3
      ? 'YELLOW'
      : 'BLUE';
  };

  const handleStart = () => {
    // Assign accurate colors based on player count order
    const updated: Record<number, LudoPlayerConfig> = {};
    for (let i = 1; i <= playerCount; i++) {
      updated[i] = {
        ...playerConfigs[i],
        color: getSeatColor(i),
      };
    }
    onStartGame(playerCount, updated, rules);
  };

  return (
    <div
      className={`min-h-[82vh] w-full flex flex-col items-center justify-center p-4 select-none ${
        theme === 'dark' ? 'text-white' : 'text-slate-900'
      }`}
    >
      <div className="w-full max-w-xl mx-auto space-y-5 text-left">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-3.5 py-2 rounded-2xl bg-[#141F38] hover:bg-[#1B2A41] text-xs font-bold text-slate-200 inline-flex items-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h2 className="text-lg font-black text-white tracking-wide">
            Match Setup &amp; Rules
          </h2>
          <div className="w-16" />
        </div>

        {/* Section 1: Number of Players */}
        <div className="rounded-3xl bg-[#1B2A41] border border-white/10 p-5 space-y-3 shadow-lg">
          <label className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4" /> {strings.playersCount}
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {([2, 3, 4] as LudoPlayerCount[]).map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setPlayerCount(count)}
                className={`py-3 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                  playerCount === count
                    ? 'bg-[#1E88E5] text-white shadow-[0_4px_12px_rgba(30,136,229,0.5)] scale-102'
                    : 'bg-[#141F38] text-slate-400 border border-white/10 hover:text-white'
                }`}
              >
                {count} Players
              </button>
            ))}
          </div>
        </div>

        {/* Section 2: Player Seats Configuration */}
        <div className="rounded-3xl bg-[#1B2A41] border border-white/10 p-5 space-y-3 shadow-lg">
          <label className="text-xs font-black uppercase text-amber-300 tracking-wider">
            Player Roster
          </label>

          <div className="space-y-2.5">
            {Array.from({ length: playerCount }, (_, idx) => {
              const seatNum = idx + 1;
              const color = getSeatColor(seatNum);
              const meta = LUDO_COLORS[color];
              const config = playerConfigs[seatNum];

              return (
                <div
                  key={seatNum}
                  className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-[#141F38] border border-white/[0.06]"
                >
                  {/* Color Swatch & Seat */}
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full shadow shrink-0"
                      style={{ backgroundColor: meta.hex }}
                    />
                    <span className="text-xs font-black text-white shrink-0">
                      Seat {seatNum} ({meta.label})
                    </span>
                  </div>

                  {/* Avatar Picker & Name Input */}
                  <div className="flex items-center gap-2 flex-1 min-w-[160px]">
                    <select
                      value={config.avatar}
                      onChange={(e) =>
                        setPlayerConfigs((prev) => ({
                          ...prev,
                          [seatNum]: { ...config, avatar: e.target.value },
                        }))
                      }
                      className="bg-[#1B2A41] border border-white/10 text-base rounded-xl px-1.5 py-1 cursor-pointer"
                      aria-label={`Seat ${seatNum} avatar`}
                    >
                      {DEFAULT_AVATARS.map((av) => (
                        <option key={av} value={av}>
                          {av}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={config.name}
                      maxLength={14}
                      onChange={(e) =>
                        setPlayerConfigs((prev) => ({
                          ...prev,
                          [seatNum]: { ...config, name: e.target.value },
                        }))
                      }
                      placeholder={`Player ${seatNum}`}
                      className="flex-1 bg-[#1B2A41] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
                    />
                  </div>

                  {/* Player Type (Human, Easy Bot, Hard Bot) */}
                  <select
                    value={config.type}
                    onChange={(e) =>
                      setPlayerConfigs((prev) => ({
                        ...prev,
                        [seatNum]: {
                          ...config,
                          type: e.target.value as LudoPlayerType,
                          avatar: e.target.value.startsWith('BOT') ? '🤖' : config.avatar,
                        },
                      }))
                    }
                    className="bg-[#1B2A41] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold cursor-pointer"
                    aria-label={`Seat ${seatNum} type`}
                  >
                    <option value="HUMAN">👤 Human</option>
                    <option value="BOT_EASY">🤖 Bot (Easy)</option>
                    <option value="BOT_HARD">🧠 Bot (Hard)</option>
                  </select>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: House Rules Toggles */}
        <div className="rounded-3xl bg-[#1B2A41] border border-white/10 p-5 space-y-3 shadow-lg">
          <label className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> {strings.houseRules}
          </label>

          <div className="space-y-2">
            {/* 1. Blockades Rule */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#141F38] border border-white/[0.06]">
              <div className="pr-2">
                <div className="text-xs font-bold text-white">{strings.blockRule}</div>
                <div className="text-[10px] text-slate-400">
                  Two same-color tokens block opponents from passing or capturing
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setRules((r) => ({ ...r, blockadesEnabled: !r.blockadesEnabled }))
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  rules.blockadesEnabled ? 'bg-[#43A047] text-white shadow' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {rules.blockadesEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* 2. Bonus on Capture */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#141F38] border border-white/[0.06]">
              <div className="pr-2">
                <div className="text-xs font-bold text-white">{strings.bonusOnCapture}</div>
                <div className="text-[10px] text-slate-400">
                  Capturing an opponent token grants an immediate extra roll
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setRules((r) => ({ ...r, extraTurnOnCapture: !r.extraTurnOnCapture }))
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  rules.extraTurnOnCapture ? 'bg-[#43A047] text-white shadow' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {rules.extraTurnOnCapture ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* 3. Must Roll 6 to Start */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#141F38] border border-white/[0.06]">
              <div className="pr-2">
                <div className="text-xs font-bold text-white">{strings.rollSixToStart}</div>
                <div className="text-[10px] text-slate-400">
                  Tokens can only leave base when rolling a 6
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setRules((r) => ({ ...r, mustRollSixToStart: !r.mustRollSixToStart }))
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  rules.mustRollSixToStart ? 'bg-[#43A047] text-white shadow' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {rules.mustRollSixToStart ? 'YES' : 'NO'}
              </button>
            </div>

            {/* 4. Exact Roll to Finish */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#141F38] border border-white/[0.06]">
              <div className="pr-2">
                <div className="text-xs font-bold text-white">{strings.exactFinish}</div>
                <div className="text-[10px] text-slate-400">
                  Exact roll needed to land on the center finish triangle
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setRules((r) => ({ ...r, exactFinishRequired: !r.exactFinishRequired }))
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  rules.exactFinishRequired ? 'bg-[#43A047] text-white shadow' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {rules.exactFinishRequired ? 'YES' : 'NO'}
              </button>
            </div>
          </div>
        </div>

        {/* Big Start Game Button */}
        <button
          type="button"
          onClick={handleStart}
          className="w-full py-4 px-6 rounded-3xl bg-gradient-to-r from-[#43A047] to-[#2E7D32] hover:from-[#4CAF50] hover:to-[#388E3C] text-white font-black text-base inline-flex items-center justify-center gap-2.5 shadow-[0_10px_25px_rgba(67,160,71,0.4)] transition-transform hover:scale-102 active:scale-98 cursor-pointer"
        >
          <Play className="w-5 h-5 fill-white" /> {strings.startGame}
        </button>
      </div>
    </div>
  );
};
