/**
 * Dama Game Audio & Haptics Engine.
 *
 * Implements low-latency, zero-dependency procedural audio synthesis via Web Audio API.
 * Supports mobile tactile vibration via navigator.vibrate.
 * Preferences are automatically persisted to localStorage.
 */

class DamaAudioManager {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private hapticsEnabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      const soundPref = localStorage.getItem('nova_dama_sound');
      const hapticsPref = localStorage.getItem('nova_dama_haptics');
      this.soundEnabled = soundPref !== null ? soundPref === 'true' : true;
      this.hapticsEnabled = hapticsPref !== null ? hapticsPref === 'true' : true;
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('nova_dama_sound', String(enabled));
    }
  }

  public isHapticsEnabled(): boolean {
    return this.hapticsEnabled;
  }

  public setHapticsEnabled(enabled: boolean) {
    this.hapticsEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('nova_dama_haptics', String(enabled));
    }
  }

  public triggerHaptic(type: 'select' | 'move' | 'capture' | 'crown' | 'victory' | 'warning') {
    if (!this.hapticsEnabled || typeof navigator === 'undefined' || !navigator.vibrate) {
      return;
    }

    try {
      switch (type) {
        case 'select':
          navigator.vibrate(10);
          break;
        case 'move':
          navigator.vibrate(25);
          break;
        case 'capture':
          navigator.vibrate([35, 25, 45]);
          break;
        case 'crown':
          navigator.vibrate([50, 40, 80]);
          break;
        case 'victory':
          navigator.vibrate([100, 50, 100, 50, 150]);
          break;
        case 'warning':
          navigator.vibrate(20);
          break;
      }
    } catch {}
  }

  /**
   * Subtle wooden click on piece selection
   */
  public playSelect() {
    this.triggerHaptic('select');
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.03);
    } catch {}
  }

  /**
   * Natural wooden piece movement sound
   */
  public playMove() {
    this.triggerHaptic('move');
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Warm wooden thud
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.06);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {}
  }

  /**
   * Crisp, punchy capture snap
   */
  public playCapture() {
    this.triggerHaptic('capture');
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Primary impact
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.09);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);

      // Secondary snap resonance
      const snapOsc = ctx.createOscillator();
      const snapGain = ctx.createGain();

      snapOsc.type = 'sine';
      snapOsc.frequency.setValueAtTime(750, now);
      snapOsc.frequency.exponentialRampToValueAtTime(200, now + 0.05);

      snapGain.gain.setValueAtTime(0.2, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      snapOsc.connect(snapGain);
      snapGain.connect(ctx.destination);

      snapOsc.start(now);
      snapOsc.stop(now + 0.05);
    } catch {}
  }

  /**
   * Royal coronation chime when promoting to King
   */
  public playCrown() {
    this.triggerHaptic('crown');
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const startTime = now + i * 0.07;
        const duration = 0.25;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } catch {}
  }

  /**
   * Victorious fanfare on match win
   */
  public playVictory() {
    this.triggerHaptic('victory');
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Majestic major chords (C5, G5, E5 -> High C6)
      const chordNotes = [
        { f: 523.25, t: 0.0, d: 0.2 },
        { f: 659.25, t: 0.1, d: 0.2 },
        { f: 783.99, t: 0.2, d: 0.25 },
        { f: 1046.5, t: 0.35, d: 0.5 },
      ];

      chordNotes.forEach(({ f, t, d }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const startTime = now + t;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, startTime);

        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + d);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + d);
      });
    } catch {}
  }

  /**
   * Defeat tone on match loss
   */
  public playDefeat() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [
        { f: 440.0, t: 0.0, d: 0.3 },  // A4
        { f: 415.3, t: 0.2, d: 0.3 },  // G#4
        { f: 370.0, t: 0.4, d: 0.5 },  // F#4
      ];

      notes.forEach(({ f, t, d }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const startTime = now + t;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, startTime);

        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + d);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + d);
      });
    } catch {}
  }

  /**
   * Urgent tick when match clock is low (< 15 seconds)
   */
  public playWarning() {
    this.triggerHaptic('warning');
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.03);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.03);
    } catch {}
  }
}

export const damaAudio = new DamaAudioManager();

