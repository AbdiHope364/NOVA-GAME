import { create } from 'zustand';
import { api } from '../services/api';

export interface WalletState {
  balance: number;
  currency: string;
  fetchWallet: () => Promise<void>;
  updateBalance: (newBalance: number) => void;
  deposit: (amount: number, method: string) => Promise<void>;
  withdraw: (amount: number, address: string) => Promise<void>;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: 1000.0,
  currency: 'USD',

  fetchWallet: async () => {
    try {
      const res = await api.get('/wallet');
      set({ balance: res.data.data.balance, currency: res.data.data.currency });
    } catch (err) {
      console.error(err);
    }
  },

  updateBalance: (newBalance) => {
    set({ balance: newBalance });
  },

  deposit: async (amount, paymentMethod) => {
    const res = await api.post('/wallet/deposit', { amount, paymentMethod });
    set({ balance: res.data.data.balance });
  },

  withdraw: async (amount, destinationAddress) => {
    const res = await api.post('/wallet/withdraw', { amount, destinationAddress });
    set({ balance: res.data.data.balance });
  },
}));
