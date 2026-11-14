import { Router } from 'express';
import { z } from 'zod';
import { LudoMatchController } from '../controllers/ludoMatch.controller.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = Router();

const roomSetupSchema = z.object({
  body: z.object({
    playerCount: z.number().int().min(2).max(4).optional(),
    stakeEtb: z.number().min(0).max(50000).optional(),
    clientSeed: z.string().min(4).max(64).optional(),
  }),
});

const joinSchema = z.object({
  body: z.object({
    roomCode: z.string().min(3).optional(),
    roomId: z.string().min(3).optional(),
    clientSeed: z.string().min(4).max(64).optional(),
  }),
});

const rollSchema = z.object({
  body: z.object({
    idempotencyKey: z.string().min(4).max(128).optional(),
  }),
});

const moveSchema = z.object({
  body: z.object({
    tokenIndex: z.number().int().min(0).max(3),
    idempotencyKey: z.string().min(4).max(128).optional(),
  }),
});

router.get('/config', LudoMatchController.getConfig);
router.get('/lobby', LudoMatchController.listLobby);
router.get('/matches/:matchId/verify', LudoMatchController.verifyMatch);
router.get('/rooms/:roomId', optionalAuthenticate, LudoMatchController.getRoom);

router.use(authenticate);
router.get('/active', LudoMatchController.getActive);
router.get('/history', LudoMatchController.getHistory);
router.post('/quick-match', validate(roomSetupSchema), LudoMatchController.quickMatch);
router.post('/rooms', validate(roomSetupSchema), LudoMatchController.createRoom);
router.post('/rooms/join', validate(joinSchema), LudoMatchController.joinRoom);
router.post('/rooms/:roomId/client-seed', LudoMatchController.updateClientSeed);
router.post('/rooms/:roomId/leave', LudoMatchController.leaveRoom);
router.post('/matches/:matchId/roll', validate(rollSchema), LudoMatchController.rollDice);
router.post('/matches/:matchId/move', validate(moveSchema), LudoMatchController.moveToken);
router.post('/matches/:matchId/timeout', LudoMatchController.handleTimeout);
router.post('/matches/:matchId/forfeit', LudoMatchController.forfeitMatch);
router.post('/ai-complete', LudoMatchController.recordAiMatch);

export default router;
