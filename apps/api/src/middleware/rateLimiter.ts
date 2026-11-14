import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

// Skip rate limiting in automated test runs
const isTest = config.env === 'test';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 1000 : 20, // 20 attempts per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

export const walletLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isTest ? 1000 : 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many wallet transactions requested. Please wait a moment.',
  },
});

export const gameLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isTest ? 5000 : 180, // 180 actions per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many gameplay requests. Please slow down.',
  },
});

