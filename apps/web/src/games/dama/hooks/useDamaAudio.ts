import { useState, useCallback } from 'react';
import { damaAudio } from '../utils/damaAudio';

export function useDamaAudio() {
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => damaAudio.isSoundEnabled());
  const [hapticsEnabled, setHapticsEnabledState] = useState<boolean>(() => damaAudio.isHapticsEnabled());

  const toggleSound = useCallback(() => {
    const next = !damaAudio.isSoundEnabled();
    damaAudio.setSoundEnabled(next);
    setSoundEnabledState(next);
    if (next) {
      damaAudio.playSelect();
    }
  }, []);

  const toggleHaptics = useCallback(() => {
    const next = !damaAudio.isHapticsEnabled();
    damaAudio.setHapticsEnabled(next);
    setHapticsEnabledState(next);
    if (next) {
      damaAudio.triggerHaptic('select');
    }
  }, []);

  return {
    soundEnabled,
    hapticsEnabled,
    toggleSound,
    toggleHaptics,
    playSelect: useCallback(() => damaAudio.playSelect(), []),
    playMove: useCallback(() => damaAudio.playMove(), []),
    playCapture: useCallback(() => damaAudio.playCapture(), []),
    playCrown: useCallback(() => damaAudio.playCrown(), []),
    playVictory: useCallback(() => damaAudio.playVictory(), []),
    playDefeat: useCallback(() => damaAudio.playDefeat(), []),
    playWarning: useCallback(() => damaAudio.playWarning(), []),
    triggerHaptic: useCallback((type: 'select' | 'move' | 'capture' | 'crown' | 'victory' | 'warning') => {
      damaAudio.triggerHaptic(type);
    }, []),
  };
}

