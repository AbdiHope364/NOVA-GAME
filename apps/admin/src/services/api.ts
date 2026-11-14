const resolveApiBase = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  if (import.meta.env.DEV) {
    return 'http://localhost:5000/api/v1';
  }
  return '/api/v1';
};

export const API_BASE_URL = resolveApiBase();

export function getAdminApiUrl(path: string): string {
  const cleanPath = path.replace(/^\/api\/v1/, '').replace(/^\//, '');
  return `${API_BASE_URL}/${cleanPath}`;
}

