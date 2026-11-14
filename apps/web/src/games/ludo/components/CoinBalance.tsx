import React, { useEffect, useRef, useState } from 'react';

export interface CoinBalanceProps {
  balance: number;
  stakeEtb?: number;
  className?: string;
}

export const GoldCoinIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 20,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.9)] ${className || ''}`}
    aria-hidden="true"
  >
    {/* Outer Gold Ring */}
    <circle cx="12" cy="12" r="11" fill="url(#coin_gold_rim)" stroke="#B45309" strokeWidth="1" />
    {/* Inner Coin Well */}
    <circle cx="12" cy="12" r="8.5" fill="url(#coin_gold_face)" stroke="#D97706" strokeWidth="0.8" />
    {/* Stamped Star/Emblem */}
    <path
      d="M12 6L13.5 9.5L17.2 9.8L14.3 12.2L15.2 15.8L12 13.8L8.8 15.8L9.7 12.2L6.8 9.8L10.5 9.5L12 6Z"
      fill="#FEF08A"
      stroke="#B45309"
      strokeWidth="0.5"
    />
    <defs>
      <radialGradient id="coin_gold_rim" cx="30%" cy="25%" r="75%">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="45%" stopColor="#FACC15" />
        <stop offset="80%" stopColor="#EAB308" />
        <stop offset="100%" stopColor="#B45309" />
      </radialGradient>
      <radialGradient id="coin_gold_face" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FEF9C3" />
        <stop offset="50%" stopColor="#FDE047" />
        <stop offset="85%" stopColor="#EAB308" />
        <stop offset="100%" stopColor="#CA8A04" />
      </radialGradient>
    </defs>
  </svg>
);

export const CoinBalance: React.FC<CoinBalanceProps> = ({
  balance,
  stakeEtb = 0,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState<number>(balance);
  const [flashState, setFlashState] = useState<'increase' | 'decrease' | null>(null);
  const prevBalanceRef = useRef<number>(balance);

  useEffect(() => {
    if (prevBalanceRef.current === balance) return;

    const start = prevBalanceRef.current;
    const end = balance;
    const isIncrease = end > start;

    setFlashState(isIncrease ? 'increase' : 'decrease');
    const flashTimer = setTimeout(() => setFlashState(null), 600);

    const duration = 400;
    const startTime = performance.now();
    let animationFrameId: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * ease);

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        prevBalanceRef.current = end;
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      clearTimeout(flashTimer);
      cancelAnimationFrame(animationFrameId);
    };
  }, [balance]);

  // Display raw value like screenshot: 10400
  const formattedBalance = displayValue;

  return (
    <div
      className={`flex items-center gap-1.5 select-none pointer-events-none ${className}`}
      aria-label={`Player coin balance: ${formattedBalance}`}
    >
      {/* 20px Gold Coin Icon */}
      <GoldCoinIcon size={20} />

      {/* Bold White Number with Dark Shadow (no pill, no box, exactly like screenshot) */}
      <span
        className={`text-[15px] sm:text-[16px] font-black tracking-normal leading-none transition-colors duration-200 ${
          flashState === 'increase'
            ? 'text-emerald-400'
            : flashState === 'decrease'
            ? 'text-rose-400'
            : 'text-white'
        }`}
        style={{
          textShadow: '0 1px 3px #000, 0 0 2px #000, 0 2px 4px rgba(0,0,0,0.85)',
        }}
      >
        {formattedBalance}
      </span>

      {/* Subtle Stake indicator if applicable */}
      {stakeEtb > 0 && (
        <span
          className="text-[10px] text-amber-200/80 font-bold ml-1"
          style={{ textShadow: '0 1px 2px #000' }}
        >
          ({stakeEtb} ETB)
        </span>
      )}
    </div>
  );
};
