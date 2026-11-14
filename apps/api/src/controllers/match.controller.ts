import { Response } from 'express';
import { MatchService } from '../services/match.service.js';
import { AbuseService } from '../services/abuse.service.js';
import { UserRepository } from '../repositories/user.repository.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

export class MatchController {
  static async createChallenge(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { stakeMinor, isPrivate, private: isPriv } = req.body;
      if (stakeMinor === undefined || stakeMinor === null || isNaN(Number(stakeMinor)) || Number(stakeMinor) < 0) {
        return res.status(400).json({ success: false, error: 'Valid stakeMinor is required (>= 0)' });
      }

      if (Number(stakeMinor) > 0) {
        const user = await UserRepository.findById(userId);
        if (!user?.ageVerifiedAt) {
          return res.status(403).json({
            success: false,
            code: 'VERIFICATION_REQUIRED',
            error: 'Age and identity verification is required before joining staked matches.',
          });
        }
      }

      const challenge = await MatchService.createChallenge(
        userId,
        BigInt(stakeMinor),
        Boolean(isPrivate || isPriv)
      );

      return res.status(201).json({
        success: true,
        data: challenge,
      });
    } catch (err: any) {
      const status = err.statusCode || 500;
      return res.status(status).json({
        success: false,
        error: err.message || 'Failed to create challenge',
      });
    }
  }

  static async listLobby(req: AuthenticatedRequest, res: Response) {
    try {
      const lobby = await MatchService.listLobby();
      return res.json({
        success: true,
        data: lobby,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to load lobby',
      });
    }
  }

  static async getMatch(req: AuthenticatedRequest, res: Response) {
    try {
      const match = await MatchService.getMatch(req.params.id);
      return res.json({
        success: true,
        data: match,
      });
    } catch (err: any) {
      const status = err.statusCode || 500;
      return res.status(status).json({
        success: false,
        error: err.message || 'Match not found',
      });
    }
  }

  static async joinMatch(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const existingMatch = await MatchService.getMatch(req.params.id);
      if (existingMatch && Number(existingMatch.stakeMinor) > 0) {
        const user = await UserRepository.findById(userId);
        if (!user?.ageVerifiedAt) {
          return res.status(403).json({
            success: false,
            code: 'VERIFICATION_REQUIRED',
            error: 'Age and identity verification is required before joining staked matches.',
          });
        }
      }

      const match = await MatchService.joinMatch(req.params.id, userId);
      return res.json({
        success: true,
        data: match,
      });
    } catch (err: any) {
      const status = err.statusCode || 500;
      return res.status(status).json({
        success: false,
        error: err.message || 'Failed to join match',
      });
    }
  }

  static async resignMatch(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const result = await MatchService.resignMatch(req.params.id, userId);
      return res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      const status = err.statusCode || 500;
      return res.status(status).json({
        success: false,
        error: err.message || 'Failed to resign match',
      });
    }
  }

  static async cancelChallenge(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const result = await MatchService.cancelChallenge(req.params.id, userId);
      return res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      const status = err.statusCode || 500;
      return res.status(status).json({
        success: false,
        error: err.message || 'Failed to cancel challenge',
      });
    }
  }

  static async getUserHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;

      const history = await MatchService.getUserMatchHistory(userId, page, limit);
      return res.json({
        success: true,
        data: history,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to load match history',
      });
    }
  }

  static async getAbuseFlags(req: AuthenticatedRequest, res: Response) {
    try {
      const flags = await AbuseService.getAbuseFlags();
      return res.json({
        success: true,
        data: flags,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to retrieve flags',
      });
    }
  }
}

