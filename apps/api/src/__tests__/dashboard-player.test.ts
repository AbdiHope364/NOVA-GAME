import assert from 'node:assert/strict';
import { prisma, initDatabaseTriggers } from '../config/database.js';
import { AuthService } from '../services/auth.service.js';
import { DashboardService } from '../services/dashboard.service.js';
import { LettiMatchService } from '../services/lettiMatch.service.js';

async function runDashboardTests() {
  await initDatabaseTriggers();

  const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const email = `dash_${suffix}@nova-test.et`;
  const username = `dash_${suffix}`;

  // 1. Register user via AuthService
  const reg = await AuthService.register({
    username,
    email,
    password: 'Password123!',
  });
  const userId = reg.user.id;

  // 2. Profile & Notification preferences update
  const updatedProfile = await AuthService.updateProfile(userId, {
    phoneNumber: '+251911223344',
    soundEnabled: false,
    notificationPrefs: { deposits: true, bonuses: false, multiplayer: true },
  });
  assert.equal(updatedProfile.phoneNumber, '+251911223344');
  assert.equal(updatedProfile.soundEnabled, false);

  // 3. Password change validation & login with updated password
  await assert.rejects(
    () => AuthService.changePassword(userId, 'WrongCurrentPass', 'NewPassword456!'),
    (err: any) => err?.statusCode === 401
  );
  await AuthService.changePassword(userId, 'Password123!', 'NewPassword456!');
  const loginRes = await AuthService.login({ email, password: 'NewPassword456!' });
  assert.equal(loginRes.user.id, userId);

  // 4. Unified History ETB normalization (1000 Santim bet = 10 ETB, 1960 Santim payout = 19.6 ETB)
  await prisma.bet.create({
    data: {
      userId,
      gameId: 'coin-flip',
      amount: 1000,
      multiplier: 1.96,
      payout: 1960,
      profit: 960,
      won: true,
      outcome: JSON.stringify({ result: 'HEADS' }),
      serverSeed: 's',
      serverSeedHash: 'h',
      clientSeed: 'c',
      nonce: 1,
    },
  });

  const histAll = await DashboardService.getUnifiedHistory(userId);
  assert.ok(histAll.length >= 1);
  assert.equal(histAll[0].stakeEtb, 10);
  assert.equal(histAll[0].payoutEtb, 19.6);
  assert.equal(histAll[0].netProfitEtb, 9.6);
  assert.equal(histAll[0].result, 'WIN');

  const histLossOnly = await DashboardService.getUnifiedHistory(userId, { result: 'LOSS' });
  assert.equal(histLossOnly.length, 0);

  // 5. Leaderboard privacy check (must NEVER expose email, passwordHash, or phoneNumber)
  const lb = await DashboardService.getLeaderboard('weekly', 'points', userId);
  assert.ok(lb.entries.length >= 1);
  const firstEntry: any = lb.entries[0];
  assert.equal('email' in firstEntry, false);
  assert.equal('passwordHash' in firstEntry, false);
  assert.equal('phoneNumber' in firstEntry, false);
  assert.ok(lb.myEntry);
  assert.equal(lb.myEntry!.wins >= 1, true);

  // 6. Overview stats & Level progression
  const overview = await DashboardService.getOverview(userId);
  assert.equal(overview.playerStats.gamesPlayed >= 1, true);
  assert.equal(overview.playerStats.wins >= 1, true);
  assert.equal(overview.recentActivity.length >= 1, true);

  // 7. Notifications mark-read persistence
  await DashboardService.markNotificationsRead(userId);
  const notifsAfterRead = await DashboardService.getNotifications(userId);
  assert.equal(
    notifsAfterRead.items.filter((i) => i.category !== 'SYSTEM' && i.unread).length,
    0
  );

  // 8. Waiting lobby listing
  const waitingRooms = await LettiMatchService.listWaitingRooms(10);
  assert.equal(Array.isArray(waitingRooms), true);

  console.log('ALL PLAYER DASHBOARD API INTEGRATION & PRIVACY TESTS PASSED!');
}

runDashboardTests()
  .catch((err) => {
    console.error('Dashboard test failure:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
