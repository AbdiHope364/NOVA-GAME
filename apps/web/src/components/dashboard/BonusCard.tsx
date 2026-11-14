import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, FileText, Gift, Lock, X } from 'lucide-react';

interface BonusCardProps {
  campaign?: any;
  welcomeBonus?: any;
  withdrawalEligibility?: any;
  bonusBalanceEtb?: number;
  loading?: boolean;
}

export const BonusCard: React.FC<BonusCardProps> = ({
  campaign,
  welcomeBonus,
  withdrawalEligibility,
  bonusBalanceEtb = 0,
  loading = false,
}) => {
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    if (!showTerms) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowTerms(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showTerms]);

  if (loading) {
    return <div className="h-56 rounded-2xl bg-[#24213A] animate-pulse" />;
  }

  const bonusPercent = campaign?.bonusPercent ?? 1000;
  const credited = welcomeBonus?.bonusAmountReceivedEtb ?? 0;
  const remaining = welcomeBonus?.remainingBonusEtb ?? bonusBalanceEtb;
  const wagered = welcomeBonus?.wageredEtb ?? 0;
  const target = welcomeBonus?.wagerTargetEtb ?? 0;
  const progress = welcomeBonus?.progressPercent ?? 0;
  const expiresAt = welcomeBonus?.expiresAt
    ? new Date(welcomeBonus.expiresAt).toLocaleDateString()
    : null;
  const firstDepositOk = Boolean(withdrawalEligibility?.firstDepositCompleted);

  return (
    <>
      <div className="rounded-2xl bg-[#24213A] border border-[#8B5CF6]/30 p-5 flex flex-col justify-between gap-4 shadow-lg">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] text-[11px] font-bold">
                <Gift className="w-3.5 h-3.5" /> Promotional Offer
              </div>
              <h3 className="text-lg font-bold text-white">{bonusPercent}% Welcome Bonus</h3>
              <p className="text-xs text-[#A8A3BC]">
                Explore eligible games with your promotional bonus.
              </p>
            </div>
            <Link to="/bonuses" className="text-xs font-bold text-[#22D3EE] hover:underline shrink-0">
              Details
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="rounded-xl bg-[#11101D] p-3 border border-white/[0.06]">
              <span className="text-[11px] text-[#A8A3BC] block">Bonus Credited</span>
              <strong className="text-sm font-mono font-bold text-white">
                {credited.toLocaleString()} ETB
              </strong>
            </div>
            <div className="rounded-xl bg-[#11101D] p-3 border border-white/[0.06]">
              <span className="text-[11px] text-[#A8A3BC] block">Current Bonus</span>
              <strong className="text-sm font-mono font-bold text-[#8B5CF6]">
                {remaining.toLocaleString()} ETB
              </strong>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#A8A3BC]">Wagering Progress</span>
              <span className="font-mono font-bold text-white">
                {wagered.toLocaleString()} / {target.toLocaleString()} ETB ({progress}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#11101D] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] transition-all duration-300"
                style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
            <span
              className={`inline-flex items-center gap-1 font-semibold ${
                firstDepositOk ? 'text-[#22C55E]' : 'text-orange-300'
              }`}
            >
              {firstDepositOk ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              {firstDepositOk ? 'First Deposit Verified' : 'First Real Deposit Required'}
            </span>
            {expiresAt && <span className="text-[#A8A3BC]">Expires: {expiresAt}</span>}
          </div>
        </div>

        <div className="space-y-2.5 pt-2 border-t border-white/[0.06]">
          <div className="flex items-start gap-2 text-[11px] text-[#A8A3BC]">
            <Lock className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
            <span>
              Promotional credit is non-withdrawable. Winnings unlock only after a confirmed first deposit and wagering completion.
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowTerms(true)}
            className="w-full py-2 px-3 rounded-xl bg-[#11101D] hover:bg-[#1B1930] border border-white/[0.08] text-xs font-bold text-white inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[#8B5CF6]" /> Terms &amp; Conditions
          </button>
        </div>
      </div>

      {showTerms && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowTerms(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Welcome Bonus Terms and Conditions"
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#24213A] border border-white/10 p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="text-base font-bold text-white">{bonusPercent}% Welcome Bonus Terms</h4>
              <button
                type="button"
                onClick={() => setShowTerms(false)}
                aria-label="Close terms modal"
                className="w-8 h-8 rounded-full bg-[#11101D] text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="space-y-2 text-xs text-[#A8A3BC] leading-relaxed list-disc pl-4">
              <li>
                Bonus credit ({campaign?.bonusPercent ?? 1000}% up to {campaign?.maxBonusEtb ?? 100} ETB) is promotional play credit and cannot be directly withdrawn.
              </li>
              <li>
                Bonus-derived winnings stay locked until qualifying first deposit and {campaign?.wageringMultiplier ?? 5}x wagering complete.
              </li>
              <li>Minimum first real-money deposit: {campaign?.minDepositEtb ?? 50} ETB.</li>
              <li>Legitimate deposited cash funds are never confiscated because of an unused promotional bonus.</li>
            </ul>
            <button
              type="button"
              onClick={() => setShowTerms(false)}
              className="w-full py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-violet-500 text-white text-xs font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
