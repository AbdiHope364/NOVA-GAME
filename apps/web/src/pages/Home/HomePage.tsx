import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  CheckCircle2,
  Flame,
  Gift,
  Target,
  Trophy,
  Users,
} from 'lucide-react';
import { api } from '../../services/api';
import { GAMES_CATALOG, FEATURED_GAME_IDS, useFavoriteGames } from '../../config/games';
import { useAuthStore } from '../../stores/authStore';
import { useWalletStore } from '../../stores/walletStore';
import { WelcomeSection } from '../../components/dashboard/WelcomeSection';
import { WalletOverview } from '../../components/dashboard/WalletOverview';
import { GameCarousel } from '../../components/dashboard/GameCarousel';
import { GameCard } from '../../components/dashboard/GameCard';
import { MultiplayerCard } from '../../components/dashboard/MultiplayerCard';
import { BonusCard } from '../../components/dashboard/BonusCard';
import { ReferralCard } from '../../components/dashboard/ReferralCard';
import { RecentActivity } from '../../components/dashboard/RecentActivity';
import { LeaderboardPreview } from '../../components/dashboard/LeaderboardPreview';

export const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { bonusBalance } = useWalletStore();
  const { favorites, toggleFavorite } = useFavoriteGames();

  const [loading, setLoading] = useState(true);
  const [disabledGames, setDisabledGames] = useState<Set<string>>(new Set());
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [promo, setPromo] = useState<any>(null);
  const [engagement, setEngagement] = useState<any>(null);
  const [social, setSocial] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setErrorMsg(null);

    Promise.all([
      api.get('/games/configs').catch(() => null),
      api.get('/dashboard/overview').catch(() => null),
      api.get('/promotions/summary').catch(() => null),
      api.get('/engagement/summary').catch(() => null),
      isAuthenticated ? api.get('/social/friends').catch(() => null) : Promise.resolve(null),
    ])
      .then(([configsRes, overviewRes, promoRes, engRes, socialRes]) => {
        if (!active) return;

        const cfgData = configsRes?.data?.data;
        if (cfgData?.games) {
          setDisabledGames(
            new Set<string>(
              cfgData.games.filter((g: any) => !g.enabled).map((g: any) => g.gameId)
            )
          );
        }
        if (cfgData?.platform?.maintenanceMode !== undefined) {
          setMaintenanceMode(Boolean(cfgData.platform.maintenanceMode));
        }

        if (overviewRes?.data?.data) {
          setOverview(overviewRes.data.data);
        }
        if (promoRes?.data?.data) {
          setPromo(promoRes.data.data);
        }
        if (engRes?.data?.data) {
          setEngagement(engRes.data.data);
        }
        if (socialRes?.data?.data) {
          setSocial(socialRes.data.data);
        }
      })
      .catch(() => {
        if (active) setErrorMsg('Unable to load some live dashboard sections.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const featuredGames = FEATURED_GAME_IDS.map((id) =>
    GAMES_CATALOG.find((g) => g.id === id)
  ).filter(Boolean) as typeof GAMES_CATALOG;

  const missions: any[] = engagement?.missions || [];
  const achievements: any[] = engagement?.achievements || [];
  const unlockedAchievements = achievements.filter((a) => a.unlocked);

  return (
    <div className="flex flex-col gap-5 sm:gap-6 w-full max-w-full overflow-x-hidden">
      {maintenanceMode && (
        <div
          role="alert"
          className="order-0 rounded-2xl bg-orange-500/15 border border-orange-500/40 px-4 py-3 text-xs sm:text-sm font-semibold text-orange-300 flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Platform maintenance mode is currently active. Live betting is temporarily paused.</span>
        </div>
      )}

      {errorMsg && (
        <div className="order-0 rounded-2xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-xs text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* First-Time Guest Welcome Banner */}
      {!isAuthenticated && (
        <div className="order-0 rounded-2xl bg-gradient-to-r from-[#8B5CF6]/20 via-[#22D3EE]/20 to-amber-500/20 border border-[#8B5CF6]/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#22D3EE] flex items-center justify-center text-white shadow-md shrink-0">
              <Gift className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-400/30 mb-1">
                New Player Welcome Offer
              </div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Get 1,000 ETB Bonus After Registering!
              </h2>
              <p className="text-xs text-[#A8A3BC]">
                Create a free account in 30 seconds to claim your 1,000 ETB welcome bonus credits.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/register"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] hover:brightness-110 text-white text-xs sm:text-sm font-black inline-flex items-center gap-1.5 transition-all shadow-[0_0_20px_rgba(139,92,246,0.4)]"
            >
              <Gift className="w-4 h-4" /> Claim 1,000 ETB Bonus
            </Link>
            <Link
              to="/login"
              className="px-3.5 py-2.5 rounded-xl bg-[#24213A] hover:bg-[#2d2947] border border-white/10 text-white text-xs sm:text-sm font-bold transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}

      {/* 1. Welcome Hero (Top on Desktop, Grouped with Profile/Rewards on Mobile) */}
      <div className="order-5 lg:order-1">
        <WelcomeSection
          level={engagement?.profile?.level ?? overview?.playerStats?.level ?? 1}
          xpPercent={engagement?.profile?.xpPercent ?? overview?.playerStats?.xpPercent ?? 0}
          isVerified={overview?.user?.isVerified ?? true}
          avatarFrame={engagement?.profile?.avatarFrame ?? overview?.user?.avatarFrame}
          equippedBadge={engagement?.profile?.equippedBadge ?? overview?.user?.equippedBadge}
          loading={loading}
        />
      </div>

      {/* 2. Wallet Overview (First priority on Mobile, below Welcome on Desktop) */}
      <div className="order-1 lg:order-2">
        <WalletOverview loading={loading} />
      </div>

      {/* 3. Daily Streak, Missions & Social Quick Strip */}
      <section
        className="order-6 lg:order-3 grid grid-cols-1 md:grid-cols-3 gap-3"
        aria-label="Daily Rewards and Friends Status"
      >
        <Link
          to="/missions"
          className="rounded-2xl bg-[#24213A] hover:border-orange-500/40 border border-white/[0.06] p-4 flex items-center justify-between gap-3 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">
                Daily Login Streak · Day {engagement?.dailyCheckIn?.nextStreakDay ?? 1}
              </div>
              <div className="text-[11px] text-[#A8A3BC]">
                {engagement?.dailyCheckIn?.claimedToday
                  ? 'Today claimed'
                  : 'Ready to claim promo reward'}
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#A8A3BC] shrink-0" />
        </Link>

        <Link
          to="/missions"
          className="rounded-2xl bg-[#24213A] hover:border-[#8B5CF6]/50 border border-white/[0.06] p-4 flex items-center justify-between gap-3 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">
                Missions &amp; Achievements
              </div>
              <div className="text-[11px] text-[#A8A3BC]">
                {missions.filter((m) => m.canClaim).length} ready to claim ·{' '}
                {unlockedAchievements.length} badges
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#A8A3BC] shrink-0" />
        </Link>

        <Link
          to="/friends"
          className="rounded-2xl bg-[#24213A] hover:border-[#22D3EE]/50 border border-white/[0.06] p-4 flex items-center justify-between gap-3 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/15 text-[#22D3EE] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">
                Friends &amp; 1v1 Invites
              </div>
              <div className="text-[11px] text-[#A8A3BC]">
                {(social?.friends || []).filter((f: any) => f.online).length} online ·{' '}
                {(social?.pendingInvites || []).length} invites
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#A8A3BC] shrink-0" />
        </Link>
      </section>

      {/* 4. Featured Games Carousel */}
      <div className="order-2 lg:order-4">
        <GameCarousel
          games={featuredGames}
          disabledGames={disabledGames}
          maintenanceMode={maintenanceMode}
        />
      </div>

      {/* 5. Quick Game Access Grid (All 11 Existing Games · 5 columns on Desktop) */}
      <section className="order-3 lg:order-5 space-y-3" aria-label="Quick Game Access">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">All Games Lobby</h2>
            <p className="text-xs text-[#A8A3BC]">
              All {GAMES_CATALOG.length} provably fair casino &amp; multiplayer games
            </p>
          </div>
          <Link
            to="/games"
            className="text-xs font-bold text-[#8B5CF6] hover:text-violet-300 inline-flex items-center gap-1"
          >
            All Games <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {GAMES_CATALOG.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              isDisabled={maintenanceMode || disabledGames.has(game.id)}
              isFavorite={favorites.includes(game.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}

          {/* Balanced Spotlight Card filling remaining columns across 2/3/4/5-col grids (13 games) */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-2 rounded-2xl bg-gradient-to-br from-[#24213A] via-[#24213A] to-[#1B1930] border border-[#8B5CF6]/30 p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-[0_0_24px_rgba(139,92,246,0.12)]">
            <div className="space-y-1.5 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#22D3EE]/15 text-[#22D3EE] text-[10px] font-bold uppercase tracking-wider">
                Live 1v1 &amp; Tournaments
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                Compete Head-to-Head or Climb Weekly Prize Ladders
              </h3>
              <p className="text-[11px] sm:text-xs text-[#A8A3BC] max-w-2xl">
                Challenge real players in Letti Card &amp; Ethiopian Dama, or enter live scheduled tournaments using verified cash or promo play.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row xl:flex-row gap-2 shrink-0">
              <Link
                to="/multiplayer"
                className="px-4 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-violet-500 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                Enter 1v1 Arena <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/tournaments"
                className="px-4 py-2.5 rounded-xl bg-[#11101D] hover:bg-[#1B1930] border border-white/10 text-[#22D3EE] text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                Tournaments
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Multiplayer Section ("Play With Friends") */}
      <div className="order-4 lg:order-6">
        <MultiplayerCard
          lettiWaitingCount={overview?.multiplayer?.lettiWaitingCount ?? 0}
          lettiWaitingRooms={overview?.multiplayer?.lettiWaitingRooms ?? []}
          damaWaitingCount={overview?.multiplayer?.damaWaitingCount ?? 0}
          chessWaitingCount={overview?.multiplayer?.chessWaitingCount ?? 0}
          ludoWaitingCount={overview?.multiplayer?.ludoWaitingCount ?? 0}
        />
      </div>

      {/* 7. Promotional Welcome Bonus & Referral Program */}
      <section
        className="order-7 lg:order-7 grid grid-cols-1 lg:grid-cols-2 gap-4"
        aria-label="Bonuses and Referrals"
      >
        <BonusCard
          campaign={promo?.campaign}
          welcomeBonus={promo?.welcomeBonus}
          withdrawalEligibility={promo?.withdrawalEligibility}
          bonusBalanceEtb={promo?.walletSeparation?.bonusBalance ?? bonusBalance}
          loading={loading}
        />
        <ReferralCard
          campaign={promo?.campaign}
          referral={promo?.referral}
          loading={loading}
        />
      </section>

      {/* 8. Lower Dashboard: Recent Matches, Leaderboard, Challenges, Achievements & Referral Stats */}
      <section className="order-8 lg:order-8 space-y-4" aria-label="Lower Dashboard Insights">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <RecentActivity items={overview?.recentActivity ?? []} loading={loading} />
          </div>
          <div>
            <LeaderboardPreview entries={overview?.leaderboardPreview ?? []} loading={loading} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Daily Challenges */}
          <div className="rounded-2xl bg-[#24213A] border border-white/[0.06] p-4 sm:p-5 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#22D3EE]" />
                <h3 className="text-sm font-bold text-white">Daily Challenges</h3>
              </div>
              <Link
                to="/missions"
                className="text-xs font-bold text-[#22D3EE] hover:text-cyan-300 inline-flex items-center gap-1"
              >
                Open <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {missions.length === 0 ? (
              <div className="rounded-xl bg-[#11101D] border border-white/[0.06] p-4 text-xs text-[#A8A3BC]">
                Sign in and play games to unlock daily missions and promo rewards.
              </div>
            ) : (
              <div className="space-y-2.5">
                {missions.slice(0, 3).map((mission: any) => {
                  const pct = Math.min(
                    100,
                    Math.round(((mission.progress || 0) / Math.max(1, mission.target || 1)) * 100)
                  );
                  return (
                    <div
                      key={mission.id}
                      className="rounded-xl bg-[#11101D] border border-white/[0.06] p-3 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-white truncate">
                          {mission.title}
                        </span>
                        <span className="text-[11px] font-bold text-[#22C55E] shrink-0">
                          {mission.claimed
                            ? 'Claimed'
                            : mission.rewardEtb
                            ? `+${mission.rewardEtb} ETB`
                            : `+${mission.rewardXp ?? 50} XP`}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Player Achievements */}
          <div className="rounded-2xl bg-[#24213A] border border-white/[0.06] p-4 sm:p-5 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#8B5CF6]" />
                <h3 className="text-sm font-bold text-white">Player Achievements</h3>
              </div>
              <Link
                to="/achievements"
                className="text-xs font-bold text-[#8B5CF6] hover:text-violet-300 inline-flex items-center gap-1"
              >
                All ({unlockedAchievements.length}/{achievements.length}) <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {achievements.length === 0 ? (
              <div className="rounded-xl bg-[#11101D] border border-white/[0.06] p-4 text-xs text-[#A8A3BC]">
                Win matches in Letti Card, Crash, and Mines to earn profile badges.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {achievements.slice(0, 4).map((ach: any) => (
                  <div
                    key={ach.id || ach.key}
                    className={`rounded-xl border p-2.5 flex items-center gap-2 min-w-0 ${
                      ach.unlocked
                        ? 'bg-[#8B5CF6]/10 border-[#8B5CF6]/40 text-white'
                        : 'bg-[#11101D] border-white/[0.06] text-[#A8A3BC]'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        ach.unlocked ? 'text-[#22C55E]' : 'text-[#A8A3BC]/40'
                      }`}
                    />
                    <span className="text-[11px] font-semibold truncate">{ach.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Referral Statistics */}
          <div className="rounded-2xl bg-[#24213A] border border-white/[0.06] p-4 sm:p-5 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-[#22C55E]" />
                <h3 className="text-sm font-bold text-white">Referral Statistics</h3>
              </div>
              <Link
                to="/referrals"
                className="text-xs font-bold text-[#22C55E] hover:text-emerald-300 inline-flex items-center gap-1"
              >
                Details <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-[#11101D] border border-white/[0.06] p-3">
                <div className="text-[10px] uppercase tracking-wider text-[#A8A3BC]">Invited</div>
                <div className="text-base font-black text-white mt-0.5">
                  {promo?.referral?.totalInvited ?? 0}
                </div>
              </div>
              <div className="rounded-xl bg-[#11101D] border border-white/[0.06] p-3">
                <div className="text-[10px] uppercase tracking-wider text-[#A8A3BC]">Qualified</div>
                <div className="text-base font-black text-[#22D3EE] mt-0.5">
                  {promo?.referral?.successfulReferrals ?? 0}
                </div>
              </div>
              <div className="rounded-xl bg-[#11101D] border border-white/[0.06] p-3">
                <div className="text-[10px] uppercase tracking-wider text-[#A8A3BC]">Earned</div>
                <div className="text-base font-black text-[#22C55E] mt-0.5">
                  {Number(promo?.referral?.totalRewardsEtb ?? 0).toFixed(0)} ETB
                </div>
              </div>
            </div>

            <div className="text-[11px] text-[#A8A3BC]">
              Invite friends with your referral link to earn{' '}
              <span className="text-white font-semibold">
                {promo?.campaign?.referralRewardEtb ?? 10} ETB
              </span>{' '}
              promotional credit per qualified signup.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
