import { create } from 'zustand';
import { api } from '../services/api';

export interface UserState {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
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
  },

  register: async (username, email, password) => {
    const res = await api.post('/auth/register', { username, email, password });
    const { token, user } = res.data.data;
    localStorage.setItem('nova_token', token);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('nova_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.data, isAuthenticated: true });
    } catch {
      // Local demo mode fallback
    }
  },
}));
