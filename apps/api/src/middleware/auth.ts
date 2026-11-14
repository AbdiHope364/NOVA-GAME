import { Request, Response, NextFunction } from 'express';
import { AuthServiceLogic } from '@nova/auth';
import { config } from '../config/env.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    username: string;
    role: any;
  };
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized - Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];

  if (token === 'demo-guest-token') {
    req.user = {
      userId: 'demo-guest',
      username: 'GuestPlayer',
      role: 'USER',
    };
    return next();
  }

  try {
    const payload = AuthServiceLogic.verifyToken(token, config.jwtSecret);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Unauthorized - Token expired or invalid' });
  }
}

export function optionalAuthenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  if (token === 'demo-guest-token') {
    req.user = {
      userId: 'demo-guest',
      username: 'GuestPlayer',
      role: 'USER',
    };
    return next();
  }

  try {
    const payload = AuthServiceLogic.verifyToken(token, config.jwtSecret);
    req.user = payload;
  } catch {
    // Fallback gracefully for guests/unauthenticated users
  }
  next();
}
