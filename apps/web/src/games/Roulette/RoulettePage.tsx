import React, { useState } from 'react';
import { RouletteUI } from '@nova/game-roulette';
import { api } from '../../services/api';
import { useWalletStore } from '../../stores/walletStore';
import { RouletteParams } from '@nova/types';

export const RoulettePage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const updateBalance = useWalletStore((s) => s.updateBalance);

  const handlePlay = async (amount: number, params: RouletteParams) => {
    setIsLoading(true);
    try {
      const res = await api.post('/games/play/roulette', { amount, params });
      updateBalance(res.data.data.newBalance);
      return res.data.data;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-6">
      <RouletteUI onPlay={handlePlay} isLoading={isLoading} />
    </div>
  );
};
