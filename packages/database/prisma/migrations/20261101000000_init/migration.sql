-- ==============================================================================
-- NOVA Gaming Platform - Baseline PostgreSQL Migration
-- ==============================================================================

-- CreateTable: User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Wallet (balance in Santim minor units, non-negative)
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 100000,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "lockedBalance" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chk_wallet_balance_non_negative" CHECK ("balance" >= 0)
);

-- CreateTable: LedgerEntry (append-only financial audit log)
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "balanceAfter" BIGINT NOT NULL,
    "type" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "actorId" TEXT,
    "meta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Match (PvP challenges and live matches)
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'LOBBY',
    "stakeMinor" BIGINT NOT NULL,
    "rakeBps" INTEGER NOT NULL DEFAULT 500,
    "whiteUserId" TEXT,
    "blackUserId" TEXT,
    "state" TEXT NOT NULL,
    "clocks" TEXT,
    "moveCount" INTEGER NOT NULL DEFAULT 0,
    "winnerId" TEXT,
    "result" TEXT,
    "inviteCode" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable: MatchMove (Authoritative dispute audit record)
CREATE TABLE "MatchMove" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "ply" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "fromPos" TEXT NOT NULL,
    "pathPos" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchMove_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AbuseFlag (Anti-collusion and chip-dumping detections)
CREATE TABLE "AbuseFlag" (
    "id" TEXT NOT NULL,
    "matchId" TEXT,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbuseFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Transaction (Payment gateway records)
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "referenceId" TEXT,
    "phoneNumber" TEXT,
    "receiptUrl" TEXT,
    "paymentMethod" TEXT,
    "description" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ProvablyFairSeed
CREATE TABLE "ProvablyFairSeed" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serverSeed" TEXT NOT NULL,
    "serverSeedHash" TEXT NOT NULL,
    "clientSeed" TEXT NOT NULL,
    "nonce" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProvablyFairSeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Bet
CREATE TABLE "Bet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seedId" TEXT,
    "gameId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL,
    "payout" INTEGER NOT NULL,
    "profit" INTEGER NOT NULL,
    "won" BOOLEAN NOT NULL,
    "outcome" TEXT NOT NULL,
    "serverSeed" TEXT NOT NULL,
    "serverSeedHash" TEXT NOT NULL,
    "clientSeed" TEXT NOT NULL,
    "nonce" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bet_pkey" PRIMARY KEY ("id")
);

-- CreateTable: GameConfig
CREATE TABLE "GameConfig" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "houseEdgePercent" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "minBet" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "maxBet" DOUBLE PRECISION NOT NULL DEFAULT 10000.0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AdminAuditLog
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- Unique & Lookup Indexes
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");
CREATE UNIQUE INDEX "LedgerEntry_idempotencyKey_key" ON "LedgerEntry"("idempotencyKey");
CREATE INDEX "LedgerEntry_walletId_idx" ON "LedgerEntry"("walletId");
CREATE INDEX "LedgerEntry_idempotencyKey_idx" ON "LedgerEntry"("idempotencyKey");
CREATE UNIQUE INDEX "Match_inviteCode_key" ON "Match"("inviteCode");
CREATE INDEX "Match_status_idx" ON "Match"("status");
CREATE INDEX "Match_whiteUserId_idx" ON "Match"("whiteUserId");
CREATE INDEX "Match_blackUserId_idx" ON "Match"("blackUserId");
CREATE INDEX "MatchMove_matchId_idx" ON "MatchMove"("matchId");
CREATE INDEX "AbuseFlag_userId_idx" ON "AbuseFlag"("userId");
CREATE INDEX "AbuseFlag_type_idx" ON "AbuseFlag"("type");
CREATE UNIQUE INDEX "Transaction_referenceId_key" ON "Transaction"("referenceId");
CREATE INDEX "ProvablyFairSeed_userId_active_idx" ON "ProvablyFairSeed"("userId", "active");
CREATE INDEX "Bet_userId_idx" ON "Bet"("userId");
CREATE INDEX "Bet_gameId_idx" ON "Bet"("gameId");
CREATE UNIQUE INDEX "GameConfig_gameId_key" ON "GameConfig"("gameId");
CREATE INDEX "AdminAuditLog_adminId_idx" ON "AdminAuditLog"("adminId");
CREATE INDEX "AdminAuditLog_action_idx" ON "AdminAuditLog"("action");

-- Foreign Key Constraints
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatchMove" ADD CONSTRAINT "MatchMove_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProvablyFairSeed" ADD CONSTRAINT "ProvablyFairSeed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_seedId_fkey" FOREIGN KEY ("seedId") REFERENCES "ProvablyFairSeed"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ==============================================================================
-- Database-Level Immutability Triggers (Append-Only Ledger Protection)
-- ==============================================================================

CREATE OR REPLACE FUNCTION prevent_ledger_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'LedgerEntry is append-only and cannot be modified or deleted at database level';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_ledger_update ON "LedgerEntry";
CREATE TRIGGER trg_prevent_ledger_update
BEFORE UPDATE ON "LedgerEntry"
FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutation();

DROP TRIGGER IF EXISTS trg_prevent_ledger_delete ON "LedgerEntry";
CREATE TRIGGER trg_prevent_ledger_delete
BEFORE DELETE ON "LedgerEntry"
FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutation();

