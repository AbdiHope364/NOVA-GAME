import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateClientSeedSchema = z.object({
  clientSeed: z.string().min(1).max(64),
});

export const coinFlipBetSchema = z.object({
  amount: z.number().positive('Bet amount must be positive'),
  params: z.object({
    choice: z.enum(['HEADS', 'TAILS']),
  }),
});

export const diceBetSchema = z.object({
  amount: z.number().positive('Bet amount must be positive'),
  params: z.object({
    target: z.number().min(1).max(98),
    condition: z.enum(['UNDER', 'OVER']),
  }),
});

export const crashBetSchema = z.object({
  amount: z.number().positive('Bet amount must be positive'),
  params: z.object({
    autoCashoutMultiplier: z.number().min(1.01).optional(),
  }),
});

export const rouletteBetSchema = z.object({
  amount: z.number().positive('Bet amount must be positive'),
  params: z.object({
    selection: z.union([z.enum(['RED', 'BLACK', 'GREEN']), z.number().min(0).max(36)]),
  }),
});

export const walletDepositSchema = z.object({
  amount: z.number().positive('Deposit amount must be positive'),
  paymentMethod: z.string().min(1),
});

export const walletWithdrawSchema = z.object({
  amount: z.number().positive('Withdrawal amount must be positive'),
  destinationAddress: z.string().min(1),
});
