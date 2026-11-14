import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Search, ShieldCheck, Swords, Wallet } from 'lucide-react';

const FAQS = [
  {
    q: 'How do Telebirr and CBE Birr deposits work?',
    a: 'Go to My Wallet, pick Telebirr or CBE Birr, transfer to the displayed merchant account, enter your phone number and receipt reference, and upload a screenshot. Once verified, your real cash balance updates immediately.',
    category: 'Wallet',
  },
  {
    q: 'Why can I not withdraw my 1000% Welcome Bonus directly?',
    a: 'Promotional bonus credit lets you explore eligible games without upfront risk. Bonus funds are non-withdrawable directly, and bonus-derived winnings unlock only after a confirmed first real-money deposit and wagering completion.',
    category: 'Bonuses',
  },
  {
    q: 'How does Letti Card 1v1 Face-to-Face Multiplayer work?',
    a: 'Both players pick one secret target card from the 52-card deck and confirm Ready. The remaining 50 cards are shuffled with a SHA-256 server seed commitment, and players alternate turns flipping until one player matches their secret rank first.',
    category: 'Games',
  },
  {
    q: 'How can I verify that game outcomes are Provably Fair?',
    a: 'Visit Settings -> Provably Fair Seed Settings to inspect your SHA-256 server seed commitment, customize your client seed, or rotate seeds anytime to reveal previous server seeds.',
    category: 'Fairness',
  },
  {
    q: 'When do I earn my 10 ETB or 20 ETB referral reward?',
    a: 'Your friend must sign up via your referral link and complete a qualifying confirmed first real deposit. Fraud checks automatically reject duplicate self-referrals.',
    category: 'Referrals',
  },
];

export const SupportPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const filteredFaqs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return FAQS;
    return FAQS.filter(
      (f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="rounded-2xl bg-[#111827] border border-slate-800/80 p-5 space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" /> Help &amp; Support Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Find answers about Telebirr/CBE Birr payments, bonus rules, provably fair verification, and 1v1 multiplayer tables.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search help articles..."
            className="w-full bg-[#0b101b] border border-slate-800 focus:border-violet-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link
          to="/wallet"
          className="rounded-2xl bg-[#111827] border border-slate-800/80 hover:border-emerald-500/40 p-4 space-y-1.5 transition-colors"
        >
          <Wallet className="w-5 h-5 text-emerald-400" />
          <div className="text-sm font-bold text-white">Deposit &amp; Withdrawal Help</div>
          <p className="text-xs text-slate-400">Check payment methods, status, and transaction receipts.</p>
        </Link>
        <Link
          to="/settings"
          className="rounded-2xl bg-[#111827] border border-slate-800/80 hover:border-cyan-500/40 p-4 space-y-1.5 transition-colors"
        >
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <div className="text-sm font-bold text-white">Provably Fair Seeds</div>
          <p className="text-xs text-slate-400">Manage your client seed and inspect committed hashes.</p>
        </Link>
        <Link
          to="/multiplayer"
          className="rounded-2xl bg-[#111827] border border-slate-800/80 hover:border-violet-500/40 p-4 space-y-1.5 transition-colors"
        >
          <Swords className="w-5 h-5 text-violet-400" />
          <div className="text-sm font-bold text-white">1v1 Multiplayer Guide</div>
          <p className="text-xs text-slate-400">Explore Letti Face-to-Face and Dama disconnect &amp; forfeit rules.</p>
        </Link>
      </div>

      <div className="rounded-2xl bg-[#111827] border border-slate-800/80 divide-y divide-slate-800/80">
        {filteredFaqs.map((item) => (
          <div key={item.q} className="p-4 sm:p-5 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-white">{item.q}</h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300 shrink-0">
                {item.category}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
