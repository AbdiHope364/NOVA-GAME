import { Router } from 'express';
import { WalletController } from '../controllers/wallet.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireAgeVerification } from '../middleware/ageVerificationGuard.js';

const router = Router();

router.get('/methods', WalletController.getPaymentMethods);
router.use(authenticate);
router.get('/', WalletController.getWallet);
router.get('/transactions', WalletController.getTransactions);
router.post('/deposit', requireAgeVerification, WalletController.deposit);
router.post('/withdraw', requireAgeVerification, WalletController.withdraw);

export default router;
