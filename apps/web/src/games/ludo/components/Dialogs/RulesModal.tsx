import React from 'react';
import { BookOpen, ShieldCheck, Sparkles, Star, Swords, Target, X } from 'lucide-react';

export interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const rules = [
    {
      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
      title: '1. Leaving the Yard',
      desc: 'All tokens start in your colored base yard. Roll a 6 (or any roll if casual entry is enabled) to deploy a token onto your colored start square.',
    },
    {
      icon: <span className="text-xl">🎲</span>,
      title: '2. Rolling a 6 = Extra Turn',
      desc: 'Rolling a 6 grants an immediate extra roll! However, rolling three consecutive sixes cancels the third roll and passes turn clockwise.',
    },
    {
      icon: <Swords className="w-5 h-5 text-rose-400" />,
      title: '3. Capturing Opponents',
      desc: 'Landing on an opponent’s lone token on any regular track square captures it, sending it flying back to its base yard and granting you a bonus roll.',
    },
    {
      icon: <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />,
      title: '4. Safe Star Squares',
      desc: 'Squares marked with a Star and all four starting squares are completely safe. Opponents can share these squares without any captures occurring.',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
      title: '5. Blockades (House Rule)',
      desc: 'When enabled, two or more tokens of the same color on a square form an impenetrable barrier that opponents cannot pass through or land on.',
    },
    {
      icon: <Target className="w-5 h-5 text-cyan-400" />,
      title: '6. Home Column & Exact Finish',
      desc: 'After circling the outer track, tokens turn into their private colored home column. An exact roll is required to reach the center triangle. First player to finish all 4 tokens wins!',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-modal-title"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-[#1B2A41] border border-white/10 p-6 space-y-4 shadow-2xl text-left max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 id="rules-modal-title" className="text-base font-black text-white">
              Official Ludo Rules &amp; Guide
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
            aria-label="Close rules dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {rules.map((r, i) => (
            <div
              key={i}
              className="p-3.5 rounded-2xl bg-[#141F38] border border-white/[0.06] flex items-start gap-3"
            >
              <div className="p-2 rounded-xl bg-slate-900 shrink-0 shadow-sm">{r.icon}</div>
              <div>
                <h3 className="text-xs font-black text-white">{r.title}</h3>
                <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-[#43A047] hover:bg-[#388E3C] text-white font-bold text-xs shadow-md transition-transform hover:scale-101 cursor-pointer"
        >
          Got It, Let's Play!
        </button>
      </div>
    </div>
  );
};
