import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  X,
  Trophy,
  ShieldCheck,
  CheckCircle2,
  Lightbulb,
  ChevronRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { GAME_RULES_DOCS, GameRuleDoc } from '../../config/gameRules';
import { GAMES_CATALOG } from '../../config/games';

export interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultGameId?: string;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
  isOpen,
  onClose,
  defaultGameId = 'tic-tac-toe',
}) => {
  const [selectedGameId, setSelectedGameId] = useState<string>(defaultGameId);
  const [activeTab, setActiveTab] = useState<'STEPS' | 'WINNING' | 'TIPS'>('STEPS');

  useEffect(() => {
    if (defaultGameId && GAME_RULES_DOCS[defaultGameId]) {
      setSelectedGameId(defaultGameId);
    }
  }, [defaultGameId, isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentRule: GameRuleDoc =
    GAME_RULES_DOCS[selectedGameId] || GAME_RULES_DOCS['tic-tac-toe'];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-to-play-title"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl max-h-[92vh] flex flex-col bg-[#0b101d] border border-slate-800 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden"
      >
        {/* MODAL HEADER */}
        <div className="relative p-4 sm:p-5 border-b border-slate-800/90 bg-gradient-to-r from-[#11192e] via-[#0e1424] to-[#0a0f1b] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl p-0.5 flex items-center justify-center shadow-lg"
              style={{
                backgroundColor: currentRule.accentColor + '20',
                borderColor: currentRule.accentColor + '60',
                borderWidth: '1px',
              }}
            >
              <HelpCircle className="w-5 h-5" style={{ color: currentRule.accentColor }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="how-to-play-title"
                  className="text-base sm:text-lg font-black text-white tracking-wide"
                >
                  {currentRule.name}
                </h2>
                <span
                  className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full border"
                  style={{
                    color: currentRule.accentColor,
                    borderColor: currentRule.accentColor + '40',
                    backgroundColor: currentRule.accentColor + '15',
                  }}
                >
                  {currentRule.rtpOrPayout}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-1">
                {currentRule.tagline}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-400 hover:text-white flex items-center justify-center hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QUICK GAME SWITCHER CHIP BAR */}
        <div className="px-3 sm:px-4 py-2 border-b border-slate-800/70 bg-[#070b14] overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
            Game:
          </span>
          {GAMES_CATALOG.map((g) => {
            const isSelected = g.id === selectedGameId;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGameId(g.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-slate-800 text-white border-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.3)]'
                    : 'bg-[#0d1322] text-slate-400 border-slate-800/80 hover:text-slate-200'
                }`}
              >
                {g.shortName}
              </button>
            );
          })}
        </div>

        {/* TAB CONTROLS */}
        <div className="grid grid-cols-3 gap-1 p-2 bg-[#0a0f1b] border-b border-slate-800/80 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('STEPS')}
            className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'STEPS'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Rules</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('WINNING')}
            className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'WINNING'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Payouts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TIPS')}
            className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'TIPS'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Pro Tips</span>
          </button>
        </div>

        {/* MODAL CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-slate-300 text-xs sm:text-sm">
          {/* TAB 1: STEP-BY-STEP RULES */}
          {activeTab === 'STEPS' && (
            <div className="space-y-4">
              <div className="p-3 sm:p-3.5 rounded-2xl bg-[#0e1628] border border-slate-800 text-slate-300 leading-relaxed">
                <span className="text-[10px] uppercase font-bold text-cyan-400 block mb-1">
                  Overview
                </span>
                {currentRule.overview}
              </div>

              {/* Special Tic-Tac-Toe Visual 3-in-a-row diagram */}
              {selectedGameId === 'tic-tac-toe' && (
                <div className="p-3.5 rounded-2xl bg-[#0e1628] border border-cyan-500/30 space-y-2">
                  <span className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    How to Win: Form 3 in a Row
                  </span>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">Horizontal</span>
                      <div className="font-mono text-xs font-bold text-cyan-400">
                        X | X | X<br />—+—+—<br />&nbsp;&nbsp;|&nbsp;&nbsp;|&nbsp;&nbsp;<br />—+—+—<br />&nbsp;&nbsp;|&nbsp;&nbsp;|&nbsp;&nbsp;
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">Vertical</span>
                      <div className="font-mono text-xs font-bold text-cyan-400">
                        X |&nbsp;&nbsp;|&nbsp;&nbsp;<br />—+—+—<br />X |&nbsp;&nbsp;|&nbsp;&nbsp;<br />—+—+—<br />X |&nbsp;&nbsp;|&nbsp;&nbsp;
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">Diagonal</span>
                      <div className="font-mono text-xs font-bold text-cyan-400">
                        X |&nbsp;&nbsp;|&nbsp;&nbsp;<br />—+—+—<br />&nbsp;&nbsp;| X |&nbsp;&nbsp;<br />—+—+—<br />&nbsp;&nbsp;|&nbsp;&nbsp;| X
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2.5">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider block px-1">
                  How to Play (Step by Step):
                </span>
                {currentRule.howToPlaySteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-[#090f1d] border border-slate-800/80 flex items-start gap-3"
                  >
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs sm:text-sm mb-0.5">
                        {step.title}
                      </h4>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: WINNING & PAYOUTS */}
          {activeTab === 'WINNING' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider block px-1">
                  Winning Conditions:
                </span>
                <div className="space-y-2">
                  {currentRule.winningConditions.map((win, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-[#090f1d] border border-emerald-500/30 flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-300 font-medium">{win}</span>
                    </div>
                  ))}
                </div>
              </div>

              {currentRule.drawOrRefundRules && (
                <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-200">
                  <span className="text-xs font-black uppercase tracking-wider mb-1 flex items-center gap-1.5 text-amber-300">
                    <ShieldCheck className="w-4 h-4" />
                    Draw & Refund Guarantee
                  </span>
                  <p className="text-xs leading-relaxed">{currentRule.drawOrRefundRules}</p>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-[#0e1628] border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Payouts & Settlements
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentRule.payoutExplanation}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: PRO TIPS */}
          {activeTab === 'TIPS' && (
            <div className="space-y-3">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider block px-1">
                Strategy & Expert Tips:
              </span>
              {currentRule.proTips.map((tip, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-gradient-to-r from-[#0d1628] to-[#0a101d] border border-cyan-500/30 flex items-start gap-3 shadow-md"
                >
                  <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[11px] font-bold text-cyan-300 block mb-0.5">
                      Tip #{idx + 1}
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">{tip}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-[#070b14] flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fair Play Guaranteed</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(0,229,255,0.4)]"
          >
            Got it, Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
};
