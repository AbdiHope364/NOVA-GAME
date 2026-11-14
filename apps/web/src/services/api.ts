import axios from 'axios';

// Resolve API base URL: from build-time VITE_API_URL, or relative /api/v1 in production, or localhost in dev
const resolveApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (import.meta.env.DEV) {
    return 'http://localhost:5000/api/v1';
  }
  return '/api/v1';
};

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nova_token') || 'demo-guest-token';
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function getAdminApiUrl(path: string): string {
  const base = resolveApiBaseUrl().replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/api\/v1/, '').replace(/^\//, '');
  return `${base}/${cleanPath}`;
}

