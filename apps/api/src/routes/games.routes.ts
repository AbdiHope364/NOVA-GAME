import { Router } from 'express';
import { z } from 'zod';
import { GameController } from '../controllers/game.controller.js';
import { LettiController } from '../controllers/letti.controller.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = Router();

const prepareLettiSchema = z.object({
  body: z.object({
    pickedCardIndex: z.number().int().min(0).max(51),
    clientSeed: z.string().min(1).max(128).optional(),
  }),
});

const confirmLettiSchema = z.object({
  body: z.object({
    roundId: z.string().min(1),
    amount: z.number().positive(),
    idempotencyKey: z.string().min(6).max(128),
  }),
});

const verifyLettiSchema = z.object({
  body: z.object({
    roundId: z.string().min(1).optional(),
    serverSeed: z.string().min(1).optional(),
    serverSeedHash: z.string().min(1).optional(),
    clientSeed: z.string().min(1).optional(),
    nonce: z.number().int().nonnegative().optional(),
    pickedCardIndex: z.number().int().min(0).max(51).optional(),
    amount: z.number().positive().optional(),
  }),
});

// Provably Fair seed discovery and rotation (works for both guests and authenticated players)
router.get('/provably-fair/seed', optionalAuthenticate, GameController.getActiveSeed);
router.get('/seed/active', optionalAuthenticate, GameController.getActiveSeed);
router.post('/provably-fair/rotate', optionalAuthenticate, GameController.rotateSeed);
router.post('/seed/rotate', optionalAuthenticate, GameController.rotateSeed);
router.post('/provably-fair/verify', GameController.verifyResult);

// Public game & platform status configs
router.get('/configs', GameController.getPublicConfigs);

// NovaGame / Bingo dynamic round configuration (publicly queryable by players)
router.get('/bingo/round-config', GameController.getCartellaRoundConfig);
router.get('/novagame/round-config', GameController.getCartellaRoundConfig);
router.get('/cartella/round-config', GameController.getCartellaRoundConfig);

// Letti 2-step server-authoritative round lifecycle, recovery, history & verification
router.post('/letti/prepare', optionalAuthenticate, validate(prepareLettiSchema), LettiController.prepare);
router.post('/letti/confirm', optionalAuthenticate, validate(confirmLettiSchema), LettiController.confirm);
router.get('/letti/active', optionalAuthenticate, LettiController.getActive);
router.get('/letti/history', optionalAuthenticate, LettiController.getHistory);
router.post('/letti/verify', validate(verifyLettiSchema), LettiController.verify);

// Gameplay route - supports both authenticated players and guest demo players
router.post('/play/:gameId', optionalAuthenticate, GameController.playGame);

// Authenticated player gameplay routes
router.use(authenticate);
router.get('/bets/recent', GameController.getRecentBets);
router.get('/bets/history', GameController.getUserBets);

export default router;
