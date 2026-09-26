import { AuthServiceLogic } from '@nova/auth';
import { UserRepository } from '../repositories/user.repository.js';
import { config } from '../config/env.js';

export class AuthService {
  static async register(data: { username: string; email: string; password: string }) {
    const existingEmail = await UserRepository.findByEmail(data.email);
    if (existingEmail) {
      throw { statusCode: 400, message: 'Email address already registered' };
    }

    const existingUsername = await UserRepository.findByUsername(data.username);
    if (existingUsername) {
      throw { statusCode: 400, message: 'Username is already taken' };
    }

    const passwordHash = await AuthServiceLogic.hashPassword(data.password);
    const user = await UserRepository.createUser({
      username: data.username,
      email: data.email,
      passwordHash,
    });

    const token = AuthServiceLogic.generateToken(
      { userId: user.id, username: user.username, role: user.role },
      config.jwtSecret,
      config.jwtExpiresIn
    );

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        wallet: user.wallet,
      },
      token,
    };
  }

  static async login(data: { email: string; password: string }) {
    const user = await UserRepository.findByEmail(data.email);
    if (!user) {
      throw { statusCode: 401, message: 'Invalid email or password' };
    }

    const match = await AuthServiceLogic.comparePassword(data.password, user.passwordHash);
    if (!match) {
      throw { statusCode: 401, message: 'Invalid email or password' };
    }

    const token = AuthServiceLogic.generateToken(
      { userId: user.id, username: user.username, role: user.role },
      config.jwtSecret,
      config.jwtExpiresIn
    );

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        wallet: user.wallet,
      },
      token,
    };
  }
}
