import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRoutes } from './routes/AppRoutes';
import { useAuthStore } from './stores/authStore';
import { useWalletStore } from './stores/walletStore';

const queryClient = new QueryClient();

export function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const fetchWallet = useWalletStore((s) => s.fetchWallet);

  useEffect(() => {
    fetchMe();
    fetchWallet();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
