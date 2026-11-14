import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { UserRepository } from '../repositories/user.repository.js';
import { AUTH_ERROR_CODES } from '@nova/validation';

/**
 * Guard on deposit, staked-match, and withdrawal endpoints.
 * Blocks staked transactions until the user has passed formal age/identity verification.
 */
export async function requireAgeVerification(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
        message: 'Authentication required',
      });
    }

    // Demo/guest player bypass for free practice play only
    if (userId === 'demo-guest') {
      return res.status(403).json({
        success: false,
        code: AUTH_ERROR_CODES.VERIFICATION_REQUIRED,
        message: 'Demo guest players cannot access real-money or staked actions.',
      });
    }

    const user = await UserRepository.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.ageVerifiedAt) {
      return res.status(403).json({
        success: false,
        code: AUTH_ERROR_CODES.VERIFICATION_REQUIRED,
        message: 'Age and identity verification is required before deposits, staked matches, or withdrawals.',
      });
    }

    next();
  } catch (err) {
    next(err);
  }
}
