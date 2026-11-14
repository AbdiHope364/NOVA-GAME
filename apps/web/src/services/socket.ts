import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

// Resolve WebSocket URL: prefer VITE_SOCKET_URL, then VITE_WS_URL, then localhost in dev, or origin in prod
const resolveSocketUrl = (): string => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  if (import.meta.env.DEV) {
    const host = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
    return `http://${host}:5000`;
  }
  // In production behind reverse proxy, connect to same host/protocol
  return typeof window !== 'undefined' ? window.location.origin : '';
};

export function getGameSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(resolveSocketUrl(), {
      transports: ['websocket', 'polling'], // Prioritize WebSocket with polling fallback
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      auth: {
        token: localStorage.getItem('nova_token') || 'demo-guest-token',
      },
    });
  }
  return socketInstance;
}
