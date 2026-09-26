import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@nova/types';

export interface JwtPayload {
  userId: string;
  username: string;
  role: Role;
}

export class AuthServiceLogic {
  /**
   * Hashes plain text password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
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
}
