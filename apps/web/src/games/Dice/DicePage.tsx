import React, { useState } from 'react';
import { DiceUI } from '@nova/game-dice';
import { api } from '../../services/api';
import { useWalletStore } from '../../stores/walletStore';
import { DiceParams } from '@nova/types';

export const DicePage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const updateBalance = useWalletStore((s) => s.updateBalance);

  const handlePlay = async (amount: number, params: DiceParams) => {
    setIsLoading(true);
    try {
      const res = await api.post('/games/play/dice', { amount, params });
      updateBalance(res.data.data.newBalance);
      return res.data.data;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-6">
      <DiceUI onPlay={handlePlay} isLoading={isLoading} />
    </div>
  );
};
