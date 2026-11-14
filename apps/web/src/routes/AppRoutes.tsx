import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { HomePage } from '../pages/Home/HomePage';
import { AllGamesPage } from '../pages/Games/AllGamesPage';
import { MultiplayerPage } from '../pages/Multiplayer/MultiplayerPage';
import { LeaderboardPage } from '../pages/Leaderboard/LeaderboardPage';
import { NotificationsPage } from '../pages/Notifications/NotificationsPage';
import { ReferralsPage } from '../pages/Referrals/ReferralsPage';
import { SupportPage } from '../pages/Support/SupportPage';
import { FriendsPage } from '../pages/Friends/FriendsPage';
import { MissionsAchievementsPage } from '../pages/Engagement/MissionsAchievementsPage';
import { TournamentsPage } from '../pages/Tournaments/TournamentsPage';
import { LoginPage } from '../pages/Login/LoginPage';
import { RegisterPage } from '../pages/Register/RegisterPage';
import { WalletPage } from '../pages/Wallet/WalletPage';
import { HistoryPage } from '../pages/History/HistoryPage';
import { SettingsPage } from '../pages/Settings/SettingsPage';
import { PromotionsPage } from '../pages/Promotions/PromotionsPage';
import { AdminPage } from '../pages/Admin/AdminPage';
import { CoinFlipPage } from '../games/coin-flip/CoinFlipPage';
import { TicTacToePage } from '../games/tic-tac-toe/TicTacToePage';
import { DicePage } from '../games/dice/DicePage';
import { CrashPage } from '../games/crash/CrashPage';
import { RoulettePage } from '../games/roulette/RoulettePage';
import { BingoPage } from '../games/bingo/BingoPage';
import { LimboPage } from '../games/limbo/LimboPage';
import { PlinkoPage } from '../games/plinko/PlinkoPage';
import { HiLoPage } from '../games/hilo/HiLoPage';
import { DamaPage } from '../games/dama/DamaPage';
import { MinesPage } from '../games/mines/MinesPage';
import { LettiPage } from '../games/letti/LettiPage';
import { ChessPage } from '../games/chess/ChessPage';
import { LudoPage } from '../games/ludo/LudoPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Standalone Admin Portal Routes */}
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/*" element={<AdminPage />} />

      {/* Main Player Dashboard App Routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="games" element={<AllGamesPage />} />
        <Route path="multiplayer" element={<MultiplayerPage />} />
        <Route path="tournaments" element={<TournamentsPage />} />
        <Route path="wallet" element={<WalletPage />} />
        <Route path="transactions" element={<WalletPage defaultTab="HISTORY" />} />
        <Route path="bonuses" element={<PromotionsPage />} />
        <Route path="promotions" element={<PromotionsPage />} />
        <Route path="referrals" element={<ReferralsPage />} />
        <Route path="friends" element={<FriendsPage />} />
        <Route path="missions" element={<MissionsAchievementsPage />} />
        <Route path="achievements" element={<MissionsAchievementsPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<SettingsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        {/* Existing Playable Games + NOVA Chess */}
        <Route path="games/tic-tac-toe" element={<TicTacToePage />} />
        <Route path="games/coin-flip" element={<CoinFlipPage />} />
        <Route path="games/dice" element={<DicePage />} />
        <Route path="games/crash" element={<CrashPage />} />
        <Route path="games/roulette" element={<RoulettePage />} />
        <Route path="games/bingo" element={<BingoPage />} />
        <Route path="games/limbo" element={<LimboPage />} />
        <Route path="games/plinko" element={<PlinkoPage />} />
        <Route path="games/hilo" element={<HiLoPage />} />
        <Route path="games/dama" element={<DamaPage />} />
        <Route path="games/mines" element={<MinesPage />} />
        <Route path="games/letti" element={<LettiPage />} />
        <Route path="games/chess" element={<ChessPage />} />
        <Route path="games/ludo" element={<LudoPage />} />
      </Route>

      {/* Fallback redirect for unmatched routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
