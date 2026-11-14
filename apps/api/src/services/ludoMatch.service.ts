import crypto from 'crypto';
import {
  LUDO_SEAT_COLOR_ORDER,
  LudoMatchState,
  LudoPlayerCount,
  applyLudoMissedTurn,
  applyLudoMove,
  applyLudoRoll,
  createLudoMatchState,
  forfeitLudoPlayer,
  getLegalLudoMoves,
} from '@nova/game-ludo';
import { ProvablyFair } from '@nova/fairness';
import { WalletServiceLogic } from '@nova/wallet';
import { prisma } from '../config/database.js';
import { LedgerService } from './ledger.service.js';
import { EngagementService } from './engagement.service.js';
import { emitWalletUpdate } from '../websocket/socket.js';

function generateRoomCode(): string {
  return `LD-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

export class LudoMatchService {
  static async getConfig(tx: any = prisma) {
    let cfg = await tx.ludoConfig.findUnique({ where: { id: 'default' } });
    if (!cfg) {
      cfg = await tx.ludoConfig.create({
        data: {
          id: 'default',
          enabled: true,
          realMoneyEnabled: false,
          quickMatchEnabled: true,
          privateRoomsEnabled: true,
          aiEnabled: true,
          minStakeSantim: 1000,
          maxStakeSantim: 500000,
          platformFeeBps: 500,
          turnTimeoutSeconds: 30,
          moveWindowSeconds: 12,
          reconnectGraceSeconds: 45,
          maxMissedTurns: 3,
          allowBonusBalance: false,
        },
      });
    }
    return {
      ...cfg,
      minStakeEtb: WalletServiceLogic.santimToEtb(cfg.minStakeSantim),
      maxStakeEtb: WalletServiceLogic.santimToEtb(cfg.maxStakeSantim),
      platformFeePercent: cfg.platformFeeBps / 100,
    };
  }

  private static async enforceJoinRules(
    playerCount: number,
    stakeSantim: number,
    isQuickMatch: boolean
  ) {
    const cfg = await this.getConfig();
    if (!cfg.enabled) {
      throw { statusCode: 503, message: 'NOVA Ludo is currently disabled by administration.' };
    }
    if (isQuickMatch && !cfg.quickMatchEnabled) {
      throw { statusCode: 403, message: 'Ludo Quick Match is currently disabled.' };
    }
    if (!isQuickMatch && !cfg.privateRoomsEnabled) {
      throw { statusCode: 403, message: 'Private Ludo rooms are currently disabled.' };
    }
    if (![2, 3, 4].includes(playerCount)) {
      throw { statusCode: 400, message: 'Player count must be 2, 3, or 4.' };
    }
    if (stakeSantim > 0) {
      if (!cfg.realMoneyEnabled) {
        throw {
          statusCode: 403,
          message:
            'Real-money Ludo matches are disabled until regulatory approval. Play 0 ETB Friendly or Free AI Practice.',
        };
      }
      if (stakeSantim < cfg.minStakeSantim || stakeSantim > cfg.maxStakeSantim) {
        throw {
          statusCode: 400,
          message: `Stake must be between ${cfg.minStakeEtb} and ${cfg.maxStakeEtb} ETB (or 0 ETB Friendly).`,
        };
      }
    }
    return cfg;
  }

  static async listLobby() {
    const [cfg, rooms] = await Promise.all([
      this.getConfig(),
      prisma.ludoRoom.findMany({
        where: { status: 'WAITING' },
        include: { players: { orderBy: { seat: 'asc' } } },
        orderBy: { createdAt: 'desc' },
        take: 25,
      }),
    ]);

    const userIds = Array.from(
      new Set(rooms.flatMap((r) => [r.hostId, ...r.players.map((p) => p.userId)]))
    );
    const users =
      userIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, username: true },
          })
        : [];
    const uMap = new Map(users.map((u) => [u.id, u.username]));

    return {
      config: cfg,
      rooms: rooms.map((r) => ({
        roomId: r.id,
        roomCode: r.roomCode,
        roomType: r.roomType,
        playerCount: r.playerCount,
        joinedCount: r.players.length,
        stakeEtb: WalletServiceLogic.santimToEtb(r.stakeSantim),
        hostUsername: uMap.get(r.hostId) || 'Host',
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  static async getActiveRoomForUser(userId: string) {
    const activePlayer = await prisma.ludoPlayer.findFirst({
      where: {
        userId,
        forfeited: false,
        room: { status: { in: ['WAITING', 'PLAYING'] } },
      },
      include: { room: true },
      orderBy: { joinedAt: 'desc' },
    });
    if (!activePlayer) return null;
    return this.getRoomView(activePlayer.roomId, userId);
  }

  static async getUserHistory(userId: string) {
    const memberships = await prisma.ludoPlayer.findMany({
      where: { userId, room: { status: { in: ['COMPLETED', 'CANCELLED'] } } },
      include: { room: { include: { match: true } } },
      orderBy: { joinedAt: 'desc' },
      take: 30,
    });

    const winnerIds = Array.from(
      new Set(
        memberships
          .map((m) => m.room.match?.winnerId)
          .filter((id): id is string => Boolean(id && id !== 'nova-ludo-ai'))
      )
    );
    const winners =
      winnerIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: winnerIds } },
            select: { id: true, username: true },
          })
        : [];
    const wMap = new Map(winners.map((u) => [u.id, u.username]));

    return memberships.map((m) => {
      const match = m.room.match;
      const outcome =
        m.room.status === 'CANCELLED'
          ? 'CANCELLED'
          : match?.winnerId === userId
          ? 'WIN'
          : match?.winnerId
          ? 'LOSS'
          : 'DRAW';
      return {
        roomId: m.roomId,
        matchId: match?.id || null,
        roomCode: m.room.roomCode,
        roomType: m.room.roomType,
        playerCount: m.room.playerCount,
        myColor: m.color,
        stakeEtb: WalletServiceLogic.santimToEtb(m.room.stakeSantim),
        payoutEtb:
          match?.winnerId === userId
            ? WalletServiceLogic.santimToEtb(match.payoutSantim)
            : 0,
        outcome,
        winnerUsername: match?.winnerId ? wMap.get(match.winnerId) || 'Winner' : null,
        completedAt: (m.room.completedAt || m.joinedAt).toISOString(),
      };
    });
  }

  static async createRoom(
    userId: string,
    opts: {
      playerCount?: number;
      stakeEtb?: number;
      roomType?: 'PRIVATE' | 'QUICK_MATCH';
      clientSeed?: string;
    }
  ) {
    const playerCount = (opts.playerCount || 2) as LudoPlayerCount;
    const stakeSantim = Math.max(0, Math.round((Number(opts.stakeEtb) || 0) * 100));
    const roomType = opts.roomType || 'PRIVATE';

    await this.enforceJoinRules(playerCount, stakeSantim, roomType === 'QUICK_MATCH');

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw { statusCode: 404, message: 'User not found.' };

    let roomCode = generateRoomCode();
    while (await prisma.ludoRoom.findUnique({ where: { roomCode } })) {
      roomCode = generateRoomCode();
    }

    const color = LUDO_SEAT_COLOR_ORDER[playerCount][0];
    const seed = (opts.clientSeed || '').trim().slice(0, 64) || ProvablyFair.generateClientSeed();

    const room = await prisma.$transaction(async (tx) => {
      const created = await tx.ludoRoom.create({
        data: {
          roomCode,
          roomType,
          playerCount,
          status: 'WAITING',
          stakeSantim,
          hostId: userId,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      let stakeLocked = false;
      if (stakeSantim > 0) {
        const res = await LedgerService.lockStake(
          `ludo-room:${created.id}`,
          userId,
          stakeSantim,
          tx
        );
        stakeLocked = true;
        emitWalletUpdate(userId, {
          balance: Number(res.balanceAfter) / 100,
          type: 'STAKE_LOCK',
          status: 'COMPLETED',
          amount: -stakeSantim / 100,
          message: `Ludo room ${roomCode} entry locked`,
        });
      }

      await tx.ludoPlayer.create({
        data: {
          roomId: created.id,
          userId,
          seat: 1,
          color,
          clientSeed: seed,
          stakeLocked,
          connectionStatus: 'CONNECTED',
        },
      });

      return created;
    });

    return this.getRoomView(room.id, userId);
  }

  static async quickMatch(
    userId: string,
    opts: { playerCount?: number; stakeEtb?: number; clientSeed?: string }
  ) {
    const playerCount = (opts.playerCount || 2) as LudoPlayerCount;
    const stakeSantim = Math.max(0, Math.round((Number(opts.stakeEtb) || 0) * 100));
    await this.enforceJoinRules(playerCount, stakeSantim, true);

    const candidates = await prisma.ludoRoom.findMany({
      where: {
        status: 'WAITING',
        roomType: 'QUICK_MATCH',
        playerCount,
        stakeSantim,
      },
      include: { players: true },
      orderBy: { createdAt: 'asc' },
      take: 5,
    });

    for (const c of candidates) {
      if (c.players.some((p) => p.userId === userId)) {
        return this.getRoomView(c.id, userId);
      }
      if (c.players.length < c.playerCount) {
        try {
          return await this.joinRoom(userId, c.id, opts.clientSeed);
        } catch (err: any) {
          if (err?.statusCode === 409) continue;
          throw err;
        }
      }
    }

    return this.createRoom(userId, {
      playerCount,
      stakeEtb: opts.stakeEtb,
      roomType: 'QUICK_MATCH',
      clientSeed: opts.clientSeed,
    });
  }

  static async joinRoom(userId: string, codeOrId: string, clientSeed?: string) {
    const clean = codeOrId.trim();
    const room = await prisma.ludoRoom.findFirst({
      where: { OR: [{ id: clean }, { roomCode: clean.toUpperCase() }] },
      include: { players: { orderBy: { seat: 'asc' } }, match: true },
    });
    if (!room) throw { statusCode: 404, message: 'Ludo room not found.' };

    if (room.players.some((p) => p.userId === userId)) {
      return this.getRoomView(room.id, userId);
    }

    if (room.status !== 'WAITING') {
      throw { statusCode: 409, message: `Ludo room is ${room.status}.` };
    }

    const cfg = await this.enforceJoinRules(
      room.playerCount,
      room.stakeSantim,
      room.roomType === 'QUICK_MATCH'
    );

    // Block check between players (never allow explicitly blocked users in same table)
    const existingIds = room.players.map((p) => p.userId);
    if (existingIds.length > 0) {
      const blocked = await prisma.userBlock.findFirst({
        where: {
          OR: [
            { blockerId: userId, blockedId: { in: existingIds } },
            { blockerId: { in: existingIds }, blockedId: userId },
          ],
        },
      });
      if (blocked) {
        throw { statusCode: 403, message: 'Cannot join table due to user block settings.' };
      }

      // Soft shared-signal collusion warning flag ONLY (no auto IP ban)
      const [joiningUser, hostUser] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { registrationIpHash: true, deviceFingerprint: true },
        }),
        prisma.user.findUnique({
          where: { id: room.hostId },
          select: { registrationIpHash: true, deviceFingerprint: true },
        }),
      ]);
      if (
        joiningUser &&
        hostUser &&
        ((joiningUser.registrationIpHash &&
          joiningUser.registrationIpHash === hostUser.registrationIpHash) ||
          (joiningUser.deviceFingerprint &&
            joiningUser.deviceFingerprint === hostUser.deviceFingerprint))
      ) {
        await prisma.abuseFlag
          .create({
            data: {
              userId,
              type: 'REPEAT_PAIRING',
              details: JSON.stringify({
                game: 'LUDO',
                roomId: room.id,
                sharedNetworkOrDeviceWith: room.hostId,
                note: 'Soft fraud signal for admin review only (non-blocking).',
              }),
            },
          })
          .catch(() => {});
      }
    }

    const seed = (clientSeed || '').trim().slice(0, 64) || ProvablyFair.generateClientSeed();

    await prisma.$transaction(async (tx) => {
      const freshPlayers = await tx.ludoPlayer.findMany({
        where: { roomId: room.id },
        orderBy: { seat: 'asc' },
      });
      if (freshPlayers.length >= room.playerCount) {
        throw { statusCode: 409, message: 'Ludo room is already full.' };
      }
      const takenSeats = new Set(freshPlayers.map((p) => p.seat));
      let seat = 1;
      while (takenSeats.has(seat) && seat <= room.playerCount) seat++;
      if (seat > room.playerCount) {
        throw { statusCode: 409, message: 'No seat available in Ludo room.' };
      }

      const color = LUDO_SEAT_COLOR_ORDER[room.playerCount as LudoPlayerCount][seat - 1];
      let stakeLocked = false;
      if (room.stakeSantim > 0) {
        const res = await LedgerService.lockStake(
          `ludo-room:${room.id}`,
          userId,
          room.stakeSantim,
          tx
        );
        stakeLocked = true;
        emitWalletUpdate(userId, {
          balance: Number(res.balanceAfter) / 100,
          type: 'STAKE_LOCK',
          status: 'COMPLETED',
          amount: -room.stakeSantim / 100,
          message: `Ludo room ${room.roomCode} entry locked`,
        });
      }

      await tx.ludoPlayer.create({
        data: {
          roomId: room.id,
          userId,
          seat,
          color,
          clientSeed: seed,
          stakeLocked,
          connectionStatus: 'CONNECTED',
        },
      });

      const allPlayers = await tx.ludoPlayer.findMany({
        where: { roomId: room.id },
        orderBy: { seat: 'asc' },
      });

      if (allPlayers.length === room.playerCount) {
        const users = await tx.user.findMany({
          where: { id: { in: allPlayers.map((p) => p.userId) } },
          select: { id: true, username: true },
        });
        const uMap = new Map(users.map((u) => [u.id, u.username]));

        const matchId = crypto.randomUUID();
        const serverSeed = ProvablyFair.generateServerSeed();
        const serverSeedHash = ProvablyFair.hashServerSeed(serverSeed);
        const combinedClientSeed = ProvablyFair.hashServerSeed(
          `${allPlayers.map((p) => p.clientSeed).join(':')}:${matchId}`
        );

        const initialState = createLudoMatchState(
          allPlayers.map((p) => ({
            userId: p.userId,
            username: uMap.get(p.userId) || `Seat ${p.seat}`,
          })),
          1
        );

        const totalPotSantim = room.stakeSantim * room.playerCount;
        const platformFeeSantim =
          totalPotSantim > 0 ? Math.floor((totalPotSantim * cfg.platformFeeBps) / 10000) : 0;
        const payoutSantim = totalPotSantim - platformFeeSantim;

        await tx.ludoRoom.update({
          where: { id: room.id },
          data: { status: 'PLAYING', startedAt: new Date() },
        });

        await tx.ludoMatch.create({
          data: {
            id: matchId,
            roomId: room.id,
            status: 'ACTIVE',
            rulesetVersion: 'NOVA_CLASSIC_V1',
            fairnessVersion: 'LUDO_HMAC_V1',
            serverSeed,
            serverSeedHash,
            combinedClientSeed,
            nonce: 0,
            turnSeat: 1,
            turnPhase: 'ROLL',
            turnDeadlineAt: new Date(Date.now() + cfg.turnTimeoutSeconds * 1000),
            gameStateJson: JSON.stringify(initialState),
            totalPotSantim,
            platformFeeSantim,
            payoutSantim,
          },
        });
      }
    });

    return this.getRoomView(room.id, userId);
  }

  static async updateClientSeed(roomId: string, userId: string, newSeed: string) {
    const match = await prisma.ludoMatch.findUnique({ where: { roomId } });
    if (match && match.nonce > 0) {
      throw { statusCode: 409, message: 'Client seeds lock permanently once Roll #1 begins.' };
    }
    const cleanSeed = newSeed.trim().slice(0, 64);
    if (!cleanSeed) throw { statusCode: 400, message: 'Invalid client seed.' };

    await prisma.ludoPlayer.updateMany({
      where: { roomId, userId },
      data: { clientSeed: cleanSeed },
    });
    return this.getRoomView(roomId, userId);
  }

  static async leaveRoom(roomId: string, userId: string) {
    const room = await prisma.ludoRoom.findUnique({
      where: { id: roomId },
      include: { players: true, match: true },
    });
    if (!room) throw { statusCode: 404, message: 'Ludo room not found.' };

    if (room.status === 'WAITING') {
      await prisma.$transaction(async (tx) => {
        const player = room.players.find((p) => p.userId === userId);
        if (!player) return;

        if (room.hostId === userId) {
          await tx.ludoRoom.update({
            where: { id: roomId },
            data: { status: 'CANCELLED', completedAt: new Date() },
          });
          for (const p of room.players) {
            if (p.stakeLocked && room.stakeSantim > 0) {
              const res = await LedgerService.refundStake(
                `ludo-room:${roomId}`,
                p.userId,
                room.stakeSantim,
                'HOST_CANCELLED_LOBBY',
                tx
              );
              emitWalletUpdate(p.userId, {
                balance: Number(res.balanceAfter) / 100,
                type: 'STAKE_REFUND',
                status: 'COMPLETED',
                amount: room.stakeSantim / 100,
                message: `Ludo lobby ${room.roomCode} cancelled & refunded`,
              });
            }
          }
        } else {
          if (player.stakeLocked && room.stakeSantim > 0) {
            const res = await LedgerService.refundStake(
              `ludo-room:${roomId}`,
              userId,
              room.stakeSantim,
              'PLAYER_LEFT_LOBBY',
              tx
            );
            emitWalletUpdate(userId, {
              balance: Number(res.balanceAfter) / 100,
              type: 'STAKE_REFUND',
              status: 'COMPLETED',
              amount: room.stakeSantim / 100,
              message: `Left Ludo lobby ${room.roomCode}`,
            });
          }
          await tx.ludoPlayer.delete({ where: { id: player.id } });
        }
      });
      return { ok: true, roomId };
    }

    if (room.match && room.match.status === 'ACTIVE') {
      return this.forfeitPlayer(room.match.id, userId);
    }

    return { ok: true, roomId };
  }

  private static async settleMatchInTx(
    tx: any,
    match: any,
    winnerId: string,
    winnerColor: string,
    nextState: LudoMatchState
  ) {
    const claimed = await tx.ludoMatch.updateMany({
      where: { id: match.id, status: 'ACTIVE', settled: false },
      data: {
        status: 'COMPLETED',
        settled: true,
        turnPhase: 'FINISHED',
        turnDeadlineAt: null,
        turnPausedRemainMs: null,
        winnerId,
        winnerColor,
        gameStateJson: JSON.stringify(nextState),
        completedAt: new Date(),
      },
    });
    if (claimed.count === 0) return;

    await tx.ludoRoom.update({
      where: { id: match.roomId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    if (match.payoutSantim > 0) {
      const res = await LedgerService.settlePayout(
        `ludo-match:${match.id}`,
        winnerId,
        match.payoutSantim,
        match.platformFeeSantim,
        tx
      );
      emitWalletUpdate(winnerId, {
        balance: Number(res.balanceAfter) / 100,
        type: 'MATCH_PAYOUT',
        status: 'COMPLETED',
        amount: match.payoutSantim / 100,
        message: `Won Ludo Match (+${(match.payoutSantim / 100).toFixed(2)} ETB)`,
      });
    }
  }

  static async rollDice(
    matchId: string,
    userId: string,
    opts?: { idempotencyKey?: string; isAutoRoll?: boolean }
  ) {
    if (opts?.idempotencyKey) {
      const existing = await prisma.ludoAction.findUnique({
        where: { idempotencyKey: opts.idempotencyKey },
        include: { match: true },
      });
      if (existing) {
        return this.getRoomView(existing.match.roomId, userId);
      }
    }

    const match = await prisma.ludoMatch.findUnique({
      where: { id: matchId },
      include: { room: { include: { players: true } } },
    });
    if (!match) throw { statusCode: 404, message: 'Ludo match not found.' };
    if (match.status !== 'ACTIVE') throw { statusCode: 409, message: 'Match is not active.' };

    const activePlayer = match.room.players.find((p) => p.seat === match.turnSeat);
    if (!activePlayer || activePlayer.userId !== userId) {
      throw { statusCode: 403, message: 'Not your turn to roll.' };
    }
    if (match.turnPhase !== 'ROLL') {
      throw { statusCode: 409, message: 'Dice already rolled; select a token to move.' };
    }

    const cfg = await this.getConfig();
    const state: LudoMatchState = JSON.parse(match.gameStateJson);
    const nextNonce = match.nonce + 1;
    const rollOutcome = ProvablyFair.generateLudoDice(
      match.serverSeed,
      match.combinedClientSeed,
      nextNonce
    );

    const applied = applyLudoRoll(state, rollOutcome.dice);
    const nextDeadline = applied.autoPassed
      ? new Date(Date.now() + cfg.turnTimeoutSeconds * 1000)
      : new Date(Date.now() + cfg.moveWindowSeconds * 1000);

    await prisma.$transaction(async (tx) => {
      const actionCount = await tx.ludoAction.count({ where: { matchId } });
      await tx.ludoAction.create({
        data: {
          matchId,
          sequenceNumber: actionCount + 1,
          userId,
          seat: activePlayer.seat,
          actionType: opts?.isAutoRoll ? 'AUTO_ROLL' : 'ROLL',
          diceValue: rollOutcome.dice,
          nonce: nextNonce,
          idempotencyKey: opts?.idempotencyKey || null,
        },
      });

      await tx.ludoMatch.update({
        where: { id: matchId },
        data: {
          nonce: nextNonce,
          turnSeat: applied.nextState.currentTurnSeat,
          turnPhase: applied.nextState.turnPhase,
          diceValue: applied.nextState.currentDice,
          consecutiveSixes: applied.nextState.consecutiveSixes,
          turnDeadlineAt: nextDeadline,
          turnPausedRemainMs: null,
          gameStateJson: JSON.stringify(applied.nextState),
        },
      });
    });

    return this.getRoomView(match.roomId, userId);
  }

  static async moveToken(
    matchId: string,
    userId: string,
    opts: { tokenIndex: number; idempotencyKey?: string }
  ) {
    if (opts.idempotencyKey) {
      const existing = await prisma.ludoAction.findUnique({
        where: { idempotencyKey: opts.idempotencyKey },
        include: { match: true },
      });
      if (existing) {
        return this.getRoomView(existing.match.roomId, userId);
      }
    }

    const match = await prisma.ludoMatch.findUnique({
      where: { id: matchId },
      include: { room: { include: { players: true } } },
    });
    if (!match) throw { statusCode: 404, message: 'Ludo match not found.' };
    if (match.status !== 'ACTIVE') throw { statusCode: 409, message: 'Match is not active.' };

    const activePlayer = match.room.players.find((p) => p.seat === match.turnSeat);
    if (!activePlayer || activePlayer.userId !== userId) {
      throw { statusCode: 403, message: 'Not your turn to move.' };
    }
    if (match.turnPhase !== 'MOVE') {
      throw { statusCode: 409, message: 'Roll the dice first.' };
    }

    const cfg = await this.getConfig();
    const state: LudoMatchState = JSON.parse(match.gameStateJson);
    let applied;
    try {
      applied = applyLudoMove(state, opts.tokenIndex);
    } catch (err: any) {
      throw { statusCode: 400, message: err?.message || 'Illegal Ludo move.' };
    }

    await prisma.$transaction(async (tx) => {
      const actionCount = await tx.ludoAction.count({ where: { matchId } });
      await tx.ludoAction.create({
        data: {
          matchId,
          sequenceNumber: actionCount + 1,
          userId,
          seat: activePlayer.seat,
          actionType: 'MOVE',
          diceValue: applied.move.dice,
          tokenIndex: applied.move.tokenIndex,
          fromProgress: applied.move.fromProgress,
          toProgress: applied.move.toProgress,
          capturedTokensJson: JSON.stringify(applied.move.captured),
          idempotencyKey: opts.idempotencyKey || null,
        },
      });

      await tx.ludoPlayer.update({
        where: { id: activePlayer.id },
        data: { missedTurns: 0 },
      });

      if (applied.gameEnded) {
        await this.settleMatchInTx(
          tx,
          match,
          activePlayer.userId,
          activePlayer.color,
          applied.nextState
        );
      } else {
        await tx.ludoMatch.update({
          where: { id: matchId },
          data: {
            turnSeat: applied.nextState.currentTurnSeat,
            turnPhase: applied.nextState.turnPhase,
            diceValue: applied.nextState.currentDice,
            consecutiveSixes: applied.nextState.consecutiveSixes,
            turnDeadlineAt: new Date(Date.now() + cfg.turnTimeoutSeconds * 1000),
            gameStateJson: JSON.stringify(applied.nextState),
          },
        });
      }
    });

    if (applied.gameEnded) {
      await EngagementService.evaluateAndSyncAchievements(activePlayer.userId).catch(() => {});
    }

    return this.getRoomView(match.roomId, userId);
  }

  /**
   * Transparent Non-Strategic Turn Timeout:
   * - In ROLL phase -> auto-rolls via LUDO_HMAC_V1
   * - In MOVE phase -> records missedTurn (NEVER silently chooses a strategic token)
   */
  static async handleTurnTimeout(matchId: string) {
    const match = await prisma.ludoMatch.findUnique({
      where: { id: matchId },
      include: { room: { include: { players: true } } },
    });
    if (!match || match.status !== 'ACTIVE') return null;

    // Respect paused turn timer when disconnected player is inside 45s reconnect grace
    if (match.turnPausedRemainMs !== null) return null;
    if (!match.turnDeadlineAt || match.turnDeadlineAt > new Date()) return null;

    const activePlayer = match.room.players.find((p) => p.seat === match.turnSeat);
    if (!activePlayer) return null;

    if (match.turnPhase === 'ROLL') {
      return this.rollDice(matchId, activePlayer.userId, { isAutoRoll: true });
    }

    const cfg = await this.getConfig();
    const state: LudoMatchState = JSON.parse(match.gameStateJson);
    const res = applyLudoMissedTurn(state, cfg.maxMissedTurns);

    await prisma.$transaction(async (tx) => {
      const actionCount = await tx.ludoAction.count({ where: { matchId } });
      await tx.ludoAction.create({
        data: {
          matchId,
          sequenceNumber: actionCount + 1,
          userId: activePlayer.userId,
          seat: activePlayer.seat,
          actionType: res.forfeited ? 'FORFEIT' : 'MISSED_TURN',
        },
      });

      await tx.ludoPlayer.update({
        where: { id: activePlayer.id },
        data: {
          missedTurns: { increment: 1 },
          forfeited: res.forfeited,
        },
      });

      if (res.gameEnded && res.nextState.winnerSeat) {
        const winnerP = match.room.players.find((p) => p.seat === res.nextState.winnerSeat);
        if (winnerP) {
          await this.settleMatchInTx(tx, match, winnerP.userId, winnerP.color, res.nextState);
        }
      } else {
        await tx.ludoMatch.update({
          where: { id: matchId },
          data: {
            turnSeat: res.nextState.currentTurnSeat,
            turnPhase: res.nextState.turnPhase,
            diceValue: null,
            consecutiveSixes: 0,
            turnDeadlineAt: new Date(Date.now() + cfg.turnTimeoutSeconds * 1000),
            gameStateJson: JSON.stringify(res.nextState),
          },
        });
      }
    });

    return this.getRoomView(match.roomId);
  }

  static async forfeitPlayer(matchId: string, userId: string) {
    const match = await prisma.ludoMatch.findUnique({
      where: { id: matchId },
      include: { room: { include: { players: true } } },
    });
    if (!match) throw { statusCode: 404, message: 'Ludo match not found.' };
    const player = match.room.players.find((p) => p.userId === userId);
    if (!player) throw { statusCode: 403, message: 'Not a participant.' };
    if (match.status !== 'ACTIVE' || player.forfeited) {
      return this.getRoomView(match.roomId, userId);
    }

    const cfg = await this.getConfig();
    const state: LudoMatchState = JSON.parse(match.gameStateJson);
    const res = forfeitLudoPlayer(state, player.seat);

    await prisma.$transaction(async (tx) => {
      const actionCount = await tx.ludoAction.count({ where: { matchId } });
      await tx.ludoAction.create({
        data: {
          matchId,
          sequenceNumber: actionCount + 1,
          userId,
          seat: player.seat,
          actionType: 'FORFEIT',
        },
      });

      await tx.ludoPlayer.update({
        where: { id: player.id },
        data: { forfeited: true },
      });

      if (res.gameEnded && res.nextState.winnerSeat) {
        const winnerP = match.room.players.find((p) => p.seat === res.nextState.winnerSeat);
        if (winnerP) {
          await this.settleMatchInTx(tx, match, winnerP.userId, winnerP.color, res.nextState);
        }
      } else {
        await tx.ludoMatch.update({
          where: { id: matchId },
          data: {
            turnSeat: res.nextState.currentTurnSeat,
            turnPhase: res.nextState.turnPhase,
            diceValue: res.nextState.currentDice,
            consecutiveSixes: res.nextState.consecutiveSixes,
            turnDeadlineAt: new Date(Date.now() + cfg.turnTimeoutSeconds * 1000),
            gameStateJson: JSON.stringify(res.nextState),
          },
        });
      }
    });

    return this.getRoomView(match.roomId, userId);
  }

  /**
   * Resolves 30s turn clock vs 45s reconnect grace:
   * Disconnecting pauses active player's turnRemainingMs; reconnecting restores it (>=10s floor).
   */
  static async updateConnectionStatus(
    roomId: string,
    userId: string,
    status: 'CONNECTED' | 'DISCONNECTED'
  ) {
    const room = await prisma.ludoRoom.findUnique({
      where: { id: roomId },
      include: { players: true, match: true },
    });
    if (!room) return;
    const player = room.players.find((p) => p.userId === userId);
    if (!player) return;

    await prisma.ludoPlayer.update({
      where: { id: player.id },
      data: {
        connectionStatus: status,
        disconnectedAt: status === 'DISCONNECTED' ? new Date() : null,
        disconnectCount: status === 'DISCONNECTED' ? { increment: 1 } : undefined,
      },
    });

    if (room.match && room.match.status === 'ACTIVE' && room.match.turnSeat === player.seat) {
      if (status === 'DISCONNECTED' && room.match.turnDeadlineAt) {
        const remainMs = Math.max(10_000, room.match.turnDeadlineAt.getTime() - Date.now());
        await prisma.ludoMatch.update({
          where: { id: room.match.id },
          data: { turnDeadlineAt: null, turnPausedRemainMs: remainMs },
        });
      } else if (status === 'CONNECTED' && room.match.turnPausedRemainMs !== null) {
        const resumeMs = Math.max(10_000, room.match.turnPausedRemainMs);
        await prisma.ludoMatch.update({
          where: { id: room.match.id },
          data: {
            turnDeadlineAt: new Date(Date.now() + resumeMs),
            turnPausedRemainMs: null,
          },
        });
      }
    }
  }

  static async verifyMatchRolls(matchId: string) {
    const match = await prisma.ludoMatch.findUnique({
      where: { id: matchId },
      include: { actions: { orderBy: { sequenceNumber: 'asc' } } },
    });
    if (!match) throw { statusCode: 404, message: 'Ludo match not found.' };

    const isCompleted = match.status === 'COMPLETED' || match.status === 'CANCELLED';
    const rolls = match.actions
      .filter((a) => (a.actionType === 'ROLL' || a.actionType === 'AUTO_ROLL') && a.nonce)
      .map((a) => {
        const verified = isCompleted
          ? ProvablyFair.verifyLudoRoll(
              match.serverSeed,
              match.serverSeedHash,
              match.combinedClientSeed,
              a.nonce!
            )
          : null;
        return {
          sequenceNumber: a.sequenceNumber,
          nonce: a.nonce,
          seat: a.seat,
          recordedDice: a.diceValue,
          verifiedDice: verified?.dice ?? null,
          matches: verified ? verified.dice === a.diceValue && verified.isValidHash : null,
        };
      });

    return {
      matchId: match.id,
      status: match.status,
      fairnessVersion: match.fairnessVersion,
      serverSeedHash: match.serverSeedHash,
      combinedClientSeed: match.combinedClientSeed,
      serverSeed: isCompleted ? match.serverSeed : null,
      rolls,
    };
  }

  static async recordAiMatch(userId: string, won: boolean) {
    await prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: won ? 20 : 8 } },
    });
    await EngagementService.evaluateAndSyncAchievements(userId).catch(() => {});
    return { recorded: true, won };
  }

  static async getRoomView(roomId: string, viewerUserId?: string) {
    const room = await prisma.ludoRoom.findUnique({
      where: { id: roomId },
      include: {
        players: { orderBy: { seat: 'asc' } },
        match: { include: { actions: { orderBy: { sequenceNumber: 'desc' }, take: 20 } } },
      },
    });
    if (!room) throw { statusCode: 404, message: 'Ludo room not found.' };

    const users = await prisma.user.findMany({
      where: { id: { in: room.players.map((p) => p.userId) } },
      select: { id: true, username: true },
    });
    const uMap = new Map(users.map((u) => [u.id, u.username]));

    const cfg = await this.getConfig();
    const match = room.match;
    const state: LudoMatchState | null = match ? JSON.parse(match.gameStateJson) : null;
    const legalMoves =
      state && state.turnPhase === 'MOVE' && state.currentDice !== null
        ? getLegalLudoMoves(state, state.currentDice)
        : [];

    const totalPotSantim = room.stakeSantim * room.playerCount;
    const platformFeeSantim =
      totalPotSantim > 0 ? Math.floor((totalPotSantim * cfg.platformFeeBps) / 10000) : 0;
    const payoutSantim = totalPotSantim - platformFeeSantim;

    return {
      roomId: room.id,
      roomCode: room.roomCode,
      roomType: room.roomType,
      status: room.status,
      playerCount: room.playerCount,
      hostId: room.hostId,
      stakeEtb: WalletServiceLogic.santimToEtb(room.stakeSantim),
      prizeBreakdown: {
        entryEtb: WalletServiceLogic.santimToEtb(room.stakeSantim),
        totalPotEtb: WalletServiceLogic.santimToEtb(totalPotSantim),
        feePercent: cfg.platformFeeBps / 100,
        platformFeeEtb: WalletServiceLogic.santimToEtb(platformFeeSantim),
        winnerReceivesEtb: WalletServiceLogic.santimToEtb(payoutSantim),
      },
      players: room.players.map((p) => ({
        userId: p.userId,
        username: uMap.get(p.userId) || `Seat ${p.seat}`,
        seat: p.seat,
        color: p.color,
        clientSeed: p.clientSeed,
        forfeited: p.forfeited,
        missedTurns: p.missedTurns,
        connectionStatus: p.connectionStatus,
      })),
      mySeat: room.players.find((p) => p.userId === viewerUserId)?.seat ?? null,
      match: match
        ? {
            matchId: match.id,
            status: match.status,
            rulesetVersion: match.rulesetVersion,
            fairnessVersion: match.fairnessVersion,
            serverSeedHash: match.serverSeedHash,
            combinedClientSeed: match.combinedClientSeed,
            serverSeed: match.status === 'COMPLETED' ? match.serverSeed : null,
            nonce: match.nonce,
            turnSeat: match.turnSeat,
            turnPhase: match.turnPhase,
            diceValue: match.diceValue,
            turnDeadlineAt: match.turnDeadlineAt?.toISOString() || null,
            turnPaused: match.turnPausedRemainMs !== null,
            winnerId: match.winnerId,
            winnerColor: match.winnerColor,
            state,
            legalMoves,
            recentActions: match.actions,
            serverNow: Date.now(),
          }
        : null,
    };
  }

  // ============================================================================
  // ADMIN OVERVIEW, CONFIG & ROOM MODERATION
  // ============================================================================

  static async getAdminOverview() {
    const [config, rooms, matches, flags, auditLogs] = await Promise.all([
      this.getConfig(),
      prisma.ludoRoom.findMany({
        orderBy: { createdAt: 'desc' },
        include: { players: true },
        take: 25,
      }),
      prisma.ludoMatch.findMany({
        orderBy: { createdAt: 'desc' },
        include: { room: true },
        take: 25,
      }),
      prisma.abuseFlag.findMany({
        where: { details: { contains: 'LUDO' } },
        orderBy: { createdAt: 'desc' },
        take: 25,
      }),
      prisma.adminAuditLog.findMany({
        where: { action: { startsWith: 'LUDO_' } },
        orderBy: { createdAt: 'desc' },
        take: 25,
      }),
    ]);

    return {
      config,
      stats: {
        totalRooms: rooms.length,
        activeMatchesCount: matches.filter((m) => m.status === 'ACTIVE').length,
        waitingRoomsCount: rooms.filter((r) => r.status === 'WAITING').length,
        flagsCount: flags.length,
      },
      rooms,
      matches,
      flags,
      auditLogs,
    };
  }

  static async updateAdminConfig(adminId: string, body: any) {
    const current = await this.getConfig();
    const updated = await prisma.$transaction(async (tx) => {
      const cfg = await tx.ludoConfig.update({
        where: { id: 'default' },
        data: {
          enabled: body.enabled !== undefined ? Boolean(body.enabled) : current.enabled,
          realMoneyEnabled:
            body.realMoneyEnabled !== undefined
              ? Boolean(body.realMoneyEnabled)
              : current.realMoneyEnabled,
          quickMatchEnabled:
            body.quickMatchEnabled !== undefined
              ? Boolean(body.quickMatchEnabled)
              : current.quickMatchEnabled,
          privateRoomsEnabled:
            body.privateRoomsEnabled !== undefined
              ? Boolean(body.privateRoomsEnabled)
              : current.privateRoomsEnabled,
          aiEnabled: body.aiEnabled !== undefined ? Boolean(body.aiEnabled) : current.aiEnabled,
          minStakeSantim:
            body.minStakeEtb !== undefined
              ? Math.round(Number(body.minStakeEtb) * 100)
              : current.minStakeSantim,
          maxStakeSantim:
            body.maxStakeEtb !== undefined
              ? Math.round(Number(body.maxStakeEtb) * 100)
              : current.maxStakeSantim,
          platformFeeBps:
            body.platformFeePercent !== undefined
              ? Math.round(Number(body.platformFeePercent) * 100)
              : current.platformFeeBps,
          turnTimeoutSeconds:
            body.turnTimeoutSeconds !== undefined
              ? Math.min(120, Math.max(10, Number(body.turnTimeoutSeconds)))
              : current.turnTimeoutSeconds,
          moveWindowSeconds:
            body.moveWindowSeconds !== undefined
              ? Math.min(60, Math.max(5, Number(body.moveWindowSeconds)))
              : current.moveWindowSeconds,
          reconnectGraceSeconds:
            body.reconnectGraceSeconds !== undefined
              ? Math.min(180, Math.max(15, Number(body.reconnectGraceSeconds)))
              : current.reconnectGraceSeconds,
        },
      });

      await tx.gameConfig.upsert({
        where: { gameId: 'ludo' },
        update: { enabled: cfg.enabled },
        create: {
          gameId: 'ludo',
          name: 'NOVA Ludo',
          houseEdgePercent: cfg.platformFeeBps / 100,
          minBet: 0,
          maxBet: cfg.maxStakeSantim / 100,
          enabled: cfg.enabled,
        },
      });

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: 'LUDO_CONFIG_UPDATED',
          targetId: 'default',
          details: JSON.stringify(cfg),
        },
      });

      return cfg;
    });
    return updated;
  }

  static async cancelAdminRoom(adminId: string, roomId: string, reason?: string) {
    const room = await prisma.ludoRoom.findUnique({
      where: { id: roomId },
      include: { players: true, match: true },
    });
    if (!room) throw { statusCode: 404, message: 'Ludo room not found.' };
    if (room.status === 'COMPLETED' || room.status === 'CANCELLED') {
      throw { statusCode: 409, message: `Room is already ${room.status}.` };
    }

    await prisma.$transaction(async (tx) => {
      await tx.ludoRoom.update({
        where: { id: roomId },
        data: { status: 'CANCELLED', completedAt: new Date() },
      });
      if (room.match && room.match.status === 'ACTIVE') {
        await tx.ludoMatch.update({
          where: { id: room.match.id },
          data: { status: 'CANCELLED', settled: true, completedAt: new Date() },
        });
      }
      for (const p of room.players) {
        if (p.stakeLocked && room.stakeSantim > 0) {
          const res = await LedgerService.refundStake(
            `ludo-room:${roomId}`,
            p.userId,
            room.stakeSantim,
            'ADMIN_CANCELLED_ROOM',
            tx
          );
          emitWalletUpdate(p.userId, {
            balance: Number(res.balanceAfter) / 100,
            type: 'STAKE_REFUND',
            status: 'COMPLETED',
            amount: room.stakeSantim / 100,
            message: `Admin refunded Ludo room ${room.roomCode}`,
          });
        }
      }
      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: 'LUDO_ROOM_CANCELLED',
          targetId: roomId,
          details: reason || 'Cancelled and refunded by admin',
        },
      });
    });

    return { cancelled: true, roomId };
  }
}
