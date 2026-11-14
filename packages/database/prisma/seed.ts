import process from 'node:process';
import { PrismaClient } from '@prisma/client';
import { AuthServiceLogic } from '@nova/auth';

const prisma = new PrismaClient();

const GAME_CONFIGS = [
  {
    gameId: 'dama',
    name: 'Ethiopian Dama (8x8 Draughts)',
    houseEdgePercent: 5.0, // 5% rake on PvP matches
    minBet: 10.0,
    maxBet: 5000.0,
    enabled: true,
  },
  {
    gameId: 'crash',
    name: 'Aviator Crash',
    houseEdgePercent: 1.0,
    minBet: 1.0,
    maxBet: 10000.0,
    enabled: true,
  },
  {
    gameId: 'dice',
    name: 'Classic Dice',
    houseEdgePercent: 1.0,
    minBet: 1.0,
    maxBet: 5000.0,
    enabled: true,
  },
  {
    gameId: 'coin-flip',
    name: 'Coin Flip',
    houseEdgePercent: 1.0,
    minBet: 1.0,
    maxBet: 5000.0,
    enabled: true,
  },
  {
    gameId: 'roulette',
    name: 'European Roulette',
    houseEdgePercent: 2.7,
    minBet: 1.0,
    maxBet: 10000.0,
    enabled: true,
  },
  {
    gameId: 'limbo',
    name: 'Limbo Multiplier',
    houseEdgePercent: 1.0,
    minBet: 1.0,
    maxBet: 5000.0,
    enabled: true,
  },
  {
    gameId: 'mines',
    name: 'Mines',
    houseEdgePercent: 1.0,
    minBet: 1.0,
    maxBet: 5000.0,
    enabled: true,
  },
  {
    gameId: 'plinko',
    name: 'Plinko Pyramid',
    houseEdgePercent: 1.0,
    minBet: 1.0,
    maxBet: 5000.0,
    enabled: true,
  },
  {
    gameId: 'hilo',
    name: 'Hi-Lo Card Guess',
    houseEdgePercent: 1.0,
    minBet: 1.0,
    maxBet: 5000.0,
    enabled: true,
  },
  {
    gameId: 'bingo',
    name: 'Classic Bingo 75',
    houseEdgePercent: 2.0,
    minBet: 5.0,
    maxBet: 2500.0,
    enabled: true,
  },
  {
    gameId: 'letti',
    name: 'Letti 52-Card Match',
    houseEdgePercent: 2.0,
    minBet: 1.0,
    maxBet: 10000.0,
    enabled: true,
  },
  {
    gameId: 'chess',
    name: 'NOVA Chess',
    houseEdgePercent: 0.0,
    minBet: 0.0,
    maxBet: 0.0,
    enabled: true,
  },
  {
    gameId: 'ludo',
    name: 'NOVA Ludo',
    houseEdgePercent: 5.0,
    minBet: 0.0,
    maxBet: 5000.0,
    enabled: true,
  },
];

