import React from 'react';
import { HiLoSuit } from '@nova/types';

export const PokerSuitVector: React.FC<{ suit: HiLoSuit; className?: string }> = ({
  suit,
  className = 'w-4 h-4',
}) => {
  const fill = suit === 'HEARTS' || suit === 'DIAMONDS' ? '#dc2626' : '#0f172a';
  return (
    <svg viewBox="0 0 24 24" className={className} fill={fill} xmlns="http://www.w3.org/2000/svg">
      {suit === 'HEARTS' && (
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      )}
      {suit === 'DIAMONDS' && (
        <path d="M12 1.5 Q15.2 8 20.5 12 Q15.2 16 12 22.5 Q8.8 16 3.5 12 Q8.8 8 12 1.5 Z" />
      )}
      {suit === 'SPADES' && (
        <path d="M12 2C9 6.5 3.5 10.5 3.5 14.5C3.5 17.3 5.8 19 8.2 19C9.7 19 10.8 18.2 11.5 17.1L10 22H14L12.5 17.1C13.2 18.2 14.3 19 15.8 19C18.2 19 20.5 17.3 20.5 14.5C20.5 10.5 15 6.5 12 2Z" />
      )}
      {suit === 'CLUBS' && (
        <path d="M12 2.5C9.8 2.5 8 4.3 8 6.5C8 7.5 8.4 8.4 9 9.1C6.2 9.1 4 11.3 4 14C4 16.5 6 18.4 8.4 18.4C9.8 18.4 11 17.7 11.7 16.7L10 22H14L12.3 16.7C13 17.7 14.2 18.4 15.6 18.4C18 18.4 20 16.5 20 14C20 11.3 17.8 9.1 15 9.1C15.6 8.4 16 7.5 16 6.5C16 4.3 14.2 2.5 12 2.5Z" />
      )}
    </svg>
  );
};

/**
 * Traditional Symmetrical Double-Headed Court Artwork (Jack, Queen, King)
 * Matches classic Bicycle/Royal Poker Deck aesthetic
 */
