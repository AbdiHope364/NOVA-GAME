import axios from 'axios';
import { LeaderboardEntry, UserTttStats } from '../types/ticTacToe.types';

const API_BASE = '/api/v1/games/tic-tac-toe';

export const ticTacToeApi = {
  async getOverview() {
    const res = await axios.get(API_BASE);
    return res.data;
  },

  async getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
    const res = await axios.get(`${API_BASE}/leaderboard`, { params: { limit } });
    return res.data?.leaderboard || [];
  },

  async getMyStats(userId?: string): Promise<UserTttStats> {
    const res = await axios.get(`${API_BASE}/my-stats`, { params: { userId } });
    return res.data?.stats;
  },

  async getHistory(limit = 20) {
    const res = await axios.get(`${API_BASE}/history`, { params: { limit } });
    return res.data?.history || [];
  },
};
