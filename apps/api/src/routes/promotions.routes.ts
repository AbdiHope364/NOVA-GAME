import { Router } from 'express';
import { BonusController } from '../controllers/bonus.controller.js';
import { optionalAuthenticate } from '../middleware/auth.js';

const router = Router();

router.get('/summary', optionalAuthenticate, BonusController.getPlayerPromotions);

export default router;
