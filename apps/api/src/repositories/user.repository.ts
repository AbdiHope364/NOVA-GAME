import { prisma } from '../config/database.js';
import { normalizeIdentifier } from '@nova/validation';

export class UserRepository {
  static async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { wallet: true },
    });
  }

  static async findByEmail(email: string) {
    const normalized = email.trim().toLowerCase();
    return prisma.user.findUnique({
      where: { email: normalized },
      include: { wallet: true },
    });
  }

  static async findByPhone(phone: string) {
    return prisma.user.findFirst({
      where: {
        OR: [{ phone }, { phoneNumber: phone }],
      },
      include: { wallet: true },
    });
  }

  static async findByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
      include: { wallet: true },
    });
  }

  /**
   * Finds a user by phone, email, or username
   */
  static async findByIdentifier(rawInput: string) {
    const input = rawInput.trim();
    if (!input) return null;

    const norm = normalizeIdentifier(input);
    if (norm.type === 'phone' && norm.isValid) {
      const byPhone = await this.findByPhone(norm.normalized);
      if (byPhone) return byPhone;
    } else if (norm.type === 'email' && norm.isValid) {
      const byEmail = await this.findByEmail(norm.normalized);
      if (byEmail) return byEmail;
    }

    // Fallback: check by username or exact match
    const byUsername = await this.findByUsername(input);
    if (byUsername) return byUsername;

    return null;
  }

  static async createUser(
    data: {
      username: string;
      email?: string | null;
      phone?: string | null;
      phoneNumber?: string | null;
      passwordHash: string;
      locale?: string;
      isVerified?: boolean;
      deviceFingerprint?: string | null;
      registrationIpHash?: string | null;
      initialCashBalanceSantim?: number;
      consent?: {
        termsVersion: string;
        privacyVersion: string;
        ipHash?: string | null;
      };
    },
    tx?: any
  ) {
    const client = tx || prisma;
    const phone = data.phone || data.phoneNumber || null;
    const email = data.email ? data.email.trim().toLowerCase() : null;

    return client.user.create({
      data: {
        username: data.username,
        email: email || undefined,
        phone: phone || undefined,
        phoneNumber: phone || undefined,
        passwordHash: data.passwordHash,
        locale: data.locale || 'en',
        isVerified: data.isVerified ?? false,
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
        consentRecords: data.consent
          ? {
              create: {
                termsVersion: data.consent.termsVersion,
                privacyVersion: data.consent.privacyVersion,
                ipHash: data.consent.ipHash,
                identifier: email || phone || undefined,
              },
            }
          : undefined,
      },
      include: { wallet: true },
    });
  }

  /**
   * Marks user contact as verified and activates account
   */
  static async markContactVerified(userId: string, type: 'phone' | 'email') {
    const now = new Date();
    return prisma.user.update({
      where: { id: userId },
      data: {
        isVerified: true,
        ...(type === 'phone' ? { phoneVerifiedAt: now } : { emailVerifiedAt: now }),
      },
      include: { wallet: true },
    });
  }

  /**
   * Updates user password and increments tokenVersion to invalidate all existing sessions
   */
  static async updatePassword(userId: string, passwordHash: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        tokenVersion: { increment: 1 },
      },
    });
  }

  /**
   * Deletes unverified accounts older than given hours (default 24h)
   */
  static async deleteUnverifiedOlderThan(hours: number = 24) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return prisma.user.deleteMany({
      where: {
        isVerified: false,
        createdAt: { lt: cutoff },
      },
    });
  }

  static async findAllUsers() {
    return prisma.user.findMany({
      include: { wallet: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
