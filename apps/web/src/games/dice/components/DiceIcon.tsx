import React from 'react';

interface DiceIconProps {
  value: number;
  className?: string;
}

export const DiceIcon: React.FC<DiceIconProps> = ({ value, className = 'w-8 h-8' }) => {
  const pipMap: Record<number, [number, number][]> = {
    1: [[12, 12]],
    2: [[6, 6], [18, 18]],
    3: [[6, 6], [12, 12], [18, 18]],
    4: [[6, 6], [18, 6], [6, 18], [18, 18]],
    5: [[6, 6], [18, 6], [12, 12], [6, 18], [18, 18]],
    6: [[6, 6], [18, 6], [6, 12], [18, 12], [6, 18], [18, 18]],
  };

  const pips = pipMap[value] || pipMap[1];

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="4" className="stroke-current fill-slate-900/60" />
      {pips.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2" className="fill-current stroke-none" />
      ))}
    </svg>
  );
};

