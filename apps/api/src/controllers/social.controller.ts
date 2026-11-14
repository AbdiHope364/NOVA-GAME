import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { SocialService } from '../services/social.service.js';

export class SocialController {
  static async getFriends(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await SocialService.getFriendsOverview(req.user!.userId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async sendFriendRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await SocialService.sendFriendRequest(
        req.user!.userId,
        String(req.body.username || '')
      );
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async respondFriendRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await SocialService.respondFriendRequest(
        req.user!.userId,
        req.params.friendshipId,
        req.body.action
      );
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async removeFriend(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await SocialService.removeFriend(req.user!.userId, req.params.friendUserId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async blockUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await SocialService.blockUser(req.user!.userId, req.params.targetUserId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async unblockUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await SocialService.unblockUser(req.user!.userId, req.params.targetUserId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async reportUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await SocialService.reportUser(
        req.user!.userId,
        req.params.targetUserId,
        req.body.reason,
        req.body.details
      );
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async sendGameInvite(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await SocialService.sendGameInvite(req.user!.userId, req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async respondGameInvite(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await SocialService.respondGameInvite(
        req.user!.userId,
        req.params.inviteId,
        req.body.action
      );
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}
