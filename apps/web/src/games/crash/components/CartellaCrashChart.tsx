import React from 'react';
import { Rocket, Flame, CheckCircle2 } from 'lucide-react';

export interface CartellaCrashChartProps {
  currentMultiplier: number;
  isFlying: boolean;
  isCrashed: boolean;
  isCashedOut: boolean;
  cashedOutMultiplier?: number;
  finalCrashPoint?: number;
  countdown?: number;
  isBetting?: boolean;
  hasPlacedBet?: boolean;
}

export const CartellaCrashChart: React.FC<CartellaCrashChartProps> = ({
  currentMultiplier,
  isFlying,
  isCrashed,
  isCashedOut,
  cashedOutMultiplier,
  finalCrashPoint,
  countdown = 5,
  isBetting = false,
  hasPlacedBet = false,
}) => {
  // SVG Canvas dimensions: 440 x 280
  // Multiplier scaling: Smooth progressive logarithmic curve
  // Ensures continuous, non-stalling flight from bottom-left directly to the top-right corner
  const delta = Math.max(0, currentMultiplier - 1.0);
  const t = Math.min(1.0, 1 - Math.exp(-delta / 3.0));

  // Acceleration & engine exhaust flame intensity based on current multiplier
  // Scales dynamically from idle (0.15) to full-thrust afterburner (1.0)
  const accel = Math.min(1.0, Math.max(0.15, delta / 4.0));
  const flameLength = 16 + accel * 36; // 16px at takeoff to 52px at high speed
  const flameGlowOpacity = 0.65 + accel * 0.35;

  // Canvas bounds (440 x 280 viewBox): Full diagonal movement from Left Bottom to Right Top Corner
  // 1. Left-Bottom Corner:
  const startX = 28;
  const startY = 252;

  // 2. Right-Top Corner:
  const targetEndX = 392; // Reaches right corner with safety margin for nose & propeller
  const targetEndY = 36;  // Reaches top corner with safety margin for wings & tail fin

  // Real-time gentle aerodynamic wave & micro-flutter for living aircraft feel
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const cruiseWave = isFlying ? Math.sin(now / 220) * 3.0 : 0;
  const cruisePitchWave = isFlying ? Math.cos(now / 260) * 2.0 : 0;

  // Aircraft position: sweeps smoothly from the left-bottom corner all the way up to the right-top corner
  const endX = isFlying
    ? startX + t * (targetEndX - startX)
    : startX;

  const endY = isFlying
    ? startY - Math.pow(t, 1.18) * (startY - targetEndY) + cruiseWave
    : startY;

  // Aerodynamic tangent pitch angle:
  // Points directly along the climbing trajectory from left-bottom towards right-top corner
  // - Starts at ~ -16° (takeoff rotation from left-bottom)
  // - Steepens to -32° to -36° (steady climb towards right-top)
  // - Levels to ~ -22° to -26° with gentle wave as it reaches the top-right corner
  const basePitch = -16 - Math.sin(t * Math.PI) * 16 - (t > 0.5 ? (t - 0.5) * 6 : 0);
  const angleDeg = isFlying ? basePitch + cruisePitchWave : isBetting ? -10 : -12;

  // Quadratic bezier flight trajectory:
  // Starts at the left-bottom corner and sweeps diagonally up into the right-top corner
  const controlX = startX + (endX - startX) * 0.62;
  const controlY = startY - (startY - endY) * 0.08;
  const pathD = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
  const areaD = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY} L ${endX} ${startY} L ${startX} ${startY} Z`;

  return (
    <div className="relative w-full h-64 sm:h-80 md:h-88 rounded-3xl bg-gradient-to-b from-[#180533] via-[#110324] to-[#0a0117] border-2 border-purple-500/70 shadow-[0_0_35px_rgba(168,85,247,0.35)] overflow-hidden flex items-center justify-center select-none">
      {/* Background Stadium Grid & Neon Perspective Effect */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #a855f7 1px, transparent 1px), linear-gradient(to bottom, #a855f7 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />

      {/* Golden-Amber Horizon & Runway Glow */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-amber-500/15 via-purple-600/10 to-transparent pointer-events-none" />

      {/* Runway Guide at Left-Bottom Corner Start Position */}
      <div className="absolute bottom-5 left-3 w-28 h-1 bg-gradient-to-r from-amber-400/50 via-purple-400/25 to-transparent rounded-full pointer-events-none" />

      {/* SVG Canvas for Curve & Glowing Red-Orange Flight Trail */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 440 280">
        <defs>
          {/* Glowing Red-Orange Shaded Area Gradient */}
          <linearGradient id="flightAreaRedOrange" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.5" />
            <stop offset="25%" stopColor="#dc2626" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#7c2d12" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#1e0438" stopOpacity="0.0" />
          </linearGradient>

          {/* Glowing Red-Orange Trajectory Stroke Gradient */}
          <linearGradient id="flightStrokeRedOrange" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#991b1b" />
            <stop offset="30%" stopColor="#ef4444" />
            <stop offset="65%" stopColor="#f97316" />
            <stop offset="90%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>

          {/* Red-Orange Neon Glow Filter */}
          <filter id="redOrangeTrailGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#f97316" floodOpacity="0.9" />
            <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#dc2626" floodOpacity="0.6" />
          </filter>

          {/* Reactive Exhaust Fire Filter */}
          <filter id="exhaustFireGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="-2" dy="0" stdDeviation="4" floodColor="#ea580c" floodOpacity="0.95" />
          </filter>
        </defs>

        {isFlying && (
          <>
            {/* Shaded Area Beneath Rising Flight Curve */}
            <path
              d={areaD}
              fill="url(#flightAreaRedOrange)"
              className="transition-all duration-75 ease-out"
            />

            {/* Glowing Red-Orange Trajectory Arc */}
            <path
              d={pathD}
              fill="none"
              stroke="url(#flightStrokeRedOrange)"
              strokeWidth="5"
              strokeLinecap="round"
              filter="url(#redOrangeTrailGlow)"
              className="transition-all duration-75 ease-out"
            />

            {/* Launchpad Origin Marker */}
            <circle cx={startX} cy={startY} r="3.5" fill="#f97316" opacity="0.85" />
          </>
        )}
      </svg>

      {/* HERO RED RACING PROP-PLANE (Modeled from the Sleek Low-Wing Racing Aircraft Reference) */}
      {!isCrashed && (
        <div
          className="absolute z-20 pointer-events-none transition-transform duration-75 ease-out"
          style={{
            left: `${(endX / 440) * 100}%`,
            top: `${(endY / 280) * 100}%`,
            transform: `translate(-50%, -50%) rotate(${angleDeg}deg)`,
          }}
        >
          {/* Plane Container: Sleek Racing Proportions (108px to 144px wide) */}
          <div className="relative w-28 h-16 sm:w-34 sm:h-18 md:w-38 md:h-20 flex items-center justify-center filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.75)] drop-shadow-[0_0_18px_rgba(234,88,12,0.65)]">
            <svg viewBox="0 0 130 75" className="w-full h-full overflow-visible" fill="none">
              <defs>
                {/* Glossy Racing Red Fuselage Gradient (Matching Real Aircraft) */}
                <linearGradient id="racingRedFuselage" x1="0.2" y1="0.1" x2="0.8" y2="0.9">
                  <stop offset="0%" stopColor="#b91c1c" />
                  <stop offset="30%" stopColor="#ef4444" />
                  <stop offset="70%" stopColor="#dc2626" />
                  <stop offset="100%" stopColor="#7f1d1d" />
                </linearGradient>

                {/* Metallic Gold Accent Pinstripe Gradient */}
                <linearGradient id="racingGoldTrim" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#b45309" />
                  <stop offset="40%" stopColor="#fef08a" />
                  <stop offset="75%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>

                {/* Cockpit Tinted Blue Glass Gradient */}
                <linearGradient id="cockpitBlueGlass" x1="0.1" y1="0.1" x2="0.9" y2="0.9">
                  <stop offset="0%" stopColor="#082f49" />
                  <stop offset="35%" stopColor="#0284c7" />
                  <stop offset="70%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#bae6fd" />
                </linearGradient>

                {/* Polished Chrome/Silver Nose Cone Spinner */}
                <linearGradient id="chromeSpinner" x1="0" y1="0.2" x2="1" y2="0.8">
                  <stop offset="0%" stopColor="#94a3b8" />
                  <stop offset="30%" stopColor="#ffffff" />
                  <stop offset="70%" stopColor="#cbd5e1" />
                  <stop offset="100%" stopColor="#64748b" />
                </linearGradient>

                {/* Dynamic Engine Exhaust Fire Gradient */}
                <linearGradient id="engineFireGrad" x1="1" y1="0.5" x2="0" y2="0.5">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="25%" stopColor="#fef08a" stopOpacity="0.95" />
                  <stop offset="55%" stopColor="#ea580c" stopOpacity="0.9" />
                  <stop offset="85%" stopColor="#dc2626" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#7c2d12" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* 1. DYNAMIC ACCELERATION-REACTIVE EXHAUST FLAME */}
              {isFlying && (
                <g filter="url(#exhaustFireGlow)" opacity={flameGlowOpacity} className="animate-pulse">
                  {/* Outer Fiery Exhaust Plume stretching with acceleration */}
                  <path
                    d={`M24 38 C14 34, ${24 - flameLength * 0.6} 33, ${24 - flameLength} 38 C${24 - flameLength * 0.6} 43, 14 42, 24 38 Z`}
                    fill="url(#engineFireGrad)"
                  />
                  {/* White-Hot Core Thrust */}
                  <path
                    d={`M24 38 C18 36, ${24 - flameLength * 0.35} 36, ${24 - flameLength * 0.45} 38 C${24 - flameLength * 0.35} 40, 18 40, 24 38 Z`}
                    fill="#ffffff"
                    opacity="0.9"
                  />
                  {/* Trailing Fire Embers */}
                  <circle cx={24 - flameLength * 0.55} cy="37" r="1.5" fill="#fde047" className="animate-ping" />
                  <circle cx={24 - flameLength * 0.85} cy="39" r="1.2" fill="#ea580c" />
                </g>
              )}

              {/* 2. TAIL EMPENNAGE (Curved Swept Vertical Stabilizer & Elevator) */}
              {/* Horizontal Stabilizer (Port Elevator) */}
              <path
                d="M18 38 L6 43 L12 46 L24 41 Z"
                fill="#991b1b"
                stroke="#7f1d1d"
                strokeWidth="0.8"
              />
              {/* Swept Curved Vertical Fin (Matching Photo Tail Geometry) */}
              <path
                d="M26 36 C24 22, 14 15, 12 15 C14 13, 19 13, 23 15 L34 34 Z"
                fill="url(#racingRedFuselage)"
                stroke="#991b1b"
                strokeWidth="1"
              />
              {/* Gold Tail Pinstripe */}
              <path
                d="M13 15 C16 13.5, 20 13.5, 22 15 L24 20 L16 18 Z"
                fill="url(#racingGoldTrim)"
              />
              {/* Tail Skid Wheel */}
              <circle cx="26" cy="43" r="1.8" fill="#18181b" />

              {/* 3. FAR WING (Port Side Angled Upward In Bank) */}
              <path
                d="M52 34 L66 16 C68 14, 74 14, 76 16 L84 33 Z"
                fill="#991b1b"
                stroke="#7f1d1d"
                strokeWidth="0.8"
                opacity="0.9"
              />
              {/* Far Wingtip Beacon (Port Red Light) */}
              <circle cx="71" cy="16" r="1.6" fill="#ef4444" className="animate-pulse" />

              {/* 4. MAIN RACING FUSELAGE (Sleek Red Low-Wing Monocoque) */}
              <path
                d="M22 38 C22 28, 92 26, 110 38 C92 50, 22 48, 22 38 Z"
                fill="url(#racingRedFuselage)"
                stroke="#7f1d1d"
                strokeWidth="1.2"
              />

              {/* Glossy Top Surface Reflection Highlight (Sunny Glare on Red Paint) */}
              <path
                d="M30 33 C48 29, 86 29, 102 35 C86 32, 48 32, 30 33 Z"
                fill="#ffffff"
                opacity="0.38"
              />

              {/* Championship Metallic Gold Racing Pinstripe along Cabin Sill */}
              <path
                d="M26 39 C46 36, 88 36, 107 39 C88 41.5, 46 41.5, 26 39 Z"
                fill="url(#racingGoldTrim)"
                stroke="#b45309"
                strokeWidth="0.4"
              />

              {/* Aircraft Tail Identifier "NOVA" in Crisp Gold */}
              <text
                x="38"
                y="41"
                fill="#ffffff"
                fontSize="4.5"
                fontWeight="900"
                fontFamily="sans-serif"
                letterSpacing="0.6"
                opacity="0.92"
              >
                NOVA
              </text>

              {/* 5. COCKPIT WITH TINTED BLUE GLASS & PILOT SILHOUETTES */}
              {/* Bubble Canopy Teardrop Frame */}
              <path
                d="M56 35 C60 23, 86 23, 92 35 Z"
                fill="url(#cockpitBlueGlass)"
                stroke="#0369a1"
                strokeWidth="1"
              />
              {/* Canopy Center Frame Arch / Rollover Bar (As in Reference Photo) */}
              <path
                d="M74 24 L74 35"
                stroke="#0f172a"
                strokeWidth="1.2"
                opacity="0.8"
              />
              {/* Pilot Silhouette with Aviation Headset */}
              <circle cx="68" cy="30" r="2.8" fill="#0f172a" opacity="0.85" />
              <rect x="66" y="32.5" width="4" height="2.5" rx="1" fill="#0f172a" opacity="0.85" />
              {/* Headset Band on Pilot */}
              <path d="M65.5 29.5 C65.5 27.5, 70.5 27.5, 70.5 29.5" stroke="#94a3b8" strokeWidth="0.8" fill="none" />

              {/* Copilot Silhouette with Headset */}
              <circle cx="80" cy="30" r="2.8" fill="#0f172a" opacity="0.85" />
              <rect x="78" y="32.5" width="4" height="2.5" rx="1" fill="#0f172a" opacity="0.85" />
              {/* Headset Band on Copilot */}
              <path d="M77.5 29.5 C77.5 27.5, 82.5 27.5, 82.5 29.5" stroke="#94a3b8" strokeWidth="0.8" fill="none" />

              {/* Curved Glass Specular Glare Arc */}
              <path
                d="M62 33 C66 27, 78 27, 84 31"
                stroke="#ffffff"
                strokeWidth="1.2"
                strokeLinecap="round"
                opacity="0.75"
              />

              {/* 6. MAIN LOW-WING WITH WING FENCE (Distinctive Racing Feature from Photo) */}
              <path
                d="M48 40 L64 66 C66 68, 73 68, 75 66 L86 41 Z"
                fill="url(#racingRedFuselage)"
                stroke="#991b1b"
                strokeWidth="1"
              />
              {/* Gold Leading-Edge Trim Stripe on Wing */}
              <path
                d="M49 40 L64 66 L67 65 L53 40 Z"
                fill="url(#racingGoldTrim)"
                opacity="0.85"
              />
              {/* DISTINCTIVE AERODYNAMIC WING FENCE (Vertical Guide Fin on Upper Wing) */}
              <path
                d="M60 48 L65 58 L63 59 L58 49 Z"
                fill="#7f1d1d"
                stroke="#b91c1c"
                strokeWidth="0.6"
              />
              {/* Starboard Wingtip Strobe (Green Navigation Beacon) */}
              <circle cx="70" cy="67" r="1.8" fill="#10b981" className="animate-pulse" />

              {/* 7. PROPELLER & CHROME NOSE SPINNER (Continuously Spinning) */}
              {/* High-Polish Chrome Spinner Cone */}
              <ellipse
                cx="110"
                cy="38"
                rx="4.5"
                ry="6"
                fill="url(#chromeSpinner)"
                stroke="#64748b"
                strokeWidth="0.6"
              />

              {/* Continuously Spinning Motion Blur Propeller Disc */}
              <g
                className="animate-spin"
                style={{
                  transformOrigin: '110px 38px',
                  animationDuration: isFlying ? '0.15s' : '0.45s',
                }}
              >
                {/* Outer Translucent Concentric Motion Blur Rings (As Seen in Reference Photo) */}
                <ellipse
                  cx="110"
                  cy="38"
                  rx="3.5"
                  ry="26"
                  fill="rgba(255, 255, 255, 0.28)"
                  stroke="rgba(255, 255, 255, 0.65)"
                  strokeWidth="1"
                  strokeDasharray="14 6"
                />
                {/* Secondary High-Speed Blade Blur Ring */}
                <ellipse
                  cx="110"
                  cy="38"
                  rx="2"
                  ry="18"
                  fill="rgba(254, 240, 138, 0.2)"
                  stroke="rgba(254, 240, 138, 0.55)"
                  strokeWidth="0.8"
                />
                {/* Spinning High-Speed Propeller Blade Streaks */}
                <line
                  x1="110"
                  y1="13"
                  x2="110"
                  y2="63"
                  stroke="#ffffff"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  opacity="0.85"
                />
                <line
                  x1="110"
                  y1="20"
                  x2="110"
                  y2="56"
                  stroke="#fbbf24"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  opacity="0.6"
                />
              </g>
            </svg>
          </div>
        </div>
      )}

      {/* 1. CRASH SEQUENCE STEP 1: PLANE DROPS WITH TUMBLE ANIMATION */}
      {isCrashed && (
        <div
          className="absolute z-10 pointer-events-none transition-all duration-700 ease-in transform"
          style={{
            left: `${(endX / 440) * 100}%`,
            top: `${(Math.min(265, endY + 45) / 280) * 100}%`,
            transform: `translate(-50%, -50%) rotate(${angleDeg + 65}deg) scale(0.8)`,
            opacity: 0.5,
          }}
        >
          {/* Fading dropped airframe */}
          <div className="w-24 h-12 filter grayscale contrast-125">
            <svg viewBox="0 0 130 75" className="w-full h-full opacity-60">
              <path
                d="M22 38 C22 28, 92 26, 110 38 C92 50, 22 48, 22 38 Z"
                fill="#450a0a"
                stroke="#7f1d1d"
                strokeWidth="1"
              />
              <path d="M48 40 L64 66 L75 66 L86 41 Z" fill="#7f1d1d" />
            </svg>
          </div>
        </div>
      )}

      {/* 1. CRASH SEQUENCE STEP 1: EXPLOSION ANIMATION PLAYS */}
      {isCrashed && (
        <div
          className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${(endX / 440) * 100}%`,
            top: `${(endY / 280) * 100}%`,
          }}
        >
          <div className="relative flex items-center justify-center">
            {/* Expanding Neon Shockwave Ring */}
            <div className="absolute w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-rose-500/40 animate-ping" />
            <div className="absolute w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-500/50 animate-pulse blur-sm" />

            {/* Comic Explosion Flame */}
            <Flame className="w-16 h-16 sm:w-20 sm:h-20 text-rose-500 fill-rose-500 filter drop-shadow-[0_0_25px_rgba(244,63,94,0.95)] animate-bounce" />

            {/* Floating Smoke Sparks */}
            <div className="absolute -top-6 -right-6 w-3 h-3 rounded-full bg-amber-400 blur-[1px] animate-ping" />
            <div className="absolute -bottom-4 -left-6 w-2.5 h-2.5 rounded-full bg-rose-400 blur-[1px] animate-ping" />
          </div>
        </div>
      )}

      {/* 5-SECOND COUNTDOWN DISPLAY DURING BETTING PHASE (NEXT FLIGHT STARTING SOON) */}
      {isBetting ? (
        <div className="relative z-30 flex flex-col items-center justify-center pointer-events-none select-none">
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="#2a0d52"
                strokeWidth="7"
                fill="transparent"
              />
              <defs>
                <linearGradient id="takeoffCountdownGlow" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="50%" stopColor="#d946ef" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="url(#takeoffCountdownGlow)"
                strokeWidth="7"
                fill="transparent"
                strokeDasharray="263.9"
                strokeDashoffset={263.9 - (263.9 * Math.max(0, countdown)) / 5}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear filter drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]"
              />
            </svg>
            <span className="absolute text-4xl sm:text-5xl font-black font-mono text-amber-300 animate-pulse drop-shadow-md">
              {countdown > 0 ? `${countdown}s` : 'FLY!'}
            </span>
          </div>

          <div className="mt-3 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-900/90 via-purple-900/90 to-indigo-900/90 border border-purple-500/50 shadow-lg flex items-center gap-2">
            <Rocket className="w-4 h-4 text-amber-300 animate-bounce" />
            <span className="text-xs sm:text-sm font-black tracking-widest text-white uppercase">
              NEXT FLIGHT STARTING SOON ({countdown}s)
            </span>
          </div>
        </div>
      ) : (
        /* GIANT LIVE MULTIPLIER DISPLAY - CLEANLY UNCOVERED & ALWAYS LEGIBLE WITH HIGH CONTRAST */
        <div className="relative z-30 flex flex-col items-center justify-center pointer-events-none select-none px-4">
          {/* Step 2: Multiplier freezes at the final crash value */}
          <div
            className={`text-6xl sm:text-7xl md:text-8xl font-black font-mono tracking-tight transition-transform drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] ${
              isCrashed
                ? 'text-rose-500 scale-105 filter drop-shadow-[0_0_30px_rgba(244,63,94,0.95)]'
                : isCashedOut
                ? 'text-emerald-400 filter drop-shadow-[0_0_30px_rgba(52,211,153,0.9)]'
                : isFlying
                ? 'bg-gradient-to-b from-[#fff7c2] via-[#ffd700] to-[#f59e0b] bg-clip-text text-transparent filter drop-shadow-[0_0_30px_rgba(245,158,11,0.85)]'
                : 'text-purple-300/80'
            }`}
          >
            {isCrashed
              ? `${(finalCrashPoint ?? currentMultiplier ?? 1.0).toFixed(2)}x`
              : `${(currentMultiplier ?? 1.0).toFixed(2)}x`}
          </div>

          {/* Step 3 & 4: Subtitle Status Banner & Player Result (PLANE CRASHED! 2.47x • WON / CASHED OUT / LOST) */}
          <div className="mt-2 text-xs sm:text-base font-black uppercase tracking-widest drop-shadow-md">
            {isCrashed ? (
              <div className="flex flex-col items-center gap-1.5">
                {/* 3. Display PLANE CRASHED! 2.47x */}
                <span className="px-4 py-1 rounded-full bg-rose-500/25 border border-rose-500/60 text-rose-300 flex items-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.6)] font-black text-sm sm:text-base animate-pulse">
                  <Flame className="w-4 h-4 text-rose-400" />
                  <span>PLANE CRASHED! {(finalCrashPoint ?? currentMultiplier ?? 1.0).toFixed(2)}x</span>
                </span>

                {/* 4. Show each player's result: WON, CASHED OUT or LOST */}
                {isCashedOut ? (
                  <span className="text-xs sm:text-sm text-emerald-300 font-black flex items-center gap-1 px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>YOU CASHED OUT! @ {(cashedOutMultiplier ?? currentMultiplier ?? 1.0).toFixed(2)}x • YOU WON!</span>
                  </span>
                ) : hasPlacedBet ? (
                  <span className="text-xs sm:text-sm text-rose-400 font-black px-3 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/50">
                    BET LOST
                  </span>
                ) : (
                  <span className="text-xs text-purple-200/90 font-bold px-3 py-0.5 rounded-full bg-purple-900/40 border border-purple-500/30">
                    ROUND OVER
                  </span>
                )}
              </div>
            ) : isCashedOut ? (
              <span className="px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 flex items-center gap-1.5 shadow-[0_0_15px_rgba(52,211,153,0.5)]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>YOU CASHED OUT! @ {(cashedOutMultiplier ?? currentMultiplier ?? 1.0).toFixed(2)}x</span>
              </span>
            ) : isFlying ? (
              <span className="px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 flex items-center gap-1.5 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                <span>RISING FLIGHT...</span>
              </span>
            ) : (
              <span className="px-3.5 py-1 rounded-full bg-indigo-900/50 text-indigo-200 text-xs font-bold border border-indigo-500/30">
                READY FOR TAKEOFF
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const NovaCrashChart = CartellaCrashChart;
