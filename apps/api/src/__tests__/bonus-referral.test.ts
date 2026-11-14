import assert from 'node:assert/strict';
import { WalletServiceLogic } from '@nova/wallet';
import { prisma } from '../config/database.js';
import { AuthService } from '../services/auth.service.js';
import { WalletService } from '../services/wallet.service.js';
import { GameService } from '../services/game.service.js';
import { BonusService } from '../services/bonus.service.js';

async function runBonusAndReferralTests() {
  // 1. Unit tests for separated Santim wallet & bonus math
  assert.equal(WalletServiceLogic.calculatePromotionalBonusSantim(1000, 1000, 10000), 10000); // 10 ETB * 1000% = 100 ETB
  assert.equal(WalletServiceLogic.calculatePromotionalBonusSantim(2000, 1000, 10000), 10000); // capped at 100 ETB max

  // Pure bonus bet: win goes strictly to lockedWinnings, not cashBalance
  const bonusPlayWin = WalletServiceLogic.settleSeparatedBet(
    { cashBalance: 0, bonusBalance: 10000, lockedWinnings: 0, withdrawableBalance: 0 },
    1000,
    1900,
    true,
    true
  );
  assert.equal(bonusPlayWin.cashUsed, 0);
  assert.equal(bonusPlayWin.bonusUsed, 1000);
  assert.equal(bonusPlayWin.newCashBalance, 0);
  assert.equal(bonusPlayWin.newBonusBalance, 9000);
  assert.equal(bonusPlayWin.newLockedWinnings, 1900);

  // Pure cash bet: win stays in cashBalance, never locked
  const cashPlayWin = WalletServiceLogic.settleSeparatedBet(
    { cashBalance: 5000, bonusBalance: 9000, lockedWinnings: 0, withdrawableBalance: 5000 },
    1000,
    2000,
    true,
    true
  );
  assert.equal(cashPlayWin.cashUsed, 1000);
  assert.equal(cashPlayWin.bonusUsed, 0);
  assert.equal(cashPlayWin.newCashBalance, 6000);
  assert.equal(cashPlayWin.newLockedWinnings, 0);

  // 2. Database integration & fraud prevention tests
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const createdUserIds: string[] = [];

  try {
    // Ensure default campaign is clean (1000%, 10 ETB base, 100 ETB cap, 50 ETB min deposit, 10 ETB referral)
    const campaign = await BonusService.getOrCreateDefaultCampaign();
    await prisma.bonusCampaign.update({
      where: { id: campaign.id },
      data: {
        isActive: true,
        bonusPercent: 1000,
        promoBaseSantim: 1000,
        maxBonusSantim: 10000,
        minDepositSantim: 5000,
        wageringMultiplier: 5.0,
        eligibleGames: 'ALL',
        referralsEnabled: true,
        referralRewardSantim: 1000,
        referralMinDepositSantim: 5000,
        referralApprovalMode: 'AUTO',
        referralRewardType: 'PROMOTIONAL',
      },
    });

    // A. Referrer registers -> receives 100 ETB promotional bonus separately from 0 cashBalance + unique referral code
    const regA = await AuthService.register({
      username: `refA_${suffix}`,
      email: `refA_${suffix}@test.nova`,
      password: 'Password123!',
      deviceFingerprint: `fp-device-A-${suffix}`,
      ipAddress: '196.188.10.1',
    });
    createdUserIds.push(regA.user.id);

    const walletA = await WalletService.getWallet(regA.user.id);
    assert.equal(walletA.cashBalance, 0, 'Cash balance must start at 0 ETB');
    assert.equal(walletA.bonusBalance, 100, '1000% welcome bonus on 10 ETB base must equal 100 ETB');
    assert.equal(walletA.lockedWinnings, 0);
    assert.equal(walletA.withdrawableBalance, 0);
    assert.ok(regA.promotions.referralCode, 'Referrer must receive unique referral code');

    // Withdrawal BEFORE qualifying first deposit must be blocked (403)
    await assert.rejects(
      () => WalletService.withdraw(regA.user.id, 10, '0911000000'),
      (err: any) => err?.statusCode === 403
    );

    // B. Play an eligible game (Letti) using promotional bonusBalance -> cashBalance stays 0, wins stay locked
    const gamePlay = await GameService.playGame(regA.user.id, 'letti', 10, {
      pickedCardIndex: 10,
    });
    assert.equal(gamePlay.cashBalance, 0);
    assert.equal(gamePlay.bonusBalance, 90);
    if (gamePlay.won) {
      assert.ok(gamePlay.lockedWinnings > 0, 'Bonus-derived win must be stored in lockedWinnings');
    }

    // C. Self-referral & device-reuse fraud check: friend with SAME deviceFingerprint is FLAGGED & not auto-credited
    const regFraud = await AuthService.register({
      username: `fraud_${suffix}`,
      email: `fraud_${suffix}@test.nova`,
      password: 'Password123!',
      referralCode: regA.promotions.referralCode,
      deviceFingerprint: `fp-device-A-${suffix}`, // Same device fingerprint as referrer!
      ipAddress: '196.188.10.1',
    });
    createdUserIds.push(regFraud.user.id);

    const fraudRef = await prisma.referral.findUnique({ where: { referredUserId: regFraud.user.id } });
    assert.ok(fraudRef, 'Suspicious referral should still be recorded for audit');
    assert.equal(fraudRef!.status, 'FLAGGED', 'Same-device referral must be FLAGGED');

    // D. Legitimate friend registers with different device & IP, then completes qualifying 100 ETB deposit
    const regFriend = await AuthService.register({
      username: `friend_${suffix}`,
      email: `friend_${suffix}@test.nova`,
      password: 'Password123!',
      referralCode: regA.promotions.referralCode,
      deviceFingerprint: `fp-device-B-${suffix}`,
      ipAddress: '196.188.20.2',
    });
    createdUserIds.push(regFriend.user.id);

    const pendingRef = await prisma.referral.findUnique({ where: { referredUserId: regFriend.user.id } });
    assert.equal(pendingRef?.status, 'PENDING');

    const depositTx = await WalletService.requestDeposit(
      regFriend.user.id,
      100,
      'TELEBIRR',
      '0912345678',
      'data:image/png;base64,test',
      `TX-TEST-${suffix}`
    );
    await WalletService.approveDeposit(depositTx.id, 'test-admin');

    // Friend wallet now has 100 ETB cashBalance & Referral rewarded 10 ETB to Referrer's bonusBalance!
    const friendWalletAfter = await WalletService.getWallet(regFriend.user.id);
    assert.equal(friendWalletAfter.cashBalance, 100);

    const referrerWalletAfter = await WalletService.getWallet(regA.user.id);
    assert.equal(referrerWalletAfter.bonusBalance, 100, 'Referrer bonusBalance should increase from 90 to 100 (+10 ETB referral reward)');

    // Second deposit for the same friend must NOT generate a duplicate referral reward
    const depositTx2 = await WalletService.requestDeposit(
      regFriend.user.id,
      100,
      'TELEBIRR',
      '0912345678',
      'data:image/png;base64,test2',
      `TX-TEST2-${suffix}`
    );
    await WalletService.approveDeposit(depositTx2.id, 'test-admin');

    const rewardCount = await prisma.referralReward.count({
      where: { referredUserId: regFriend.user.id },
    });
    assert.equal(rewardCount, 1, 'Referral reward must be created strictly once per referred user & campaign');

    // Verify auditable BonusTransaction & append-only LedgerEntry records exist
    const bonusTxCount = await prisma.bonusTransaction.count({
      where: { userId: { in: createdUserIds } },
    });
    assert.ok(bonusTxCount >= 3, 'Bonus transactions (credit, wager, referral) must be audited');

    const ledgerCount = await prisma.ledgerEntry.count({
      where: { wallet: { userId: { in: createdUserIds } } },
    });
    assert.ok(ledgerCount >= 3, 'Append-only LedgerEntry records must exist for bonus & referral credits');

    console.log('Bonus & Referral integration + fraud-prevention tests passed!');
  } finally {
    await prisma.$disconnect();
  }
}

runBonusAndReferralTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
