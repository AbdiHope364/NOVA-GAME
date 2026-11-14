import { Router } from 'express';
import { z } from 'zod';
import { EngagementController } from '../controllers/engagement.controller.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = Router();

router.get('/summary', optionalAuthenticate, EngagementController.getSummary);

router.use(authenticate);
router.post('/check-in', EngagementController.claimDailyCheckIn);
router.post('/missions/:missionCode/claim', EngagementController.claimMission);
router.patch(
  '/customization',
  validate(
    z.object({
      body: z.object({
        avatarFrame: z.string().max(24).optional(),
        equippedBadge: z.string().max(64).nullable().optional(),
      }),
    })
  ),
  EngagementController.updateCustomization
);

export default router;
