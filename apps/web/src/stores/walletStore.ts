import { create } from 'zustand';
import { api } from '../services/api';

export interface WalletTransactionItem {
  id: string;
  type: string;
  status: string;
  amount: number;
  balanceAfter?: number;
  paymentMethod?: string;
  referenceId?: string;
  description?: string;
  createdAt: string;
}

export interface WalletState {
  balance: number;
  cashBalance: number;
  bonusBalance: number;
  lockedWinnings: number;
  withdrawableBalance: number;
  currency: string;
  transactions: WalletTransactionItem[];
  walletNotification: string | null;
  fetchWallet: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  updateBalance: (newBalance: number) => void;
  setWalletNotification: (msg: string | null) => void;
  deposit: (
    amount: number,
    method: string,
    phoneNumber?: string,
    receiptPhoto?: string,
    referenceId?: string
  ) => Promise<any>;
  withdraw: (amount: number, address: string) => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  balance: typeof window !== 'undefined' && localStorage.getItem('nova_token') ? 0 : 1000,
  cashBalance: typeof window !== 'undefined' && localStorage.getItem('nova_token') ? 0 : 1000,
  bonusBalance: 0,
  lockedWinnings: 0,
  withdrawableBalance: 0,
  currency: 'ETB',
  transactions: [],
  walletNotification: null,

  fetchWallet: async () => {
    const token = localStorage.getItem('nova_token');
    if (!token) {
      if (get().balance === 0) {
        set({ balance: 1000, cashBalance: 1000 });
      }
      return;
    }
    try {
      const res = await api.get('/wallet');
      const w = res.data.data;
      set({
        balance: w.totalPlayableBalance ?? w.balance,
        cashBalance: w.cashBalance ?? w.balance,
        bonusBalance: w.bonusBalance ?? 0,
        lockedWinnings: w.lockedWinnings ?? 0,
        withdrawableBalance: w.withdrawableBalance ?? 0,
        currency: w.currency || 'ETB',
      });
    } catch {
      // Keep fallback demo balance
    }
  },

  fetchTransactions: async () => {
    const token = localStorage.getItem('nova_token');
    if (!token) return;
    try {
      const res = await api.get('/wallet/transactions');
      if (res.data?.data) {
        set({ transactions: res.data.data });
      }
    } catch {
      // Ignore if offline
    }
  },

  updateBalance: (newBalance) => {
    set((state) => {
      const bonus = state.bonusBalance || 0;
      return {
        balance: newBalance,
        cashBalance: Math.max(0, newBalance - bonus),
      };
    });
  },

  setWalletNotification: (msg) => {
    set({ walletNotification: msg });
  },

  deposit: async (
    amount: number,
    paymentMethod: string,
    phoneNumber?: string,
    receiptPhoto?: string,
    referenceId?: string
  ) => {
    const cleanRef = referenceId && referenceId.trim().length > 0 ? referenceId.trim() : undefined;
    const res = await api.post('/wallet/deposit', {
      amount,
      paymentMethod,
      phoneNumber,
      receiptPhoto,
      referenceId: cleanRef,
    });
    await get().fetchTransactions();
    return res.data;
  },

  withdraw: async (amount, destinationAddress) => {
    try {
      const res = await api.post('/wallet/withdraw', { amount, destinationAddress });
      const w = res.data.data;
      set({
        balance: w.totalPlayableBalance ?? w.balance,
        cashBalance: w.cashBalance ?? w.balance,
        bonusBalance: w.bonusBalance ?? 0,
        lockedWinnings: w.lockedWinnings ?? 0,
        withdrawableBalance: w.withdrawableBalance ?? 0,
      });
      await get().fetchTransactions();
    } catch (err) {
      throw err;
    }
  },
}));