async function main() {
  console.log('🌱 Starting Database Seeding...');

  // 1. Seed Game Configurations
  console.log('🎮 Seeding Game Configurations...');
  for (const config of GAME_CONFIGS) {
    await prisma.gameConfig.upsert({
      where: { gameId: config.gameId },
      update: {
        name: config.name,
        houseEdgePercent: config.houseEdgePercent,
        minBet: config.minBet,
        maxBet: config.maxBet,
        enabled: config.enabled,
      },
      create: config,
    });
  }
  console.log(`✅ Seeded ${GAME_CONFIGS.length} Game Configurations.`);

  // 2. Seed Initial Admin Account from Environment Variables
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@novagame.et';
  const adminUsername = process.env.INITIAL_ADMIN_USERNAME || 'NovaAdmin';
  const rawAdminPassword = process.env.INITIAL_ADMIN_PASSWORD;

  if (!rawAdminPassword) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '❌ FATAL: INITIAL_ADMIN_PASSWORD environment variable is required to seed production admin!'
      );
    }
    console.warn(
      '⚠️ WARNING: INITIAL_ADMIN_PASSWORD not set. Using development password "Admin@Dev2026!"'
    );
  }

  const adminPassword = rawAdminPassword || 'Admin@Dev2026!';
  const passwordHash = await AuthServiceLogic.hashPassword(adminPassword);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      username: adminUsername,
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      email: adminEmail,
      username: adminUsername,
      passwordHash,
      role: 'ADMIN',
      isActive: true,
      wallet: {
        create: {
          balance: 1000000, // 10,000.00 ETB
          currency: 'ETB',
        },
      },
    },
  });

  console.log(`✅ Seeded Superadmin Account: ${adminUser.username} (${adminUser.email})`);

  // 3. Seed Demo Guest Player and Wallet for immediate offline/guest play database persistence
  const guestUser = await prisma.user.upsert({
    where: { id: 'demo-guest' },
    update: {
      username: 'Guest Player',
      role: 'USER',
      isActive: true,
    },
    create: {
      id: 'demo-guest',
      email: 'guest@novagame.et',
      username: 'Guest Player',
      passwordHash: 'guest-disabled-hash',
      role: 'USER',
      isActive: true,
      wallet: {
        create: {
          id: 'demo-guest-wallet',
          balance: 1000000, // 10,000.00 ETB
          currency: 'ETB',
        },
      },
    },
    include: {
      wallet: true,
    },
  });

  if (!guestUser.wallet) {
    await prisma.wallet.create({
      data: {
        id: 'demo-guest-wallet',
        userId: guestUser.id,
        balance: 1000000,
        currency: 'ETB',
      },
    });
  }
  console.log(`✅ Seeded Guest Player: ${guestUser.username} with 10,000 ETB wallet.`);

  // 4. Seed Active NovaGame Bingo Round Configuration
  console.log('👑 Seeding Active NovaGame Round Configuration...');
  const roundConfig = await prisma.roundConfig.upsert({
    where: { gameId: 'bingo' },
    update: {
      roundId: 'NOVA-1024',
      stake: 50.0,
      prize: 350.0,
      adminFee: 150.0,
      maxSlots: 10,
      activePlayers: 10,
      pattern: 'FULL_HOUSE',
      patternName: 'Full House',
      patternDescription: 'Get all numbers in the card!',
      status: 'ON_GOING',
      nextNumberCountdown: 45,
      gameName: 'NovaGame',
    },
    create: {
      id: 'active_bingo_round',
      gameId: 'bingo',
      roundId: 'NOVA-1024',
      stake: 50.0,
      prize: 350.0,
      adminFee: 150.0,
      maxSlots: 10,
      activePlayers: 10,
      pattern: 'FULL_HOUSE',
      patternName: 'Full House',
      patternDescription: 'Get all numbers in the card!',
      status: 'ON_GOING',
      nextNumberCountdown: 45,
      gameName: 'NovaGame',
    },
  });
  console.log(`✅ Seeded Round Config: ${roundConfig.roundId} (${roundConfig.gameName}) - Stake: ${roundConfig.stake} ETB, Prize: ${roundConfig.prize} ETB`);

  // 5. Seed Default 1000% Welcome Bonus & Referral Campaign
  console.log('🎁 Seeding Default Welcome Bonus & Referral Campaign...');
  await prisma.bonusCampaign.upsert({
    where: { code: 'WELCOME_1000' },
    update: {},
    create: {
      code: 'WELCOME_1000',
      name: '1000% Welcome Bonus & Referral Program',
      type: 'WELCOME_1000',
      isActive: true,
      bonusPercent: 1000,
      promoBaseSantim: 1000, // 10 ETB base -> 100 ETB promotional bonus
      maxBonusSantim: 10000, // 100 ETB cap
      minDepositSantim: 5000, // 50 ETB first qualifying deposit
      wageringMultiplier: 5.0,
      eligibleGames: 'ALL',
      expirationDays: 14,
      requireVerification: true,
      referralsEnabled: true,
      referralRewardSantim: 1000, // 10 ETB default (Admin can switch to 2000 = 20 ETB)
      referralMinDepositSantim: 5000,
      referralApprovalMode: 'AUTO',
      referralRewardType: 'PROMOTIONAL',
      maxReferralsPerUser: 50,
    },
  });
  console.log('✅ Seeded Default Bonus & Referral Campaign (WELCOME_1000).');

  // 6. Seed Default Letti 1v1 Multiplayer Configuration
  await prisma.lettiMultiplayerConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      enabled: true,
      quickMatchEnabled: true,
      privateRoomsEnabled: true,
      minStakeSantim: 1000,
      maxStakeSantim: 500000,
      platformFeeBps: 500, // 5% platform fee
      reconnectGraceSeconds: 45,
      maxDisconnects: 3,
      roomExpiryMinutes: 15,
      turnTimeoutSeconds: 30,
      allowBonusBalance: false,
    },
  });
  console.log('✅ Seeded Default Letti 1v1 Multiplayer Config (5% fee).');

  // 7. Seed Default Daily Rewards & Missions Campaign Configuration
  await prisma.dailyRewardCampaignConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      enabled: true,
      dailyStreakEnabled: true,
      missionsEnabled: true,
      dayRewardsJson: '[5,10,15,20,25,35,50]',
      wageringMultiplier: 5.0,
      requireVerifiedAccount: true,
    },
  });
  console.log('✅ Seeded Default Daily Rewards & Missions Campaign Config.');

  // 8. Seed Default NOVA Chess Configuration
  await prisma.chessConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      enabled: true,
      rankedEnabled: true,
      casualEnabled: true,
      aiEnabled: true,
      maxAiDifficulty: 'EXPERT',
      enabledTimeControlsJson:
        '["BULLET_1_0","BULLET_2_1","BLITZ_3_0","BLITZ_3_2","BLITZ_5_0","RAPID_10_0","RAPID_10_5","RAPID_15_10","CLASSICAL_30_0"]',
      disconnectGraceSeconds: 45,
      abortWindowPlies: 2,
    },
  });
  console.log('✅ Seeded Default NOVA Chess Config.');

  // 9. Seed Default NOVA Ludo Configuration (realMoneyEnabled=false by default until legal sign-off)
  await prisma.ludoConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      enabled: true,
      realMoneyEnabled: false,
      quickMatchEnabled: true,
      privateRoomsEnabled: true,
      aiEnabled: true,
      minStakeSantim: 1000,
      maxStakeSantim: 500000,
      platformFeeBps: 500,
      turnTimeoutSeconds: 30,
      moveWindowSeconds: 12,
      reconnectGraceSeconds: 45,
      maxMissedTurns: 3,
      allowBonusBalance: false,
    },
  });
  console.log('✅ Seeded Default NOVA Ludo Config (realMoneyEnabled=false).');

  console.log('🎉 Database Seeding Completed Successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
