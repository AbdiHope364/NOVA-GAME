import React from 'react';

interface GameThumbnailProps {
  gameId: string;
  compact?: boolean;
}

export const GameThumbnail: React.FC<GameThumbnailProps> = ({ gameId, compact = false }) => {
  const heightCls = compact ? 'h-24 sm:h-28' : 'h-32 sm:h-36';

  switch (gameId) {
    case 'crash':
      return (
        <div className={`relative w-full ${heightCls} rounded-xl overflow-hidden bg-[#131122] flex items-center justify-center`}>
          <svg viewBox="0 0 240 120" className="w-full h-full" aria-hidden="true">
            <defs>
              <linearGradient id="crashGrad" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.85" />
              </linearGradient>
            </defs>
            <path d="M20 98 Q120 92 205 22 L205 98 Z" fill="url(#crashGrad)" opacity="0.35" />
            <path d="M20 98 Q120 92 205 22" fill="none" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" />
            <circle cx="205" cy="22" r="7" fill="#fb7185" />
            <text x="30" y="38" fill="#ffffff" fontSize="22" fontWeight="900" fontFamily="monospace">
              4.82x
            </text>
          </svg>
        </div>
      );

    case 'dice':
      return (
        <div className={`relative w-full ${heightCls} rounded-xl overflow-hidden bg-[#0e1b29] flex items-center justify-center`}>
          <svg viewBox="0 0 240 120" className="w-full h-full" aria-hidden="true">
            <rect x="65" y="26" width="54" height="54" rx="12" fill="#0f172a" stroke="#06b6d4" strokeWidth="3" transform="rotate(-8 92 53)" />
            <circle cx="80" cy="42" r="4" fill="#22d3ee" />
            <circle cx="102" cy="64" r="4" fill="#22d3ee" />
            <circle cx="91" cy="53" r="4" fill="#22d3ee" />
            <rect x="122" y="38" width="54" height="54" rx="12" fill="#172554" stroke="#8b5cf6" strokeWidth="3" transform="rotate(10 149 65)" />
            <circle cx="137" cy="52" r="4" fill="#c4b5fd" />
            <circle cx="160" cy="52" r="4" fill="#c4b5fd" />
            <circle cx="137" cy="76" r="4" fill="#c4b5fd" />
            <circle cx="160" cy="76" r="4" fill="#c4b5fd" />
          </svg>
        </div>
      );

    case 'coin-flip':
      return (
        <div className={`relative w-full ${heightCls} rounded-xl overflow-hidden bg-[#1a1625] flex items-center justify-center`}>
          <svg viewBox="0 0 240 120" className="w-full h-full" aria-hidden="true">
            <circle cx="120" cy="60" r="38" fill="#f59e0b" opacity="0.2" />
            <circle cx="120" cy="60" r="31" fill="#1e1b2e" stroke="#f59e0b" strokeWidth="4" />
            <circle cx="120" cy="60" r="22" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4 3" />
            <text x="120" y="67" textAnchor="middle" fill="#fbbf24" fontSize="22" fontWeight="900">
              N
            </text>
          </svg>
        </div>
      );

    case 'roulette':
      return (
        <div className={`relative w-full ${heightCls} rounded-xl overflow-hidden bg-[#0e1f1c] flex items-center justify-center`}>
          <svg viewBox="0 0 240 120" className="w-full h-full" aria-hidden="true">
            <circle cx="120" cy="60" r="42" fill="#0f172a" stroke="#10b981" strokeWidth="4" />
            <circle cx="120" cy="60" r="30" fill="none" stroke="#ef4444" strokeWidth="8" strokeDasharray="14 14" />
            <circle cx="120" cy="60" r="16" fill="#064e3b" stroke="#34d399" strokeWidth="2.5" />
            <circle cx="138" cy="36" r="4" fill="#ffffff" />
          </svg>
        </div>
      );

    case 'mines':
      return (
        <div className={`relative w-full ${heightCls} rounded-xl overflow-hidden bg-[#161229] flex items-center justify-center`}>
          <svg viewBox="0 0 240 120" className="w-full h-full" aria-hidden="true">
            {[0, 1, 2].map((r) =>
              [0, 1, 2].map((c) => {
                const x = 75 + c * 32;
                const y = 18 + r * 30;
                const isGem = (r === 0 && c === 1) || (r === 1 && c === 2) || (r === 2 && c === 0);
                return (
                  <g key={`${r}-${c}`}>
                    <rect
                      x={x}
                      y={y}
                      width="26"
                      height="24"
                      rx="6"
                      fill={isGem ? '#2e1065' : '#1e293b'}
                      stroke={isGem ? '#8b5cf6' : '#334155'}
                      strokeWidth="1.5"
                    />
                    {isGem && (
                      <polygon
                        points={`${x + 13},${y + 5} ${x + 19},${y + 12} ${x + 13},${y + 19} ${x + 7},${y + 12}`}
                        fill="#22d3ee"
                      />
                    )}
                  </g>
                );
              })
            )}
          </svg>
        </div>
      );

    case 'limbo':
      return (
        <div className={`relative w-full ${heightCls} rounded-xl overflow-hidden bg-[#141026] flex items-center justify-center`}>
          <svg viewBox="0 0 240 120" className="w-full h-full" aria-hidden="true">
            <circle cx="120" cy="60" r="40" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="6 6" />
            <path d="M55 92 C90 78, 130 58, 182 26" fill="none" stroke="#06b6d4" strokeWidth="3.5" strokeLinecap="round" />
            <polygon points="184,24 170,27 178,37" fill="#22d3ee" />
            <text x="45" y="42" fill="#e9d5ff" fontSize="18" fontWeight="900" fontFamily="monospace">
              100.0x
            </text>
          </svg>
        </div>
      );

    case 'plinko':
      return (
        <div className={`relative w-full ${heightCls} rounded-xl overflow-hidden bg-[#1a1423] flex items-center justify-center`}>
          <svg viewBox="0 0 240 120" className="w-full h-full" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((row) =>
              Array.from({ length: row + 2 }, (_, col) => {
                const startX = 120 - ((row + 1) * 18) / 2;
                return (
                  <circle
                    key={`${row}-${col}`}
                    cx={startX + col * 18}
                    cy={22 + row * 16}
                    r="3"
                    fill="#94a3b8"
                  />
                );
              })
            )}
            <circle cx="120" cy="22" r="5" fill="#f97316" />
            <rect x="65" y="96" width="24" height="14" rx="4" fill="#8b5cf6" />
            <rect x="94" y="96" width="24" height="14" rx="4" fill="#06b6d4" />
            <rect x="123" y="96" width="24" height="14" rx="4" fill="#06b6d4" />
            <rect x="152" y="96" width="24" height="14" rx="4" fill="#8b5cf6" />
          </svg>
        </div>
      );

    case 'bingo':
      return (
        <div className={`relative w-full ${heightCls} rounded-xl overflow-hidden bg-[#0f1a2c] flex items-center justify-center`}>
          <svg viewBox="0 0 240 120" className="w-full h-full" aria-hidden="true">
            <circle cx="72" cy="48" r="20" fill="#0ea5e9" stroke="#e0f2fe" strokeWidth="2.5" />
            <text x="72" y="54" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="900">B12</text>
            <circle cx="120" cy="64" r="22" fill="#8b5cf6" stroke="#ede9fe" strokeWidth="2.5" />
            <text x="120" y="70" textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="900">N41</text>
            <circle cx="168" cy="46" r="20" fill="#10b981" stroke="#d1fae5" strokeWidth="2.5" />
            <text x="168" y="52" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="900">G58</text>
          </svg>
        </div>
      );

    case 'hilo':
      return (
        <div className={`relative w-full ${heightCls} rounded-xl overflow-hidden bg-[#0e1b28] flex items-center justify-center`}>
          <svg viewBox="0 0 240 120" className="w-full h-full" aria-hidden="true">
            <rect x="74" y="24" width="44" height="64" rx="8" fill="#1e293b" stroke="#06b6d4" strokeWidth="2.5" transform="rotate(-7 96 56)" />
            <text x="86" y="50" fill="#22d3ee" fontSize="18" fontWeight="900">A♠</text>
            <rect x="122" y="28" width="44" height="64" rx="8" fill="#1e1b3a" stroke="#8b5cf6" strokeWidth="2.5" transform="rotate(7 144 60)" />
            <text x="134" y="54" fill="#c4b5fd" fontSize="18" fontWeight="900">K♥</text>
          </svg>
        </div>
      );

    case 'dama':
      return (
        <div className={`relative w-full ${heightCls} rounded-xl overflow-hidden bg-[#191614] flex items-center justify-center`}>
          <svg viewBox="0 0 240 120" className="w-full h-full" aria-hidden="true">
            {[0, 1, 2, 3].map((r) =>
              [0, 1, 2, 3].map((c) => (
                <rect
                  key={`${r}-${c}`}
                  x={72 + c * 24}
                  y={14 + r * 23}
                  width="24"
                  height="23"
                  fill={(r + c) % 2 === 0 ? '#292524' : '#44403c'}
                />
              ))
            )}
            <circle cx="108" cy="25" r="7" fill="#f59e0b" stroke="#fde68a" strokeWidth="2" />
            <circle cx="132" cy="72" r="7" fill="#0f172a" stroke="#94a3b8" strokeWidth="2" />
            <circle cx="84" cy="48" r="7" fill="#f59e0b" stroke="#fde68a" strokeWidth="2" />
          </svg>
        </div>
      );

    case 'ludo':
      return (
        <div className={`relative w-full ${heightCls} rounded-xl overflow-hidden bg-[#131122] flex items-center justify-center`}>
          <svg viewBox="0 0 240 120" className="w-full h-full" aria-hidden="true">
            <rect x="78" y="16" width="84" height="84" rx="10" fill="#1E1B2E" stroke="#475569" strokeWidth="2" />
            <rect x="82" y="20" width="30" height="30" rx="5" fill="#F43F5E" opacity="0.85" />
            <rect x="128" y="20" width="30" height="30" rx="5" fill="#22C55E" opacity="0.85" />
            <rect x="82" y="66" width="30" height="30" rx="5" fill="#22D3EE" opacity="0.85" />
            <rect x="128" y="66" width="30" height="30" rx="5" fill="#FBBF24" opacity="0.85" />
            <polygon points="112,50 128,50 120,58" fill="#22C55E" />
            <polygon points="112,66 128,66 120,58" fill="#22D3EE" />
            <polygon points="112,50 112,66 120,58" fill="#F43F5E" />
            <polygon points="128,50 128,66 120,58" fill="#FBBF24" />
          </svg>
        </div>
      );

    case 'chess':
      return (
        <div className={`relative w-full ${heightCls} rounded-xl overflow-hidden bg-[#15122b] flex items-center justify-center`}>
          <svg viewBox="0 0 240 120" className="w-full h-full" aria-hidden="true">
            {[0, 1, 2, 3].map((r) =>
              [0, 1, 2, 3].map((c) => (
                <rect
                  key={`c-${r}-${c}`}
                  x={72 + c * 24}
                  y={14 + r * 23}
                  width="24"
                  height="23"
                  fill={(r + c) % 2 === 0 ? '#DDD6F3' : '#5B4E8A'}
                  opacity="0.92"
                />
              ))
            )}
            <text x="108" y="69" textAnchor="middle" fill="#1E1B2E" fontSize="28" fontWeight="900">
              ♔
            </text>
            <text x="132" y="47" textAnchor="middle" fill="#8B5CF6" fontSize="26" fontWeight="900">
              ♞
            </text>
          </svg>
        </div>
      );

    case 'letti':
    default:
      return (
        <div className={`relative w-full ${heightCls} rounded-xl overflow-hidden bg-[#14132a] flex items-center justify-center`}>
          <svg viewBox="0 0 240 120" className="w-full h-full" aria-hidden="true">
            <rect x="66" y="24" width="44" height="64" rx="8" fill="#1e1b4b" stroke="#8b5cf6" strokeWidth="2.5" transform="rotate(-10 88 56)" />
            <text x="86" y="62" textAnchor="middle" fill="#a78bfa" fontSize="20" fontWeight="900">?</text>
            <rect x="130" y="26" width="44" height="64" rx="8" fill="#0f172a" stroke="#06b6d4" strokeWidth="2.5" transform="rotate(10 152 58)" />
            <text x="142" y="54" fill="#22d3ee" fontSize="16" fontWeight="900">Q♦</text>
          </svg>
        </div>
      );
  }
};
