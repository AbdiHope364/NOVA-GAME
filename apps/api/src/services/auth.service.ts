import { UserRepository } from '../repositories/user.repository.js';
import { AuthServiceLogic } from '@nova/auth';
import { config } from '../config/env.js';
import { Role } from '@nova/types';
import { prisma } from '../config/database.js';
import { BonusService } from './bonus.service.js';

export class AuthService {
  static async register(data: {
    username: string;
    email: string;
    password?: string;
    passwordHash?: string;
    referralCode?: string;
    deviceFingerprint?: string;
    ipAddress?: string;
  }) {
    const existingEmail = await UserRepository.findByEmail(data.email);
    if (existingEmail) {
      throw { statusCode: 400, message: 'Email is already registered' };
    }

    const existingUsername = await UserRepository.findByUsername(data.username);
    if (existingUsername) {
      throw { statusCode: 400, message: 'Username is already taken' };
    }

    const passwordToHash = data.password || data.passwordHash || '';
    if (!passwordToHash) {
      throw { statusCode: 400, message: 'Password is required' };
    }

    const hashedPassword = await AuthServiceLogic.hashPassword(passwordToHash);

    const { user, promotions } = await prisma.$transaction(async (tx) => {
      const created = await UserRepository.createUser(
        {
          username: data.username,
          email: data.email,
          passwordHash: hashedPassword,
          deviceFingerprint: BonusService.hashSignal(data.deviceFingerprint),
          registrationIpHash: BonusService.hashSignal(data.ipAddress),
          initialCashBalanceSantim: 0,
        },
        tx
      );

      const promo = await BonusService.onUserRegistered(tx, {
        userId: created.id,
        username: created.username,
        walletId: created.wallet!.id,
        referralCodeInput: data.referralCode,
        deviceFingerprint: data.deviceFingerprint,
        ipAddress: data.ipAddress,
        isVerified: true,
      });

      const refreshedUser = await tx.user.findUnique({
        where: { id: created.id },
        include: { wallet: true },
      });

      return { user: refreshedUser || created, promotions: promo };
    });

    const token = AuthServiceLogic.generateToken(
      {
        userId: user.id,
        username: user.username,
        role: (user.role as Role) || 'USER',
      },
      config.jwtSecret
    );

    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token, promotions };
  }

  static async login(data: { email?: string; username?: string; password?: string }) {
    const identifier = data.email || data.username;
    if (!identifier || !data.password) {
      throw { statusCode: 400, message: 'Credentials are required' };
    }

    const user = data.email
      ? await UserRepository.findByEmail(data.email)
      : await UserRepository.findByUsername(data.username!);

    if (!user) {
      throw { statusCode: 401, message: 'Invalid email/username or password' };
    }

    const isValidPassword = await AuthServiceLogic.comparePassword(data.password, user.passwordHash);
    if (!isValidPassword) {
      throw { statusCode: 401, message: 'Invalid email/username or password' };
    }

    const token = AuthServiceLogic.generateToken(
      {
        userId: user.id,
        username: user.username,
        role: (user.role as Role) || 'USER',
      },
      config.jwtSecret
    );

    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
  }

  static async updateProfile(
    userId: string,
    updates: {
      phoneNumber?: string | null;
      avatarUrl?: string | null;
      soundEnabled?: boolean;
      notificationPrefs?: Record<string, boolean>;
    }
  ) {
    if (!userId || userId === 'demo-guest') {
      throw { statusCode: 401, message: 'Sign in to update profile settings' };
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(updates.phoneNumber !== undefined ? { phoneNumber: updates.phoneNumber?.trim() || null } : {}),
        ...(updates.avatarUrl !== undefined ? { avatarUrl: updates.avatarUrl?.trim() || null } : {}),
        ...(updates.soundEnabled !== undefined ? { soundEnabled: Boolean(updates.soundEnabled) } : {}),
        ...(updates.notificationPrefs !== undefined
          ? { notificationPrefs: JSON.stringify(updates.notificationPrefs) }
          : {}),
      },
      include: { wallet: true },
    });

    const { passwordHash: _, ...safeUser } = updated;
    return safeUser;
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (!userId || userId === 'demo-guest') {
      throw { statusCode: 401, message: 'Sign in to change your password' };
    }
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      throw { statusCode: 400, message: 'New password must be at least 6 characters long' };
    }

    const user = await UserRepository.findById(userId);
    if (!user) throw { statusCode: 404, message: 'User not found' };

    const valid = await AuthServiceLogic.comparePassword(currentPassword, user.passwordHash);
    if (!valid) {
      throw { statusCode: 401, message: 'Current password is incorrect' };
    }

    const newHash = await AuthServiceLogic.hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { updated: true };
  }
}
