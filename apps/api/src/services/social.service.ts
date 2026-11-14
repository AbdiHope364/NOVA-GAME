import { prisma } from '../config/database.js';
import { emitToUser, isUserOnline } from '../websocket/socket.js';
import { LettiMatchService } from './lettiMatch.service.js';
import { ChessMatchService } from './chessMatch.service.js';
import { LudoMatchService } from './ludoMatch.service.js';
import { MatchService } from './match.service.js';

export class SocialService {
  private static async isBlockedBetween(userA: string, userB: string): Promise<boolean> {
    const block = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userA, blockedId: userB },
          { blockerId: userB, blockedId: userA },
        ],
      },
    });
    return Boolean(block);
  }

  /**
   * Returns complete friends overview: accepted friends with live online status,
   * incoming/outgoing requests, recent opponents, blocked users, and active game invites
   */
  static async getFriendsOverview(userId: string) {
    if (!userId || userId === 'demo-guest') {
      return {
        friends: [],
        incomingRequests: [],
        outgoingRequests: [],
        recentOpponents: [],
        blockedUsers: [],
        pendingInvites: [],
      };
    }

    const now = new Date();
    const [friendships, blocks, invites, lettiRecent, damaRecent] = await Promise.all([
      prisma.friendship.findMany({
        where: { OR: [{ requesterId: userId }, { addresseeId: userId }] },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.userBlock.findMany({
        where: { blockerId: userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.gameInvite.findMany({
        where: {
          recipientId: userId,
          status: 'PENDING',
          expiresAt: { gt: now },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.lettiMatch.findMany({
        where: {
          status: 'COMPLETED',
          OR: [{ playerOneId: userId }, { playerTwoId: userId }],
        },
        orderBy: { completedAt: 'desc' },
        take: 15,
      }),
      prisma.match.findMany({
        where: {
          status: 'FINISHED',
          OR: [{ whiteUserId: userId }, { blackUserId: userId }],
        },
        orderBy: { finishedAt: 'desc' },
        take: 15,
      }),
    ]);

    const otherIds = new Set<string>();
    for (const f of friendships) {
      otherIds.add(f.requesterId === userId ? f.addresseeId : f.requesterId);
    }
    for (const b of blocks) otherIds.add(b.blockedId);
    for (const inv of invites) otherIds.add(inv.senderId);

    const recentOppsList: Array<{ userId: string; lastGame: string; lastPlayedAt: Date }> = [];
    for (const lm of lettiRecent) {
      const opp = lm.playerOneId === userId ? lm.playerTwoId : lm.playerOneId;
      if (opp && opp !== 'demo-guest') {
        otherIds.add(opp);
        recentOppsList.push({
          userId: opp,
          lastGame: 'Letti Card 1v1',
          lastPlayedAt: lm.completedAt || lm.createdAt,
        });
      }
    }
    for (const dm of damaRecent) {
      const opp = dm.whiteUserId === userId ? dm.blackUserId : dm.whiteUserId;
      if (opp && opp !== 'demo-guest') {
        otherIds.add(opp);
        recentOppsList.push({
          userId: opp,
          lastGame: 'Ethiopian Dama',
          lastPlayedAt: dm.finishedAt || dm.createdAt,
        });
      }
    }

    const users =
      otherIds.size > 0
        ? await prisma.user.findMany({
            where: { id: { in: Array.from(otherIds) } },
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              avatarFrame: true,
              equippedBadge: true,
              lastActiveAt: true,
              isActive: true,
            },
          })
        : [];
    const uMap = new Map(users.map((u) => [u.id, u]));

    const blockedSet = new Set(blocks.map((b) => b.blockedId));
    const friendUserIds = new Set<string>();

    const friends: any[] = [];
    const incomingRequests: any[] = [];
    const outgoingRequests: any[] = [];

    for (const f of friendships) {
      const isRequester = f.requesterId === userId;
      const otherId = isRequester ? f.addresseeId : f.requesterId;
      const u = uMap.get(otherId);
      if (!u || !u.isActive || blockedSet.has(otherId)) continue;

      if (f.status === 'ACCEPTED') {
        friendUserIds.add(otherId);
        friends.push({
          friendshipId: f.id,
          userId: u.id,
          username: u.username,
          avatarUrl: u.avatarUrl,
          avatarFrame: u.avatarFrame,
          equippedBadge: u.equippedBadge,
          online: isUserOnline(u.id),
          lastActiveAt: u.lastActiveAt?.toISOString() || null,
        });
      } else if (isRequester) {
        outgoingRequests.push({
          friendshipId: f.id,
          userId: u.id,
          username: u.username,
          avatarFrame: u.avatarFrame,
          createdAt: f.createdAt.toISOString(),
        });
      } else {
        incomingRequests.push({
          friendshipId: f.id,
          userId: u.id,
          username: u.username,
          avatarFrame: u.avatarFrame,
          createdAt: f.createdAt.toISOString(),
        });
      }
    }

    // Deduplicate recent opponents and attach friendship status
    const seenOpps = new Set<string>();
    const recentOpponents: any[] = [];
    recentOppsList.sort((a, b) => b.lastPlayedAt.getTime() - a.lastPlayedAt.getTime());
    for (const item of recentOppsList) {
      if (seenOpps.has(item.userId) || blockedSet.has(item.userId)) continue;
      seenOpps.add(item.userId);
      const u = uMap.get(item.userId);
      if (!u || !u.isActive) continue;
      recentOpponents.push({
        userId: u.id,
        username: u.username,
        avatarFrame: u.avatarFrame,
        equippedBadge: u.equippedBadge,
        online: isUserOnline(u.id),
        isFriend: friendUserIds.has(u.id),
        lastGame: item.lastGame,
        lastPlayedAt: item.lastPlayedAt.toISOString(),
      });
      if (recentOpponents.length >= 10) break;
    }

    const blockedUsers = blocks
      .map((b) => {
        const u = uMap.get(b.blockedId);
        return {
          blockId: b.id,
          userId: b.blockedId,
          username: u?.username || 'Player',
          createdAt: b.createdAt.toISOString(),
        };
      });

    const pendingInvites = invites.map((inv) => {
      const sender = uMap.get(inv.senderId);
      return {
        id: inv.id,
        senderId: inv.senderId,
        senderUsername: sender?.username || 'Player',
        gameType: inv.gameType,
        roomCode: inv.roomCode,
        stakeEtb: inv.stakeEtb,
        expiresAt: inv.expiresAt.toISOString(),
        createdAt: inv.createdAt.toISOString(),
      };
    });

    return {
      friends,
      incomingRequests,
      outgoingRequests,
      recentOpponents,
      blockedUsers,
      pendingInvites,
    };
  }

  static async sendFriendRequest(requesterId: string, targetUsername: string) {
    const clean = targetUsername.trim();
    if (!clean) throw { statusCode: 400, message: 'Enter a username to send a friend request.' };

    const target = await prisma.user.findUnique({ where: { username: clean } });
    if (!target || !target.isActive || target.id === 'demo-guest') {
      throw { statusCode: 404, message: `Player "${clean}" not found.` };
    }
    if (target.id === requesterId) {
      throw { statusCode: 400, message: 'You cannot add yourself as a friend.' };
    }
    if (await this.isBlockedBetween(requesterId, target.id)) {
      throw { statusCode: 403, message: 'Cannot send a friend request to this player.' };
    }

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId: target.id },
          { requesterId: target.id, addresseeId: requesterId },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        throw { statusCode: 409, message: `You are already friends with ${target.username}.` };
      }
      if (existing.requesterId === target.id) {
        // Mutual request -> auto-accept!
        const accepted = await prisma.friendship.update({
          where: { id: existing.id },
          data: { status: 'ACCEPTED' },
        });
        emitToUser(target.id, 'social:friend-accepted', { byUserId: requesterId });
        return { friendship: accepted, autoAccepted: true };
      }
      throw { statusCode: 409, message: 'Friend request already sent.' };
    }

    const created = await prisma.friendship.create({
      data: {
        requesterId,
        addresseeId: target.id,
        status: 'PENDING',
      },
    });

    const sender = await prisma.user.findUnique({
      where: { id: requesterId },
      select: { username: true },
    });
    emitToUser(target.id, 'social:friend-request', {
      friendshipId: created.id,
      fromUsername: sender?.username || 'Player',
    });

    return { friendship: created, autoAccepted: false };
  }

  static async respondFriendRequest(
    userId: string,
    friendshipId: string,
    action: 'ACCEPT' | 'DECLINE'
  ) {
    const reqRecord = await prisma.friendship.findUnique({ where: { id: friendshipId } });
    if (!reqRecord) throw { statusCode: 404, message: 'Friend request not found.' };
    if (reqRecord.addresseeId !== userId) {
      throw { statusCode: 403, message: 'Not authorized to respond to this friend request.' };
    }

    if (action === 'DECLINE') {
      await prisma.friendship.delete({ where: { id: friendshipId } });
      return { status: 'DECLINED' };
    }

    const updated = await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: 'ACCEPTED' },
    });
    emitToUser(reqRecord.requesterId, 'social:friend-accepted', { byUserId: userId });
    return { status: 'ACCEPTED', friendship: updated };
  }

  static async removeFriend(userId: string, friendUserId: string) {
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { requesterId: userId, addresseeId: friendUserId },
          { requesterId: friendUserId, addresseeId: userId },
        ],
      },
    });
    return { removed: true };
  }

  static async blockUser(blockerId: string, targetUserId: string) {
    if (blockerId === targetUserId) {
      throw { statusCode: 400, message: 'You cannot block yourself.' };
    }
    await prisma.$transaction(async (tx) => {
      await tx.friendship.deleteMany({
        where: {
          OR: [
            { requesterId: blockerId, addresseeId: targetUserId },
            { requesterId: targetUserId, addresseeId: blockerId },
          ],
        },
      });
      await tx.gameInvite.updateMany({
        where: {
          status: 'PENDING',
          OR: [
            { senderId: blockerId, recipientId: targetUserId },
            { senderId: targetUserId, recipientId: blockerId },
          ],
        },
        data: { status: 'DECLINED' },
      });
      await tx.userBlock.upsert({
        where: { blockerId_blockedId: { blockerId, blockedId: targetUserId } },
        update: {},
        create: { blockerId, blockedId: targetUserId },
      });
    });
    return { blocked: true };
  }

  static async unblockUser(blockerId: string, targetUserId: string) {
    await prisma.userBlock.deleteMany({
      where: { blockerId, blockedId: targetUserId },
    });
    return { unblocked: true };
  }

  static async reportUser(
    reporterId: string,
    reportedUserId: string,
    reason: string,
    details?: string
  ) {
    if (reporterId === reportedUserId) {
      throw { statusCode: 400, message: 'You cannot report your own account.' };
    }
    const cleanReason = reason.trim();
    if (!cleanReason) throw { statusCode: 400, message: 'Report reason is required.' };

    const report = await prisma.userReport.create({
      data: {
        reporterId,
        reportedUserId,
        reason: cleanReason,
        details: details?.trim() || null,
      },
    });
    return report;
  }

  /**
   * Sends a live 1v1 Multiplayer Game Invite (creates a private room automatically if none specified)
   */
  static async sendGameInvite(
    senderId: string,
    input: {
      recipientId: string;
      gameType: 'LETTI_PVP' | 'DAMA_PVP' | 'CHESS_PVP' | 'LUDO_PVP';
      stakeEtb: number;
      roomCode?: string;
    }
  ) {
    if (senderId === input.recipientId) {
      throw { statusCode: 400, message: 'Cannot invite yourself to a match.' };
    }
    if (await this.isBlockedBetween(senderId, input.recipientId)) {
      throw { statusCode: 403, message: 'Cannot send a game invite to this user.' };
    }

    const stakeEtb = input.gameType === 'CHESS_PVP' ? 0 : Math.max(Number(input.stakeEtb) || 0, 0);
    let roomCode = input.roomCode?.trim().toUpperCase() || '';

    if (input.gameType === 'LETTI_PVP') {
      if (!roomCode) {
        const room = await LettiMatchService.createRoom(senderId, Math.max(stakeEtb, 10), 'PRIVATE');
        roomCode = room.roomCode;
      }
    } else if (input.gameType === 'DAMA_PVP') {
      if (!roomCode) {
        const challenge = await MatchService.createChallenge(
          senderId,
          BigInt(Math.round(Math.max(stakeEtb, 10) * 100)),
          true
        );
        roomCode = challenge.inviteCode || challenge.id;
      }
    } else if (input.gameType === 'CHESS_PVP') {
      if (!roomCode) {
        const room = await ChessMatchService.createRoom(senderId, {
          timeControl: 'BLITZ_5_0',
          isRanked: true,
          roomType: 'PRIVATE',
        });
        roomCode = room.roomCode;
      }
    } else if (input.gameType === 'LUDO_PVP') {
      if (!roomCode) {
        const room = await LudoMatchService.createRoom(senderId, {
          playerCount: 2,
          stakeEtb: 0,
          roomType: 'PRIVATE',
        });
        roomCode = room.roomCode;
      }
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const invite = await prisma.gameInvite.create({
      data: {
        senderId,
        recipientId: input.recipientId,
        gameType: input.gameType,
        roomCode,
        stakeEtb,
        expiresAt,
      },
    });

    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { username: true },
    });

    emitToUser(input.recipientId, 'social:game-invite', {
      id: invite.id,
      senderId,
      senderUsername: sender?.username || 'Player',
      gameType: invite.gameType,
      roomCode: invite.roomCode,
      stakeEtb: invite.stakeEtb,
      expiresAt: invite.expiresAt.toISOString(),
    });

    return {
      invite,
      redirectPath:
        invite.gameType === 'LETTI_PVP'
          ? `/games/letti?room=${encodeURIComponent(invite.roomCode)}`
          : invite.gameType === 'CHESS_PVP'
          ? `/games/chess?room=${encodeURIComponent(invite.roomCode)}`
          : invite.gameType === 'LUDO_PVP'
          ? `/games/ludo?room=${encodeURIComponent(invite.roomCode)}`
          : `/games/dama`,
    };
  }

  static async respondGameInvite(
    userId: string,
    inviteId: string,
    action: 'ACCEPT' | 'DECLINE'
  ) {
    const invite = await prisma.gameInvite.findUnique({ where: { id: inviteId } });
    if (!invite) throw { statusCode: 404, message: 'Game invite not found.' };
    if (invite.recipientId !== userId) {
      throw { statusCode: 403, message: 'Not authorized to respond to this invite.' };
    }
    if (invite.status !== 'PENDING') {
      throw { statusCode: 409, message: `Invite is already ${invite.status}.` };
    }
    if (invite.expiresAt < new Date()) {
      await prisma.gameInvite.update({ where: { id: inviteId }, data: { status: 'EXPIRED' } });
      throw { statusCode: 410, message: 'This game invite has expired.' };
    }

    const updated = await prisma.gameInvite.update({
      where: { id: inviteId },
      data: { status: action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED' },
    });

    emitToUser(invite.senderId, 'social:game-invite-response', {
      inviteId: invite.id,
      status: updated.status,
      byUserId: userId,
    });

    return {
      invite: updated,
      redirectPath:
        action === 'ACCEPT'
          ? invite.gameType === 'LETTI_PVP'
            ? `/games/letti?room=${encodeURIComponent(invite.roomCode)}`
            : invite.gameType === 'CHESS_PVP'
            ? `/games/chess?room=${encodeURIComponent(invite.roomCode)}`
            : invite.gameType === 'LUDO_PVP'
            ? `/games/ludo?room=${encodeURIComponent(invite.roomCode)}`
            : `/games/dama`
          : null,
    };
  }
}
