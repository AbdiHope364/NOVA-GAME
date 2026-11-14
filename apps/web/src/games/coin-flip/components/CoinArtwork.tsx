import React from 'react';

interface CoinSvgProps {
  className?: string;
  dimmed?: boolean;
}

/**
 * Embossed Gold Coin - HEADS (Winged Spartan Helmet + Laurel Wreath)
 */
export const HeadsCoinSvg: React.FC<CoinSvgProps> = ({ className = 'w-full h-full', dimmed = false }) => (
  <svg
    viewBox="0 0 200 200"
    className={`${className} transition-all duration-300 ${dimmed ? 'brightness-50 saturate-50 contrast-90' : 'drop-shadow-[0_10px_24px_rgba(245,158,11,0.4)]'}`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <radialGradient id="goldBaseH" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FFF2A6" />
        <stop offset="35%" stopColor="#F5C036" />
        <stop offset="75%" stopColor="#B87A14" />
        <stop offset="100%" stopColor="#6E4206" />
      </radialGradient>
      <linearGradient id="goldRimH" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFE985" />
        <stop offset="45%" stopColor="#D99B26" />
        <stop offset="80%" stopColor="#8A560B" />
        <stop offset="100%" stopColor="#F7D060" />
      </linearGradient>
      <radialGradient id="innerFaceH" cx="42%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#FAD662" />
        <stop offset="60%" stopColor="#C98A1B" />
        <stop offset="100%" stopColor="#7A4C08" />
      </radialGradient>
      <linearGradient id="reliefH" x1="20%" y1="0%" x2="80%" y2="100%">
        <stop offset="0%" stopColor="#FFF5BA" />
        <stop offset="50%" stopColor="#DDA028" />
        <stop offset="100%" stopColor="#734507" />
      </linearGradient>
    </defs>

    {/* Outer Beveled Rim */}
    <circle cx="100" cy="100" r="96" fill="url(#goldRimH)" stroke="#523004" strokeWidth="3" />
    <circle cx="100" cy="100" r="87" fill="url(#goldBaseH)" stroke="#7D4E09" strokeWidth="2.5" />
    <circle cx="100" cy="100" r="80" fill="url(#innerFaceH)" stroke="#FFE484" strokeWidth="1.5" strokeOpacity="0.6" />

    {/* Subtle battle-worn rim nicks */}
    <path d="M 32 45 L 40 50 L 36 53 Z" fill="#4A2B03" opacity="0.7" />
    <path d="M 164 148 L 172 142 L 169 152 Z" fill="#4A2B03" opacity="0.7" />

    {/* Laurel Wreath Leaves - Left Arc */}
    <g fill="url(#reliefH)" stroke="#6B4005" strokeWidth="1.2">
      <ellipse cx="42" cy="138" rx="9" ry="4.5" transform="rotate(-55 42 138)" />
      <ellipse cx="34" cy="122" rx="9" ry="4.5" transform="rotate(-70 34 122)" />
      <ellipse cx="30" cy="104" rx="9" ry="4.5" transform="rotate(-85 30 104)" />
      <ellipse cx="31" cy="86" rx="9" ry="4.5" transform="rotate(-100 31 86)" />
      <ellipse cx="37" cy="68" rx="9" ry="4.5" transform="rotate(-118 37 68)" />
      <ellipse cx="48" cy="52" rx="9" ry="4.5" transform="rotate(-135 48 52)" />
      <ellipse cx="64" cy="40" rx="8.5" ry="4" transform="rotate(-152 64 40)" />
    </g>

    {/* Laurel Wreath Leaves - Right Arc */}
    <g fill="url(#reliefH)" stroke="#6B4005" strokeWidth="1.2">
      <ellipse cx="158" cy="138" rx="9" ry="4.5" transform="rotate(55 158 138)" />
      <ellipse cx="166" cy="122" rx="9" ry="4.5" transform="rotate(70 166 122)" />
      <ellipse cx="170" cy="104" rx="9" ry="4.5" transform="rotate(85 170 104)" />
      <ellipse cx="169" cy="86" rx="9" ry="4.5" transform="rotate(100 169 86)" />
      <ellipse cx="163" cy="68" rx="9" ry="4.5" transform="rotate(118 163 68)" />
      <ellipse cx="152" cy="52" rx="9" ry="4.5" transform="rotate(135 152 52)" />
      <ellipse cx="136" cy="40" rx="8.5" ry="4" transform="rotate(152 136 40)" />
    </g>

    {/* Bottom Wreath Tie */}
    <path d="M 54 152 Q 100 172 146 152" fill="none" stroke="#6B4005" strokeWidth="3" strokeLinecap="round" />
    <path d="M 54 151 Q 100 171 146 151" fill="none" stroke="#FCE07A" strokeWidth="1.5" strokeLinecap="round" />

    {/* Centerpiece: Winged Spartan/Knight Helmet & Armor */}
    <g stroke="#5C3604" strokeWidth="2" strokeLinejoin="round">
      {/* Plume Crest */}
      <path
        d="M 88 50 Q 98 28 118 35 Q 112 48 106 54 Z"
        fill="url(#reliefH)"
      />
      {/* Left & Right Wings on Helmet */}
      <path
        d="M 76 80 Q 60 62 66 48 Q 74 60 82 70 Z"
        fill="url(#reliefH)"
      />
      <path
        d="M 122 80 Q 138 62 132 48 Q 124 60 116 70 Z"
        fill="url(#reliefH)"
      />
      {/* Helmet Dome */}
      <path
        d="M 74 96 C 74 62 126 62 126 96 L 122 124 L 106 130 L 100 105 L 94 130 L 78 124 Z"
        fill="url(#reliefH)"
      />
      {/* Visor Eye Slits & Cheek Guard Shadow */}
      <path d="M 82 95 L 96 100 L 94 108 L 80 103 Z" fill="#4D2C03" />
      <path d="M 118 95 L 104 100 L 106 108 L 120 103 Z" fill="#4D2C03" />
      {/* Nasal Guard Ridge */}
      <path d="M 100 72 L 100 115" stroke="#FFE996" strokeWidth="2" />

      {/* Armored Shoulders / Pauldrons */}
      <path
        d="M 58 145 Q 70 124 90 128 L 100 144 L 110 128 Q 130 124 142 145 Q 100 156 58 145 Z"
        fill="url(#reliefH)"
      />
      <path d="M 72 135 Q 100 146 128 135" fill="none" stroke="#5C3604" strokeWidth="2" />
    </g>
  </svg>
);

/**
 * Embossed Gold Coin - TAILS (Warrior / Orc Crest + Laurel Wreath)
 */
export const TailsCoinSvg: React.FC<CoinSvgProps> = ({ className = 'w-full h-full', dimmed = false }) => (
  <svg
    viewBox="0 0 200 200"
    className={`${className} transition-all duration-300 ${dimmed ? 'brightness-50 saturate-50 contrast-90' : 'drop-shadow-[0_10px_24px_rgba(245,158,11,0.45)]'}`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <radialGradient id="goldBaseT" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FFF3AE" />
        <stop offset="35%" stopColor="#F7BE2E" />
        <stop offset="75%" stopColor="#B57510" />
        <stop offset="100%" stopColor="#693E04" />
      </radialGradient>
      <linearGradient id="goldRimT" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFEC8E" />
        <stop offset="45%" stopColor="#DE9E22" />
        <stop offset="80%" stopColor="#855108" />
        <stop offset="100%" stopColor="#F9D566" />
      </linearGradient>
      <radialGradient id="innerFaceT" cx="42%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#FCD866" />
        <stop offset="60%" stopColor="#C48516" />
        <stop offset="100%" stopColor="#754806" />
      </radialGradient>
      <linearGradient id="reliefT" x1="20%" y1="0%" x2="80%" y2="100%">
        <stop offset="0%" stopColor="#FFF7C2" />
        <stop offset="50%" stopColor="#E0A228" />
        <stop offset="100%" stopColor="#6E4105" />
      </linearGradient>
    </defs>

    {/* Outer Beveled Rim */}
    <circle cx="100" cy="100" r="96" fill="url(#goldRimT)" stroke="#4F2D03" strokeWidth="3" />
    <circle cx="100" cy="100" r="87" fill="url(#goldBaseT)" stroke="#7A4B08" strokeWidth="2.5" />
    <circle cx="100" cy="100" r="80" fill="url(#innerFaceT)" stroke="#FFE88C" strokeWidth="1.5" strokeOpacity="0.6" />

    {/* Inner Dotted / Engraved Ring */}
    <circle
      cx="100"
      cy="100"
      r="73"
      fill="none"
      stroke="#5C3604"
      strokeWidth="1.5"
      strokeDasharray="4 4"
      opacity="0.6"
    />

    {/* Laurel Wreath Bottom */}
    <g fill="url(#reliefT)" stroke="#6B4005" strokeWidth="1.2">
      <ellipse cx="46" cy="140" rx="8.5" ry="4" transform="rotate(-50 46 140)" />
      <ellipse cx="36" cy="124" rx="8.5" ry="4" transform="rotate(-70 36 124)" />
      <ellipse cx="32" cy="105" rx="8.5" ry="4" transform="rotate(-88 32 105)" />
      <ellipse cx="34" cy="86" rx="8.5" ry="4" transform="rotate(-105 34 86)" />

      <ellipse cx="154" cy="140" rx="8.5" ry="4" transform="rotate(50 154 140)" />
      <ellipse cx="164" cy="124" rx="8.5" ry="4" transform="rotate(70 164 124)" />
      <ellipse cx="168" cy="105" rx="8.5" ry="4" transform="rotate(88 168 105)" />
      <ellipse cx="166" cy="86" rx="8.5" ry="4" transform="rotate(105 166 86)" />
    </g>

    {/* Centerpiece: Fierce Warrior / Orc Warlord Profile */}
    <g stroke="#543003" strokeWidth="2" strokeLinejoin="round">
      {/* Flowing Mane / Topknot Hair */}
      <path
        d="M 92 52 Q 124 44 138 66 Q 126 70 118 68 Q 134 84 128 102 Q 116 94 110 88 Z"
        fill="url(#reliefT)"
      />
      {/* Head & Brow Profile facing Left */}
      <path
        d="M 95 54 C 72 54 62 72 64 90 L 56 102 L 64 110 L 62 126 Q 76 138 104 134 L 116 112 Q 120 74 95 54 Z"
        fill="url(#reliefT)"
      />
      {/* Fierce Brow & Eye Shadow */}
      <path d="M 68 86 L 84 89 L 76 94 Z" fill="#4A2A03" />
      {/* Pointed Ear */}
      <path d="M 98 84 L 118 76 L 106 96 Z" fill="url(#reliefT)" />
      {/* Tusks & Jaw */}
      <path d="M 62 114 L 54 104 L 66 109 Z" fill="#FFF7CA" />
      <path d="M 64 120 L 84 122" stroke="#543003" strokeWidth="2" />
      {/* Battle Shoulder Plate */}
      <path
        d="M 56 146 Q 82 130 132 138 Q 112 156 56 146 Z"
        fill="url(#reliefT)"
      />
    </g>
  </svg>
);
