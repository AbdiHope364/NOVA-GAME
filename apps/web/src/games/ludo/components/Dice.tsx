import React, { useEffect, useRef } from 'react';
import { playSound, triggerHaptic } from '../audio';

export interface DiceProps {
  value: number | null;
  isRolling: boolean;
  disabled: boolean;
  canRoll: boolean;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
  onRoll: () => void;
  size?: 'normal' | 'large' | 'compact';
  themeVariant?: 'active' | 'inactive';
}

export const Dice: React.FC<DiceProps> = ({
  value,
  isRolling,
  disabled,
  canRoll,
  soundEnabled = true,
  vibrationEnabled = true,
  onRoll,
  size = 'normal',
  themeVariant = 'active',
}) => {
  // Mobile shake detection support
  const lastShakeTimeRef = useRef(0);

  useEffect(() => {
    if (!canRoll || disabled || isRolling) return;
    if (typeof window === 'undefined' || !window.DeviceMotionEvent) return;

    let lastX = 0,
      lastY = 0,
      lastZ = 0;
    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;
      const delta =
        Math.abs(acc.x - lastX) + Math.abs(acc.y - lastY) + Math.abs(acc.z - lastZ);
      if (delta > 24) {
        const now = Date.now();
        if (now - lastShakeTimeRef.current > 1200) {
          lastShakeTimeRef.current = now;
          playSound.diceRoll(soundEnabled);
          triggerHaptic('roll', vibrationEnabled);
          onRoll();
        }
      }
      lastX = acc.x;
      lastY = acc.y;
      lastZ = acc.z;
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [canRoll, disabled, isRolling, soundEnabled, vibrationEnabled, onRoll]);

  const handleDiceClick = () => {
    if (!canRoll || disabled || isRolling) return;
    playSound.diceRoll(soundEnabled);
    triggerHaptic('roll', vibrationEnabled);
    onRoll();
  };

  const isInactive = themeVariant === 'inactive';
  const pipColorClass = isInactive
    ? 'bg-[#111827] shadow-[inset_0_1px_1px_rgba(0,0,0,0.8)]'
    : 'bg-[#111827] shadow-[inset_0_1px_1px_rgba(0,0,0,0.6)]';

  // Render pips pattern on dice face (1 to 6)
  const renderPips = (num: number) => {
    const pip = (key: string) => (
      <span
        key={key}
        className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${pipColorClass} block`}
      />
    );

    switch (num) {
      case 1:
        return (
          <div className="flex items-center justify-center w-full h-full">
            <span className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full ${pipColorClass} block`} />
          </div>
        );
      case 2:
        return (
          <div className="flex justify-between w-full h-full p-1.5 sm:p-2">
            <div className="self-start">{pip('top-left')}</div>
            <div className="self-end">{pip('bottom-right')}</div>
          </div>
        );
      case 3:
        return (
          <div className="flex justify-between w-full h-full p-1.5 sm:p-2">
            <div className="self-start">{pip('top-left')}</div>
            <div className="self-center">{pip('center')}</div>
            <div className="self-end">{pip('bottom-right')}</div>
          </div>
        );
      case 4:
        return (
          <div className="grid grid-cols-2 grid-rows-2 w-full h-full p-1.5 sm:p-2 place-items-center">
            {pip('1')}
            {pip('2')}
            {pip('3')}
            {pip('4')}
          </div>
        );
      case 5:
        return (
          <div className="relative w-full h-full p-1.5 sm:p-2">
            <div className="absolute top-1.5 left-1.5">{pip('1')}</div>
            <div className="absolute top-1.5 right-1.5">{pip('2')}</div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              {pip('3')}
            </div>
            <div className="absolute bottom-1.5 left-1.5">{pip('4')}</div>
            <div className="absolute bottom-1.5 right-1.5">{pip('5')}</div>
          </div>
        );
      case 6:
      default:
        return (
          <div className="grid grid-cols-2 grid-rows-3 w-full h-full p-1 sm:p-1.5 place-items-center gap-y-0.5">
            {pip('1')}
            {pip('2')}
            {pip('3')}
            {pip('4')}
            {pip('5')}
            {pip('6')}
          </div>
        );
    }
  };

  const dimClass =
    size === 'large'
      ? 'w-16 h-16 sm:w-18 sm:h-18'
      : size === 'compact'
      ? 'w-10 h-10 sm:w-11 sm:h-11'
      : 'w-12 h-12 sm:w-13 sm:h-13';

  // Fallback to 6 dots if no value rolled yet (as in screenshot)
  const displayNum = value ?? 6;

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <button
        type="button"
        role="button"
        aria-label={`Dice. ${value ? `Value: ${value}.` : 'Ready.'}${
          canRoll ? ' Tap to roll.' : ''
        }`}
        disabled={!canRoll || disabled}
        onClick={handleDiceClick}
        className={`relative ${dimClass} rounded-2xl p-0.5 transition-all duration-200 outline-none flex items-center justify-center ${
          canRoll && !disabled
            ? 'cursor-pointer hover:scale-105 active:scale-95'
            : 'cursor-default'
        }`}
        style={{ perspective: '600px' }}
      >
        {/* 3D Dice Face */}
        <div
          className={`w-full h-full rounded-2xl flex items-center justify-center relative overflow-hidden transition-transform duration-300 ${
            isInactive
              ? 'bg-gradient-to-br from-[#4b5563] via-[#374151] to-[#1f2937] border-2 border-[#4b5563] shadow-[inset_0_1px_2px_rgba(255,255,255,0.2),0_4px_8px_rgba(0,0,0,0.6)]'
              : 'bg-gradient-to-br from-white via-[#f8fafc] to-[#e2e8f0] border-2 border-slate-300 shadow-[0_6px_14px_rgba(0,0,0,0.45)]'
          } ${isRolling ? 'animate-spin' : ''}`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isRolling
              ? 'rotateX(720deg) rotateY(1080deg) scale(0.92)'
              : 'rotateX(0deg) rotateY(0deg) scale(1)',
            transition: isRolling ? 'none' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {/* Top Specular Glint */}
          {!isInactive && (
            <div className="absolute top-0.5 left-1 w-2.5 h-1 rounded-full bg-white/90 rotate-[-25deg] blur-[0.3px]" />
          )}

          {/* Render face pips */}
          {renderPips(displayNum)}
        </div>
      </button>
    </div>
  );
};
