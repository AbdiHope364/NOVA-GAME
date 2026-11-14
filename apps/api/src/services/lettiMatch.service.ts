import crypto from 'crypto';
import { LettiEngine } from '@nova/game-letti';
import { ProvablyFair } from '@nova/fairness';
import { WalletServiceLogic } from '@nova/wallet';
import {
  LettiCard,
  LettiMatchPhase,
  LettiMatchPublicView,
  LettiMultiplayerConfigDTO,
  LettiPvpFlip,
  LettiRoomStatus,
  LettiRoomType,
} from '@nova/types';
import { prisma } from '../config/database.js';
import { LedgerService } from './ledger.service.js';
import { emitWalletUpdate } from '../websocket/socket.js';

interface InternalGameState {
  playerOnePickIndex: number | null;
  playerTwoPickIndex: number | null;
  deckOrder: number[];
  nextDeckCursor: number;
  flips: LettiPvpFlip[];
}

export class LettiMatchService {
  /**
   * Returns current admin-configurable Letti 1v1 multiplayer settings
   */
  static async getConfig(tx?: any): Promise<LettiMultiplayerConfigDTO & { platformFeeBps: number }> {
    const client = tx || prisma;
    let cfg = await client.lettiMultiplayerConfig.findUnique({ where: { id: 'default' } });
    if (!cfg) {
      cfg = await client.lettiMultiplayerConfig.create({
        data: { id: 'default' },
      });
    }
    return {
      enabled: cfg.enabled,
      quickMatchEnabled: cfg.quickMatchEnabled,
      privateRoomsEnabled: cfg.privateRoomsEnabled,
      minStakeEtb: WalletServiceLogic.santimToEtb(cfg.minStakeSantim),
      maxStakeEtb: WalletServiceLogic.santimToEtb(cfg.maxStakeSantim),
      platformFeePercent: cfg.platformFeeBps / 100,
      platformFeeBps: cfg.platformFeeBps,
      reconnectGraceSeconds: cfg.reconnectGraceSeconds,
      maxDisconnects: cfg.maxDisconnects,
      roomExpiryMinutes: cfg.roomExpiryMinutes,
      turnTimeoutSeconds: cfg.turnTimeoutSeconds,
      allowBonusBalance: cfg.allowBonusBalance,
    };
  }

  /**
   * Expires stale WAITING rooms past expiresAt and refunds any locked stakes atomically
   */
  static async expireStaleRooms() {
    const now = new Date();
    const staleRooms = await prisma.lettiRoom.findMany({
      where: {
        status: 'WAITING',
        expiresAt: { lt: now },
      },
      include: { players: true },
    });

    for (const room of staleRooms) {
      await prisma.$transaction(async (tx) => {
        const claimed = await tx.lettiRoom.updateMany({
          where: { id: room.id, status: 'WAITING' },
          data: { status: 'EXPIRED', completedAt: now },
        });
        if (claimed.count === 0) return;

        for (const p of room.players) {
          if (p.stakeLocked) {
            await LedgerService.refundStake(
              `letti-room:${room.id}`,
              p.userId,
              room.stakeSantim,
              'ROOM_EXPIRED',
              tx
            );
          }
        }
      });
    }
  }

  private static async assertEligibleForStake(
    tx: any,
    userId: string,
    stakeSantim: number,
    cfg: LettiMultiplayerConfigDTO & { platformFeeBps: number }
  ) {
    if (!cfg.enabled) {
      throw { statusCode: 403, message: 'Letti 1v1 Multiplayer is currently disabled.' };
    }
    const minSantim = WalletServiceLogic.etbToSantim(cfg.minStakeEtb);
    const maxSantim = WalletServiceLogic.etbToSantim(cfg.maxStakeEtb);
    if (stakeSantim < minSantim || stakeSantim > maxSantim) {
      throw {
        statusCode: 400,
        message: `Stake must be between ${cfg.minStakeEtb} and ${cfg.maxStakeEtb} ETB.`,
      };
    }

    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw { statusCode: 404, message: 'Wallet not found' };
    }

