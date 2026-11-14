import { Router } from 'express';
import { z } from 'zod';
import { AdminController } from '../controllers/admin.controller.js';
import { BonusController } from '../controllers/bonus.controller.js';
import { LettiMatchController } from '../controllers/lettiMatch.controller.js';
import { ChessMatchController } from '../controllers/chessMatch.controller.js';
import { LudoMatchController } from '../controllers/ludoMatch.controller.js';
import { EngagementController } from '../controllers/engagement.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { validate } from '../middleware/validation.js';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/stats', AdminController.getStats);
router.get('/users', AdminController.getUsers);
router.post('/users/:id/toggle-status', AdminController.toggleUserStatus);

// Crash Engine Monitor & Emergency Safe Controls (No Outcome Tampering)
router.get('/crash/monitor', AdminController.getCrashMonitor);
router.post('/crash/pause', AdminController.pauseCrashEngine);
router.post('/crash/resume', AdminController.resumeCrashEngine);

// Deposit Approval Routes
router.get('/deposits/pending', AdminController.getPendingDeposits);
router.post('/deposits/:id/approve', AdminController.approveDeposit);
router.post('/deposits/:id/reject', AdminController.rejectDeposit);

// Withdrawal Approval Routes
router.get('/withdrawals/pending', AdminController.getPendingWithdrawals);
router.post('/withdrawals/:id/approve', AdminController.approveWithdrawal);
router.post('/withdrawals/:id/reject', AdminController.rejectWithdrawal);

// Financial Ledger
router.get('/ledger', AdminController.getLedger);

// Game Management (All 10 games)
router.get('/games', AdminController.getGames);
router.put('/games/:gameId/config', AdminController.updateGameConfig);
router.post('/games/:gameId/config', AdminController.updateGameConfig);

// NovaGame / Bingo Round Management
router.get('/bingo/round-config', AdminController.getBingoRoundConfig);
router.put('/bingo/round-config', AdminController.updateBingoRoundConfig);
router.post('/bingo/round-config', AdminController.updateBingoRoundConfig);
router.get('/novagame/round-config', AdminController.getBingoRoundConfig);
router.put('/novagame/round-config', AdminController.updateBingoRoundConfig);
router.post('/novagame/round-config', AdminController.updateBingoRoundConfig);
router.get('/cartella/round-config', AdminController.getBingoRoundConfig);
router.put('/cartella/round-config', AdminController.updateBingoRoundConfig);
router.post('/cartella/round-config', AdminController.updateBingoRoundConfig);

// Admin Audit Trail
router.get('/audit-logs', AdminController.getAuditLogs);

// Platform System Settings
router.get('/settings', AdminController.getSettings);
router.post('/settings', AdminController.updateSettings);
router.put('/settings', AdminController.updateSettings);

// Bonus & Referral Campaign Management
const campaignUpdateSchema = z.object({
  body: z.object({
    isActive: z.boolean().optional(),
    bonusPercent: z.number().int().min(0).max(5000).optional(),
    promoBaseEtb: z.number().min(0).max(10000).optional(),
    maxBonusEtb: z.number().min(0).max(100000).optional(),
    minDepositEtb: z.number().min(0).max(100000).optional(),
    wageringMultiplier: z.number().min(0).max(100).optional(),
    eligibleGames: z.string().optional(),
    expirationDays: z.number().int().min(0).max(365).optional(),
    referralsEnabled: z.boolean().optional(),
    referralRewardEtb: z.number().refine((v) => v === 10 || v === 20, {
      message: 'Referral reward must be 10 ETB or 20 ETB',
    }).optional(),
    referralMinDepositEtb: z.number().min(0).max(100000).optional(),
    referralApprovalMode: z.enum(['AUTO', 'MANUAL']).optional(),
    referralRewardType: z.enum(['PROMOTIONAL', 'CASH']).optional(),
    maxReferralsPerUser: z.number().int().min(1).max(10000).optional(),
    startsAt: z.string().nullable().optional(),
    endsAt: z.string().nullable().optional(),
  }),
});

const reviewReferralSchema = z.object({
  body: z.object({
    decision: z.enum(['APPROVE', 'REJECT']),
    reason: z.string().max(300).optional(),
  }),
});

router.get('/promotions', BonusController.getAdminOverview);
router.put('/promotions/campaign', validate(campaignUpdateSchema), BonusController.updateCampaign);
router.post('/promotions/campaign', validate(campaignUpdateSchema), BonusController.updateCampaign);
router.post('/promotions/referrals/:referralId/review', validate(reviewReferralSchema), BonusController.reviewReferral);

// Letti 1v1 Multiplayer Management
router.get('/letti-pvp', LettiMatchController.getAdminOverview);
router.put('/letti-pvp/config', LettiMatchController.updateAdminConfig);
router.post('/letti-pvp/config', LettiMatchController.updateAdminConfig);
router.post('/letti-pvp/rooms/:roomId/cancel', LettiMatchController.cancelAdminRoom);

// Daily Rewards, Missions & Player Reports Management
router.get('/engagement', EngagementController.getAdminOverview);
router.put('/engagement/config', EngagementController.updateAdminConfig);
router.post('/engagement/reports/:reportId/review', EngagementController.reviewReport);

// NOVA Chess Management & Moderation
router.get('/chess', ChessMatchController.getAdminOverview);
router.put('/chess/config', ChessMatchController.updateAdminConfig);
router.post('/chess/config', ChessMatchController.updateAdminConfig);
router.post('/chess/matches/:matchId/abort', ChessMatchController.adminAbortMatch);

// NOVA Ludo Management & Refunds
router.get('/ludo', LudoMatchController.getAdminOverview);
router.put('/ludo/config', LudoMatchController.updateAdminConfig);
router.post('/ludo/config', LudoMatchController.updateAdminConfig);
router.post('/ludo/rooms/:roomId/cancel', LudoMatchController.cancelAdminRoom);

export default router;
