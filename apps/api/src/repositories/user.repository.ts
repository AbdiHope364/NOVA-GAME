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

  static async createUser(data: { username: string; email: string; passwordHash: string }) {
    return prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash: data.passwordHash,
        wallet: {
          create: {
            balance: 1000.0, // Starting bonus demo balance
            currency: 'USD',
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