    // Bonus Balance Restriction: paid PvP requires real cashBalance unless admin explicitly enables bonus play
    const availableCash = Math.max(0, wallet.balance - (wallet.lockedBalance || 0));
    if (availableCash < stakeSantim) {
      throw {
        statusCode: 400,
        message:
          'Insufficient cash balance for 1v1 multiplayer stake (promotional bonus cannot enter cash PvP).',
      };
    }
  }

  private static generateRoomCode(): string {
    return `LT-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  }

  private static parseGameState(raw?: string | null): InternalGameState {
    if (!raw) {
      return {
        playerOnePickIndex: null,
        playerTwoPickIndex: null,
        deckOrder: [],
        nextDeckCursor: 0,
        flips: [],
      };
    }
    return JSON.parse(raw) as InternalGameState;
  }

  /**
   * Builds a strictly sanitized per-user view so opponent secret cards and deck order are NEVER leaked.
   */
  static async getSanitizedRoomView(roomId: string, viewerUserId: string): Promise<LettiMatchPublicView> {
    const room = await prisma.lettiRoom.findUnique({
      where: { id: roomId },
      include: {
        players: true,
        match: true,
      },
    });
    if (!room) throw { statusCode: 404, message: 'Letti room not found' };

    const cfg = await this.getConfig();
    const userIds = room.players.map((p) => p.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, avatarUrl: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const p1 = room.players.find((p) => p.seat === 1) || null;
    const p2 = room.players.find((p) => p.seat === 2) || null;
    const me = room.players.find((p) => p.userId === viewerUserId) || null;
    const mySeat = me ? (me.seat as 1 | 2) : null;

    const match = room.match;
    const state = this.parseGameState(match?.gameState);
    const isCompleted = match?.status === 'COMPLETED' || room.status === 'COMPLETED';

    const p1PickCard =
      state.playerOnePickIndex !== null ? LettiEngine.cardFromIndex(state.playerOnePickIndex) : null;
    const p2PickCard =
      state.playerTwoPickIndex !== null ? LettiEngine.cardFromIndex(state.playerTwoPickIndex) : null;

    let myPickedCard: LettiCard | null = null;
    let opponentPickedCard: LettiCard | null = null;

    if (mySeat === 1) {
      myPickedCard = p1PickCard;
      opponentPickedCard = isCompleted ? p2PickCard : null;
    } else if (mySeat === 2) {
      myPickedCard = p2PickCard;
      opponentPickedCard = isCompleted ? p1PickCard : null;
    } else if (isCompleted) {
      opponentPickedCard = p1PickCard;
    }

    const totalPotSantim = match?.totalPotSantim ?? room.stakeSantim * 2;
    const platformFeeSantim =
      match?.platformFeeSantim ?? Math.floor((totalPotSantim * cfg.platformFeeBps) / 10000);
    const winnerPayoutSantim = totalPotSantim - platformFeeSantim;

    const remainingDeckCount =
      state.deckOrder.length > 0
        ? Math.max(0, state.deckOrder.length - state.nextDeckCursor)
        : 50;

    return {
      roomId: room.id,
      roomCode: room.roomCode,
      roomType: room.roomType as LettiRoomType,
      roomStatus: room.status as LettiRoomStatus,
      stakeEtb: WalletServiceLogic.santimToEtb(room.stakeSantim),
      totalPotEtb: WalletServiceLogic.santimToEtb(totalPotSantim),
      platformFeeEtb: WalletServiceLogic.santimToEtb(platformFeeSantim),
      winnerPayoutEtb: WalletServiceLogic.santimToEtb(winnerPayoutSantim),
      matchId: match?.id || null,
      phase: (match?.status || 'PICKING') as LettiMatchPhase,
      currentTurnUserId: match?.currentTurnUserId || null,
      remainingDeckCount,
      mySeat,
      myPickedCard,
      opponentPickedCard,
      playerOne: p1
        ? {
            userId: p1.userId,
            username: userMap.get(p1.userId)?.username || 'Player 1',
            avatarUrl: userMap.get(p1.userId)?.avatarUrl || null,
            seat: 1,
            ready: p1.ready,
            connectionStatus: p1.connectionStatus as 'CONNECTED' | 'DISCONNECTED',
            disconnectCount: p1.disconnectCount,
            hasPicked: state.playerOnePickIndex !== null,
          }
        : null,
      playerTwo: p2
        ? {
            userId: p2.userId,
            username: userMap.get(p2.userId)?.username || 'Player 2',
            avatarUrl: userMap.get(p2.userId)?.avatarUrl || null,
            seat: 2,
            ready: p2.ready,
            connectionStatus: p2.connectionStatus as 'CONNECTED' | 'DISCONNECTED',
            disconnectCount: p2.disconnectCount,
            hasPicked: state.playerTwoPickIndex !== null,
          }
        : null,
      playerOneFlips: state.flips.filter((f) => f.seat === 1),
      playerTwoFlips: state.flips.filter((f) => f.seat === 2),
      winnerId: match?.winnerId || null,
      resultType: (match?.resultType as any) || null,
      rematchAcceptedBy: JSON.parse(room.rematchAcceptedBy || '[]'),
      serverSeedHash: match?.serverSeedHash || null,
      serverSeed: isCompleted ? match?.serverSeed || null : null,
      clientSeed: match?.clientSeed || null,
      nonce: match?.nonce || null,
      expiresAt: room.expiresAt?.toISOString() || null,
      startedAt: room.startedAt?.toISOString() || null,
      completedAt: (match?.completedAt || room.completedAt)?.toISOString() || null,
    };
  }

  /**
   * Creates a new Private Room (or Quick Match waiting room) & atomically reserves host stake
   */
  static async createRoom(userId: string, stakeEtb: number, roomType: LettiRoomType = 'PRIVATE') {
    if (!userId || userId === 'demo-guest') {
      throw { statusCode: 401, message: 'Please sign in to play 1v1 Face-to-Face Letti.' };
    }

    await this.expireStaleRooms();
    const stakeSantim = WalletServiceLogic.etbToSantim(stakeEtb);

    const createdRoom = await prisma.$transaction(async (tx) => {
      const cfg = await this.getConfig(tx);
      if (roomType === 'PRIVATE' && !cfg.privateRoomsEnabled) {
        throw { statusCode: 403, message: 'Private rooms are currently disabled by admin.' };
      }
      if (roomType === 'QUICK_MATCH' && !cfg.quickMatchEnabled) {
        throw { statusCode: 403, message: 'Quick matchmaking is currently disabled by admin.' };
      }

      await this.assertEligibleForStake(tx, userId, stakeSantim, cfg);

      const expiresAt = new Date(Date.now() + cfg.roomExpiryMinutes * 60 * 1000);
      const roomCode = this.generateRoomCode();

      const room = await tx.lettiRoom.create({
        data: {
          roomCode,
          roomType,
          status: 'WAITING',
          stakeSantim,
          hostId: userId,
          expiresAt,
        },
      });

      await tx.lettiPlayer.create({
        data: {
          roomId: room.id,
          userId,
          seat: 1,
          ready: false,
          connectionStatus: 'CONNECTED',
          stakeLocked: true,
        },
      });

      const lockRes = await LedgerService.lockStake(`letti-room:${room.id}`, userId, stakeSantim, tx);
      emitWalletUpdate(userId, {
        balance: WalletServiceLogic.santimToEtb(Number(lockRes.balanceAfter)),
        type: 'STAKE_LOCK',
        status: 'COMPLETED',
        amount: stakeEtb,
      });

      return room;
    });

    return this.getSanitizedRoomView(createdRoom.id, userId);
  }

  /**
   * Joins an open room by roomCode or roomId atomically, reserving Player 2's stake and creating LettiMatch
   */
  static async joinRoom(userId: string, roomCodeOrId: string) {
    if (!userId || userId === 'demo-guest') {
      throw { statusCode: 401, message: 'Please sign in to join a 1v1 Letti room.' };
    }

    await this.expireStaleRooms();
    const cleanInput = roomCodeOrId.trim();
    const upperCode = cleanInput.toUpperCase();

    const joinedRoomId = await prisma.$transaction(async (tx) => {
      const cfg = await this.getConfig(tx);
      const room = await tx.lettiRoom.findFirst({
        where: {
          OR: [{ id: cleanInput }, { roomCode: upperCode }],
        },
        include: { players: true },
      });

      if (!room) {
        throw { statusCode: 404, message: 'Room not found. Check the room code and try again.' };
      }
      if (room.players.some((p) => p.userId === userId)) {
        // Already in this room — return it cleanly for reconnect/idempotency
        return room.id;
      }
      if (room.status !== 'WAITING' || room.players.length >= 2) {
        throw { statusCode: 409, message: 'Room is already full or the match has started.' };
      }

      await this.assertEligibleForStake(tx, userId, room.stakeSantim, cfg);

      // Claim seat 2 conditionally via room status guard
      const claimed = await tx.lettiRoom.updateMany({
        where: { id: room.id, status: 'WAITING' },
        data: { status: 'READY' },
      });
      if (claimed.count === 0) {
        throw { statusCode: 409, message: 'Another player claimed the last seat.' };
      }

      await tx.lettiPlayer.create({
        data: {
          roomId: room.id,
          userId,
          seat: 2,
          ready: false,
          connectionStatus: 'CONNECTED',
          stakeLocked: true,
        },
      });

      const lockRes = await LedgerService.lockStake(
        `letti-room:${room.id}`,
        userId,
        room.stakeSantim,
        tx
      );
      emitWalletUpdate(userId, {
        balance: WalletServiceLogic.santimToEtb(Number(lockRes.balanceAfter)),
        type: 'STAKE_LOCK',
        status: 'COMPLETED',
        amount: WalletServiceLogic.santimToEtb(room.stakeSantim),
      });

      const serverSeed = ProvablyFair.generateServerSeed();
      const serverSeedHash = ProvablyFair.hashServerSeed(serverSeed);
      const clientSeed = `letti-pvp-${room.roomCode}`;
      const totalPotSantim = room.stakeSantim * 2;
      const platformFeeSantim = Math.floor((totalPotSantim * cfg.platformFeeBps) / 10000);

      const initialState: InternalGameState = {
        playerOnePickIndex: null,
        playerTwoPickIndex: null,
        deckOrder: [],
        nextDeckCursor: 0,
        flips: [],
      };

      await tx.lettiMatch.create({
        data: {
          roomId: room.id,
          playerOneId: room.hostId,
          playerTwoId: userId,
          status: 'PICKING',
          currentTurnUserId: null,
          gameState: JSON.stringify(initialState),
          totalPotSantim,
          platformFeeSantim,
          serverSeed,
          serverSeedHash,
          clientSeed,
          nonce: 1,
        },
      });

      return room.id;
    });

    return this.getSanitizedRoomView(joinedRoomId, userId);
  }

  /**
   * Quick Match: Pairs with an existing WAITING room of equal stake, or creates one and waits
   */
  static async quickMatch(userId: string, stakeEtb: number) {
    if (!userId || userId === 'demo-guest') {
      throw { statusCode: 401, message: 'Please sign in to enter Quick Match.' };
    }

    await this.expireStaleRooms();
    const cfg = await this.getConfig();
    if (!cfg.enabled || !cfg.quickMatchEnabled) {
      throw { statusCode: 403, message: 'Quick Match is currently disabled.' };
    }

    const stakeSantim = WalletServiceLogic.etbToSantim(stakeEtb);

    // Search for oldest matching waiting room by another player
    const candidate = await prisma.lettiRoom.findFirst({
      where: {
        status: 'WAITING',
        roomType: 'QUICK_MATCH',
        stakeSantim,
        hostId: { not: userId },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (candidate) {
      try {
        const view = await this.joinRoom(userId, candidate.id);
        return { matched: true, view };
      } catch (err: any) {
        // Race condition where candidate filled first -> fall through to create new room
        if (err?.statusCode !== 409) throw err;
      }
    }

    const view = await this.createRoom(userId, stakeEtb, 'QUICK_MATCH');
    return { matched: Boolean(view.playerTwo), view };
  }

  /**
   * Server-authoritative player action handler (PICK_CARD, PLAYER_READY, FLIP_CARD, FORFEIT)
   */
  static async handleAction(
    userId: string,
    matchId: string,
    input: {
      actionType: 'PICK_CARD' | 'PLAYER_READY' | 'FLIP_CARD' | 'FORFEIT';
      pickedCardIndex?: number;
      idempotencyKey?: string;
    }
  ) {
    const actionResult = await prisma.$transaction(async (tx) => {
      const match = await tx.lettiMatch.findUnique({
        where: { id: matchId },
        include: { room: { include: { players: true } } },
      });
      if (!match) throw { statusCode: 404, message: 'Match not found' };

      const me = match.room.players.find((p) => p.userId === userId);
      if (!me) throw { statusCode: 403, message: 'You are not a participant in this room' };

      if (input.idempotencyKey) {
        const existingAction = await tx.lettiAction.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
        });
        if (existingAction) {
          return { roomId: match.roomId, completed: match.status === 'COMPLETED' };
        }
      }

      const actionCount = await tx.lettiAction.count({ where: { matchId: match.id } });
      const nextSeq = actionCount + 1;
      const state = this.parseGameState(match.gameState);
      const seat = me.seat as 1 | 2;

      if (input.actionType === 'PICK_CARD') {
        if (match.status !== 'PICKING' && match.status !== 'READY') {
          throw { statusCode: 409, message: 'Card selection is locked once flipping starts.' };
        }
        const idx = input.pickedCardIndex;
        if (idx === undefined || !Number.isInteger(idx) || idx < 0 || idx > 51) {
          throw { statusCode: 400, message: 'Picked card index must be an integer between 0 and 51.' };
        }

        const otherIdx = seat === 1 ? state.playerTwoPickIndex : state.playerOnePickIndex;
        if (otherIdx !== null && otherIdx === idx) {
          throw { statusCode: 409, message: 'That card slot was already selected by your opponent. Pick another card.' };
        }

        if (seat === 1) state.playerOnePickIndex = idx;
        else state.playerTwoPickIndex = idx;

        // Selecting a new card resets own ready state until confirmed
        await tx.lettiPlayer.update({ where: { id: me.id }, data: { ready: false } });

        let nextStatus = 'PICKING';
        if (state.playerOnePickIndex !== null && state.playerTwoPickIndex !== null) {
          state.deckOrder = LettiEngine.buildDuelShuffledOrder(
            state.playerOnePickIndex,
            state.playerTwoPickIndex,
            match.serverSeed,
            match.clientSeed,
            match.nonce
          );
          state.nextDeckCursor = 0;
          state.flips = [];
          nextStatus = 'READY';
        }

        await tx.lettiMatch.update({
          where: { id: match.id },
          data: { status: nextStatus, gameState: JSON.stringify(state) },
        });
      } else if (input.actionType === 'PLAYER_READY') {
        if (match.status !== 'READY' && match.status !== 'PICKING') {
          throw { statusCode: 409, message: 'Match has already started or completed.' };
        }
        const myPick = seat === 1 ? state.playerOnePickIndex : state.playerTwoPickIndex;
        if (myPick === null) {
          throw { statusCode: 400, message: 'Pick your secret card before marking ready.' };
        }

        await tx.lettiPlayer.update({ where: { id: me.id }, data: { ready: true } });

        const updatedPlayers = await tx.lettiPlayer.findMany({ where: { roomId: match.roomId } });
        const bothPicked = state.playerOnePickIndex !== null && state.playerTwoPickIndex !== null;
        const bothReady = updatedPlayers.length === 2 && updatedPlayers.every((p) => p.ready);

        if (bothPicked && bothReady) {
          await tx.lettiRoom.update({
            where: { id: match.roomId },
            data: { status: 'PLAYING', startedAt: new Date() },
          });
          await tx.lettiMatch.update({
            where: { id: match.id },
            data: { status: 'PLAYING', currentTurnUserId: match.playerOneId },
          });
        }
      } else if (input.actionType === 'FLIP_CARD') {
        if (match.status !== 'PLAYING') {
          throw { statusCode: 409, message: 'Match is not currently in PLAYING state.' };
        }
        if (match.currentTurnUserId !== userId) {
          throw { statusCode: 403, message: 'Wait for your turn!' };
        }
        if (state.nextDeckCursor >= state.deckOrder.length) {
          throw { statusCode: 409, message: 'Deck already exhausted.' };
        }

        const flippedIdx = state.deckOrder[state.nextDeckCursor];
        state.nextDeckCursor += 1;

        const flippedCard = LettiEngine.cardFromIndex(flippedIdx);
        const myPickIndex = seat === 1 ? state.playerOnePickIndex! : state.playerTwoPickIndex!;
        const myPickCard = LettiEngine.cardFromIndex(myPickIndex);
        const matched = flippedCard.rank === myPickCard.rank;

        state.flips.push({
          step: state.flips.length + 1,
          playerId: userId,
          seat,
          card: flippedCard,
          matched,
          createdAt: new Date().toISOString(),
        });

        const deckExhausted = state.nextDeckCursor >= state.deckOrder.length;

        if (matched) {
          const payoutSantim = match.totalPotSantim - match.platformFeeSantim;
          const settledClaim = await tx.lettiMatch.updateMany({
            where: { id: match.id, settled: false },
            data: {
              status: 'COMPLETED',
              winnerId: userId,
              resultType: 'WIN',
              payoutSantim,
              currentTurnUserId: null,
              gameState: JSON.stringify(state),
              settled: true,
              completedAt: new Date(),
            },
          });
          if (settledClaim.count === 0) {
            throw { statusCode: 409, message: 'Match already settled.' };
          }
          await tx.lettiRoom.update({
            where: { id: match.roomId },
            data: { status: 'COMPLETED', completedAt: new Date() },
          });

          const payRes = await LedgerService.settlePayout(
            `letti-room:${match.roomId}`,
            userId,
            payoutSantim,
            match.platformFeeSantim,
            tx
          );
          emitWalletUpdate(userId, {
            balance: WalletServiceLogic.santimToEtb(Number(payRes.balanceAfter)),
            type: 'MATCH_PAYOUT',
            status: 'COMPLETED',
            amount: WalletServiceLogic.santimToEtb(payoutSantim),
          });
        } else if (deckExhausted) {
          // Explicit Draw Refund Policy when all 50 remaining cards are exhausted with no match
          const settledClaim = await tx.lettiMatch.updateMany({
            where: { id: match.id, settled: false },
            data: {
              status: 'COMPLETED',
              winnerId: null,
              resultType: 'DRAW',
              payoutSantim: match.room.stakeSantim,
              currentTurnUserId: null,
              gameState: JSON.stringify(state),
              settled: true,
              completedAt: new Date(),
            },
          });
          if (settledClaim.count === 0) {
            throw { statusCode: 409, message: 'Match already settled.' };
          }
          await tx.lettiRoom.update({
            where: { id: match.roomId },
            data: { status: 'COMPLETED', completedAt: new Date() },
          });

          for (const pid of [match.playerOneId, match.playerTwoId]) {
            const refRes = await LedgerService.refundStake(
              `letti-room:${match.roomId}`,
              pid,
              match.room.stakeSantim,
              'DECK_EXHAUSTED_DRAW',
              tx
            );
            emitWalletUpdate(pid, {
              balance: WalletServiceLogic.santimToEtb(Number(refRes.balanceAfter)),
              type: 'STAKE_REFUND',
              status: 'COMPLETED',
              amount: WalletServiceLogic.santimToEtb(match.room.stakeSantim),
            });
          }
        } else {
          const nextTurnUserId = userId === match.playerOneId ? match.playerTwoId : match.playerOneId;
          await tx.lettiMatch.update({
            where: { id: match.id },
            data: {
              currentTurnUserId: nextTurnUserId,
              gameState: JSON.stringify(state),
            },
          });
        }
      } else if (input.actionType === 'FORFEIT') {
        if (match.status === 'COMPLETED' || match.status === 'CANCELLED') {
          throw { statusCode: 409, message: 'Match already finished.' };
        }
        const opponentId = userId === match.playerOneId ? match.playerTwoId : match.playerOneId;
        const payoutSantim = match.totalPotSantim - match.platformFeeSantim;
        const settledClaim = await tx.lettiMatch.updateMany({
          where: { id: match.id, settled: false },
          data: {
            status: 'COMPLETED',
            winnerId: opponentId,
            resultType: 'FORFEIT',
            payoutSantim,
            currentTurnUserId: null,
            settled: true,
            completedAt: new Date(),
          },
        });
        if (settledClaim.count > 0) {
          await tx.lettiRoom.update({
            where: { id: match.roomId },
            data: { status: 'COMPLETED', completedAt: new Date() },
          });
          const payRes = await LedgerService.settlePayout(
            `letti-room:${match.roomId}`,
            opponentId,
            payoutSantim,
            match.platformFeeSantim,
            tx
          );
          emitWalletUpdate(opponentId, {
            balance: WalletServiceLogic.santimToEtb(Number(payRes.balanceAfter)),
            type: 'MATCH_PAYOUT',
            status: 'COMPLETED',
            amount: WalletServiceLogic.santimToEtb(payoutSantim),
          });
        }
      }

      await tx.lettiAction.create({
        data: {
          matchId: match.id,
          playerId: userId,
          actionType: input.actionType,
          actionData: JSON.stringify(input),
          sequenceNumber: nextSeq,
          idempotencyKey: input.idempotencyKey || undefined,
        },
      });

      const refreshed = await tx.lettiMatch.findUnique({ where: { id: match.id } });
      return { roomId: match.roomId, completed: refreshed?.status === 'COMPLETED' };
    });

    return actionResult;
  }

  /**
   * Cancels a waiting/unstarted room cleanly & refunds any locked stakes atomically
   */
  static async leaveOrCancelRoom(userId: string, roomId: string, isAdmin = false) {
    return prisma.$transaction(async (tx) => {
      const room = await tx.lettiRoom.findUnique({
        where: { id: roomId },
        include: { players: true, match: true },
      });
      if (!room) throw { statusCode: 404, message: 'Room not found' };

      const isParticipant = room.players.some((p) => p.userId === userId);
      if (!isAdmin && !isParticipant) {
        throw { statusCode: 403, message: 'Not a participant in this room' };
      }

      if (room.status === 'PLAYING' && room.match && !isAdmin) {
        // Leaving an active PLAYING match triggers forfeit settlement to opponent
        return { action: 'FORFEIT_REQUIRED', matchId: room.match.id };
      }

      if (room.status === 'WAITING' || room.status === 'READY') {
        const claimed = await tx.lettiRoom.updateMany({
          where: { id: room.id, status: { in: ['WAITING', 'READY'] } },
          data: { status: 'CANCELLED', completedAt: new Date() },
        });
        if (claimed.count > 0) {
          if (room.match) {
            await tx.lettiMatch.update({
              where: { id: room.match.id },
              data: {
                status: 'CANCELLED',
                resultType: 'CANCELLED',
                settled: true,
                completedAt: new Date(),
              },
            });
          }
          for (const p of room.players) {
            if (p.stakeLocked) {
              const refRes = await LedgerService.refundStake(
                `letti-room:${room.id}`,
                p.userId,
                room.stakeSantim,
                isAdmin ? 'ADMIN_CANCELLED' : 'PLAYER_LEFT_BEFORE_START',
                tx
              );
              emitWalletUpdate(p.userId, {
                balance: WalletServiceLogic.santimToEtb(Number(refRes.balanceAfter)),
                type: 'STAKE_REFUND',
                status: 'COMPLETED',
                amount: WalletServiceLogic.santimToEtb(room.stakeSantim),
              });
            }
          }
        }
      }

      return { action: 'CANCELLED', roomId: room.id };
    });
  }

  /**
   * Mutual-consent Rematch: requires BOTH players to accept and authorizes fresh stakes
   */
  static async requestRematch(userId: string, roomId: string) {
    return prisma.$transaction(async (tx) => {
      const room = await tx.lettiRoom.findUnique({
        where: { id: roomId },
        include: { players: true },
      });
      if (!room) throw { statusCode: 404, message: 'Room not found' };
      if (room.status !== 'COMPLETED') {
        throw { statusCode: 409, message: 'Rematch is only available after the match completes.' };
      }
      if (!room.players.some((p) => p.userId === userId)) {
        throw { statusCode: 403, message: 'Only room participants can accept a rematch.' };
      }

      if (room.rematchNextRoomId) {
        return { rematchReady: true, newRoomId: room.rematchNextRoomId, acceptedBy: JSON.parse(room.rematchAcceptedBy) };
      }

      const accepted: string[] = JSON.parse(room.rematchAcceptedBy || '[]');
      if (!accepted.includes(userId)) {
        accepted.push(userId);
      }

      if (accepted.length < 2) {
        await tx.lettiRoom.update({
          where: { id: room.id },
          data: { rematchAcceptedBy: JSON.stringify(accepted) },
        });
        return { rematchReady: false, newRoomId: null, acceptedBy: accepted };
      }

      // Both players accepted -> verify fresh stake balances for both & create new room + match
      const cfg = await this.getConfig(tx);
      const p1 = room.players.find((p) => p.seat === 1)!;
      const p2 = room.players.find((p) => p.seat === 2)!;

      await this.assertEligibleForStake(tx, p1.userId, room.stakeSantim, cfg);
      await this.assertEligibleForStake(tx, p2.userId, room.stakeSantim, cfg);

      const newRoom = await tx.lettiRoom.create({
        data: {
          roomCode: this.generateRoomCode(),
          roomType: room.roomType,
          status: 'READY',
          stakeSantim: room.stakeSantim,
          hostId: p1.userId,
          expiresAt: new Date(Date.now() + cfg.roomExpiryMinutes * 60 * 1000),
        },
      });

      for (const pl of [p1, p2]) {
        await tx.lettiPlayer.create({
          data: {
            roomId: newRoom.id,
            userId: pl.userId,
            seat: pl.seat,
            ready: false,
            connectionStatus: 'CONNECTED',
            stakeLocked: true,
          },
        });
        const lockRes = await LedgerService.lockStake(
          `letti-room:${newRoom.id}`,
          pl.userId,
          room.stakeSantim,
          tx
        );
        emitWalletUpdate(pl.userId, {
          balance: WalletServiceLogic.santimToEtb(Number(lockRes.balanceAfter)),
          type: 'STAKE_LOCK',
          status: 'COMPLETED',
          amount: WalletServiceLogic.santimToEtb(room.stakeSantim),
        });
      }

      const serverSeed = ProvablyFair.generateServerSeed();
      const serverSeedHash = ProvablyFair.hashServerSeed(serverSeed);
      const totalPotSantim = room.stakeSantim * 2;
      const platformFeeSantim = Math.floor((totalPotSantim * cfg.platformFeeBps) / 10000);

      await tx.lettiMatch.create({
        data: {
          roomId: newRoom.id,
          playerOneId: p1.userId,
          playerTwoId: p2.userId,
          status: 'PICKING',
          gameState: JSON.stringify({
            playerOnePickIndex: null,
            playerTwoPickIndex: null,
            deckOrder: [],
            nextDeckCursor: 0,
            flips: [],
          }),
          totalPotSantim,
          platformFeeSantim,
          serverSeed,
          serverSeedHash,
          clientSeed: `letti-pvp-${newRoom.roomCode}`,
          nonce: 1,
        },
      });

      await tx.lettiRoom.update({
        where: { id: room.id },
        data: {
          rematchAcceptedBy: JSON.stringify(accepted),
          rematchNextRoomId: newRoom.id,
        },
      });

      return { rematchReady: true, newRoomId: newRoom.id, acceptedBy: accepted };
    });
  }

  /**
   * Reconnection recovery: finds latest active room for user
   */
  static async getActiveRoomForUser(userId: string) {
    if (!userId || userId === 'demo-guest') return null;
    await this.expireStaleRooms();

    const membership = await prisma.lettiPlayer.findFirst({
      where: {
        userId,
        room: {
          status: { in: ['WAITING', 'READY', 'PLAYING'] },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    if (!membership) return null;
    return this.getSanitizedRoomView(membership.roomId, userId);
  }

  /**
   * Lists open WAITING 1v1 Letti rooms for the multiplayer lobby
   */
  static async listWaitingRooms(limit = 20) {
    await this.expireStaleRooms();
    const rooms = await prisma.lettiRoom.findMany({
      where: { status: 'WAITING' },
      include: { players: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const hostIds = Array.from(new Set(rooms.map((r) => r.hostId)));
    const hosts = await prisma.user.findMany({
      where: { id: { in: hostIds } },
      select: { id: true, username: true, avatarUrl: true },
    });
    const hostMap = new Map(hosts.map((u) => [u.id, u]));

    return rooms.map((r) => {
      const host = hostMap.get(r.hostId);
      return {
        roomId: r.id,
        roomCode: r.roomCode,
        roomType: r.roomType,
        stakeEtb: WalletServiceLogic.santimToEtb(r.stakeSantim),
        hostId: r.hostId,
        hostUsername: host?.username || 'Player',
        hostAvatarUrl: host?.avatarUrl || null,
        createdAt: r.createdAt.toISOString(),
        expiresAt: r.expiresAt?.toISOString() || null,
      };
    });
  }

  /**
   * Returns completed 1v1 matches for a user
   */
  static async getMatchHistoryForUser(userId: string, limit = 20) {
    if (!userId || userId === 'demo-guest') return [];
    const matches = await prisma.lettiMatch.findMany({
      where: {
        status: 'COMPLETED',
        OR: [{ playerOneId: userId }, { playerTwoId: userId }],
      },
      include: { room: true },
      orderBy: { completedAt: 'desc' },
      take: limit,
    });

    const oppIds = Array.from(
      new Set(matches.map((m) => (m.playerOneId === userId ? m.playerTwoId : m.playerOneId)))
    );
    const opps = await prisma.user.findMany({
      where: { id: { in: oppIds } },
      select: { id: true, username: true, avatarUrl: true },
    });
    const oppMap = new Map(opps.map((o) => [o.id, o]));

    return matches.map((m) => {
      const oppId = m.playerOneId === userId ? m.playerTwoId : m.playerOneId;
      const opp = oppMap.get(oppId);
      const state = this.parseGameState(m.gameState);
      const didWin = m.winnerId === userId;
      const isDraw = m.resultType === 'DRAW';
      return {
        roomId: m.roomId,
        matchId: m.id,
        roomCode: m.room.roomCode,
        roomType: m.room.roomType,
        stakeEtb: WalletServiceLogic.santimToEtb(m.room.stakeSantim),
        totalPotEtb: WalletServiceLogic.santimToEtb(m.totalPotSantim),
        platformFeeEtb: WalletServiceLogic.santimToEtb(m.platformFeeSantim),
        winnerPayoutEtb: WalletServiceLogic.santimToEtb(m.payoutSantim),
        payoutEtb: WalletServiceLogic.santimToEtb(m.payoutSantim),
        winnerId: m.winnerId,
        won: didWin,
        didWin,
        isDraw,
        resultType: m.resultType,
        totalFlips: state.flips.length,
        opponent: opp ? { userId: opp.id, username: opp.username, avatarUrl: opp.avatarUrl } : null,
        completedAt: (m.completedAt || m.createdAt).toISOString(),
      };
    });
  }

  static async updateConnectionStatus(
    roomId: string,
    userId: string,
    status: 'CONNECTED' | 'DISCONNECTED'
  ) {
    await prisma.lettiPlayer.updateMany({
      where: { roomId, userId },
      data:
        status === 'DISCONNECTED'
          ? {
              connectionStatus: 'DISCONNECTED',
              disconnectedAt: new Date(),
              disconnectCount: { increment: 1 },
            }
          : {
              connectionStatus: 'CONNECTED',
              disconnectedAt: null,
            },
    });
  }

  static async getAdminOverview() {
    await this.expireStaleRooms();
    const [config, rooms, matches] = await Promise.all([
      this.getConfig(),
      prisma.lettiRoom.findMany({
        include: { players: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.lettiMatch.findMany({
        include: { room: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    const userIds = Array.from(new Set(rooms.flatMap((r) => r.players.map((p) => p.userId))));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true },
    });
    const uMap = new Map(users.map((u) => [u.id, u.username]));

    return {
      config,
      rooms: rooms.map((r) => ({
        id: r.id,
        roomCode: r.roomCode,
        roomType: r.roomType,
        status: r.status,
        stakeEtb: WalletServiceLogic.santimToEtb(r.stakeSantim),
        players: r.players.map((p) => ({
          userId: p.userId,
          username: uMap.get(p.userId) || 'Player',
          seat: p.seat,
          connectionStatus: p.connectionStatus,
          disconnectCount: p.disconnectCount,
        })),
        createdAt: r.createdAt.toISOString(),
        expiresAt: r.expiresAt?.toISOString() || null,
      })),
      matches: matches.map((m) => ({
        id: m.id,
        roomCode: m.room.roomCode,
        status: m.status,
        resultType: m.resultType,
        playerOneUsername: uMap.get(m.playerOneId) || 'Player 1',
        playerTwoUsername: uMap.get(m.playerTwoId) || 'Player 2',
        winnerUsername: m.winnerId ? uMap.get(m.winnerId) || m.winnerId : null,
        totalPotEtb: WalletServiceLogic.santimToEtb(m.totalPotSantim),
        platformFeeEtb: WalletServiceLogic.santimToEtb(m.platformFeeSantim),
        payoutEtb: WalletServiceLogic.santimToEtb(m.payoutSantim),
        settled: m.settled,
        createdAt: m.createdAt.toISOString(),
        completedAt: m.completedAt?.toISOString() || null,
      })),
    };
  }

  static async updateAdminConfig(adminId: string, body: any) {
    const current = await this.getConfig();
    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.lettiMultiplayerConfig.upsert({
        where: { id: 'default' },
        update: {
          enabled: body.enabled !== undefined ? Boolean(body.enabled) : current.enabled,
          quickMatchEnabled:
            body.quickMatchEnabled !== undefined
              ? Boolean(body.quickMatchEnabled)
              : current.quickMatchEnabled,
          privateRoomsEnabled:
            body.privateRoomsEnabled !== undefined
              ? Boolean(body.privateRoomsEnabled)
              : current.privateRoomsEnabled,
          minStakeSantim:
            body.minStakeEtb !== undefined
              ? WalletServiceLogic.etbToSantim(Number(body.minStakeEtb))
              : WalletServiceLogic.etbToSantim(current.minStakeEtb),
          maxStakeSantim:
            body.maxStakeEtb !== undefined
              ? WalletServiceLogic.etbToSantim(Number(body.maxStakeEtb))
              : WalletServiceLogic.etbToSantim(current.maxStakeEtb),
          platformFeeBps:
            body.platformFeePercent !== undefined
              ? Math.round(Number(body.platformFeePercent) * 100)
              : current.platformFeeBps,
          reconnectGraceSeconds:
            body.reconnectGraceSeconds !== undefined
              ? Number(body.reconnectGraceSeconds)
              : current.reconnectGraceSeconds,
          maxDisconnects:
            body.maxDisconnects !== undefined ? Number(body.maxDisconnects) : current.maxDisconnects,
          roomExpiryMinutes:
            body.roomExpiryMinutes !== undefined
              ? Number(body.roomExpiryMinutes)
              : current.roomExpiryMinutes,
          turnTimeoutSeconds:
            body.turnTimeoutSeconds !== undefined
              ? Number(body.turnTimeoutSeconds)
              : current.turnTimeoutSeconds,
          allowBonusBalance:
            body.allowBonusBalance !== undefined
              ? Boolean(body.allowBonusBalance)
              : current.allowBonusBalance,
        },
        create: { id: 'default' },
      });

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: 'LETTI_PVP_CONFIG_UPDATED',
          targetId: 'default',
          details: JSON.stringify(body),
        },
      });

      return next;
    });
    return updated;
  }
}
