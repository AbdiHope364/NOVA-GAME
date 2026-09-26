import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { HomePage } from '../pages/Home/HomePage';
import { LoginPage } from '../pages/Login/LoginPage';
import { RegisterPage } from '../pages/Register/RegisterPage';
import { WalletPage } from '../pages/Wallet/WalletPage';
import { HistoryPage } from '../pages/History/HistoryPage';
import { CoinFlipPage } from '../games/CoinFlip/CoinFlipPage';
import { DicePage } from '../games/Dice/DicePage';
import { CrashPage } from '../games/Crash/CrashPage';
import { RoulettePage } from '../games/Roulette/RoulettePage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="wallet" element={<WalletPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="games/coin-flip" element={<CoinFlipPage />} />
        <Route path="games/dice" element={<DicePage />} />
        <Route path="games/crash" element={<CrashPage />} />
        <Route path="games/roulette" element={<RoulettePage />} />
      </Route>
    </Routes>
  );
};
