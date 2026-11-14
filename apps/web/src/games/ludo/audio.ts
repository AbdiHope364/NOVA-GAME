/**
 * Web Audio API procedural sound synthesizer and haptic feedback manager.
 * Requires zero external audio assets, works instantly in all modern browsers.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export const playSound = {
  /**
   * Quick dice roll rattle
   */
  diceRoll: (enabled: boolean = true) => {
    if (!enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const count = 5;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        if (!ctx || ctx.state === 'closed') return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140 + Math.random() * 120, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.045);
      }, i * 60);
    }
  },

  /**
   * Soft acoustic wooden hop sound on each square stepped
   */
  hopTick: (stepIndex: number = 0, enabled: boolean = true) => {
    if (!enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const baseFreq = 480 + (stepIndex % 12) * 22; // subtle pitch increase
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, ctx.currentTime + 0.045);

    gain.gain.setValueAtTime(0.09, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  },

  /**
   * Capture swoosh & impact thump
   */
  capture: (enabled: boolean = true) => {
    if (!enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    // Downward swoosh
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);

    // Impact thump
    setTimeout(() => {
      if (!ctx || ctx.state === 'closed') return;
      const thump = ctx.createOscillator();
      const thumpGain = ctx.createGain();
      thump.type = 'sine';
      thump.frequency.setValueAtTime(130, ctx.currentTime);
      thump.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.12);

      thumpGain.gain.setValueAtTime(0.2, ctx.currentTime);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      thump.connect(thumpGain);
      thumpGain.connect(ctx.destination);
      thump.start();
      thump.stop(ctx.currentTime + 0.13);
    }, 80);
  },

  /**
   * Finish starburst celebratory bell
   */
  starburst: (enabled: boolean = true) => {
    if (!enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    freqs.forEach((freq, i) => {
      setTimeout(() => {
        if (!ctx || ctx.state === 'closed') return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.36);
      }, i * 70);
    });
  },

  /**
   * Winner victory fanfare
   */
  winFanfare: (enabled: boolean = true) => {
    if (!enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [
      { f: 440, d: 0.15 },
      { f: 554.37, d: 0.15 },
      { f: 659.25, d: 0.15 },
      { f: 880, d: 0.4 },
    ];
    let offset = 0;
    notes.forEach((n) => {
      setTimeout(() => {
        if (!ctx || ctx.state === 'closed') return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.f, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.d);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + n.d);
      }, offset * 1000);
      offset += n.d;
    });
  },
};

/**
 * Mobile device haptic feedback trigger
 */
export function triggerHaptic(
  type: 'roll' | 'capture' | 'win' | 'tap',
  enabled: boolean = true
) {
  if (!enabled || typeof window === 'undefined' || !('vibrate' in navigator)) return;
  try {
    switch (type) {
      case 'tap':
        navigator.vibrate(12);
        break;
      case 'roll':
        navigator.vibrate([20, 25, 20]);
        break;
      case 'capture':
        navigator.vibrate([40, 30, 60]);
        break;
      case 'win':
        navigator.vibrate([60, 40, 80, 40, 120]);
        break;
    }
  } catch {}
}
