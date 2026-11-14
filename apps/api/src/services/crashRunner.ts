import { Server as SocketIOServer, Socket } from 'socket.io';
import { ProvablyFair } from '@nova/fairness';
import { WalletRepository } from '../repositories/wallet.repository.js';
import { WalletServiceLogic } from '@nova/wallet';

export interface ActiveCrashBet {
  socketId: string;
  userId: string;
  username: string;
  amount: number;
  autoCashoutMultiplier?: number;
  cashedOut: boolean;
  cashedOutMultiplier?: number;
  payout?: number;
}

export interface RoundAuditLog {
  roundId: number;
  crashPoint: number;
  roundHash: string;
  prevHash: string;
  verified: boolean;
  timestamp: string;
}

export class CrashRunner {
  private static io: SocketIOServer | null = null;
  public static state: 'BETTING' | 'FLYING' | 'CRASHED' | 'PAUSED' = 'BETTING';
  public static isPaused: boolean = false;
  public static pauseReason: string = '';
  public static currentMultiplier: number = 1.0;
  public static countdown: number = 5;
  public static flightStartTime: number = 0;
  public static roundId: number = 1001;
  public static activeBets: Map<string, ActiveCrashBet> = new Map();
  public static recentCrashHistory: number[] = [2.45, 1.88, 12.3, 1.15, 4.2, 1.95, 8.5];
  public static recentAuditHistory: RoundAuditLog[] = [];

  // Provably Fair SHA-256 Hash Chain
  private static readonly CHAIN_LENGTH = 100000;
  private static hashChain: string[] = [];
  private static chainIndex: number = 1;
  public static genesisHash: string = '';
  public static clientSalt: string = '000000000000000000045e054ff8e7b9bfd79ad4fa368297b489d71c4c1143c6';

  private static activeCountdownTimer: NodeJS.Timeout | null = null;
  private static activeFlightTimer: NodeJS.Timeout | null = null;
  private static activePhaseTimer: NodeJS.Timeout | null = null;

  public static init(io: SocketIOServer) {
    this.io = io;
    this.initializeHashChain();
    this.startRoundLoop();
  }

  /**
   * Initializes the pre-committed cryptographic hash chain
   */
  private static initializeHashChain() {
    this.hashChain = ProvablyFair.generateHashChain(this.CHAIN_LENGTH);
    this.genesisHash = this.hashChain[0];
    this.chainIndex = 1;
  }

  public static getPublicState() {
    return {
      roundId: this.roundId,
      state: this.state,
      currentMultiplier: this.currentMultiplier,
      countdown: this.countdown,
      history: this.recentCrashHistory.slice(0, 10),
      activeBetsCount: this.activeBets.size,
      genesisHash: this.genesisHash,
      prevRoundHash: this.chainIndex > 1 ? this.hashChain[this.chainIndex - 1] : this.genesisHash,
      isPaused: this.isPaused,
      pauseReason: this.pauseReason,
    };
  }

  public static getAdminTelemetry() {
    const totalWagered = Array.from(this.activeBets.values()).reduce((acc, b) => acc + b.amount, 0);

    return {
      engineState: this.isPaused ? 'PAUSED' : 'RUNNING',
      currentState: this.state,
      currentMultiplier: this.currentMultiplier,
      countdown: this.countdown,
      activeBetsCount: this.activeBets.size,
      totalWagered,
      roundId: this.roundId,
      genesisHash: this.genesisHash,
      chainProgress: `${this.chainIndex} / ${this.CHAIN_LENGTH}`,
      recentAuditHistory: this.recentAuditHistory.slice(0, 10),
      isPaused: this.isPaused,
      pauseReason: this.pauseReason,
    };
  }

  private static startRoundLoop() {
    if (this.isPaused) return;
    this.runBettingPhase();
  }

  private static runBettingPhase() {
    if (this.isPaused) return;

    this.clearAllTimers();
    this.state = 'BETTING';
    this.currentMultiplier = 1.0;
    this.countdown = 5;
    this.activeBets.clear();
    this.roundId++;

    // Increment chain index to target next pre-committed hash
    if (this.chainIndex >= this.CHAIN_LENGTH - 1) {
      this.initializeHashChain();
    } else {
      this.chainIndex++;
    }

    // Deterministically compute crash target from pre-committed hash
    const currentRoundHash = this.hashChain[this.chainIndex];
    const targetCrashPoint = ProvablyFair.calculateCrashPointFromHash(currentRoundHash, this.clientSalt);

    this.broadcastState();
    this.broadcastAdminTelemetry();

    this.activeCountdownTimer = setInterval(() => {
      if (this.isPaused) {
        this.clearAllTimers();
        return;
      }

      this.countdown--;
      this.broadcastState();
      this.broadcastAdminTelemetry();

      if (this.countdown <= 0) {
        if (this.activeCountdownTimer) clearInterval(this.activeCountdownTimer);
        this.runFlightPhase(targetCrashPoint, currentRoundHash);
      }
    }, 1000);
  }

