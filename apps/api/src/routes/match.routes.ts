import { Router } from 'express';
import { MatchController } from '../controllers/match.controller.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';

const router = Router();

// Public/authenticated lobby and matches
router.post('/', authenticate, MatchController.createChallenge);
router.get('/lobby', optionalAuthenticate, MatchController.listLobby);
router.get('/user/history', authenticate, MatchController.getUserHistory);
router.get('/:id', optionalAuthenticate, MatchController.getMatch);
router.post('/:id/join', authenticate, MatchController.joinMatch);
router.post('/:id/resign', authenticate, MatchController.resignMatch);
router.post('/:id/cancel', authenticate, MatchController.cancelChallenge);

// Admin abuse flags inspection (read-only dispute audit)
router.get('/admin/flags', authenticate, MatchController.getAbuseFlags);

export const matchRoutes = router;

