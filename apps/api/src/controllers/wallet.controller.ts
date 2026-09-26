import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { WalletService } from '../services/wallet.service.js';
import { TransactionRepository } from '../repositories/transaction.repository.js';

export class WalletController {
  static async getWallet(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const wallet = await WalletService.getWallet(req.user!.userId);
      res.json({ success: true, data: wallet });
    } catch (err) {
      next(err);
    }
  }

  static async deposit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { amount, paymentMethod } = req.body;
      const wallet = await WalletService.deposit(req.user!.userId, amount, paymentMethod);
      res.json({ success: true, data: wallet });
    } catch (err) {
      next(err);
    }
  }

  static async withdraw(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { amount, destinationAddress } = req.body;
      const wallet = await WalletService.withdraw(req.user!.userId, amount, destinationAddress);
      res.json({ success: true, data: wallet });
    } catch (err) {
      next(err);
    }
  }

  static async getHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const wallet = await WalletService.getWallet(req.user!.userId);
      const history = await TransactionRepository.findWalletTransactions(wallet.id);
      res.json({ success: true, data: history });
    } catch (err) {
      next(err);
    }
  }
}
