import React, { useState } from 'react';
import { CoinFlipUI } from '@nova/game-coin-flip';
import { api } from '../../services/api';
import { useWalletStore } from '../../stores/walletStore';
import { CoinFlipParams } from '@nova/types';

export const CoinFlipPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const updateBalance = useWalletStore((s) => s.updateBalance);

  const handlePlay = async (amount: number, params: CoinFlipParams) => {
    setIsLoading(true);
    try {
      const res = await api.post('/games/play/coin-flip', { amount, params });
      updateBalance(res.data.data.newBalance);
      return res.data.data;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-6">
      <CoinFlipUI onPlay={handlePlay} isLoading={isLoading} />
    </div>
  );
};
