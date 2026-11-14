import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { UserRepository } from '../repositories/user.repository.js';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register({
        ...req.body,
        ipAddress: req.ip || (req.headers['x-forwarded-for'] as string)?.split(',')[0],
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.userId === 'demo-guest') {
        return res.json({
          success: true,
          data: {
            id: 'demo-guest',
            username: 'GuestPlayer',
            email: 'guest@novagame.com',
            role: 'USER',
            isActive: true,
          },
        });
      }

      const user = await UserRepository.findById(req.user!.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const { passwordHash: _, ...safeUser } = user;
      res.json({ success: true, data: safeUser });
    } catch (err) {
      next(err);
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const updated = await AuthService.updateProfile(req.user!.userId, req.body);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  static async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await AuthService.changePassword(
        req.user!.userId,
        currentPassword,
        newPassword
      );
      res.json({ success: true, data: result, message: 'Password updated successfully.' });
    } catch (err) {
      next(err);
    }
  }
}
