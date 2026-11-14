import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      includeAssets: [
        'favicon.ico',
        'favicon.svg',
        'apple-touch-icon.png',
        'icons/apple-touch-icon.png',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/icon-maskable-512.png',
        'images/nova-icon.png',
        'images/nova-logo.png',
      ],
      manifest: {
        name: 'NOVA Gaming',
        short_name: 'NOVA',
        description: 'NOVA Gaming - Next-Gen Multi-Game Platform',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#1B2A41',
        background_color: '#1B2A41',
        lang: 'en',
        categories: ['games', 'entertainment'],
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/socket\.io\//, /^\/health/, /^\/ready/],
        runtimeCaching: [
          // 1. NEVER cache authenticated, wallet or real-time API responses (NetworkOnly)
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/api/') ||
              url.pathname.includes('/wallet') ||
              url.pathname.includes('/auth'),
            handler: 'NetworkOnly',
            options: {
              backgroundSync: {
                name: 'api-network-only-queue',
                options: {
                  maxRetentionTime: 1, // Do not retry sensitive wallet/auth calls silently
                },
              },
            },
          },
          // 2. NEVER cache Socket.IO WebSocket or polling handshakes (NetworkOnly)
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/socket.io/'),
            handler: 'NetworkOnly',
          },
          // 3. Stale-while-revalidate for local & static images
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'nova-images-cache',
              expiration: {
                maxEntries: 120,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
          // 4. Stale-while-revalidate for static fonts
          {
            urlPattern: /\.(?:woff|woff2|eot|ttf|otf)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'nova-fonts-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // Don't interfere with hot module reloading in dev mode
      },
    }),
  ],
  resolve: {
    alias: {
      '@nova/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
      '@nova/ui': path.resolve(__dirname, '../../packages/ui/src/index.tsx'),
      '@nova/i18n': path.resolve(__dirname, '../../packages/i18n/src/index.ts'),
      '@nova/auth': path.resolve(__dirname, '../../packages/auth/src/index.ts'),
      '@nova/wallet': path.resolve(__dirname, '../../packages/wallet/src/index.ts'),
      '@nova/fairness': path.resolve(__dirname, '../../packages/fairness/src/index.ts'),
      '@nova/game-engine': path.resolve(__dirname, '../../packages/game-engine/src/index.ts'),
      '@nova/game-coin-flip': path.resolve(__dirname, '../../games/coin-flip/src/index.ts'),
      '@nova/game-dice': path.resolve(__dirname, '../../games/dice/src/index.ts'),
      '@nova/game-crash': path.resolve(__dirname, '../../games/crash/src/index.ts'),
      '@nova/game-roulette': path.resolve(__dirname, '../../games/roulette/src/index.ts'),
      '@nova/game-mines': path.resolve(__dirname, '../../games/mines/src/index.ts'),
      '@nova/game-bingo': path.resolve(__dirname, '../../games/bingo/src/index.ts'),
      '@nova/game-limbo': path.resolve(__dirname, '../../games/limbo/src/index.ts'),
      '@nova/game-plinko': path.resolve(__dirname, '../../games/plinko/src/index.ts'),
      '@nova/game-hilo': path.resolve(__dirname, '../../games/hilo/src/index.ts'),
      '@nova/game-dama': path.resolve(__dirname, '../../games/dama/src/index.ts'),
      '@nova/game-letti': path.resolve(__dirname, '../../games/letti/src/index.ts'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
});
