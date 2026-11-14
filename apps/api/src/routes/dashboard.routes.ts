import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';

const router = Router();

router.get('/overview', optionalAuthenticate, DashboardController.getOverview);
router.get('/leaderboard', optionalAuthenticate, DashboardController.getLeaderboard);

router.use(authenticate);
router.get('/history', DashboardController.getHistory);
router.get('/notifications', DashboardController.getNotifications);
router.post('/notifications/read', DashboardController.markNotificationsRead);

export default router;
