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
  currency: 'ETB',

  fetchWallet: async () => {
    try {
      const res = await api.get('/wallet');
      set({ balance: res.data.data.balance, currency: res.data.data.currency || 'ETB' });
    } catch {
      // Keep demo initial balance 1,000 ETB
    }
  },

  updateBalance: (newBalance) => {
    set({ balance: newBalance });
  },

  deposit: async (amount, paymentMethod) => {
    try {
      const res = await api.post('/wallet/deposit', { amount, paymentMethod });
      set({ balance: res.data.data.balance });
    } catch {
      set((s) => ({ balance: s.balance + amount }));
    }
  },

  withdraw: async (amount, destinationAddress) => {
    try {
      const res = await api.post('/wallet/withdraw', { amount, destinationAddress });
      set({ balance: res.data.data.balance });
    } catch {
      set((s) => ({ balance: Math.max(0, s.balance - amount) }));
    }
  },
}));
