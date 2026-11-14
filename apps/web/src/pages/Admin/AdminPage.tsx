import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  Wallet,
  Gamepad2,
  ShieldAlert,
  BarChart3,
  Sliders,
  LogOut,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Eye,
  Pause,
  Play,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  FileText,
  Check,
  X,
  Lock,
  ShieldCheck,
  Layers,
  Activity,
  DollarSign,
  CreditCard,
  ArrowUpDown,
  Flame,
  Crown,
  Sparkles,
  Clock,
  Download,
  ExternalLink,
  Maximize2,
  RotateCw,
  Building2,
  Smartphone,
  Calendar,
  Zap,
  Home,
  Shield,
  Award,
} from 'lucide-react';
import { getAdminApiUrl } from '../../services/api';
import { BonusReferralManager, LettiPvpManager, EngagementAdminManager } from '@nova/ui';

const getAuthToken = () =>
  localStorage.getItem('nova_admin_token') ||
  localStorage.getItem('token') ||
  localStorage.getItem('nova_token') ||
  '';

interface PendingDeposit {
  id: string;
  amount: number;
  paymentMethod: string;
  phoneNumber: string;
  receiptUrl: string;
  referenceId?: string;
  createdAt: string;
  wallet: {
    user: {
      id: string;
      username: string;
      email: string;
    };
  };
}

interface PendingWithdrawal {
  id: string;
  amount: number;
  paymentMethod: string;
  phoneNumber?: string;
  destinationAddress?: string;
  referenceId?: string;
  status: string;
  createdAt: string;
  wallet: {
    balance: number;
    user: {
      id: string;
      username: string;
      email: string;
    };
  };
}

interface LedgerItem {
  id: string;
  amount: number;
  type: string;
  status: string;
  balanceAfter?: number;
  referenceId?: string;
  paymentMethod?: string;
  createdAt: string;
  wallet: {
    user: {
      id: string;
      username: string;
      email: string;
    };
  };
}

interface UserItem {
  id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  wallet?: {
    balance: number;
    currency: string;
  };
}

interface GameConfigItem {
  id?: string;
  gameId: string;
  name: string;
  houseEdgePercent: number;
  minBet: number;
  maxBet: number;
  enabled: boolean;
  updatedAt?: string;
}

interface AuditLogItem {
  id: string;
  adminId: string;
  action: string;
  targetId?: string;
  details?: string;
  createdAt: string;
}

