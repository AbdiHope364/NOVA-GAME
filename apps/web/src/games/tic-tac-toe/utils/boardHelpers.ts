import { WinningLine } from '../types/ticTacToe.types';

export interface LineCoordinates {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Calculates SVG line coordinates (in percentages 0..100) for drawing the animated emerald winning strike line.
 */
export function getWinningLineSvgCoords(line: WinningLine): LineCoordinates | null {
  if (!line) return null;

  // Grid cell centers: col 0 = 16.6%, col 1 = 50%, col 2 = 83.3%
  const getCol = (idx: number) => (idx % 3) * 33.33 + 16.66;
  const getRow = (idx: number) => Math.floor(idx / 3) * 33.33 + 16.66;

  const start = line[0];
  const end = line[2];

  return {
    x1: getCol(start),
    y1: getRow(start),
    x2: getCol(end),
    y2: getRow(end),
  };
}

/**
 * Sound synthesizer using Web Audio API for fast, zero-dependency audio feedback.
 */
class TttSoundFX {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playMove(symbol: 'X' | 'O') {
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = symbol === 'X' ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(symbol === 'X' ? 520 : 380, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(symbol === 'X' ? 780 : 310, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  playWin() {
    const ctx = this.getContext();
    if (!ctx) return;
    const notes = [440, 554, 659, 880];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
      gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.25);
    });
  }

  playLoss() {
    const ctx = this.getContext();
    if (!ctx) return;
    const notes = [400, 360, 320];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.1);
      osc.stop(ctx.currentTime + idx * 0.1 + 0.2);
    });
  }

  playDraw() {
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.setValueAtTime(440, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  }
}

export const tttSound = new TttSoundFX();
