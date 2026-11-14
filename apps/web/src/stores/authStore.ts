import { create } from 'zustand';
import { api } from '../services/api';
import { getGameSocket } from '../services/socket';
import { useWalletStore } from './walletStore';

export interface UserState {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginMinimal: (identifier: string, password: string) => Promise<any>;
  register: (
    username: string,
    email: string,
    password: string,
    referralCode?: string,
    deviceFingerprint?: string
  ) => Promise<any>;
  registerMinimal: (data: {
    identifier: string;
    password: string;
    acceptedTerms: boolean;
    deviceFingerprint?: string;
  }) => Promise<any>;
  verifyRegistration: (identifier: string, code: string) => Promise<any>;
  resendCode: (identifier: string, purpose?: string) => Promise<any>;
  forgotPassword: (identifier: string) => Promise<any>;
  resetPassword: (identifier: string, code: string, newPassword: string) => Promise<any>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  setUser: (user: any) => void;
}

export const useAuthStore = create<UserState>((set) => ({
  user: null,
  token: localStorage.getItem('nova_token'),
  isAuthenticated: !!localStorage.getItem('nova_token'),

  login: async (email, password) => {
    const res = await api.post('/auth/login', { identifier: email, password });
    const { token, user } = res.data.data;
    if (token) {
      localStorage.setItem('nova_token', token);
      set({ user, token, isAuthenticated: true });
      useWalletStore.getState().fetchWallet();
      useWalletStore.getState().fetchTransactions();
      getGameSocket().emit('WALLET_SUBSCRIBE', { token });
    }
  },

  loginMinimal: async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    const data = res.data.data;
    if (data.token) {
      localStorage.setItem('nova_token', data.token);
      set({ user: data.user, token: data.token, isAuthenticated: true });
      useWalletStore.getState().fetchWallet();
      useWalletStore.getState().fetchTransactions();
      getGameSocket().emit('WALLET_SUBSCRIBE', { token: data.token });
    }
    return data;
  },

  register: async (username, email, password, referralCode, deviceFingerprint) => {
    const res = await api.post('/auth/register', {
      identifier: email,
      password,
      acceptedTerms: true,
      ...(deviceFingerprint ? { deviceFingerprint } : {}),
    });
    return res.data.data;
  },

  registerMinimal: async (data) => {
    const res = await api.post('/auth/register', data);
    return res.data.data;
  },

  verifyRegistration: async (identifier, code) => {
    const res = await api.post('/auth/verify-registration', { identifier, code });
    const { token, user } = res.data.data;
    if (token) {
      localStorage.setItem('nova_token', token);
      set({ user, token, isAuthenticated: true });
      useWalletStore.getState().fetchWallet();
      useWalletStore.getState().fetchTransactions();
      getGameSocket().emit('WALLET_SUBSCRIBE', { token });
    }
    return res.data.data;
  },

  resendCode: async (identifier, purpose = 'REGISTER') => {
    const res = await api.post('/auth/resend-code', { identifier, purpose });
    return res.data.data;
  },

  forgotPassword: async (identifier) => {
    const res = await api.post('/auth/forgot-password', { identifier });
    return res.data.data;
  },

  resetPassword: async (identifier, code, newPassword) => {
    const res = await api.post('/auth/reset-password', { identifier, code, newPassword });
    return res.data.data;
  },

  logout: () => {
    localStorage.removeItem('nova_token');
    set({ user: null, token: null, isAuthenticated: false });
    useWalletStore.getState().updateBalance(0);
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