export const PokerCourtIllustration: React.FC<{
  rank: number; // 11=J, 12=Q, 13=K
  suit: HiLoSuit;
  className?: string;
}> = ({ rank, suit, className = 'w-full h-full' }) => {
  const isRedSuit = suit === 'HEARTS' || suit === 'DIAMONDS';
  const suitColor = isRedSuit ? '#dc2626' : '#0f172a';
  const primaryRobe = isRedSuit ? '#b91c1c' : '#1e293b';
  const secondaryRobe = isRedSuit ? '#1d4ed8' : '#b91c1c';
  const gold = '#eab308';

  const renderHalfPortrait = (isInverted: boolean) => (
    <g transform={isInverted ? 'rotate(180 60 85)' : undefined}>
      {/* Top-left inner frame suit pip */}
      <g transform="translate(8, 8) scale(0.95)">
        {suit === 'HEARTS' && (
          <path
            fill={suitColor}
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />
        )}
        {suit === 'DIAMONDS' && (
          <path
            fill={suitColor}
            d="M12 1.5 Q15.2 8 20.5 12 Q15.2 16 12 22.5 Q8.8 16 3.5 12 Q8.8 8 12 1.5 Z"
          />
        )}
        {suit === 'SPADES' && (
          <path
            fill={suitColor}
            d="M12 2C9 6.5 3.5 10.5 3.5 14.5C3.5 17.3 5.8 19 8.2 19C9.7 19 10.8 18.2 11.5 17.1L10 22H14L12.5 17.1C13.2 18.2 14.3 19 15.8 19C18.2 19 20.5 17.3 20.5 14.5C20.5 10.5 15 6.5 12 2Z"
          />
        )}
        {suit === 'CLUBS' && (
          <path
            fill={suitColor}
            d="M12 2.5C9.8 2.5 8 4.3 8 6.5C8 7.5 8.4 8.4 9 9.1C6.2 9.1 4 11.3 4 14C4 16.5 6 18.4 8.4 18.4C9.8 18.4 11 17.7 11.7 16.7L10 22H14L12.3 16.7C13 17.7 14.2 18.4 15.6 18.4C18 18.4 20 16.5 20 14C20 11.3 17.8 9.1 15 9.1C15.6 8.4 16 7.5 16 6.5C16 4.3 14.2 2.5 12 2.5Z"
          />
        )}
      </g>

      {/* Head & Crown / Cap */}
      <g stroke="#0f172a" strokeWidth="1.6" strokeLinejoin="round">
        {/* Hair */}
        <path
          d="M 46 24 C 41 28 38 38 38 46 L 48 46 Z"
          fill={gold}
        />
        <path
          d="M 74 24 C 79 28 82 38 82 46 L 72 46 Z"
          fill={gold}
        />

        {/* Face */}
        <path
          d="M 48 24 L 74 24 L 76 38 Q 76 46 66 47 L 50 47 Q 46 38 48 24 Z"
          fill="#ffffff"
        />
        {/* Eye & Nose & Mustache/Lips */}
        <path d="M 65 30 Q 69 29 71 31" fill="none" stroke="#0f172a" strokeWidth="1.2" />
        <circle cx="67.5" cy="32.5" r="1.2" fill="#0f172a" stroke="none" />
        <path d="M 74 33 L 77 37 L 74 39" fill="none" stroke="#0f172a" strokeWidth="1.2" />
        {rank === 11 && (
          <path d="M 67 41 Q 71 39 74 42" fill="none" stroke="#0f172a" strokeWidth="1.3" />
        )}
        {rank === 13 && (
          /* King Beard */
          <path d="M 52 40 Q 64 50 74 42 Q 66 48 56 46 Z" fill={gold} />
        )}

        {/* Headgear: Jack Cap / Queen Crown / King Crown */}
        {rank === 11 && (
          <g>
            <path d="M 41 10 L 82 10 L 76 24 L 46 24 Z" fill="#dc2626" />
            <line x1="55" y1="10" x2="55" y2="24" stroke="#0f172a" strokeWidth="1.4" />
            <line x1="67" y1="10" x2="67" y2="24" stroke="#0f172a" strokeWidth="1.4" />
            <rect x="45" y="21" width="32" height="3.5" fill={gold} />
          </g>
        )}
        {rank === 12 && (
          <g>
            <path d="M 45 24 L 44 11 L 54 17 L 61 7 L 68 17 L 78 11 L 76 24 Z" fill={gold} />
            <circle cx="61" cy="17" r="2.2" fill="#dc2626" />
            <rect x="45" y="21" width="31" height="3.5" fill="#dc2626" />
          </g>
        )}
        {rank === 13 && (
          <g>
            <path d="M 44 24 L 42 9 L 52 16 L 61 5 L 70 16 L 80 9 L 77 24 Z" fill={gold} />
            <rect x="44" y="20" width="33" height="4" fill="#dc2626" />
            <circle cx="52" cy="22" r="1.4" fill={gold} stroke="none" />
            <circle cx="61" cy="22" r="1.4" fill={gold} stroke="none" />
            <circle cx="70" cy="22" r="1.4" fill={gold} stroke="none" />
          </g>
        )}

        {/* Royal Weapon / Scepter / Rosette Held at Right */}
        {rank === 11 && (
          <g transform="translate(89, 14)">
            <ellipse cx="7" cy="10" rx="5" ry="7" fill={gold} />
            <ellipse cx="7" cy="24" rx="5" ry="7" fill={gold} />
            <rect x="5" y="31" width="4" height="10" fill={gold} />
            {/* Small holding hand */}
            <rect x="2" y="38" width="9" height="6" rx="2" fill="#ffffff" />
          </g>
        )}
        {rank === 12 && (
          <g transform="translate(88, 16)">
            <circle cx="8" cy="12" r="7" fill="#dc2626" />
            <circle cx="8" cy="12" r="3" fill={gold} />
            <line x1="8" y1="19" x2="8" y2="38" stroke="#16a34a" strokeWidth="2.5" />
            <rect x="3" y="36" width="9" height="6" rx="2" fill="#ffffff" />
          </g>
        )}
        {rank === 13 && (
          <g transform="translate(88, 8)">
            <polygon points="8,0 11,6 11,36 5,36 5,6" fill="#cbd5e1" />
            <rect x="2" y="34" width="12" height="3.5" fill={gold} />
            <rect x="3" y="38" width="9" height="6" rx="2" fill="#ffffff" />
          </g>
        )}

        {/* Royal Shoulders & Ornate Tunic */}
        <path
          d="M 4 58 L 46 47 L 76 47 L 116 68 L 116 85 L 4 85 Z"
          fill={primaryRobe}
        />
        {/* Diagonal Gold Sash */}
        <path d="M 22 85 L 70 47 L 82 51 L 38 85 Z" fill={gold} />
        {/* Secondary Geometric Tunic Panel */}
        <path d="M 4 64 L 36 85 L 4 85 Z" fill={secondaryRobe} />
        <path d="M 78 55 L 116 74 L 116 85 L 60 85 Z" fill={secondaryRobe} />
        {/* Ornate Filigree Dots & Collar */}
        <rect x="46" y="47" width="28" height="6" fill={gold} />
        <circle cx="60" cy="60" r="3.5" fill="#ffffff" />
        <circle cx="26" cy="70" r="3" fill={gold} />
        <circle cx="94" cy="74" r="3" fill={gold} />
        <path d="M 14 80 Q 30 62 46 80" fill="none" stroke={gold} strokeWidth="2.5" />
      </g>
    </g>
  );

  return (
    <svg
      viewBox="0 0 120 170"
      className={`${className} border border-[#0f172a] bg-white rounded-[3px] overflow-hidden`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top Upright Half */}
      {renderHalfPortrait(false)}
      {/* Bottom Inverted Symmetrical Half */}
      {renderHalfPortrait(true)}
      {/* Center Belt / Shield Divider */}
      <g stroke="#0f172a" strokeWidth="1.5">
        <line x1="0" y1="85" x2="120" y2="85" stroke="#0f172a" strokeWidth="1.4" />
        <rect x="48" y="80" width="24" height="10" rx="3" fill="#eab308" />
      </g>
    </svg>
  );
};
