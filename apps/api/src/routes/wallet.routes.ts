import { Router } from 'express';
import { WalletController } from '../controllers/wallet.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/methods', WalletController.getPaymentMethods);
router.use(authenticate);
router.get('/', WalletController.getWallet);
router.get('/transactions', WalletController.getTransactions);
router.post('/deposit', WalletController.deposit);
router.post('/withdraw', WalletController.withdraw);

export default router;