  private static runFlightPhase(targetCrashPoint: number, currentRoundHash: string) {
    if (this.isPaused) return;

    this.state = 'FLYING';
    this.flightStartTime = Date.now();
    this.broadcastState();

    const k = 0.065;

    this.activeFlightTimer = setInterval(async () => {
      if (this.isPaused) {
        this.clearAllTimers();
        return;
      }

      const elapsedSec = (Date.now() - this.flightStartTime) / 1000;
      const rawMultiplier = Math.exp(k * elapsedSec);
      const mult = Math.floor(rawMultiplier * 100) / 100;

      this.currentMultiplier = mult;

      // Process Auto Cash-Outs
      for (const bet of this.activeBets.values()) {
        if (
          !bet.cashedOut &&
          bet.autoCashoutMultiplier &&
          bet.autoCashoutMultiplier <= targetCrashPoint &&
          mult >= bet.autoCashoutMultiplier
        ) {
          bet.cashedOut = true;
          bet.cashedOutMultiplier = bet.autoCashoutMultiplier;
          bet.payout = Math.floor(bet.amount * bet.autoCashoutMultiplier);

          if (this.io) {
            this.io.to(bet.socketId).emit('CRASH_CASHOUT_SUCCESS', {
              multiplier: bet.cashedOutMultiplier,
              payout: bet.payout,
            });
          }

          // Credit auto-cashout winner in database
          try {
            const effectiveUserId = bet.userId || 'demo-guest';
            WalletRepository.findByUserId(effectiveUserId).then((wallet) => {
              if (wallet) {
                const payoutSantim = WalletServiceLogic.etbToSantim(bet.payout ?? 0);
                const creditedBal = WalletServiceLogic.creditWin(wallet.balance, payoutSantim);
                WalletRepository.updateBalance(wallet.id, creditedBal);
              }
            }).catch(() => {});
          } catch {
            // Non-fatal
          }
        }
      }

      this.broadcastTick();
      this.broadcastAdminTelemetry();

      if (mult >= targetCrashPoint) {
        if (this.activeFlightTimer) clearInterval(this.activeFlightTimer);
        this.runCrashedPhase(targetCrashPoint, currentRoundHash);
      }
    }, 50);
  }

  private static runCrashedPhase(finalCrashPoint: number, revealedRoundHash: string) {
    this.state = 'CRASHED';
    this.currentMultiplier = finalCrashPoint;
    this.recentCrashHistory.unshift(finalCrashPoint);

    const prevHash = this.hashChain[this.chainIndex - 1];
    const isLinkVerified = ProvablyFair.verifyHashChainLink(prevHash, revealedRoundHash);

    this.recentAuditHistory.unshift({
      roundId: this.roundId,
      crashPoint: finalCrashPoint,
      roundHash: revealedRoundHash,
      prevHash,
      verified: isLinkVerified,
      timestamp: new Date().toISOString(),
    });

    // Reveal the round hash publicly upon crash completion
    if (this.io) {
      this.io.emit('CRASH_STATE', {
        ...this.getPublicState(),
        revealedRoundHash,
        verified: isLinkVerified,
      });
    }
    this.broadcastAdminTelemetry();

    this.activePhaseTimer = setTimeout(() => {
      if (!this.isPaused) {
        this.runBettingPhase();
      }
    }, 3000);
  }

  /**
   * Safely pauses the crash engine and issues 100% wager refunds
   * to all active uncashed players. Does NOT alter any outcome.
   */
  public static async pause(reason: string) {
    this.isPaused = true;
    this.pauseReason = reason;
    this.state = 'PAUSED';
    this.clearAllTimers();

    // Issue refunds to active bets
    for (const bet of this.activeBets.values()) {
      if (!bet.cashedOut) {
        try {
          const wallet = await WalletRepository.findByUserId(bet.userId);
          if (wallet) {
            const refundedBal = WalletServiceLogic.creditWin(wallet.balance, bet.amount);
            await WalletRepository.updateBalance(wallet.id, refundedBal);
          }
        } catch {
          // Log and continue refund loop
        }

        if (this.io) {
          this.io.to(bet.socketId).emit('CRASH_ROUND_REFUNDED', {
            amount: bet.amount,
            reason: `Round halted for emergency maintenance: ${reason}. Bet 100% refunded.`,
          });
        }
      }
    }

    this.activeBets.clear();
    this.broadcastState();
    this.broadcastAdminTelemetry();

    return {
      success: true,
      message: `Crash Engine safely paused. All active wagers refunded. Reason: ${reason}`,
    };
  }

