import { WalletServiceLogic } from '../../../wallet/src/index.js';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ ${msg}`);
}

interface WalletState {
  id: string;
  userId: string;
  balance: number; // in Santim
  lockedBalance: number;
  version: number;
}

interface LedgerEntry {
  id: string;
  walletId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'BET_PLACED' | 'BET_WON';
  amount: number; // in Santim
  balanceAfter: number; // in Santim
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
}

class SimulatedLedgerService {
  private wallet: WalletState;
  private ledger: LedgerEntry[] = [];
  private lockActive = false;

  constructor(initialSantim: number) {
    this.wallet = {
      id: 'wallet-test-01',
      userId: 'user-test-01',
      balance: initialSantim,
      lockedBalance: 0,
      version: 1,
    };
  }

  getWallet(): WalletState {
    return { ...this.wallet };
  }

  getLedger(): LedgerEntry[] {
    return [...this.ledger];
  }

  /**
   * Simulates an atomic ACID database transaction with optimistic concurrency version check
   */
  async executeBet(betEtb: number, multiplier: number, expectedVersion: number): Promise<{ won: boolean; payoutEtb: number }> {
    const betSantim = WalletServiceLogic.etbToSantim(betEtb);

    // 1. Version conflict check (Optimistic Concurrency Control)
    if (this.wallet.version !== expectedVersion) {
      throw new Error(`OCC_CONFLICT: expected version ${expectedVersion}, but current is ${this.wallet.version}`);
    }

    // 2. Balance validation
    if (!WalletServiceLogic.validateSufficientBalance(this.wallet, betSantim)) {
      throw new Error('INSUFFICIENT_BALANCE');
    }

    // 3. Atomically deduct bet
    const balanceAfterBet = WalletServiceLogic.deductBet(this.wallet.balance, betSantim);
    this.wallet.balance = balanceAfterBet;
    this.wallet.version += 1;

    this.ledger.push({
      id: `tx-${this.ledger.length + 1}`,
      walletId: this.wallet.id,
      type: 'BET_PLACED',
      amount: betSantim,
      balanceAfter: balanceAfterBet,
      status: 'COMPLETED',
    });

    // 4. Calculate payout
    const won = multiplier > 0;
    const payoutSantim = won ? WalletServiceLogic.etbToSantim(betEtb * multiplier) : 0;

    if (won) {
      const finalBalance = WalletServiceLogic.creditWin(this.wallet.balance, payoutSantim);
      this.wallet.balance = finalBalance;
      this.wallet.version += 1;

      this.ledger.push({
        id: `tx-${this.ledger.length + 1}`,
        walletId: this.wallet.id,
        type: 'BET_WON',
        amount: payoutSantim,
        balanceAfter: finalBalance,
        status: 'COMPLETED',
      });
    }

    return { won, payoutEtb: WalletServiceLogic.santimToEtb(payoutSantim) };
  }
}

async function runWalletLedgerTests() {
  console.log('--- WALLET LEDGER TEST SUITE: Integer Santim & Currency Safety ---');

  // 1. Santim Conversion Integrity
  assert(WalletServiceLogic.etbToSantim(0.01) === 1, '0.01 ETB converts cleanly to 1 Santim');
  assert(WalletServiceLogic.etbToSantim(100.5) === 10050, '100.50 ETB converts to 10050 Santim');
  assert(WalletServiceLogic.santimToEtb(10050) === 100.5, '10050 Santim converts back to 100.50 ETB');
  assert(WalletServiceLogic.formatCurrency(100000) === '1,000.00 ETB', '100000 Santim formats as "1,000.00 ETB"');

  // 2. Invariant: Ledger Audit Balance Matching
  console.log('\n--- WALLET LEDGER TEST SUITE: Double-Entry Audit Trail Invariant ---');
  const service = new SimulatedLedgerService(50000); // 500.00 ETB starting balance

  let v = service.getWallet().version;
  // Bet 50 ETB, win at 2.0x (100 ETB payout)
  const round1 = await service.executeBet(50, 2.0, v);
  assert(round1.won && round1.payoutEtb === 100, 'Round 1 won with 100 ETB payout');

  v = service.getWallet().version;
  // Bet 100 ETB, lost (0 payout)
  const round2 = await service.executeBet(100, 0, v);
  assert(!round2.won && round2.payoutEtb === 0, 'Round 2 lost with 0 ETB payout');

  // Verify Ledger Invariant:
  // Initial 50000 - 5000 + 10000 - 10000 = 45000 Santim (450.00 ETB)
  const currentWallet = service.getWallet();
  assert(currentWallet.balance === 45000, `Final wallet balance is exactly 450.00 ETB (got ${currentWallet.balance} Santim)`);

  const ledger = service.getLedger();
  assert(ledger.length === 3, 'Ledger recorded exactly 3 entries (2 bets placed, 1 bet won)');
  assert(ledger[0].balanceAfter === 45000, 'Ledger 1 balanceAfter matches 450.00 ETB');
  assert(ledger[1].balanceAfter === 55000, 'Ledger 2 balanceAfter matches 550.00 ETB');
  assert(ledger[2].balanceAfter === 45000, 'Ledger 3 balanceAfter matches 450.00 ETB');

  // 3. Optimistic Concurrency Control (OCC) Collision Prevention
  console.log('\n--- WALLET LEDGER TEST SUITE: Optimistic Concurrency Control (OCC) ---');
  let conflictCaught = false;
  try {
    // Attempt to bet with stale version (using v - 1)
    await service.executeBet(20, 1.5, v - 1);
  } catch (err: any) {
    if (err.message.includes('OCC_CONFLICT')) {
      conflictCaught = true;
    }
  }
  assert(conflictCaught, 'OCC conflict successfully thrown on stale wallet version');

  // 4. Overdraft & Insufficient Balance Prevention
  console.log('\n--- WALLET LEDGER TEST SUITE: Overdraft & Race-Condition Resistance ---');
  let overdraftRejected = false;
  try {
    v = service.getWallet().version;
    // Attempt to bet 1,000 ETB when only 450 ETB is available
    await service.executeBet(1000, 2.0, v);
  } catch (err: any) {
    if (err.message.includes('INSUFFICIENT_BALANCE')) {
      overdraftRejected = true;
    }
  }
  assert(overdraftRejected, 'Overdraft attempt safely rejected; balance never goes negative');

  // 5. Maker-Checker Review Thresholds
  console.log('\n--- WALLET LEDGER TEST SUITE: Maker-Checker Risk Controls ---');
  assert(
    !WalletServiceLogic.requiresWithdrawalReview(WalletServiceLogic.etbToSantim(4999)),
    '4,999 ETB withdrawal executes automatically without manual review'
  );
  assert(
    WalletServiceLogic.requiresWithdrawalReview(WalletServiceLogic.etbToSantim(5000)),
    '5,000 ETB withdrawal requires maker-checker approval'
  );
  assert(
    WalletServiceLogic.requiresWithdrawalReview(WalletServiceLogic.etbToSantim(25000)),
    '25,000 ETB withdrawal requires maker-checker approval'
  );

  console.log('\n🎉 ALL WALLET LEDGER TESTS PASSED! Financial accuracy, OCC protection, and auditability verified.');
}

runWalletLedgerTests().catch((err) => {
  console.error(err);
  process.exit(1);
});

