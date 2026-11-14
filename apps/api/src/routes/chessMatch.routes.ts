import { Router } from 'express';
import { z } from 'zod';
import { ChessMatchController } from '../controllers/chessMatch.controller.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = Router();

const TIME_CONTROL_ENUM = z.enum([
  'BULLET_1_0',
  'BULLET_2_1',
  'BLITZ_3_0',
  'BLITZ_3_2',
  'BLITZ_5_0',
  'RAPID_10_0',
  'RAPID_10_5',
  'RAPID_15_10',
  'CLASSICAL_30_0',
]);

const roomSetupSchema = z.object({
  body: z.object({
    timeControl: TIME_CONTROL_ENUM.optional(),
    isRanked: z.boolean().optional(),
  }),
});

const joinSchema = z.object({
  body: z.object({
    roomCode: z.string().min(3).optional(),
    roomId: z.string().min(3).optional(),
  }),
});

const moveSchema = z.object({
  body: z.object({
    from: z.string().length(2),
    to: z.string().length(2),
    promotion: z.enum(['q', 'r', 'b', 'n']).optional(),
    expectedPly: z.number().int().positive().optional(),
    idempotencyKey: z.string().min(4).max(128).optional(),
  }),
});

const drawSchema = z.object({
  body: z.object({
    action: z.enum(['OFFER', 'ACCEPT', 'DECLINE']),
  }),
});

router.get('/lobby', ChessMatchController.listLobby);
router.get('/leaderboard', ChessMatchController.getLeaderboard);
router.get('/rooms/:roomId', optionalAuthenticate, ChessMatchController.getRoom);

router.use(authenticate);
router.get('/ratings', ChessMatchController.getRatings);
router.get('/active', ChessMatchController.getActive);
router.get('/history', ChessMatchController.getHistory);
router.post('/quick-match', validate(roomSetupSchema), ChessMatchController.quickMatch);
router.post('/rooms', validate(roomSetupSchema), ChessMatchController.createRoom);
router.post('/rooms/join', validate(joinSchema), ChessMatchController.joinRoom);
router.post('/rooms/:roomId/leave', ChessMatchController.leaveRoom);
router.post('/rooms/:roomId/rematch', ChessMatchController.requestRematch);
router.post('/matches/:matchId/move', validate(moveSchema), ChessMatchController.submitMove);
router.post('/matches/:matchId/resign', ChessMatchController.resignMatch);
router.post('/matches/:matchId/draw', validate(drawSchema), ChessMatchController.drawAction);
router.post('/matches/:matchId/timeout', ChessMatchController.claimTimeout);
router.post('/ai-complete', ChessMatchController.recordAiMatch);

export default router;
