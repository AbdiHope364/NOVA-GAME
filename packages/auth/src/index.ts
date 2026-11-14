import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { Role } from '@nova/types';

export interface JwtPayload {
  userId: string;
  username: string;
  role: Role;
  tokenVersion?: number;
}

export class AuthServiceLogic {
  /**
   * Hashes plain text password using bcrypt with cost 12
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compares plain password with hashed password
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generates JWT token for user
   */
  static generateToken(payload: JwtPayload, secret: string, expiresIn: string = '7d'): string {
    return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
  }

  /**
   * Verifies JWT token and returns payload
   */
  static verifyToken(token: string, secret: string): JwtPayload {
    return jwt.verify(token, secret) as JwtPayload;
  }

  /**
   * Cryptographically generates a secure 6-digit numeric OTP code
   */
  static generateOtpCode(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Hashes an OTP code for secure database storage (never store plain OTPs!)
   */
  static hashOtp(code: string, salt: string = 'nova-otp-salt'): string {
    return crypto.createHash('sha256').update(`${code}:${salt}`).digest('hex');
  }

  /**
   * Verifies an OTP code against its stored hash
   */
  static verifyOtp(code: string, hash: string, salt: string = 'nova-otp-salt'): boolean {
    const computed = this.hashOtp(code, salt);
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
  }

  /**
   * Generates a random friendly player username, e.g. "Player-7K2P"
   */
  static generatePlayerUsername(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // base32 without confusing chars (0, O, 1, I)
    const bytes = crypto.randomBytes(4);
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars[bytes[i] % chars.length];
    }
    return `Player-${code}`;
  }

  /**
   * Masks a phone number for user privacy (e.g. +251 9XX XXX 1234 -> +251 9•• ••• 1234)
   */
  static maskPhone(phone: string): string {
    const clean = phone.replace(/\s+/g, '');
    if (clean.length < 9) return clean;
    // Format: +251 9** *** 3456
    const prefix = clean.slice(0, 6); // +251 9
    const suffix = clean.slice(-4);
    return `${prefix} ••• ${suffix}`;
  }

  /**
   * Masks an email address for user privacy (e.g. you@example.com -> y•••@example.com)
   */
  static maskEmail(email: string): string {
    const [name, domain] = email.split('@');
    if (!domain) return email;
    const maskedName = name.length <= 2 ? `${name[0]}*` : `${name[0]}***${name[name.length - 1]}`;
    return `${maskedName}@${domain}`;
  }

  /**
   * Masks an identifier (phone or email)
   */
  static maskIdentifier(identifier: string): string {
    if (identifier.includes('@')) {
      return this.maskEmail(identifier);
    }
    return this.maskPhone(identifier);
  }
}
