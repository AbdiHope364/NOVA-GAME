-- Migration: Add NOVA Ludo (2-4 players, LUDO_HMAC_V1 fairness, wallet lock/settlement)
CREATE TABLE IF NOT EXISTS "LudoConfig" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "realMoneyEnabled" BOOLEAN NOT NULL DEFAULT false,
  "quickMatchEnabled" BOOLEAN NOT NULL DEFAULT true,
  "privateRoomsEnabled" BOOLEAN NOT NULL DEFAULT true,
  "aiEnabled" BOOLEAN NOT NULL DEFAULT true,
  "minStakeSantim" INTEGER NOT NULL DEFAULT 1000,
  "maxStakeSantim" INTEGER NOT NULL DEFAULT 500000,
  "platformFeeBps" INTEGER NOT NULL DEFAULT 500,
  "turnTimeoutSeconds" INTEGER NOT NULL DEFAULT 30,
  "moveWindowSeconds" INTEGER NOT NULL DEFAULT 12,
  "reconnectGraceSeconds" INTEGER NOT NULL DEFAULT 45,
  "maxMissedTurns" INTEGER NOT NULL DEFAULT 3,
  "allowBonusBalance" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "LudoRoom" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "roomCode" TEXT NOT NULL UNIQUE,
  "roomType" TEXT NOT NULL DEFAULT 'PRIVATE',
  "playerCount" INTEGER NOT NULL DEFAULT 2,
  "status" TEXT NOT NULL DEFAULT 'WAITING',
  "stakeSantim" INTEGER NOT NULL DEFAULT 0,
  "hostId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS "LudoPlayer" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "roomId" TEXT NOT NULL REFERENCES "LudoRoom"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL,
  "seat" INTEGER NOT NULL,
  "color" TEXT NOT NULL,
  "clientSeed" TEXT NOT NULL,
  "stakeLocked" BOOLEAN NOT NULL DEFAULT false,
  "forfeited" BOOLEAN NOT NULL DEFAULT false,
  "missedTurns" INTEGER NOT NULL DEFAULT 0,
  "connectionStatus" TEXT NOT NULL DEFAULT 'CONNECTED',
  "disconnectedAt" TIMESTAMP(3),
  "disconnectCount" INTEGER NOT NULL DEFAULT 0,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("roomId", "userId"),
  UNIQUE("roomId", "seat")
);

CREATE TABLE IF NOT EXISTS "LudoMatch" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "roomId" TEXT NOT NULL UNIQUE REFERENCES "LudoRoom"("id") ON DELETE CASCADE,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "rulesetVersion" TEXT NOT NULL DEFAULT 'NOVA_CLASSIC_V1',
  "fairnessVersion" TEXT NOT NULL DEFAULT 'LUDO_HMAC_V1',
  "serverSeed" TEXT NOT NULL,
  "serverSeedHash" TEXT NOT NULL,
  "combinedClientSeed" TEXT NOT NULL,
  "nonce" INTEGER NOT NULL DEFAULT 0,
  "turnSeat" INTEGER NOT NULL DEFAULT 1,
  "turnPhase" TEXT NOT NULL DEFAULT 'ROLL',
  "diceValue" INTEGER,
  "consecutiveSixes" INTEGER NOT NULL DEFAULT 0,
  "turnDeadlineAt" TIMESTAMP(3),
  "turnPausedRemainMs" INTEGER,
  "gameStateJson" TEXT NOT NULL,
  "winnerId" TEXT,
  "winnerColor" TEXT,
  "totalPotSantim" INTEGER NOT NULL DEFAULT 0,
  "platformFeeSantim" INTEGER NOT NULL DEFAULT 0,
  "payoutSantim" INTEGER NOT NULL DEFAULT 0,
  "settled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS "LudoAction" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "matchId" TEXT NOT NULL REFERENCES "LudoMatch"("id") ON DELETE CASCADE,
  "sequenceNumber" INTEGER NOT NULL,
  "userId" TEXT NOT NULL,
  "seat" INTEGER NOT NULL,
  "actionType" TEXT NOT NULL,
  "diceValue" INTEGER,
  "tokenIndex" INTEGER,
  "fromProgress" INTEGER,
  "toProgress" INTEGER,
  "capturedTokensJson" TEXT,
  "nonce" INTEGER,
  "idempotencyKey" TEXT UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("matchId", "sequenceNumber")
);
