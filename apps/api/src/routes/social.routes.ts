import { Router } from 'express';
import { z } from 'zod';
import { SocialController } from '../controllers/social.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = Router();
router.use(authenticate);

router.get('/friends', SocialController.getFriends);

router.post(
  '/friends/request',
  validate(z.object({ body: z.object({ username: z.string().min(2).max(40) }) })),
  SocialController.sendFriendRequest
);

router.post(
  '/friends/:friendshipId/respond',
  validate(z.object({ body: z.object({ action: z.enum(['ACCEPT', 'DECLINE']) }) })),
  SocialController.respondFriendRequest
);

router.delete('/friends/:friendUserId', SocialController.removeFriend);

router.post('/block/:targetUserId', SocialController.blockUser);
router.delete('/block/:targetUserId', SocialController.unblockUser);

router.post(
  '/report/:targetUserId',
  validate(
    z.object({
      body: z.object({
        reason: z.string().min(3).max(120),
        details: z.string().max(500).optional(),
      }),
    })
  ),
  SocialController.reportUser
);

router.post(
  '/invites',
  validate(
    z.object({
      body: z.object({
        recipientId: z.string().min(1),
        gameType: z.enum(['LETTI_PVP', 'DAMA_PVP', 'CHESS_PVP', 'LUDO_PVP']),
        stakeEtb: z.number().min(0).max(50000),
        roomCode: z.string().max(32).optional(),
      }),
    })
  ),
  SocialController.sendGameInvite
);

router.post(
  '/invites/:inviteId/respond',
  validate(z.object({ body: z.object({ action: z.enum(['ACCEPT', 'DECLINE']) }) })),
  SocialController.respondGameInvite
);

export default router;
