import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
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
      '@nova/game-roulette': path.resolve(__dirname, '../../games/roulette/src/index.ts')
    }
  },
  server: {
    port: 3000,
    host: true
  }
});