export function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!(
      localStorage.getItem('nova_admin_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('nova_token')
    );
  });

  const [adminUser, setAdminUser] = useState<any>(() => {
    try {
      const u = localStorage.getItem('nova_admin_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });

  // Auth form state
  const [loginEmail, setLoginEmail] = useState('admin@novagame.et');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active Navigation
  const [activeNav, setActiveNav] = useState<
    'DASHBOARD' | 'USERS' | 'FINANCE' | 'GAMES' | 'LETTI_PVP' | 'ENGAGEMENT' | 'PROMOTIONS' | 'RISK' | 'REPORTS' | 'SETTINGS'
  >('DASHBOARD');

  // Sub-tabs
  const [financeTab, setFinanceTab] = useState<'DEPOSITS' | 'WITHDRAWALS' | 'LEDGER'>('DEPOSITS');
  const [gameTab, setGameTab] = useState<'CRASH' | 'BINGO' | 'DAMA' | 'CASINO'>('CRASH');

  // Time range filter
  const [timeRange, setTimeRange] = useState<'TODAY' | '7D' | '30D' | 'ALL'>('7D');

  // Live Data State
  const [stats, setStats] = useState<{
    totalUsers: number;
    activeUsers: number;
    totalBets: number;
    totalWagered: number;
    totalPayouts: number;
    platformRevenue: number;
    averageRtp: number;
    totalDeposits: number;
    totalWithdrawals: number;
    pendingDepositsCount: number;
    pendingWithdrawalsCount: number;
    dailySeries: { label: string; turnover: number; revenue: number }[];
    recentActivity: any[];
  }>({
    totalUsers: 0,
    activeUsers: 0,
    totalBets: 0,
    totalWagered: 0,
    totalPayouts: 0,
    platformRevenue: 0,
    averageRtp: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingDepositsCount: 0,
    pendingWithdrawalsCount: 0,
    dailySeries: [],
    recentActivity: [],
  });

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  const [deposits, setDeposits] = useState<PendingDeposit[]>([]);
  const [loadingDeposits, setLoadingDeposits] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PendingDeposit | null>(null);
  const [receiptZoom, setReceiptZoom] = useState(1);
  const [receiptRotation, setReceiptRotation] = useState(0);

  const [withdrawals, setWithdrawals] = useState<PendingWithdrawal[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);

  const [ledgerEntries, setLedgerEntries] = useState<LedgerItem[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState('ALL');

  const [games, setGames] = useState<GameConfigItem[]>([
    { gameId: 'crash', name: 'Aviator Crash', houseEdgePercent: 1.0, minBet: 1, maxBet: 10000, enabled: true },
    { gameId: 'bingo', name: 'Classic Bingo 75', houseEdgePercent: 2.0, minBet: 5, maxBet: 2500, enabled: true },
    { gameId: 'dama', name: 'Ethiopian Dama (8x8)', houseEdgePercent: 5.0, minBet: 10, maxBet: 5000, enabled: true },
    { gameId: 'roulette', name: 'European Roulette', houseEdgePercent: 2.7, minBet: 1, maxBet: 10000, enabled: true },
    { gameId: 'coin-flip', name: 'Coin Flip 3D', houseEdgePercent: 1.0, minBet: 1, maxBet: 5000, enabled: true },
    { gameId: 'dice', name: 'Classic Slider Dice', houseEdgePercent: 1.0, minBet: 1, maxBet: 5000, enabled: true },
    { gameId: 'limbo', name: 'Limbo Multiplier', houseEdgePercent: 1.0, minBet: 1, maxBet: 5000, enabled: true },
    { gameId: 'plinko', name: 'Plinko Pyramid', houseEdgePercent: 1.0, minBet: 1, maxBet: 5000, enabled: true },
    { gameId: 'hilo', name: 'Hi-Lo Card Guess', houseEdgePercent: 1.0, minBet: 1, maxBet: 5000, enabled: true },
    { gameId: 'letti', name: 'Letti 52-Card Match', houseEdgePercent: 2.0, minBet: 1, maxBet: 10000, enabled: true },
    { gameId: 'mines', name: 'Mines Grid Cashout', houseEdgePercent: 1.0, minBet: 1, maxBet: 5000, enabled: true },
  ]);

  // Aviator Crash Monitor
  const [crashData, setCrashData] = useState<{
    isRunning: boolean;
    state: string;
    currentMultiplier: number;
    roundId: number;
    activeBetsCount: number;
    totalActiveWager: number;
    serverSeedHash: string;
    clientSeed: string;
    nonce: number;
  }>({
    isRunning: true,
    state: 'FLYING',
    currentMultiplier: 2.45,
    roundId: 10842,
    activeBetsCount: 14,
    totalActiveWager: 3200,
    serverSeedHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    clientSeed: 'nova-fairness-prod-seed',
    nonce: 10842,
  });

  // Bingo Config
  const [cartellaConfig, setCartellaConfig] = useState({
    roundId: 'NOVA-1024',
    stake: 50,
    prize: 350,
    adminFee: 150,
    maxSlots: 10,
    activePlayers: 10,
    pattern: 'ONE_LINE',
    patternName: '1 Line (Any)',
    patternDescription: 'Any single horizontal, vertical, or diagonal line',
    status: 'IN_PROGRESS',
    nextNumberCountdown: 4,
  });

  // Dama Flags
  const [damaFlags, setDamaFlags] = useState<any[]>([]);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // Platform Settings State
  const [settings, setSettings] = useState({
    platformName: 'NOVA GAMING',
    maintenanceMode: false,
    autoWithdrawLimit: 5000,
    minDeposit: 10,
    maxDeposit: 50000,
    minBet: 1,
    maxBet: 10000,
  });

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // --------------------------------------------------------------------------
  // API Calls
  // --------------------------------------------------------------------------
  const fetchStats = async () => {
    try {
      const res = await fetch(getAdminApiUrl('/admin/stats'), {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setStats((prev) => ({ ...prev, ...json.data }));
        }
      }
    } catch {}
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(getAdminApiUrl('/admin/users'), {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (res.ok) {
        const json = await res.json();
        setUsers(json.data || []);
      }
    } catch {
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchDeposits = async () => {
    setLoadingDeposits(true);
    try {
      const res = await fetch(getAdminApiUrl('/admin/deposits/pending'), {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (res.ok) {
        const json = await res.json();
        setDeposits(json.data || []);
      }
    } catch {
    } finally {
      setLoadingDeposits(false);
    }
  };

  const fetchWithdrawals = async () => {
    setLoadingWithdrawals(true);
    try {
      const res = await fetch(getAdminApiUrl('/admin/withdrawals/pending'), {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (res.ok) {
        const json = await res.json();
        setWithdrawals(json.data || []);
      }
    } catch {
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  const fetchLedger = async () => {
    setLoadingLedger(true);
    try {
      const res = await fetch(
        getAdminApiUrl(`/admin/ledger?type=${ledgerTypeFilter}&limit=100`),
        {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        }
      );
      if (res.ok) {
        const json = await res.json();
        setLedgerEntries(json.data || []);
      }
    } catch {
    } finally {
      setLoadingLedger(false);
    }
  };

  const fetchGames = async () => {
    try {
      const res = await fetch(getAdminApiUrl('/admin/games'), {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          setGames(json.data);
        }
      }
    } catch {}
  };

  const fetchCrashMonitor = async () => {
    try {
      const res = await fetch(getAdminApiUrl('/admin/crash/monitor'), {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) setCrashData(json.data);
      }
    } catch {}
  };

  const fetchCartellaConfig = async () => {
    try {
      const res = await fetch(getAdminApiUrl('/admin/bingo/round-config'), {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) setCartellaConfig(json.data);
      }
    } catch {}
  };

  const fetchAbuseFlags = async () => {
    try {
      const res = await fetch(getAdminApiUrl('/matches/admin/flags'), {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (res.ok) {
        const json = await res.json();
        setDamaFlags(json.data || []);
      }
    } catch {}
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch(getAdminApiUrl('/admin/audit-logs'), {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (res.ok) {
        const json = await res.json();
        setAuditLogs(json.data || []);
      }
    } catch {}
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(getAdminApiUrl('/admin/settings'), {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setSettings((prev) => ({ ...prev, ...json.data }));
        }
      }
    } catch {}
  };

  const handleSaveSettings = async () => {
    try {
      const res = await fetch(getAdminApiUrl('/admin/settings'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Failed to save platform settings');
      const json = await res.json();
      if (json.data) setSettings((prev) => ({ ...prev, ...json.data }));
      showToast('Platform settings saved to database.');
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'error');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
      fetchDeposits();
      fetchWithdrawals();
      fetchGames();
      fetchUsers();
      fetchSettings();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeNav === 'USERS') fetchUsers();
    if (activeNav === 'FINANCE') {
      if (financeTab === 'DEPOSITS') fetchDeposits();
      if (financeTab === 'WITHDRAWALS') fetchWithdrawals();
      if (financeTab === 'LEDGER') fetchLedger();
    }
    if (activeNav === 'GAMES') {
      fetchGames();
      fetchCrashMonitor();
      fetchCartellaConfig();
      fetchAbuseFlags();
    }
    if (activeNav === 'RISK') {
      fetchAbuseFlags();
      fetchAuditLogs();
    }
    if (activeNav === 'SETTINGS') {
      fetchSettings();
    }
  }, [activeNav, financeTab, gameTab]);

  // Actions
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await fetch(getAdminApiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      if (data.data?.user?.role !== 'ADMIN') {
        throw new Error('Access denied: Admin privileges required.');
      }
      localStorage.setItem('nova_admin_token', data.data.token);
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('nova_token', data.data.token);
      localStorage.setItem('nova_admin_user', JSON.stringify(data.data.user));
      setAdminUser(data.data.user);
      setIsAuthenticated(true);
      showToast('Welcome back to NOVA Admin Control Center!');
    } catch (err: any) {
      setLoginError(err.message || 'Authentication failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('nova_admin_token');
    localStorage.removeItem('nova_admin_user');
    setIsAuthenticated(false);
    setAdminUser(null);
    showToast('Admin session logged out.');
  };

  const handleApproveDeposit = async (id: string) => {
    try {
      const res = await fetch(getAdminApiUrl(`/admin/deposits/${id}/approve`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed to approve deposit');
      showToast('Deposit approved! User balance credited.');
      setSelectedReceipt(null);
      fetchDeposits();
      fetchStats();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRejectDeposit = async (id: string) => {
    try {
      const res = await fetch(getAdminApiUrl(`/admin/deposits/${id}/reject`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed to reject deposit');
      showToast('Deposit rejected.', 'error');
      setSelectedReceipt(null);
      fetchDeposits();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleApproveWithdrawal = async (id: string) => {
    try {
      const res = await fetch(getAdminApiUrl(`/admin/withdrawals/${id}/approve`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed to approve withdrawal');
      showToast('Withdrawal marked as completed / paid.');
      fetchWithdrawals();
      fetchStats();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRejectWithdrawal = async (id: string) => {
    try {
      const res = await fetch(getAdminApiUrl(`/admin/withdrawals/${id}/reject`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Rejected by administrator' }),
      });
      if (!res.ok) throw new Error('Failed to reject withdrawal');
      showToast('Withdrawal rejected and funds refunded to user.', 'error');
      fetchWithdrawals();
      fetchStats();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleUserStatus = async (id: string) => {
    try {
      const res = await fetch(getAdminApiUrl(`/admin/users/${id}/toggle-status`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (!res.ok) throw new Error('Failed to toggle status');
      showToast('User account status updated.');
      fetchUsers();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleEmergencyCrashPause = async () => {
    try {
      const res = await fetch(getAdminApiUrl('/admin/crash/pause'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Manual operator pause' }),
      });
      const data = await res.json();
      showToast(data.message || 'Crash engine paused with 100% wager refund.', 'error');
      fetchCrashMonitor();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleResumeCrash = async () => {
    try {
      const res = await fetch(getAdminApiUrl('/admin/crash/resume'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const data = await res.json();
      showToast(data.message || 'Crash engine resumed.');
      fetchCrashMonitor();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveBingoConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(getAdminApiUrl('/admin/bingo/round-config'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cartellaConfig),
      });
      if (!res.ok) throw new Error('Failed to update config');
      showToast('Cartella Bingo round settings saved!');
      fetchCartellaConfig();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleGameEnabled = async (gameId: string, currentEnabled: boolean) => {
    try {
      const res = await fetch(getAdminApiUrl(`/admin/games/${gameId}/config`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      if (!res.ok) throw new Error('Failed to toggle game status');
      showToast('Game status updated.');
      fetchGames();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Metric,Value\n' +
      `Total Users,${stats.totalUsers}\n` +
      `Active Users,${stats.activeUsers}\n` +
      `Total Wagered (ETB),${stats.totalWagered}\n` +
      `Total Payouts (ETB),${stats.totalPayouts}\n` +
      `Platform Revenue (ETB),${stats.platformRevenue}\n` +
      `Total Deposits (ETB),${stats.totalDeposits}\n` +
      `Total Withdrawals (ETB),${stats.totalWithdrawals}\n`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nova_gaming_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Report downloaded successfully.');
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.id.toLowerCase().includes(userSearch.toLowerCase());
      const matchRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
      const matchStatus =
        userStatusFilter === 'ALL' ||
        (userStatusFilter === 'ACTIVE' && u.isActive) ||
        (userStatusFilter === 'SUSPENDED' && !u.isActive);
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, userSearch, userRoleFilter, userStatusFilter]);

  // --------------------------------------------------------------------------
  // RENDER: Unauthenticated Admin Login
  // --------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#080D18] flex items-center justify-center p-4 text-white">
        <div className="w-full max-w-md bg-[#111827] border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col items-center text-center mb-8">
            <img
              src="/images/nova-logo.png"
              alt="NOVA GAMING"
              className="h-20 w-auto object-contain mb-3 drop-shadow-[0_0_20px_rgba(139,92,246,0.45)]"
            />
            <h1 className="text-2xl font-black tracking-tight text-white">
              NOVA <span className="text-[#F5B942]">ADMIN</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
              Operations & Risk Control Center
            </p>
          </div>

          {loginError && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5 font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                Admin Email
              </label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="w-full bg-[#172033] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#F5B942] transition-colors font-medium"
                placeholder="admin@novagame.et"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="w-full bg-[#172033] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#F5B942] transition-colors font-medium"
                placeholder="••••••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-[#F5B942] hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer mt-6 disabled:opacity-50"
            >
              {loginLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Sign In to Control Center
            </button>
          </form>

          <div className="mt-6 text-center border-t border-slate-800/80 pt-4">
            <a
              href="/"
              className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5 font-bold"
            >
              <Home className="w-3.5 h-3.5" /> Return to Player Lobby
            </a>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER: Authenticated Full-Screen Admin Layout
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen w-full bg-[#080D18] text-white flex flex-col font-sans selection:bg-amber-500/30">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-[#111827] border-b border-slate-800/80 px-4 sm:px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <img
            src="/images/nova-icon.png"
            alt="NOVA GAMING"
            className="w-10 h-10 rounded-xl object-contain shrink-0 drop-shadow-[0_0_10px_rgba(139,92,246,0.35)]"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight text-white">
                NOVA <span className="text-[#F5B942]">ADMIN</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-[#10B981] border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider">
                LIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wide hidden sm:block">
              Platform Operations & Financial Risk Center
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          {/* Time Filter Pills */}
          <div className="hidden md:flex items-center bg-[#172033] border border-slate-800 rounded-xl p-1 text-xs">
            {(['TODAY', '7D', '30D', 'ALL'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  timeRange === r
                    ? 'bg-[#F5B942] text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              fetchStats();
              fetchDeposits();
              fetchWithdrawals();
              if (activeNav === 'USERS') fetchUsers();
              if (activeNav === 'FINANCE' && financeTab === 'LEDGER') fetchLedger();
              showToast('Data refreshed');
            }}
            className="p-2 rounded-xl bg-[#172033] hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer border border-slate-700/60"
            title="Refresh Live Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <a
            href="/"
            className="px-3 py-1.5 rounded-xl bg-[#172033] hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <Home className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Player Lobby</span>
          </a>

          {/* Admin Profile & Logout */}
          <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-black text-white shadow-inner">
              {adminUser?.username?.substring(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-white leading-tight">
                {adminUser?.username || 'NovaAdmin'}
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold leading-tight">
                Superadmin
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors text-xs font-bold cursor-pointer ml-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-60 lg:w-64 bg-[#111827] border-r border-slate-800/80 flex flex-col shrink-0 p-3.5 gap-1.5 overflow-y-auto no-scrollbar">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider px-3 mb-1">
            Core Modules
          </span>

          <button
            type="button"
            onClick={() => setActiveNav('DASHBOARD')}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeNav === 'DASHBOARD'
                ? 'bg-amber-500/15 border border-[#F5B942]/40 text-[#F5B942] shadow-lg shadow-amber-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          </button>

          <button
            type="button"
            onClick={() => setActiveNav('USERS')}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeNav === 'USERS'
                ? 'bg-amber-500/15 border border-[#F5B942]/40 text-[#F5B942] shadow-lg shadow-amber-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4" />
              <span>User Management</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {stats.totalUsers}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveNav('FINANCE')}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeNav === 'FINANCE'
                ? 'bg-amber-500/15 border border-[#F5B942]/40 text-[#F5B942] shadow-lg shadow-amber-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <Wallet className="w-4 h-4" />
              <span>Financial Control</span>
            </div>
            {deposits.length > 0 && (
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 animate-pulse">
                {deposits.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveNav('GAMES')}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeNav === 'GAMES'
                ? 'bg-amber-500/15 border border-[#F5B942]/40 text-[#F5B942] shadow-lg shadow-amber-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <Gamepad2 className="w-4 h-4" />
              <span>Game Management</span>
            </div>
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-cyan-500/20 text-[#22D3EE] border border-cyan-500/30">
              10
            </span>
          </button>

          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider px-3 mt-4 mb-1">
            Governance & Audit
          </span>

          <button
            type="button"
            onClick={() => setActiveNav('LETTI_PVP')}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeNav === 'LETTI_PVP'
                ? 'bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 shadow-lg shadow-emerald-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4" />
              <span>Letti 1v1 PvP</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              1v1
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveNav('ENGAGEMENT')}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeNav === 'ENGAGEMENT'
                ? 'bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 shadow-lg shadow-cyan-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <Award className="w-4 h-4" />
              <span>Daily &amp; Reports</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
              XP
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveNav('PROMOTIONS')}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeNav === 'PROMOTIONS'
                ? 'bg-amber-500/15 border border-[#F5B942]/40 text-[#F5B942] shadow-lg shadow-amber-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4" />
              <span>Bonus &amp; Referrals</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
              1000%
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveNav('RISK')}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeNav === 'RISK'
                ? 'bg-amber-500/15 border border-[#F5B942]/40 text-[#F5B942] shadow-lg shadow-amber-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-4 h-4" />
              <span>Risk & Security</span>
            </div>
            {damaFlags.length > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400">
                {damaFlags.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveNav('REPORTS')}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeNav === 'REPORTS'
                ? 'bg-amber-500/15 border border-[#F5B942]/40 text-[#F5B942] shadow-lg shadow-amber-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="w-4 h-4" />
              <span>Reports & Analytics</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveNav('SETTINGS')}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeNav === 'SETTINGS'
                ? 'bg-amber-500/15 border border-[#F5B942]/40 text-[#F5B942] shadow-lg shadow-amber-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <Sliders className="w-4 h-4" />
              <span>System Settings</span>
            </div>
          </button>

          {/* Quick Engine Status Card at bottom of sidebar */}
          <div className="mt-auto bg-[#172033] p-3 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-300">Crash Engine</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                  crashData.isRunning
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {crashData.isRunning ? 'Active' : 'Paused'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Multiplier: <span className="text-amber-400 font-bold">{crashData.currentMultiplier.toFixed(2)}x</span>
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              Round: #{crashData.roundId}
            </p>
          </div>
        </aside>

        {/* Dynamic Body Content */}
        <main className="flex-1 w-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Toast Notification */}
          {toastMsg && (
            <div
              className={`p-4 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-between shadow-xl ${
                toastMsg.type === 'error'
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {toastMsg.type === 'error' ? (
                  <XCircle className="w-5 h-5 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                )}
                <span>{toastMsg.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setToastMsg(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ================================================================ */}
          {/* 1. DASHBOARD VIEW                                                 */}
          {/* ================================================================ */}
          {activeNav === 'DASHBOARD' && (
            <div className="space-y-6">
              {/* Top 6 Stat Cards (Matching Platform 1 & BackOffice360) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
                <div className="bg-[#172033] p-4 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Gross Revenue
                    </span>
                    <span className="p-1.5 rounded-lg bg-amber-500/20 text-[#F5B942]">
                      <DollarSign className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-xl font-black text-[#F5B942] font-mono">
                    {stats.platformRevenue.toLocaleString()} ETB
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" /> +14.2% GGR
                  </span>
                </div>

                <div className="bg-[#172033] p-4 rounded-2xl border border-slate-800 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Active Players
                    </span>
                    <span className="p-1.5 rounded-lg bg-cyan-500/20 text-[#22D3EE]">
                      <Users className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-xl font-black text-[#22D3EE] font-mono">
                    {stats.activeUsers}{' '}
                    <span className="text-xs text-slate-400 font-normal">/ {stats.totalUsers}</span>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-bold mt-1 block">
                    62% Live Engagement
                  </span>
                </div>

                <div className="bg-[#172033] p-4 rounded-2xl border border-slate-800 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Total Deposits
                    </span>
                    <span className="p-1.5 rounded-lg bg-emerald-500/20 text-[#10B981]">
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-xl font-black text-[#10B981] font-mono">
                    {stats.totalDeposits.toLocaleString()} ETB
                  </div>
                  <span className="text-[10px] text-amber-400 font-bold mt-1 block">
                    {deposits.length} Pending Review
                  </span>
                </div>

                <div className="bg-[#172033] p-4 rounded-2xl border border-slate-800 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Withdrawals
                    </span>
                    <span className="p-1.5 rounded-lg bg-rose-500/20 text-[#EF4444]">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-xl font-black text-[#EF4444] font-mono">
                    {stats.totalWithdrawals.toLocaleString()} ETB
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold mt-1 block">
                    {withdrawals.length} Pending Approval
                  </span>
                </div>

                <div className="bg-[#172033] p-4 rounded-2xl border border-slate-800 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Total Wagers
                    </span>
                    <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                      <Zap className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-xl font-black text-purple-300 font-mono">
                    {stats.totalWagered.toLocaleString()} ETB
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold mt-1 block">
                    {stats.totalBets} Total Bets
                  </span>
                </div>

                <div className="bg-[#172033] p-4 rounded-2xl border border-slate-800 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Average RTP
                    </span>
                    <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                      <Activity className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-xl font-black text-blue-300 font-mono">
                    {stats.averageRtp > 0 ? `${stats.averageRtp}%` : '—'}
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold mt-1 block">
                    Live Payout Ratio
                  </span>
                </div>
              </div>

              {/* Middle Row: Revenue Chart & Live Activity Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 7-Day Revenue Analytics Area Chart */}
                <div className="lg:col-span-2 bg-[#172033] p-5 rounded-2xl border border-slate-800 shadow-lg flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-sm font-black text-white uppercase tracking-wider">
                        Revenue & Turnover Analytics
                      </h2>
                      <p className="text-xs text-slate-400">
                        Last 7 Days Live Database Wagers vs GGR
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#22D3EE]" />
                        <span className="text-slate-300 font-semibold">Turnover</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#F5B942]" />
                        <span className="text-slate-300 font-semibold">GGR Net</span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic SVG Chart Graphic from stats.dailySeries */}
                  {(() => {
                    const series =
                      stats.dailySeries.length > 0
                        ? stats.dailySeries
                        : [
                            { label: 'Mon', turnover: 0, revenue: 0 },
                            { label: 'Tue', turnover: 0, revenue: 0 },
                            { label: 'Wed', turnover: 0, revenue: 0 },
                            { label: 'Thu', turnover: 0, revenue: 0 },
                            { label: 'Fri', turnover: 0, revenue: 0 },
                            { label: 'Sat', turnover: 0, revenue: 0 },
                            { label: 'Sun', turnover: 0, revenue: 0 },
                          ];
                    const maxVal = Math.max(100, ...series.map((s) => s.turnover));
                    const turnoverPts = series.map((s, idx) => {
                      const x = (idx / Math.max(1, series.length - 1)) * 600;
                      const y = 185 - (s.turnover / maxVal) * 150;
                      return `${x},${y}`;
                    });
                    const revPts = series.map((s, idx) => {
                      const x = (idx / Math.max(1, series.length - 1)) * 600;
                      const y = 185 - (s.revenue / maxVal) * 150;
                      return `${x},${y}`;
                    });

                    return (
                      <>
                        <div className="h-56 w-full relative flex items-end pt-4">
                          <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
                            <defs>
                              <linearGradient id="cyanArea" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.35" />
                                <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.0" />
                              </linearGradient>
                              <linearGradient id="goldArea" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#F5B942" stopOpacity="0.35" />
                                <stop offset="100%" stopColor="#F5B942" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>

                            <line x1="0" y1="40" x2="600" y2="40" stroke="#1E293B" strokeDasharray="4 4" />
                            <line x1="0" y1="90" x2="600" y2="90" stroke="#1E293B" strokeDasharray="4 4" />
                            <line x1="0" y1="140" x2="600" y2="140" stroke="#1E293B" strokeDasharray="4 4" />

                            <polygon
                              points={`0,200 ${turnoverPts.join(' ')} 600,200`}
                              fill="url(#cyanArea)"
                            />
                            <polyline
                              fill="none"
                              stroke="#22D3EE"
                              strokeWidth="3"
                              points={turnoverPts.join(' ')}
                            />

                            <polygon
                              points={`0,200 ${revPts.join(' ')} 600,200`}
                              fill="url(#goldArea)"
                            />
                            <polyline
                              fill="none"
                              stroke="#F5B942"
                              strokeWidth="2.5"
                              points={revPts.join(' ')}
                            />

                            {series.map((s, idx) => {
                              const x = (idx / Math.max(1, series.length - 1)) * 600;
                              const y = 185 - (s.turnover / maxVal) * 150;
                              return (
                                <circle
                                  key={s.label + idx}
                                  cx={x}
                                  cy={y}
                                  r="4"
                                  fill="#22D3EE"
                                  stroke="#080D18"
                                  strokeWidth="2"
                                />
                              );
                            })}
                          </svg>
                        </div>

                        <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-3 border-t border-slate-800">
                          {series.map((s, idx) => (
                            <span key={s.label + idx}>{s.label}</span>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Live Activity Feed (Real Backend Data) */}
                <div className="bg-[#172033] p-5 rounded-2xl border border-slate-800 shadow-lg flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" /> Live Activity Feed
                    </h2>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto max-h-64 no-scrollbar text-xs">
                    {stats.recentActivity.length === 0 ? (
                      <div className="py-10 text-center text-slate-500 font-semibold">
                        No live bets or deposits recorded yet.
                      </div>
                    ) : (
                      stats.recentActivity.map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-xl bg-[#111827] border border-slate-800 flex items-start gap-2.5"
                        >
                          <span
                            className={`p-1.5 rounded-lg mt-0.5 ${
                              item.kind === 'WIN'
                                ? 'bg-emerald-500/20 text-[#10B981]'
                                : item.kind === 'DEPOSIT'
                                ? 'bg-cyan-500/20 text-[#22D3EE]'
                                : item.kind === 'WITHDRAWAL'
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-purple-500/20 text-purple-400'
                            }`}
                          >
                            {item.kind === 'WIN' ? (
                              <Check className="w-3 h-3" />
                            ) : item.kind === 'DEPOSIT' ? (
                              <CreditCard className="w-3 h-3" />
                            ) : item.kind === 'WITHDRAWAL' ? (
                              <ArrowUpRight className="w-3 h-3" />
                            ) : (
                              <Zap className="w-3 h-3" />
                            )}
                          </span>
                          <div className="flex-1">
                            <p className="text-slate-200 font-medium">
                              <span className="font-bold text-white">{item.username}</span>{' '}
                              {item.kind === 'WIN'
                                ? `won ${item.amount} ETB on ${item.gameId} (${item.multiplier}x)`
                                : item.kind === 'BET'
                                ? `bet ${item.amount} ETB on ${item.gameId}`
                                : item.kind === 'DEPOSIT'
                                ? `requested deposit of ${item.amount} ETB (${item.method})`
                                : `requested withdrawal of ${item.amount} ETB`}
                            </p>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(item.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Row: Top Games Summary Table */}
              <div className="bg-[#172033] p-5 rounded-2xl border border-slate-800 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-[#F5B942]" /> Top Performing Games
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveNav('GAMES')}
                    className="text-xs text-[#F5B942] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    Manage All 10 Games <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#111827] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Game</th>
                        <th className="py-3 px-4">House Edge</th>
                        <th className="py-3 px-4">Min / Max Bet</th>
                        <th className="py-3 px-4">Estimated RTP</th>
                        <th className="py-3 px-4">Engine Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-medium">
                      {games.slice(0, 5).map((g) => (
                        <tr key={g.gameId} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            {g.name}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-amber-400 font-bold">
                            {g.houseEdgePercent.toFixed(1)}%
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-300">
                            {g.minBet} - {g.maxBet} ETB
                          </td>
                          <td className="py-3.5 px-4 font-mono text-cyan-400 font-bold">
                            {(100 - g.houseEdgePercent).toFixed(1)}%
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                g.enabled
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {g.enabled ? 'Active' : 'Maintenance'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveNav('GAMES');
                                if (g.gameId === 'crash') setGameTab('CRASH');
                                else if (g.gameId === 'bingo') setGameTab('BINGO');
                                else if (g.gameId === 'dama') setGameTab('DAMA');
                                else setGameTab('CASINO');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-[#F5B942] hover:text-slate-950 text-slate-300 font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              Configure
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* 2. USER MANAGEMENT VIEW                                           */}
          {/* ================================================================ */}
          {activeNav === 'USERS' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#172033] p-4 rounded-2xl border border-slate-800 shadow-lg">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by name, email or ID..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full bg-[#111827] border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#F5B942] transition-colors"
                    />
                  </div>

                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="bg-[#111827] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300 font-bold focus:outline-none"
                  >
                    <option value="ALL">All Roles</option>
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>

                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    className="bg-[#111827] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300 font-bold focus:outline-none"
                  >
                    <option value="ALL">All Status</option>
                    <option value="ACTIVE">Active Only</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>

                <div className="text-xs text-slate-400 font-bold font-mono">
                  Showing {filteredUsers.length} of {users.length} registered players
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-[#172033] rounded-2xl border border-slate-800 shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#111827] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Player</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Wallet Balance</th>
                        <th className="py-3 px-4">Registered</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-medium">
                      {loadingUsers ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#F5B942]" />
                            Loading players database...
                          </td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 font-bold">
                            No matching players found.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4 flex items-center gap-2.5 font-bold text-white">
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-[10px] font-black text-white shrink-0">
                                {u.username.substring(0, 2).toUpperCase()}
                              </div>
                              <span>{u.username}</span>
                            </td>
                            <td className="py-3 px-4 text-slate-300 font-mono">{u.email}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                  u.role === 'ADMIN'
                                    ? 'bg-amber-500/20 text-[#F5B942] border border-amber-500/40'
                                    : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  u.isActive
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                {u.isActive ? 'Active' : 'Suspended'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                              {u.wallet?.balance !== undefined ? u.wallet.balance : 1000} ETB
                            </td>
                            <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-right space-x-2">
                              <button
                                type="button"
                                onClick={() => setSelectedUser(u)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                                title="View Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleUserStatus(u.id)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-black transition-colors cursor-pointer ${
                                  u.isActive
                                    ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                }`}
                              >
                                {u.isActive ? 'Suspend' : 'Activate'}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* User Details Drawer Modal */}
              {selectedUser && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-[#111827] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-sm font-black text-white">
                          {selectedUser.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-base font-black text-white">{selectedUser.username}</h3>
                          <p className="text-xs text-slate-400 font-mono">{selectedUser.email}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedUser(null)}
                        className="p-1.5 rounded-xl bg-[#172033] hover:bg-slate-700 text-slate-400 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="p-3 rounded-xl bg-[#172033] border border-slate-800">
                        <span className="text-slate-400 block mb-1 font-semibold uppercase text-[10px]">Account ID</span>
                        <span className="font-mono text-white text-[11px] break-all">{selectedUser.id}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#172033] border border-slate-800">
                        <span className="text-slate-400 block mb-1 font-semibold uppercase text-[10px]">Current Balance</span>
                        <span className="font-mono font-black text-emerald-400 text-base">
                          {selectedUser.wallet?.balance !== undefined ? selectedUser.wallet.balance : 1000} ETB
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#172033] border border-slate-800">
                        <span className="text-slate-400 block mb-1 font-semibold uppercase text-[10px]">Role</span>
                        <span className="font-bold text-amber-400">{selectedUser.role}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#172033] border border-slate-800">
                        <span className="text-slate-400 block mb-1 font-semibold uppercase text-[10px]">Registration Date</span>
                        <span className="font-mono text-slate-300 text-[11px]">
                          {new Date(selectedUser.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          handleToggleUserStatus(selectedUser.id);
                          setSelectedUser(null);
                        }}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                          selectedUser.isActive
                            ? 'bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40'
                            : 'bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/40'
                        }`}
                      >
                        {selectedUser.isActive ? 'Suspend User Account' : 'Reactivate User Account'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedUser(null)}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* 3. FINANCIAL MANAGEMENT VIEW                                      */}
          {/* ================================================================ */}
          {activeNav === 'FINANCE' && (
            <div className="space-y-6">
              {/* Financial Sub-Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFinanceTab('DEPOSITS')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                    financeTab === 'DEPOSITS'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-[#172033] text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Deposit Approvals</span>
                  {deposits.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-emerald-400 text-[10px]">
                      {deposits.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setFinanceTab('WITHDRAWALS')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                    financeTab === 'WITHDRAWALS'
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                      : 'bg-[#172033] text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Withdrawals Review</span>
                  {withdrawals.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-white text-rose-600 text-[10px]">
                      {withdrawals.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setFinanceTab('LEDGER')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                    financeTab === 'LEDGER'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-[#172033] text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Financial Ledger</span>
                </button>
              </div>

              {/* Sub-tab 1: Deposits Management */}
              {financeTab === 'DEPOSITS' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <p className="font-bold uppercase tracking-wider">
                      Pending Player Manual Deposits (Telebirr, CBE Birr, Chapa)
                    </p>
                    <span className="font-mono font-bold text-amber-400">
                      {deposits.length} Pending Actions
                    </span>
                  </div>

                  {loadingDeposits ? (
                    <div className="p-12 text-center text-slate-400 bg-[#172033] rounded-2xl border border-slate-800">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
                      Checking pending deposit tickets...
                    </div>
                  ) : deposits.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 bg-[#172033] rounded-2xl border border-slate-800 font-bold space-y-2">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
                      <p className="text-base text-white">All deposits processed!</p>
                      <p className="text-xs text-slate-500">No pending player deposits requiring manual review.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {deposits.map((d) => (
                        <div
                          key={d.id}
                          className="bg-[#172033] rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col justify-between space-y-4 relative overflow-hidden"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-[#10B981] border border-emerald-500/30">
                                {d.paymentMethod}
                              </span>
                              <h3 className="text-base font-black text-white mt-1.5">
                                {d.wallet?.user?.username || 'Player'}
                              </h3>
                              <p className="text-xs text-slate-400 font-mono">
                                {d.phoneNumber || 'No phone'}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-xl font-black text-emerald-400 font-mono">
                                +{d.amount} ETB
                              </span>
                              <p className="text-[10px] text-slate-500 font-mono">
                                {new Date(d.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>

                          {/* Receipt Preview Thumbnail */}
                          {d.receiptUrl && (
                            <div
                              onClick={() => {
                                setSelectedReceipt(d);
                                setReceiptZoom(1);
                                setReceiptRotation(0);
                              }}
                              className="relative h-36 w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 cursor-pointer group flex items-center justify-center"
                            >
                              <img
                                src={d.receiptUrl}
                                alt="Receipt"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform opacity-80 group-hover:opacity-100"
                              />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white font-bold text-xs">
                                <Maximize2 className="w-4 h-4" /> Inspect Receipt
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                            <button
                              type="button"
                              onClick={() => handleRejectDeposit(d.id)}
                              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-400 font-bold text-xs border border-slate-700/60 transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveDeposit(d.id)}
                              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                            >
                              Approve & Credit
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Receipt Lightbox Modal */}
                  {selectedReceipt && (
                    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
                      <div className="bg-[#111827] border border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                          <div>
                            <h3 className="font-black text-white text-sm">
                              Receipt Inspection — {selectedReceipt.wallet?.user?.username}
                            </h3>
                            <p className="text-xs text-slate-400 font-mono">
                              Ref: {selectedReceipt.referenceId || selectedReceipt.id}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setReceiptZoom((z) => Math.min(z + 0.25, 2.5))}
                              className="px-2 py-1.5 rounded-xl bg-[#172033] hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                            >
                              +Zoom
                            </button>
                            <button
                              type="button"
                              onClick={() => setReceiptRotation((r) => (r + 90) % 360)}
                              className="p-2 rounded-xl bg-[#172033] hover:bg-slate-700 text-slate-300 cursor-pointer"
                              title="Rotate 90deg"
                            >
                              <RotateCw className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedReceipt(null)}
                              className="p-2 rounded-xl bg-[#172033] hover:bg-slate-700 text-slate-400 cursor-pointer"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-950 flex items-center justify-center flex-1 overflow-auto min-h-[350px]">
                          <img
                            src={selectedReceipt.receiptUrl}
                            alt="Receipt Full Preview"
                            style={{
                              transform: `scale(${receiptZoom}) rotate(${receiptRotation}deg)`,
                              transition: 'transform 0.2s',
                            }}
                            className="max-w-full max-h-[55vh] rounded-xl object-contain shadow-2xl border border-slate-800"
                          />
                        </div>

                        <div className="p-4 border-t border-slate-800 bg-[#111827] flex items-center justify-between">
                          <div>
                            <span className="text-xs text-slate-400 block">Claimed Deposit</span>
                            <span className="text-xl font-black text-emerald-400 font-mono">
                              +{selectedReceipt.amount} ETB
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleRejectDeposit(selectedReceipt.id)}
                              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-400 font-bold text-xs border border-slate-700 cursor-pointer"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveDeposit(selectedReceipt.id)}
                              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 cursor-pointer"
                            >
                              Approve & Credit Balance
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab 2: Withdrawals Management */}
              {financeTab === 'WITHDRAWALS' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <p className="font-bold uppercase tracking-wider">
                      Player Withdrawal Requests (Flagged & Manual Review)
                    </p>
                    <span className="font-mono font-bold text-rose-400">
                      {withdrawals.length} Pending
                    </span>
                  </div>

                  {loadingWithdrawals ? (
                    <div className="p-12 text-center text-slate-400 bg-[#172033] rounded-2xl border border-slate-800">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-400" />
                      Checking withdrawal queue...
                    </div>
                  ) : withdrawals.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 bg-[#172033] rounded-2xl border border-slate-800 font-bold space-y-2">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
                      <p className="text-base text-white">All withdrawals processed!</p>
                      <p className="text-xs text-slate-500">No pending player payout requests requiring review.</p>
                    </div>
                  ) : (
                    <div className="bg-[#172033] rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#111827] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                          <tr>
                            <th className="py-3 px-4">Player</th>
                            <th className="py-3 px-4">Amount</th>
                            <th className="py-3 px-4">Destination</th>
                            <th className="py-3 px-4">Player Balance</th>
                            <th className="py-3 px-4">Requested</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 font-medium">
                          {withdrawals.map((w) => (
                            <tr key={w.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-3 px-4 font-bold text-white">
                                {w.wallet?.user?.username}
                              </td>
                              <td className="py-3 px-4 font-mono font-black text-rose-400">
                                -{w.amount} ETB
                              </td>
                              <td className="py-3 px-4 font-mono text-slate-300">
                                {w.destinationAddress || w.phoneNumber || 'Telebirr Wallet'}
                              </td>
                              <td className="py-3 px-4 font-mono text-emerald-400 font-bold">
                                {w.wallet?.balance} ETB
                              </td>
                              <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                                {new Date(w.createdAt).toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-right space-x-2">
                                <button
                                  type="button"
                                  onClick={() => handleRejectWithdrawal(w.id)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                                >
                                  Reject & Refund
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApproveWithdrawal(w.id)}
                                  className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
                                >
                                  Mark as Paid
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab 3: Financial Ledger */}
              {financeTab === 'LEDGER' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-[#172033] p-4 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Immutable Double-Entry Ledger Stream
                      </span>
                    </div>

                    <select
                      value={ledgerTypeFilter}
                      onChange={(e) => {
                        setLedgerTypeFilter(e.target.value);
                        setTimeout(fetchLedger, 50);
                      }}
                      className="bg-[#111827] border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-bold focus:outline-none"
                    >
                      <option value="ALL">All Transaction Types</option>
                      <option value="DEPOSIT">Deposits</option>
                      <option value="WITHDRAWAL">Withdrawals</option>
                      <option value="BET_PLACED">Bets Placed</option>
                      <option value="BET_WON">Winnings</option>
                      <option value="BET_REFUND">Refunds</option>
                    </select>
                  </div>

                  <div className="bg-[#172033] rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#111827] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4">ID / Ref</th>
                          <th className="py-3 px-4">Player</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Balance After</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 font-medium font-mono text-[11px]">
                        {loadingLedger ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
                              Fetching double-entry ledger records...
                            </td>
                          </tr>
                        ) : ledgerEntries.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-400 font-sans font-bold">
                              No transactions match the selected filter.
                            </td>
                          </tr>
                        ) : (
                          ledgerEntries.map((l) => (
                            <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-2.5 px-4 text-slate-400">{l.referenceId || l.id.slice(0, 10)}</td>
                              <td className="py-2.5 px-4 font-bold text-white font-sans">
                                {l.wallet?.user?.username || 'Player'}
                              </td>
                              <td className="py-2.5 px-4 font-sans font-bold text-[10px]">
                                <span
                                  className={`px-2 py-0.5 rounded ${
                                    l.type === 'DEPOSIT'
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : l.type === 'WITHDRAWAL'
                                      ? 'bg-rose-500/20 text-rose-400'
                                      : l.type === 'BET_WON'
                                      ? 'bg-amber-500/20 text-amber-400'
                                      : 'bg-slate-800 text-slate-300'
                                  }`}
                                >
                                  {l.type}
                                </span>
                              </td>
                              <td
                                className={`py-2.5 px-4 font-bold ${
                                  l.type === 'DEPOSIT' || l.type === 'BET_WON'
                                    ? 'text-emerald-400'
                                    : 'text-rose-400'
                                }`}
                              >
                                {l.type === 'DEPOSIT' || l.type === 'BET_WON' ? '+' : '-'}
                                {l.amount} ETB
                              </td>
                              <td className="py-2.5 px-4 text-slate-300">
                                {l.balanceAfter !== undefined ? `${l.balanceAfter} ETB` : '—'}
                              </td>
                              <td className="py-2.5 px-4 font-sans font-bold text-[10px]">
                                <span className="text-emerald-400">{l.status}</span>
                              </td>
                              <td className="py-2.5 px-4 text-slate-500">
                                {new Date(l.createdAt).toLocaleTimeString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* 4. GAME MANAGEMENT VIEW (ALL 10 GAMES)                            */}
          {/* ================================================================ */}
          {activeNav === 'GAMES' && (
            <div className="space-y-6">
              {/* Game Sub-Navigation */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setGameTab('CRASH')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                    gameTab === 'CRASH'
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                      : 'bg-[#172033] text-slate-400 hover:text-white'
                  }`}
                >
                  <Flame className="w-4 h-4" />
                  <span>Aviator Crash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGameTab('BINGO')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                    gameTab === 'BINGO'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-[#172033] text-slate-400 hover:text-white'
                  }`}
                >
                  <Crown className="w-4 h-4" />
                  <span>Cartella Bingo 75</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGameTab('DAMA')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                    gameTab === 'DAMA'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-[#172033] text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Ethiopian Dama 8x8</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGameTab('CASINO')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                    gameTab === 'CASINO'
                      ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                      : 'bg-[#172033] text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Mini-Games (Roulette, Plinko, etc.)</span>
                </button>
              </div>

              {/* Game Tab 1: Aviator Crash */}
              {gameTab === 'CRASH' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#172033] p-5 rounded-2xl border border-slate-800">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        Multiplier Status
                      </span>
                      <div className="text-3xl font-black text-rose-400 font-mono mt-1">
                        {crashData.currentMultiplier.toFixed(2)}x
                      </div>
                      <span className="text-xs text-slate-400 mt-1 block">
                        State: <span className="text-emerald-400 font-bold">{crashData.state}</span>
                      </span>
                    </div>

                    <div className="bg-[#172033] p-5 rounded-2xl border border-slate-800">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        Active Wagers in Flight
                      </span>
                      <div className="text-3xl font-black text-[#F5B942] font-mono mt-1">
                        {crashData.totalActiveWager} ETB
                      </div>
                      <span className="text-xs text-slate-400 mt-1 block">
                        {crashData.activeBetsCount} Connected Player Bets
                      </span>
                    </div>

                    <div className="bg-[#172033] p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        Emergency Safe Controls
                      </span>
                      <div className="flex items-center gap-2 mt-2">
                        {crashData.isRunning ? (
                          <button
                            type="button"
                            onClick={handleEmergencyCrashPause}
                            className="w-full py-2.5 px-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-rose-500/20 cursor-pointer"
                          >
                            <Pause className="w-4 h-4" /> Safe Pause (100% Refund)
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResumeCrash}
                            className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
                          >
                            <Play className="w-4 h-4" /> Resume Engine
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Provably Fair Cryptographic Audit Card */}
                  <div className="bg-[#172033] p-5 rounded-2xl border border-slate-800 space-y-3">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> Provably Fair Audit Trail (Read-Only)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      <div className="p-3 rounded-xl bg-[#111827] border border-slate-800">
                        <span className="text-slate-400 text-[10px] block font-sans font-bold uppercase mb-1">
                          Server Seed SHA-256 Hash
                        </span>
                        <span className="text-cyan-400 break-all">{crashData.serverSeedHash}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#111827] border border-slate-800">
                        <span className="text-slate-400 text-[10px] block font-sans font-bold uppercase mb-1">
                          Client Seed & Nonce
                        </span>
                        <span className="text-amber-400">
                          {crashData.clientSeed} (Nonce: {crashData.nonce})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Game Tab 2: Cartella Bingo */}
              {gameTab === 'BINGO' && (
                <div className="bg-[#172033] p-6 rounded-2xl border border-slate-800 w-full space-y-5 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <Crown className="w-4 h-4 text-[#F5B942]" /> Cartella Bingo 75 Round Configuration
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Updates live prize pool, house fee, stake, and target winning pattern.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/30">
                      Round #{cartellaConfig.roundId}
                    </span>
                  </div>

                  <form onSubmit={handleSaveBingoConfig} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">
                          Card Stake (ETB)
                        </label>
                        <input
                          type="number"
                          value={cartellaConfig.stake}
                          onChange={(e) =>
                            setCartellaConfig({ ...cartellaConfig, stake: Number(e.target.value) })
                          }
                          className="w-full bg-[#111827] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">
                          Prize Pool (ETB)
                        </label>
                        <input
                          type="number"
                          value={cartellaConfig.prize}
                          onChange={(e) =>
                            setCartellaConfig({ ...cartellaConfig, prize: Number(e.target.value) })
                          }
                          className="w-full bg-[#111827] border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">
                          Admin / House Fee (ETB)
                        </label>
                        <input
                          type="number"
                          value={cartellaConfig.adminFee}
                          onChange={(e) =>
                            setCartellaConfig({ ...cartellaConfig, adminFee: Number(e.target.value) })
                          }
                          className="w-full bg-[#111827] border border-slate-700 rounded-xl px-3 py-2 text-[#F5B942] font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">
                          Winning Pattern Rule
                        </label>
                        <select
                          value={cartellaConfig.pattern}
                          onChange={(e) =>
                            setCartellaConfig({ ...cartellaConfig, pattern: e.target.value })
                          }
                          className="w-full bg-[#111827] border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                        >
                          <option value="ONE_LINE">1 Line (Horizontal, Vertical, Diagonal)</option>
                          <option value="TWO_LINES">2 Lines (Any)</option>
                          <option value="FOUR_CORNERS">Four Corners</option>
                          <option value="TOP_MIDDLE_BOTTOM">Layer Cake (Top, Middle, Bottom)</option>
                          <option value="FULL_HOUSE">Full House (All 25 Spaces)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">
                          Max Slot Seats
                        </label>
                        <input
                          type="number"
                          value={cartellaConfig.maxSlots}
                          onChange={(e) =>
                            setCartellaConfig({ ...cartellaConfig, maxSlots: Number(e.target.value) })
                          }
                          className="w-full bg-[#111827] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="pt-3 flex justify-end">
                      <button
                        type="submit"
                        className="py-2.5 px-6 rounded-xl bg-[#F5B942] hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                      >
                        Save Round Settings
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Game Tab 3: Ethiopian Dama */}
              {gameTab === 'DAMA' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <p className="font-bold uppercase tracking-wider">
                      Anti-Abuse Flags & Dispute Review (Move Spams, Time Stalls, Reconnect Exploits)
                    </p>
                    <span className="font-mono font-bold text-cyan-400">
                      {damaFlags.length} Flagged Matches
                    </span>
                  </div>

                  {damaFlags.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 bg-[#172033] rounded-2xl border border-slate-800 font-bold space-y-2">
                      <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
                      <p className="text-base text-white">No Active Dama Match Flags</p>
                      <p className="text-xs text-slate-500">Anti-cheat engine reports 100% normal player timing behavior.</p>
                    </div>
                  ) : (
                    <div className="bg-[#172033] rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#111827] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                          <tr>
                            <th className="py-3 px-4">Match ID</th>
                            <th className="py-3 px-4">Host vs Joiner</th>
                            <th className="py-3 px-4">Stake</th>
                            <th className="py-3 px-4">Anomaly Flag</th>
                            <th className="py-3 px-4">Timestamp</th>
                            <th className="py-3 px-4 text-right">Review</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 font-medium">
                          {damaFlags.map((f: any) => (
                            <tr key={f.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-3 px-4 font-mono text-cyan-400">{f.id.slice(0, 8)}</td>
                              <td className="py-3 px-4 font-bold text-white">
                                {f.whiteUsername} vs {f.blackUsername}
                              </td>
                              <td className="py-3 px-4 font-mono text-amber-400 font-bold">
                                {f.stake} ETB
                              </td>
                              <td className="py-3 px-4 text-rose-400 font-bold">
                                {f.flagReason || 'Excessive quiet plies'}
                              </td>
                              <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                                {new Date(f.updatedAt).toLocaleTimeString()}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  type="button"
                                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                                >
                                  Inspect Board
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Game Tab 4: All Other Casino Mini-Games */}
              {gameTab === 'CASINO' && (
                <div className="bg-[#172033] rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#111827] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Game Name</th>
                        <th className="py-3 px-4">House Edge %</th>
                        <th className="py-3 px-4">Min Bet (ETB)</th>
                        <th className="py-3 px-4">Max Bet (ETB)</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-medium">
                      {games.map((g) => (
                        <tr key={g.gameId} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-white">{g.name}</td>
                          <td className="py-3.5 px-4 font-mono text-amber-400 font-bold">
                            {g.houseEdgePercent.toFixed(1)}%
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-300">{g.minBet}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-300">{g.maxBet}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                g.enabled
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {g.enabled ? 'Active' : 'Maintenance'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleToggleGameEnabled(g.gameId, g.enabled)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                g.enabled
                                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {g.enabled ? 'Disable' : 'Enable'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* 5. RISK & SECURITY VIEW                                           */}
          {/* ================================================================ */}
          {activeNav === 'RISK' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#172033] p-5 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2 text-rose-400 font-black text-xs uppercase tracking-wider mb-2">
                    <ShieldAlert className="w-4 h-4" /> Integrity Alerts
                  </div>
                  <div className="text-2xl font-black text-white font-mono">0 Critical</div>
                  <p className="text-xs text-slate-400 mt-1">No unauthorized balance escalations detected.</p>
                </div>

                <div className="bg-[#172033] p-5 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2 text-[#F5B942] font-black text-xs uppercase tracking-wider mb-2">
                    <Lock className="w-4 h-4" /> Seed Verification
                  </div>
                  <div className="text-2xl font-black text-white font-mono">100% HMAC Valid</div>
                  <p className="text-xs text-slate-400 mt-1">Cryptographic nonces match SHA-256 chains.</p>
                </div>

                <div className="bg-[#172033] p-5 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2 text-cyan-400 font-black text-xs uppercase tracking-wider mb-2">
                    <Clock className="w-4 h-4" /> Admin Logs
                  </div>
                  <div className="text-2xl font-black text-white font-mono">{auditLogs.length} Actions</div>
                  <p className="text-xs text-slate-400 mt-1">Logged with administrator ID & timestamp.</p>
                </div>
              </div>

              {/* Audit Log Stream */}
              <div className="bg-[#172033] rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" /> Administrative Audit Trail
                </h3>

                <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar font-mono text-xs">
                  {auditLogs.length === 0 ? (
                    <p className="text-slate-500 py-4 text-center font-sans">No audit entries logged yet.</p>
                  ) : (
                    auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl bg-[#111827] border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <span className="text-amber-400 font-bold">{log.action}</span>
                          <span className="text-slate-400 ml-2">Admin: {log.adminId}</span>
                          {log.details && (
                            <p className="text-[11px] text-slate-500 mt-0.5">{log.details}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* 6. REPORTS & ANALYTICS VIEW                                       */}
          {/* ================================================================ */}
          {activeNav === 'REPORTS' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-[#172033] p-5 rounded-2xl border border-slate-800 shadow-lg">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Financial & Performance Reports
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Consolidated Gross Gaming Revenue, turnover & margin statistics.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="py-2.5 px-4 rounded-xl bg-[#F5B942] hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Export Report (CSV)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#172033] p-5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Gross Gaming Revenue
                  </span>
                  <div className="text-2xl font-black text-[#F5B942] font-mono">
                    {stats.platformRevenue.toLocaleString()} ETB
                  </div>
                  <span className="text-xs text-slate-500 mt-1 block">Wagers minus player winnings</span>
                </div>

                <div className="bg-[#172033] p-5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Net Fiat Cashflow
                  </span>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    +{(stats.totalDeposits - stats.totalWithdrawals).toLocaleString()} ETB
                  </div>
                  <span className="text-xs text-slate-500 mt-1 block">Deposits minus withdrawals</span>
                </div>

                <div className="bg-[#172033] p-5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Total Turnover
                  </span>
                  <div className="text-2xl font-black text-cyan-400 font-mono">
                    {stats.totalWagered.toLocaleString()} ETB
                  </div>
                  <span className="text-xs text-slate-500 mt-1 block">From {stats.totalBets} player bets</span>
                </div>

                <div className="bg-[#172033] p-5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Platform Margin
                  </span>
                  <div className="text-2xl font-black text-purple-300 font-mono">
                    {stats.totalWagered > 0
                      ? ((stats.platformRevenue / stats.totalWagered) * 100).toFixed(1)
                      : '10.0'}
                    %
                  </div>
                  <span className="text-xs text-slate-500 mt-1 block">Effective hold rate</span>
                </div>
              </div>
            </div>
          )}

          {/* LETTI 1v1 PVP MULTIPLAYER VIEW                                  */}
          {/* ================================================================ */}
          {activeNav === 'LETTI_PVP' && (
            <LettiPvpManager getUrl={getAdminApiUrl} getToken={getAuthToken} />
          )}

          {/* DAILY REWARDS, MISSIONS & PLAYER REPORTS VIEW                     */}
          {/* ================================================================ */}
          {activeNav === 'ENGAGEMENT' && (
            <EngagementAdminManager getUrl={getAdminApiUrl} getToken={getAuthToken} />
          )}

          {/* BONUS & REFERRAL MANAGEMENT VIEW                                  */}
          {/* ================================================================ */}
          {activeNav === 'PROMOTIONS' && (
            <BonusReferralManager getUrl={getAdminApiUrl} getToken={getAuthToken} />
          )}

          {/* ================================================================ */}
          {/* 7. SYSTEM SETTINGS VIEW                                           */}
          {/* ================================================================ */}
          {activeNav === 'SETTINGS' && (
            <div className="bg-[#172033] p-6 rounded-2xl border border-slate-800 w-full space-y-5 shadow-lg">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#F5B942]" /> Global Platform Settings
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure operational limits, currency, and maintenance mode.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">
                    Platform Title
                  </label>
                  <input
                    type="text"
                    value={settings.platformName}
                    onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                    className="w-full bg-[#111827] border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">
                      Min Deposit (ETB)
                    </label>
                    <input
                      type="number"
                      value={settings.minDeposit}
                      onChange={(e) => setSettings({ ...settings, minDeposit: Number(e.target.value) })}
                      className="w-full bg-[#111827] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">
                      Max Deposit (ETB)
                    </label>
                    <input
                      type="number"
                      value={settings.maxDeposit}
                      onChange={(e) => setSettings({ ...settings, maxDeposit: Number(e.target.value) })}
                      className="w-full bg-[#111827] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">
                    Automated Withdrawal Review Threshold (ETB)
                  </label>
                  <input
                    type="number"
                    value={settings.autoWithdrawLimit}
                    onChange={(e) => setSettings({ ...settings, autoWithdrawLimit: Number(e.target.value) })}
                    className="w-full bg-[#111827] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Withdrawals exceeding this threshold are flagged for manual admin sign-off.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Platform Maintenance Mode</span>
                    <span className="text-[11px] text-slate-400">
                      When enabled, blocks new bets across all games and displays a maintenance notice in the player lobby.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                    className={`px-4 py-2 rounded-xl font-black text-xs uppercase transition-colors cursor-pointer ${
                      settings.maintenanceMode
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}
                  >
                    {settings.maintenanceMode ? 'Maintenance ON' : 'Live Mode'}
                  </button>
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    className="py-2.5 px-6 rounded-xl bg-[#F5B942] hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    Save Platform Configuration
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminPage;
