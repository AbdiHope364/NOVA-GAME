import { prisma, initDatabaseTriggers } from '@nova/database';
import { logger } from '@nova/logger';

export { prisma, initDatabaseTriggers };

export async function ensureDemoUser(client = prisma) {
  try {
    const existingUser = await client.user.findUnique({ where: { id: 'demo-guest' } });
    if (!existingUser) {
      await client.user.create({
        data: {
          id: 'demo-guest',
          username: 'GuestPlayer',
          email: 'guest@novagame.io',
          passwordHash: 'demo-guest-hash',
          wallet: {
            create: {
              id: 'wallet-demo-guest',
              balance: 100000, // 1,000.00 ETB
              currency: 'ETB',
            },
          },
        },
      });
    } else {
      const existingWallet = await client.wallet.findUnique({ where: { userId: 'demo-guest' } });
      if (!existingWallet) {
        await client.wallet.create({
          data: {
            id: 'wallet-demo-guest',
            userId: 'demo-guest',
            balance: 100000,
            currency: 'ETB',
          },
        });
      }
    }
  } catch (err) {
    logger.warn('Failed to ensure demo-guest user/wallet', err);
  }
}

export async function connectDatabase() {
  try {
    await prisma.$connect();
    await initDatabaseTriggers(prisma);
    await ensureDemoUser(prisma);
    logger.info('Database Connected Successfully via Prisma ORM & Triggers Initialized');
  } catch (err) {
    logger.error('Failed to connect to database', err);
  }
}
