import { Router } from 'express';
import { WalletController } from '../controllers/wallet.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { walletDepositSchema, walletWithdrawSchema } from '@nova/validation';

const router = Router();

router.use(authenticate);
router.get('/', WalletController.getWallet);
router.post('/deposit', validateBody(walletDepositSchema), WalletController.deposit);
router.post('/withdraw', validateBody(walletWithdrawSchema), WalletController.withdraw);
router.get('/history', WalletController.getHistory);

export default router;
