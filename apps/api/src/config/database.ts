import { prisma } from '@nova/database';
import { logger } from '@nova/logger';

export { prisma };

export async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('PostgreSQL Database Connected Successfully via Prisma ORM');
  } catch (err) {
    logger.error('Failed to connect to database', err);
  }
}
