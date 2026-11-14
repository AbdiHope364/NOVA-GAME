import React, { useState, useRef, useEffect } from 'react';
import { BingoPattern } from '@nova/types';
import { ChevronDown, CheckCircle2 } from 'lucide-react';
import { PATTERNS_CATALOG } from './BingoLobby';

export interface PatternSelectorProps {
  pattern: BingoPattern;
  onPatternChange: (pattern: BingoPattern) => void;
  disabled?: boolean;
}

export const PatternSelector: React.FC<PatternSelectorProps> = ({
  pattern,
  onPatternChange,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Standard' | 'Shapes' | 'Jackpot'>('All');
  const containerRef = useRef<HTMLDivElement>(null);

  const activeMeta = PATTERNS_CATALOG.find((p) => p.key === pattern) || PATTERNS_CATALOG[0];

  const filteredPatterns =
    selectedCategory === 'All'
      ? PATTERNS_CATALOG
      : PATTERNS_CATALOG.filter((p) => p.category === selectedCategory);

  // Close drop list when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Close drop list on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelectPattern = (key: BingoPattern) => {
    onPatternChange(key);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col w-full bg-[#1b0638]/95 border border-purple-600/60 rounded-2xl px-3 py-2 sm:py-2.5 shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all select-none"
    >
      {/* Trigger Button Matching Cartella Mockup: Pattern: Full House [Chevron] */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-between gap-2.5 w-full text-left focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed group cursor-pointer"
        aria-expanded={isOpen}
        aria-label="Toggle pattern drop list"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Mini 5x5 Shape Visualizer of Active Pattern */}
          <div
            className="grid grid-cols-5 gap-[1px] p-[2px] rounded-lg bg-[#110324] border border-purple-500/40 w-7 h-7 sm:w-8 sm:h-8 shrink-0 shadow-inner"
            title={`${activeMeta.name} pattern shape`}
          >
            {activeMeta.previewMask.map((row, r) =>
              row.map((active, c) => (
                <div
                  key={`${r}-${c}`}
                  className={`rounded-[0.5px] transition-colors ${
                    r === 2 && c === 2
                      ? 'bg-amber-400'
                      : active
                      ? 'bg-yellow-300 shadow-[0_0_2px_rgba(253,224,71,0.9)]'
                      : 'bg-purple-950/80'
                  }`}
                />
              ))
            )}
          </div>

          <div className="flex items-center gap-1.5 truncate">
            <span className="text-xs sm:text-base font-black text-white group-hover:text-amber-300 transition-colors truncate">
              Pattern: {activeMeta.name}
            </span>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-400 shrink-0">
              ({activeMeta.mult})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] sm:text-xs font-mono text-cyan-300 font-bold bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-md shrink-0">
            {activeMeta.spacesNeeded}
          </span>
          <div
            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#270b4f] border border-purple-500/40 flex items-center justify-center transition-transform duration-200 ${
              isOpen ? 'rotate-180 bg-amber-500/20 border-amber-500/50' : 'group-hover:border-purple-300'
            }`}
          >
            <ChevronDown
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                isOpen ? 'text-amber-400' : 'text-purple-200 group-hover:text-white'
              }`}
            />
          </div>
        </div>
      </button>

      {/* Dropped List (Responsive across full width and contained inside the boundary) */}
      {isOpen && !disabled && (
        <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-purple-800/60 w-full animate-in fade-in duration-150">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-[#120427] p-1 sm:p-1.5 rounded-xl border border-purple-900/60 overflow-x-auto no-scrollbar w-full">
            {(['All', 'Standard', 'Shapes', 'Jackpot'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex-1 text-center ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black shadow-sm'
                    : 'text-purple-300 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Pattern Options Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-56 overflow-y-auto no-scrollbar p-0.5 w-full">
            {filteredPatterns.map((p) => {
              const isSelected = p.key === pattern;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handleSelectPattern(p.key)}
                  className={`flex items-center gap-2 p-1.5 rounded-xl border transition-all text-left w-full cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                      : 'bg-[#15052c] border-purple-900/60 text-slate-300 hover:border-purple-600 hover:text-white'
                  }`}
                >
                  {/* Pattern mini preview grid */}
                  <div className="grid grid-cols-5 gap-[0.5px] p-[1.5px] rounded bg-[#0d011f] border border-purple-950 w-6 h-6 shrink-0">
                    {p.previewMask.map((row, r) =>
                      row.map((active, c) => (
                        <div
                          key={`${r}-${c}`}
                          className={`rounded-[0.5px] ${
                            r === 2 && c === 2
                              ? 'bg-amber-400'
                              : active
                              ? isSelected
                                ? 'bg-amber-300'
                                : 'bg-emerald-400'
                              : 'bg-purple-950/60'
                          }`}
                        />
                      ))
                    )}
                  </div>

                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-black truncate leading-tight">
                      {p.name}
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 font-bold leading-none mt-0.5">
                      {p.mult}
                    </span>
                  </div>

                  {isSelected && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
