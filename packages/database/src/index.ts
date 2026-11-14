import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

/**
 * Initializes database triggers and constraints to enforce tamper-proof immutability:
 * 1. LedgerEntry table is strictly append-only (BLOCKS UPDATE and DELETE)
 * 2. Wallet balance cannot drop below 0 (negative balance prevention)
 * Automatically adapts between PostgreSQL (production) and SQLite (local dev/test fallback).
 */
export async function initDatabaseTriggers(client: PrismaClient = prisma) {
  const isPostgres = Boolean(
    process.env.DATABASE_URL &&
      (process.env.DATABASE_URL.startsWith('postgres://') ||
        process.env.DATABASE_URL.startsWith('postgresql://'))
  );

  if (isPostgres) {
    try {
      // 1. PostgreSQL Ledger Immutability Function & Triggers
      await client.$executeRawUnsafe(`
        CREATE OR REPLACE FUNCTION prevent_ledger_mutation()
        RETURNS TRIGGER AS $$
        BEGIN
          RAISE EXCEPTION 'LedgerEntry is append-only and cannot be updated or deleted';
        END;
        $$ LANGUAGE plpgsql;
      `);

      await client.$executeRawUnsafe(`
        DROP TRIGGER IF EXISTS trg_prevent_ledger_update ON "LedgerEntry";
        CREATE TRIGGER trg_prevent_ledger_update
        BEFORE UPDATE ON "LedgerEntry"
        FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutation();
      `);

      await client.$executeRawUnsafe(`
        DROP TRIGGER IF EXISTS trg_prevent_ledger_delete ON "LedgerEntry";
        CREATE TRIGGER trg_prevent_ledger_delete
        BEFORE DELETE ON "LedgerEntry"
        FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutation();
      `);

      // 2. Non-negative Wallet Balance Constraint
      await client.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'chk_wallet_balance_non_negative'
          ) THEN
            ALTER TABLE "Wallet" ADD CONSTRAINT chk_wallet_balance_non_negative CHECK (balance >= 0);
          END IF;
        END $$;
      `);
    } catch (err: any) {
      console.warn('[PostgreSQL Trigger Warning]:', err.message);
    }
  } else {
    // SQLite Fallback for Local Dev and Tests
    try {
      await client.$queryRawUnsafe('PRAGMA journal_mode = WAL;');
      await client.$queryRawUnsafe('PRAGMA busy_timeout = 10000;');

      await client.$executeRawUnsafe(`
        CREATE TRIGGER IF NOT EXISTS prevent_ledger_update
        BEFORE UPDATE ON LedgerEntry
        BEGIN
          SELECT RAISE(ABORT, 'LedgerEntry is append-only and cannot be updated');
        END;
      `);

      await client.$executeRawUnsafe(`
        CREATE TRIGGER IF NOT EXISTS prevent_ledger_delete
        BEFORE DELETE ON LedgerEntry
        BEGIN
          SELECT RAISE(ABORT, 'LedgerEntry is append-only and cannot be deleted');
        END;
      `);

      await client.$executeRawUnsafe(`
        CREATE TRIGGER IF NOT EXISTS prevent_negative_wallet_balance
        BEFORE UPDATE OF balance ON Wallet
        FOR EACH ROW
        WHEN NEW.balance < 0
        BEGIN
          SELECT RAISE(ABORT, 'Wallet balance cannot be negative');
        END;
      `);
    } catch {
      // Ignore if database does not support trigger creation
    }
  }
}

export * from '@prisma/client';