  /**
   * Resumes continuous loop
   */
  public static resume() {
    this.isPaused = false;
    this.pauseReason = '';
    this.runBettingPhase();

    return {
      success: true,
      message: 'Crash Engine resumed with fresh betting phase.',
    };
  }

  private static clearAllTimers() {
    if (this.activeCountdownTimer) {
      clearInterval(this.activeCountdownTimer);
      this.activeCountdownTimer = null;
    }
    if (this.activeFlightTimer) {
      clearInterval(this.activeFlightTimer);
      this.activeFlightTimer = null;
    }
    if (this.activePhaseTimer) {
      clearTimeout(this.activePhaseTimer);
      this.activePhaseTimer = null;
    }
  }

  private static broadcastState() {
    if (!this.io) return;
    this.io.emit('CRASH_STATE', this.getPublicState());
  }

  private static broadcastTick() {
    if (!this.io) return;
    this.io.emit('CRASH_TICK', {
      multiplier: this.currentMultiplier,
      state: this.state,
    });
  }

  public static broadcastAdminTelemetry() {
    if (!this.io) return;
    this.io.emit('ADMIN_CRASH_TELEMETRY', this.getAdminTelemetry());
  }

  public static async handlePlaceBet(
    socket: Socket,
    data: { userId: string; username: string; amount: number; autoCashoutMultiplier?: number }
  ) {
    if (this.isPaused || this.state !== 'BETTING') {
      socket.emit('CRASH_BET_ERROR', {
        message: this.isPaused
          ? `Game temporarily paused: ${this.pauseReason || 'Maintenance'}`
          : 'Betting phase closed for this round',
      });
      return;
    }

    const effectiveUserId = data.userId || 'demo-guest';

    // Deduct bet from DB wallet if available
    try {
      const wallet = await WalletRepository.findByUserId(effectiveUserId);
      if (wallet) {
        const betSantim = WalletServiceLogic.etbToSantim(data.amount);
        if (WalletServiceLogic.validateSufficientBalance(wallet, betSantim)) {
          const debitedBal = WalletServiceLogic.deductBet(wallet.balance, betSantim);
          await WalletRepository.updateBalance(wallet.id, debitedBal);
        }
      }
    } catch {
      // Non-fatal
    }

    const bet: ActiveCrashBet = {
      socketId: socket.id,
      userId: effectiveUserId,
      username: data.username || 'Player',
      amount: data.amount,
      autoCashoutMultiplier: data.autoCashoutMultiplier,
      cashedOut: false,
    };

    this.activeBets.set(socket.id, bet);
    socket.emit('CRASH_BET_SUCCESS', { bet });
    this.broadcastState();
    this.broadcastAdminTelemetry();
  }

  public static async handleManualCashout(socket: Socket) {
    if (this.state !== 'FLYING') {
      socket.emit('CRASH_CASHOUT_ERROR', { message: 'Cashout available during flight only' });
      return;
    }

    let bet = this.activeBets.get(socket.id);
    if (!bet || bet.cashedOut) {
      socket.emit('CRASH_CASHOUT_ERROR', { message: 'No active bet or already cashed out' });
      return;
    }

    const mult = this.currentMultiplier;
    bet.cashedOut = true;
    bet.cashedOutMultiplier = mult;
    bet.payout = Math.floor(bet.amount * mult);

    socket.emit('CRASH_CASHOUT_SUCCESS', {
      multiplier: mult,
      payout: bet.payout,
    });

    // Credit winner in database
    try {
      const effectiveUserId = bet.userId || 'demo-guest';
      const wallet = await WalletRepository.findByUserId(effectiveUserId);
      if (wallet) {
        const payoutSantim = WalletServiceLogic.etbToSantim(bet.payout ?? 0);
        const creditedBal = WalletServiceLogic.creditWin(wallet.balance, payoutSantim);
        await WalletRepository.updateBalance(wallet.id, creditedBal);
      }
    } catch {
      // Proceed gracefully
    }

    this.broadcastAdminTelemetry();
  }
}
