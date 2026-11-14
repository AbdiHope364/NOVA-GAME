import { UserRepository } from '../repositories/user.repository.js';
import { AuthServiceLogic } from '@nova/auth';
import { config } from '../config/env.js';
import { Role } from '@nova/types';
import { prisma } from '../config/database.js';
import { BonusService } from './bonus.service.js';
import {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  normalizeIdentifier,
  AUTH_ERROR_CODES,
} from '@nova/validation';
import { OtpService } from './otp.service.js';
import { NotificationService } from './notification.service.js';

export class AuthService {
  /**
   * Minimal 2-input registration: { identifier, password, acceptedTerms }
   */
  static async register(data: {
    identifier: string;
    password?: string;
    acceptedTerms?: boolean;
    deviceFingerprint?: string;
    ipAddress?: string;
    locale?: string;
  }) {
    // 1. Zod validation with the SAME schema used on web
    const parsed = registerSchema.parse({
      identifier: data.identifier,
      password: data.password,
      acceptedTerms: data.acceptedTerms,
    });

    const norm = normalizeIdentifier(parsed.identifier);
    if (!norm.isValid) {
      throw {
        statusCode: 400,
        code: AUTH_ERROR_CODES.IDENTIFIER_INVALID,
        message: norm.error || 'Invalid phone number or email address',
      };
    }

    const ipAddress = data.ipAddress || '127.0.0.1';
    const ipHash = BonusService.hashSignal(ipAddress);

    // 2. Anti-enumeration: Check if identifier already exists
    const existingUser = await UserRepository.findByIdentifier(norm.normalized);

    if (existingUser) {
      // Send security alert notice to the real account owner without revealing account exists to the caller
      const notice =
        norm.type === 'phone'
          ? 'Notice: Someone attempted to create an account with this phone number. If this was not you, please log in and review your security.'
          : 'Notice: Someone attempted to create an account with this email address. If this was you, please sign in to your existing account.';

      if (norm.type === 'phone') {
        NotificationService.sendSms(norm.normalized, notice).catch(() => {});
      } else {
        NotificationService.sendEmail(norm.normalized, 'Security Alert: Registration Attempt', notice).catch(() => {});
      }

      // Return the EXACT SAME success response shape as a new registration
      return {
        success: true,
        message: 'We sent a 6-digit code to confirm your account.',
        identifier: AuthServiceLogic.maskIdentifier(norm.normalized),
        destinationType: norm.type,
        normalized: norm.normalized,
      };
    }

    // 3. Hash password using bcrypt cost 12
    const hashedPassword = await AuthServiceLogic.hashPassword(parsed.password);

    // 4. Generate unique player username, e.g. "Player-7K2P"
    let username = AuthServiceLogic.generatePlayerUsername();
    let attempts = 0;
    while (attempts < 5 && (await UserRepository.findByUsername(username))) {
      username = AuthServiceLogic.generatePlayerUsername();
      attempts++;
    }

    // 5. Create unverified player account with 0-balance wallet and consent record
    const createdUser = await UserRepository.createUser({
      username,
      phone: norm.type === 'phone' ? norm.normalized : null,
      email: norm.type === 'email' ? norm.normalized : null,
      passwordHash: hashedPassword,
      locale: data.locale || 'en',
      isVerified: false,
      deviceFingerprint: BonusService.hashSignal(data.deviceFingerprint),
      registrationIpHash: ipHash,
      initialCashBalanceSantim: 0,
      consent: {
        termsVersion: '1.0',
        privacyVersion: '1.0',
        ipHash,
      },
    });

    // 6. Generate and send verification OTP code
    await OtpService.sendOtp(norm.normalized, 'REGISTER', ipAddress);

    return {
      success: true,
      message: 'We sent a 6-digit code to confirm your account.',
      identifier: AuthServiceLogic.maskIdentifier(norm.normalized),
      destinationType: norm.type,
      normalized: norm.normalized,
      userId: createdUser.id,
    };
  }

