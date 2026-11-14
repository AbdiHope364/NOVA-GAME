import { prisma } from '../config/database.js';

export class UserRepository {
  static async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { wallet: true },
    });
  }

  static async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { wallet: true },
    });
  }

  static async findByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
    });
  }

  static async createUser(
    data: {
      username: string;
      email: string;
      passwordHash: string;
      deviceFingerprint?: string | null;
      registrationIpHash?: string | null;
      initialCashBalanceSantim?: number;
    },
    tx?: any
  ) {
    const client = tx || prisma;
    return client.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash: data.passwordHash,
        isVerified: true,
        deviceFingerprint: data.deviceFingerprint || undefined,
        registrationIpHash: data.registrationIpHash || undefined,
        wallet: {
          create: {
            balance: data.initialCashBalanceSantim ?? 0,
            bonusBalance: 0,
            lockedWinnings: 0,
            withdrawableBalance: 0,
            currency: 'ETB',
          },
        },
      },
      include: { wallet: true },
    });
  }

  static async findAllUsers() {
    return prisma.user.findMany({
      include: { wallet: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
