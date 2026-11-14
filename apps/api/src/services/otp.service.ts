import { prisma } from '../config/database.js';
import { AuthServiceLogic } from '@nova/auth';
import { AUTH_ERROR_CODES } from '@nova/validation';
import { NotificationService } from './notification.service.js';

interface RateLimitTracker {
  count: number;
  resetAt: number;
}

const contactSendLimits = new Map<string, RateLimitTracker>(); // 3 per hour
const ipSendLimits = new Map<string, RateLimitTracker>(); // 10 per day
const failedLoginAttempts = new Map<string, { attempts: number; lockoutUntil: number }>();

export class OtpService {
  /**
   * Enforces rate limits: max 3 per contact per hour, max 10 per IP per day
   */
  static checkSendRateLimit(identifier: string, ipAddress: string = '127.0.0.1') {
    const now = Date.now();

    // Check contact limit (3 sends / hour)
    const contactTracker = contactSendLimits.get(identifier);
    if (contactTracker) {
      if (now > contactTracker.resetAt) {
        contactSendLimits.set(identifier, { count: 1, resetAt: now + 60 * 60 * 1000 });
      } else if (contactTracker.count >= 3) {
        throw {
          statusCode: 429,
          code: AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS,
          message: 'Too many verification codes requested. Please try again in an hour.',
        };
      } else {
        contactTracker.count++;
      }
    } else {
      contactSendLimits.set(identifier, { count: 1, resetAt: now + 60 * 60 * 1000 });
    }

    // Check IP limit (10 sends / day)
    const ipTracker = ipSendLimits.get(ipAddress);
    if (ipTracker) {
      if (now > ipTracker.resetAt) {
        ipSendLimits.set(ipAddress, { count: 1, resetAt: now + 24 * 60 * 60 * 1000 });
      } else if (ipTracker.count >= 10) {
        throw {
          statusCode: 429,
          code: AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS,
          message: 'Too many requests from this device. Please try again later.',
        };
      } else {
        ipTracker.count++;
      }
    } else {
      ipSendLimits.set(ipAddress, { count: 1, resetAt: now + 24 * 60 * 60 * 1000 });
    }
  }

  /**
   * Generates, hashes, stores, and sends a 6-digit OTP code
   */
  static async sendOtp(
    identifier: string,
    purpose: 'REGISTER' | 'LOGIN' | 'PASSWORD_RESET',
    ipAddress: string = '127.0.0.1'
  ): Promise<{ masked: string; destinationType: 'phone' | 'email' }> {
    // 1. Enforce rate limits
    this.checkSendRateLimit(identifier, ipAddress);

    // 2. Invalidate any existing active OTP for this identifier & purpose
    await prisma.otpCode.deleteMany({
      where: { identifier, purpose },
    });

    // 3. Cryptographically generate 6-digit code
    const rawCode = AuthServiceLogic.generateOtpCode();
    const hashedCode = AuthServiceLogic.hashOtp(rawCode);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // 4. Store ONLY the hash in database
    await prisma.otpCode.create({
      data: {
        identifier,
        hash: hashedCode,
        purpose,
        expiresAt,
        attempts: 0,
      },
    });

    // 5. Send message via notification provider
    const isEmail = identifier.includes('@');
    const destinationType: 'phone' | 'email' = isEmail ? 'email' : 'phone';
    const message = `Your NOVA Gaming verification code is ${rawCode}. It expires in 5 minutes. Do not share this code with anyone.`;

    if (isEmail) {
      const oneTapLink = `${process.env.APP_URL || 'http://localhost:5173'}/verify?identifier=${encodeURIComponent(
        identifier
      )}&code=${rawCode}`;
      const htmlBody = `
        <div style="font-family: sans-serif; background: #11101D; color: #fff; padding: 24px; border-radius: 12px; max-width: 480px;">
          <h2 style="color: #8B5CF6; margin-top: 0;">NOVA Gaming Verification</h2>
          <p style="color: #A8A3BC;">Use the 6-digit code below to confirm your account:</p>
          <div style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #22D3EE; background: #1B1930; padding: 16px; border-radius: 8px; text-align: center; margin: 16px 0;">
            ${rawCode}
          </div>
          <p style="font-size: 13px; color: #64748B;">This code will expire in 5 minutes.</p>
          <div style="margin-top: 24px;">
            <a href="${oneTapLink}" style="display: inline-block; background: #8B5CF6; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 13px;">
              Verify in One Tap
            </a>
          </div>
        </div>
      `;
      await NotificationService.sendEmail(identifier, 'Your NOVA Gaming Verification Code', message, htmlBody);
    } else {
      await NotificationService.sendSms(identifier, message);
    }

    return {
      masked: AuthServiceLogic.maskIdentifier(identifier),
      destinationType,
    };
  }

