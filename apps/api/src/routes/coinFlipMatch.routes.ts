import { Router } from 'express';
import { CoinFlipMatchController } from '../controllers/coinFlipMatch.controller.js';
import { optionalAuthenticate } from '../middleware/auth.js';

const router = Router();

router.get('/config', CoinFlipMatchController.getConfig);
router.get('/rooms', CoinFlipMatchController.getAvailableRooms);
router.get('/winners', CoinFlipMatchController.getRecentWinners);
router.get('/leaderboard', CoinFlipMatchController.getLeaderboard);
router.get('/stats', optionalAuthenticate, CoinFlipMatchController.getUserStats);

router.post('/room/create', optionalAuthenticate, CoinFlipMatchController.createPrivateRoom);
router.post('/room/join', optionalAuthenticate, CoinFlipMatchController.joinPrivateRoom);

export default router;
