import { Router } from 'express';
import { GameController } from '../controllers/game.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.post('/play/:gameId', GameController.playGame);
router.get('/provably-fair/seed', GameController.getActiveSeed);
router.post('/provably-fair/rotate', GameController.rotateSeed);
router.post('/provably-fair/verify', GameController.verifyResult);
router.get('/bets/recent', GameController.getRecentBets);
router.get('/bets/history', GameController.getUserBets);

export default router;