  /**
   * Verifies an OTP code against its database hash
   */
  static async verifyOtp(
    identifier: string,
    code: string,
    purpose: 'REGISTER' | 'LOGIN' | 'PASSWORD_RESET'
  ): Promise<boolean> {
    const record = await prisma.otpCode.findFirst({
      where: { identifier, purpose },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw {
        statusCode: 400,
        code: AUTH_ERROR_CODES.OTP_INCORRECT,
        message: 'Invalid or expired verification code.',
      };
    }

    // Check if lockout threshold reached (max 5 failed attempts)
    if (record.attempts >= 5) {
      await prisma.otpCode.delete({ where: { id: record.id } });
      throw {
        statusCode: 429,
        code: AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS,
        message: 'Too many incorrect attempts. Please request a new verification code.',
      };
    }

    // Check expiration (5 minutes)
    if (new Date() > record.expiresAt) {
      await prisma.otpCode.delete({ where: { id: record.id } });
      throw {
        statusCode: 400,
        code: AUTH_ERROR_CODES.OTP_EXPIRED,
        message: 'Verification code has expired. Please request a new one.',
      };
    }

    // Validate hash
    const isValid = AuthServiceLogic.verifyOtp(code, record.hash);
    if (!isValid) {
      // Increment attempt counter
      const updatedAttempts = record.attempts + 1;
      if (updatedAttempts >= 5) {
        await prisma.otpCode.delete({ where: { id: record.id } }).catch(() => {});
        throw {
          statusCode: 429,
          code: AUTH_ERROR_CODES.ACCOUNT_LOCKED,
          message: 'Too many incorrect attempts. Please request a new code.',
        };
      }

      await prisma.otpCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });

      const remaining = 5 - updatedAttempts;
      throw {
        statusCode: 400,
        code: AUTH_ERROR_CODES.OTP_INCORRECT,
        message: `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      };
    }

    // Successfully verified -> Delete the used OTP code
    await prisma.otpCode.delete({ where: { id: record.id } });
    return true;
  }

  /**
   * Tracks failed login attempts and applies exponential lockout
   */
  static recordFailedLogin(key: string) {
    const now = Date.now();
    const current = failedLoginAttempts.get(key) || { attempts: 0, lockoutUntil: 0 };
    current.attempts++;
    if (current.attempts >= 5) {
      // Lockout duration grows exponentially: 5 attempts = 2 min, 6 = 5 min, 7 = 15 min
      const minutes = Math.min(30, Math.pow(2, current.attempts - 5) * 2);
      current.lockoutUntil = now + minutes * 60 * 1000;
    }
    failedLoginAttempts.set(key, current);
  }

  static checkLoginLockout(key: string) {
    const now = Date.now();
    const entry = failedLoginAttempts.get(key);
    if (entry && entry.lockoutUntil > now) {
      const waitSeconds = Math.ceil((entry.lockoutUntil - now) / 1000);
      throw {
        statusCode: 429,
        code: AUTH_ERROR_CODES.ACCOUNT_LOCKED,
        message: `Too many failed attempts. Please wait ${waitSeconds} seconds before trying again.`,
      };
    }
  }

  static resetLoginAttempts(key: string) {
    failedLoginAttempts.delete(key);
  }

  /**
   * Resets all in-memory rate limit stores (for testing)
   */
  static resetStores() {
    contactSendLimits.clear();
    ipSendLimits.clear();
    failedLoginAttempts.clear();
  }
}
