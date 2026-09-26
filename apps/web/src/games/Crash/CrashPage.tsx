import React, { useState } from 'react';
import { CrashUI } from '@nova/game-crash';
import { api } from '../../services/api';
import { useWalletStore } from '../../stores/walletStore';
import { CrashParams } from '@nova/types';

export const CrashPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const updateBalance = useWalletStore((s) => s.updateBalance);

  const handlePlay = async (amount: number, params: CrashParams) => {
    setIsLoading(true);
    try {
      const res = await api.post('/games/play/crash', { amount, params });
      updateBalance(res.data.data.newBalance);
      return res.data.data;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-6">
      <CrashUI onPlay={handlePlay} isLoading={isLoading} />
    </div>
  );
};
