import { Router } from 'express';
import { z } from 'zod';
import { LettiMatchController } from '../controllers/lettiMatch.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = Router();

const stakeSchema = z.object({
  body: z.object({
    stakeEtb: z.number().positive(),
  }),
});

const joinSchema = z.object({
  body: z.object({
    roomCode: z.string().min(3).optional(),
    roomId: z.string().min(3).optional(),
  }),
});

const actionSchema = z.object({
  body: z.object({
    actionType: z.enum(['PICK_CARD', 'PLAYER_READY', 'FLIP_CARD', 'FORFEIT']),
    pickedCardIndex: z.number().int().min(0).max(51).optional(),
    idempotencyKey: z.string().min(4).max(128).optional(),
  }),
});

router.get('/config', LettiMatchController.getConfig);
router.get('/lobby', LettiMatchController.listLobby);

router.use(authenticate);
router.get('/active', LettiMatchController.getActive);
router.get('/history', LettiMatchController.getHistory);
router.post('/quick-match', validate(stakeSchema), LettiMatchController.quickMatch);
router.post('/rooms', validate(stakeSchema), LettiMatchController.createRoom);
router.post('/rooms/join', validate(joinSchema), LettiMatchController.joinRoom);
router.post('/rooms/:roomId/leave', LettiMatchController.leaveRoom);
router.post('/rooms/:roomId/rematch', LettiMatchController.requestRematch);
router.post('/matches/:matchId/action', validate(actionSchema), LettiMatchController.submitAction);

export default router;
