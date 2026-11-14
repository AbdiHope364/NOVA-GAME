import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { WalletService } from '../services/wallet.service.js';
import { PlatformSettingsService } from '../services/platformSettings.service.js';

export class WalletController {
  static async getPaymentMethods(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const settings = await PlatformSettingsService.getSettings();
      res.json({
        success: true,
        data: {
          minDepositEtb: settings.minDeposit,
          maxDepositEtb: settings.maxDeposit,
          autoWithdrawLimitEtb: settings.autoWithdrawLimit,
          methods: [
            {
              id: 'TELEBIRR',
              label: 'Telebirr',
              description: 'Instant mobile wallet receipt verification',
              accountHint: '+251 9XX XXX XXX',
              enabled: true,
            },
            {
              id: 'CBE_BIRR',
              label: 'CBE Birr',
              description: 'Commercial Bank of Ethiopia mobile wallet',
              accountHint: '1000 4829 1928',
              enabled: true,
            },
            {
              id: 'BANK_TRANSFER',
              label: 'Bank Transfer',
              description: 'Direct Ethiopian bank transfer',
              accountHint: '1000 4829 1928 (CBE)',
              enabled: true,
            },
          ],
        },
      });
    } catch (err) {
      next(err);
    }
  }
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
      const { amount, paymentMethod, phoneNumber, receiptPhoto, referenceId } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Valid deposit amount required' });
      }
      if (!phoneNumber) {
        return res.status(400).json({ success: false, message: 'Phone number is required for manual deposit' });
      }
      if (!receiptPhoto) {
        return res.status(400).json({ success: false, message: 'Receipt photo is required for manual deposit' });
      }

      const transaction = await WalletService.requestDeposit(
        req.user!.userId,
        Number(amount),
        paymentMethod || 'Telebirr',
        phoneNumber,
        receiptPhoto,
        referenceId
      );

      res.json({
        success: true,
        message: 'Deposit request submitted successfully. Pending admin approval.',
        data: transaction,
      });
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

  static async getTransactions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const transactions = await WalletService.getUserTransactions(req.user!.userId, 30);
      res.json({ success: true, data: transactions });
    } catch (err) {
      next(err);
    }
  }
}
