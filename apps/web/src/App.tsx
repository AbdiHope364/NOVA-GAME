import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRoutes } from './routes/AppRoutes';
import { useAuthStore } from './stores/authStore';
import { useWalletStore } from './stores/walletStore';
import { getGameSocket } from './services/socket';
import { PwaUpdatePrompt } from './components/pwa/PwaUpdatePrompt';
import { PwaInstallPrompt } from './components/pwa/PwaInstallPrompt';
import { OfflineBanner } from './components/pwa/OfflineBanner';

const queryClient = new QueryClient();

export function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const fetchWallet = useWalletStore((s) => s.fetchWallet);
  const fetchTransactions = useWalletStore((s) => s.fetchTransactions);
  const updateBalance = useWalletStore((s) => s.updateBalance);
  const setWalletNotification = useWalletStore((s) => s.setWalletNotification);

  useEffect(() => {
    fetchMe();
    fetchWallet();
    fetchTransactions();

    const socket = getGameSocket();
    const token = localStorage.getItem('nova_token');
    if (token) {
      socket.emit('WALLET_SUBSCRIBE', { token });
    }

    const handleWalletUpdated = (payload: any) => {
      if (typeof payload?.balance === 'number') {
        updateBalance(payload.balance);
      } else {
        fetchWallet();
      }
      fetchTransactions();
      if (payload?.message) {
        setWalletNotification(payload.message);
        setTimeout(() => setWalletNotification(null), 7000);
      }
    };

    socket.on('WALLET_UPDATED', handleWalletUpdated);
    return () => {
      socket.off('WALLET_UPDATED', handleWalletUpdated);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <OfflineBanner />
        <AppRoutes />
        <PwaInstallPrompt />
        <PwaUpdatePrompt />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
