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
  try {
    const payload = AuthServiceLogic.verifyToken(token, config.jwtSecret);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Unauthorized - Token expired or invalid' });
  }
}