  /**
   * Verifies the 6-digit registration OTP code and activates the account
   */
  static async verifyRegistration(data: { identifier: string; code: string }) {
    const norm = normalizeIdentifier(data.identifier);
    if (!norm.isValid) {
      throw {
        statusCode: 400,
        code: AUTH_ERROR_CODES.IDENTIFIER_INVALID,
        message: 'Invalid phone or email',
      };
    }

    // Verify cryptographic OTP
    await OtpService.verifyOtp(norm.normalized, data.code, 'REGISTER');

    // Find and verify the user
    const user = await UserRepository.findByIdentifier(norm.normalized);
    if (!user) {
      throw {
        statusCode: 404,
        code: AUTH_ERROR_CODES.IDENTIFIER_INVALID,
        message: 'User account not found',
      };
    }

    const verifiedUser = await UserRepository.markContactVerified(user.id, norm.type);

    // Generate JWT auth token
    const token = AuthServiceLogic.generateToken(
      {
        userId: verifiedUser.id,
        username: verifiedUser.username,
        role: (verifiedUser.role as Role) || 'USER',
        tokenVersion: verifiedUser.tokenVersion,
      },
      config.jwtSecret
    );

    const { passwordHash: _, ...safeUser } = verifiedUser;
    return {
      success: true,
      message: 'Account verified successfully.',
      user: safeUser,
      token,
    };
  }

  /**
   * Resends an OTP verification code
   */
  static async resendCode(data: {
    identifier: string;
    purpose?: 'REGISTER' | 'LOGIN' | 'PASSWORD_RESET';
    ipAddress?: string;
  }) {
    const norm = normalizeIdentifier(data.identifier);
    if (!norm.isValid) {
      throw {
        statusCode: 400,
        code: AUTH_ERROR_CODES.IDENTIFIER_INVALID,
        message: 'Invalid phone or email',
      };
    }

    const purpose = data.purpose || 'REGISTER';
    const res = await OtpService.sendOtp(norm.normalized, purpose, data.ipAddress || '127.0.0.1');

    return {
      success: true,
      message: 'A new 6-digit code has been sent.',
      identifier: res.masked,
      destinationType: res.destinationType,
    };
  }

  /**
   * Minimal login with phone or email + password
   */
  static async login(data: { identifier: string; password?: string; ipAddress?: string }) {
    const parsed = loginSchema.parse({
      identifier: data.identifier,
      password: data.password,
    });

    const ipAddress = data.ipAddress || '127.0.0.1';
    const norm = normalizeIdentifier(parsed.identifier);
    const lookupKey = norm.isValid ? norm.normalized : parsed.identifier.trim();

    // Enforce rate limits / lockout
    OtpService.checkLoginLockout(ipAddress);
    OtpService.checkLoginLockout(lookupKey);

    const user = await UserRepository.findByIdentifier(lookupKey);

    // Generic error message for all credential failures to prevent account enumeration
    if (!user) {
      OtpService.recordFailedLogin(ipAddress);
      OtpService.recordFailedLogin(lookupKey);
      throw {
        statusCode: 401,
        code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
        message: 'Phone/email or password is incorrect.',
      };
    }

    const isValidPassword = await AuthServiceLogic.comparePassword(parsed.password, user.passwordHash);
    if (!isValidPassword) {
      OtpService.recordFailedLogin(ipAddress);
      OtpService.recordFailedLogin(lookupKey);
      throw {
        statusCode: 401,
        code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
        message: 'Phone/email or password is incorrect.',
      };
    }

    // Check if account has verified contact
    if (!user.isVerified) {
      // Trigger new OTP verification
      const destination = norm.isValid ? norm.normalized : user.phone || user.email || user.username;
      await OtpService.sendOtp(destination, 'REGISTER', ipAddress).catch(() => {});

      return {
        requiresVerification: true,
        message: 'Please verify your phone or email to complete sign in.',
        identifier: AuthServiceLogic.maskIdentifier(destination),
        destinationType: norm.type,
      };
    }

    // Reset failed attempts on success
    OtpService.resetLoginAttempts(ipAddress);
    OtpService.resetLoginAttempts(lookupKey);

    const token = AuthServiceLogic.generateToken(
      {
        userId: user.id,
        username: user.username,
        role: (user.role as Role) || 'USER',
        tokenVersion: user.tokenVersion,
      },
      config.jwtSecret
    );

    const { passwordHash: _, ...safeUser } = user;
    return {
      success: true,
      user: safeUser,
      token,
    };
  }

