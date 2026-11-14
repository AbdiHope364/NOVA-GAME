import { Router } from 'express';
import { TicTacToeController } from '../controllers/ticTacToe.controller.js';

const router = Router();

// Public / Authenticated endpoints
router.get('/', TicTacToeController.getOverview);
router.get('/leaderboard', TicTacToeController.getLeaderboard);
router.get('/my-stats', TicTacToeController.getMyStats);
router.get('/history', TicTacToeController.getHistory);

// Admin endpoints
router.get('/admin/overview', TicTacToeController.getAdminOverview);

export default router;
