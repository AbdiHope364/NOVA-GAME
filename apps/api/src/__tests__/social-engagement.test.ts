import assert from 'node:assert/strict';
import { prisma, initDatabaseTriggers } from '../config/database.js';
import { AuthService } from '../services/auth.service.js';
import { WalletService } from '../services/wallet.service.js';
import { SocialService } from '../services/social.service.js';
import { EngagementService } from '../services/engagement.service.js';

async function runSocialEngagementTests() {
  await initDatabaseTriggers();

  // Ensure default daily rewards config is enabled
  await prisma.dailyRewardCampaignConfig.upsert({
    where: { id: 'default' },
    update: {
      enabled: true,
      dailyStreakEnabled: true,
      missionsEnabled: true,
      dayRewardsJson: '[5,10,15,20,25,35,50]',
      wageringMultiplier: 5.0,
      requireVerifiedAccount: true,
    },
    create: { id: 'default' },
  });

  const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const u1 = await AuthService.register({
    username: `soc_a_${suffix}`,
    email: `soc_a_${suffix}@nova-test.et`,
    password: 'Password123!',
  });
  const u2 = await AuthService.register({
    username: `soc_b_${suffix}`,
    email: `soc_b_${suffix}@nova-test.et`,
    password: 'Password123!',
  });
  const admin = await AuthService.register({
    username: `soc_adm_${suffix}`,
    email: `soc_adm_${suffix}@nova-test.et`,
    password: 'Password123!',
  });

  // Give u1 real cash balance so Letti 1v1 Private Invite auto-room creation can lock escrow stake cleanly
  await prisma.wallet.update({
    where: { userId: u1.user.id },
    data: { balance: 50000, withdrawableBalance: 50000 }, // 500 ETB cash
  });

  // 1. Friends System: Request, Reject Self-Add, Accept
  await assert.rejects(
    () => SocialService.sendFriendRequest(u1.user.id, u1.user.username),
    (err: any) => err?.statusCode === 400
  );

  const req1 = await SocialService.sendFriendRequest(u1.user.id, u2.user.username);
  assert.equal(req1.autoAccepted, false);

  const overviewU2Before = await SocialService.getFriendsOverview(u2.user.id);
  assert.equal(overviewU2Before.incomingRequests.length, 1);

  await SocialService.respondFriendRequest(u2.user.id, req1.friendship.id, 'ACCEPT');

  const overviewU1Friends = await SocialService.getFriendsOverview(u1.user.id);
  assert.equal(overviewU1Friends.friends.some((f) => f.userId === u2.user.id), true);

  // 2. Multiplayer Game Invitation (Letti 1v1 auto-creates private room)
  const inviteRes = await SocialService.sendGameInvite(u1.user.id, {
    recipientId: u2.user.id,
    gameType: 'LETTI_PVP',
    stakeEtb: 50,
  });
  assert.ok(inviteRes.invite.roomCode.startsWith('LT-'));
  assert.ok(inviteRes.redirectPath.includes(inviteRes.invite.roomCode));

  const acceptInvite = await SocialService.respondGameInvite(u2.user.id, inviteRes.invite.id, 'ACCEPT');
  assert.equal(acceptInvite.invite.status, 'ACCEPTED');
  assert.ok(acceptInvite.redirectPath?.includes(inviteRes.invite.roomCode));

  // 3. Report & Block Enforcement
  const report = await SocialService.reportUser(
    u1.user.id,
    u2.user.id,
    'Abusive chat/invites',
    'Test report details'
  );
  assert.equal(report.status, 'OPEN');

  await SocialService.blockUser(u1.user.id, u2.user.id);
  await assert.rejects(
    () => SocialService.sendFriendRequest(u2.user.id, u1.user.username),
    (err: any) => err?.statusCode === 403
  );
  await assert.rejects(
    () =>
      SocialService.sendGameInvite(u2.user.id, {
        recipientId: u1.user.id,
        gameType: 'DAMA_PVP',
        stakeEtb: 20,
      }),
    (err: any) => err?.statusCode === 403
  );

  // Admin reviews report
  const adminOverview = await EngagementService.getAdminOverview();
  assert.ok(adminOverview.reports.some((r) => r.id === report.id));
  const reviewed = await EngagementService.reviewReport(admin.user.id, report.id, 'REVIEWED');
  assert.equal(reviewed.status, 'REVIEWED');

  // Unblock and re-friend so SOCIAL_BUTTERFLY achievement can unlock cleanly
  await SocialService.unblockUser(u1.user.id, u2.user.id);
  const reReq = await SocialService.sendFriendRequest(u1.user.id, u2.user.username);
  await SocialService.respondFriendRequest(u2.user.id, reReq.friendship.id, 'ACCEPT');

  // 4. Daily Check-In Streak -> Strict Promotional Bonus Balance Enforcement
  const walletBeforeCheckIn = await WalletService.getWallet(u2.user.id);
  const checkInRes = await EngagementService.claimDailyCheckIn(u2.user.id);
  assert.equal(checkInRes.streakDay, 1);
  assert.equal(checkInRes.rewardEtb, 5);

  const walletAfterCheckIn = await WalletService.getWallet(u2.user.id);
  assert.equal(walletAfterCheckIn.cashBalance, walletBeforeCheckIn.cashBalance, 'Daily reward must NOT add withdrawable cash');
  assert.equal(walletAfterCheckIn.withdrawableBalance, walletBeforeCheckIn.withdrawableBalance);
  assert.equal(walletAfterCheckIn.bonusBalance, walletBeforeCheckIn.bonusBalance + 5);

  // Duplicate same-day check-in rejected
  await assert.rejects(
    () => EngagementService.claimDailyCheckIn(u2.user.id),
    (err: any) => err?.statusCode === 409
  );

  // 5. Daily Missions & Duplicate Claim Guard
  // Before playing any game today, DAILY_WIN_1 must reject
  await assert.rejects(
    () => EngagementService.claimMission(u2.user.id, 'DAILY_WIN_1'),
    (err: any) => err?.statusCode === 409
  );

  // Record 1 winning Bet today for u2
  await prisma.bet.create({
    data: {
      userId: u2.user.id,
      gameId: 'dice',
      amount: 1000,
      multiplier: 2,
      payout: 2000,
      profit: 1000,
      won: true,
      outcome: JSON.stringify({ roll: 6 }),
      serverSeed: 's',
      serverSeedHash: 'h',
      clientSeed: 'c',
      nonce: 1,
    },
  });

  const missionClaim = await EngagementService.claimMission(u2.user.id, 'DAILY_WIN_1');
  assert.equal(missionClaim.bonusEtb, 5);

  // Duplicate mission claim rejected
  await assert.rejects(
    () => EngagementService.claimMission(u2.user.id, 'DAILY_WIN_1'),
    (err: any) => err?.statusCode === 409
  );

  // 6. Achievements Sync & Profile Customization Guard
  const engSummary = await EngagementService.getPlayerEngagementSummary(u2.user.id);
  const unlockedCodes = engSummary.achievements.filter((a) => a.unlocked).map((a) => a.code);
  assert.equal(unlockedCodes.includes('FIRST_VICTORY'), true);
  assert.equal(unlockedCodes.includes('DAILY_CHECKIN_1'), true);
  assert.equal(unlockedCodes.includes('SOCIAL_BUTTERFLY'), true);

  // Cannot equip locked badge
  await assert.rejects(
    () => EngagementService.updateCustomization(u2.user.id, { equippedBadge: 'DAILY_STREAK_7' }),
    (err: any) => err?.statusCode === 403
  );

  // Equip unlocked badge + frame
  const customized = await EngagementService.updateCustomization(u2.user.id, {
    avatarFrame: 'cyan',
    equippedBadge: 'FIRST_VICTORY',
  });
  assert.equal(customized.avatarFrame, 'cyan');
  assert.equal(customized.equippedBadge, 'FIRST_VICTORY');

  console.log('ALL SOCIAL, INVITES, DAILY MISSIONS & ACHIEVEMENTS TESTS PASSED!');
}

runSocialEngagementTests()
  .catch((err) => {
    console.error('Social/Engagement test failure:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