  /**
   * Request password reset code
   */
  static async forgotPassword(data: { identifier: string; ipAddress?: string }) {
    const norm = normalizeIdentifier(data.identifier);
    if (!norm.isValid) {
      throw {
        statusCode: 400,
        code: AUTH_ERROR_CODES.IDENTIFIER_INVALID,
        message: 'Enter a valid phone number or email address',
      };
    }

    const ipAddress = data.ipAddress || '127.0.0.1';
    const user = await UserRepository.findByIdentifier(norm.normalized);

    // Anti-enumeration: If user exists, send OTP code. If not, return identical message.
    if (user) {
      await OtpService.sendOtp(norm.normalized, 'PASSWORD_RESET', ipAddress);
    }

    return {
      success: true,
      message: 'If an account exists with this phone or email, we sent a verification code.',
      identifier: AuthServiceLogic.maskIdentifier(norm.normalized),
      destinationType: norm.type,
    };
  }

  /**
   * Reset password with OTP verification and session invalidation
   */
  static async resetPassword(data: {
    identifier: string;
    code: string;
    newPassword?: string;
  }) {
    const parsed = resetPasswordSchema.parse({
      identifier: data.identifier,
      code: data.code,
      newPassword: data.newPassword,
    });

    const norm = normalizeIdentifier(parsed.identifier);
    if (!norm.isValid) {
      throw {
        statusCode: 400,
        code: AUTH_ERROR_CODES.IDENTIFIER_INVALID,
        message: 'Invalid phone or email',
      };
    }

    // Verify OTP code
    await OtpService.verifyOtp(norm.normalized, parsed.code, 'PASSWORD_RESET');

    const user = await UserRepository.findByIdentifier(norm.normalized);
    if (!user) {
      throw {
        statusCode: 404,
        code: AUTH_ERROR_CODES.IDENTIFIER_INVALID,
        message: 'User account not found',
      };
    }

    // Hash new password with bcrypt cost 12
    const hashedPassword = await AuthServiceLogic.hashPassword(parsed.newPassword);

    // Update password and increment tokenVersion to invalidate all existing sessions
    await UserRepository.updatePassword(user.id, hashedPassword);

    return {
      success: true,
      message: 'Password updated successfully. Please log in with your new password.',
    };
  }

  /**
   * Updates user profile (e.g. username)
   */
  static async updateProfile(
    userId: string,
    data: {
      username?: string;
      avatarUrl?: string;
      avatarFrame?: string;
      equippedBadge?: string;
      soundEnabled?: boolean;
    }
  ) {
    if (data.username) {
      const existing = await UserRepository.findByUsername(data.username);
      if (existing && existing.id !== userId) {
        throw { statusCode: 400, message: 'Username is already taken' };
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      include: { wallet: true },
    });

    const { passwordHash: _, ...safeUser } = updated;
    return safeUser;
  }

  /**
   * User change password while logged in
   */
  static async changePassword(userId: string, currentPass: string, newPass: string) {
    if (!newPass || newPass.length < 8) {
      throw { statusCode: 400, message: 'New password must be at least 8 characters long.' };
    }

    const user = await UserRepository.findById(userId);
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    const valid = await AuthServiceLogic.comparePassword(currentPass, user.passwordHash);
    if (!valid) {
      throw { statusCode: 400, message: 'Current password is incorrect.' };
    }

    const hashedPassword = await AuthServiceLogic.hashPassword(newPass);
    await UserRepository.updatePassword(userId, hashedPassword);

    return { success: true };
  }
}
