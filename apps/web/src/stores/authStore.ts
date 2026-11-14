import { create } from 'zustand';
import { api } from '../services/api';
import { getGameSocket } from '../services/socket';
import { useWalletStore } from './walletStore';

export interface UserState {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    referralCode?: string,
    deviceFingerprint?: string
  ) => Promise<any>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  setUser: (user: any) => void;
}

export const useAuthStore = create<UserState>((set) => ({
  user: null,
  token: localStorage.getItem('nova_token'),
  isAuthenticated: !!localStorage.getItem('nova_token'),

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user } = res.data.data;
    localStorage.setItem('nova_token', token);
    set({ user, token, isAuthenticated: true });
    useWalletStore.getState().fetchWallet();
    useWalletStore.getState().fetchTransactions();
    getGameSocket().emit('WALLET_SUBSCRIBE', { token });
  },

  register: async (username, email, password, referralCode, deviceFingerprint) => {
    const res = await api.post('/auth/register', {
      username,
      email,
      password,
      ...(referralCode ? { referralCode } : {}),
      ...(deviceFingerprint ? { deviceFingerprint } : {}),
    });
    const { token, user, promotions } = res.data.data;
    localStorage.setItem('nova_token', token);
    localStorage.removeItem('nova_referral_code');
    set({ user, token, isAuthenticated: true });
    useWalletStore.getState().fetchWallet();
    useWalletStore.getState().fetchTransactions();
    getGameSocket().emit('WALLET_SUBSCRIBE', { token });
    return promotions;
  },

  logout: () => {
    localStorage.removeItem('nova_token');
    set({ user: null, token: null, isAuthenticated: false });
    useWalletStore.getState().updateBalance(1000.0);
  },

  fetchMe: async () => {
    const token = localStorage.getItem('nova_token');
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false });
      return;
    }
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.data, isAuthenticated: true });
    } catch {
      // Token is invalid or expired: clear from storage
      localStorage.removeItem('nova_token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  setUser: (user) => set({ user }),
}));
