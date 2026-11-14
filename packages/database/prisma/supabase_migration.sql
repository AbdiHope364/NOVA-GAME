-- Clean reset for fresh deployment (prevents "relation already exists" errors)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "avatarUrl" TEXT,
    "avatarFrame" TEXT NOT NULL DEFAULT 'violet',
    "equippedBadge" TEXT,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "chessElo" INTEGER NOT NULL DEFAULT 1200,
    "chessGamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "chessWins" INTEGER NOT NULL DEFAULT 0,
    "chessDraws" INTEGER NOT NULL DEFAULT 0,
    "chessLosses" INTEGER NOT NULL DEFAULT 0,
    "lastActiveAt" TIMESTAMP(3),
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "soundEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notificationPrefs" TEXT,
    "notificationsLastReadAt" TIMESTAMP(3),
    "deviceFingerprint" TEXT,
    "registrationIpHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "bonusBalance" INTEGER NOT NULL DEFAULT 0,
    "lockedWinnings" INTEGER NOT NULL DEFAULT 0,
    "withdrawableBalance" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "lockedBalance" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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
    "rulesetVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "ruleOptions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "AbuseFlag" (
    "id" TEXT NOT NULL,
    "matchId" TEXT,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbuseFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "LettiRound" (
    "id" TEXT NOT NULL,
    "roundCode" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pickedIndex" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PREPARED',
    "serverSeed" TEXT NOT NULL,
    "serverSeedHash" TEXT NOT NULL,
    "clientSeed" TEXT NOT NULL,
    "nonce" INTEGER NOT NULL,
    "shuffledOrder" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "betId" TEXT,
    "amountSantim" INTEGER,
    "payoutSantim" INTEGER,
    "won" BOOLEAN,
    "outcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMP(3),

    CONSTRAINT "LettiRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "RoundConfig" (
    "id" TEXT NOT NULL DEFAULT 'active_bingo_round',
    "gameId" TEXT NOT NULL DEFAULT 'bingo',
    "roundId" TEXT NOT NULL DEFAULT 'NOVA-1024',
    "stake" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "prize" DOUBLE PRECISION NOT NULL DEFAULT 350.0,
    "adminFee" DOUBLE PRECISION NOT NULL DEFAULT 150.0,
    "maxSlots" INTEGER NOT NULL DEFAULT 10,
    "activePlayers" INTEGER NOT NULL DEFAULT 10,
    "pattern" TEXT NOT NULL DEFAULT 'FULL_HOUSE',
    "patternName" TEXT NOT NULL DEFAULT 'Full House',
    "patternDescription" TEXT NOT NULL DEFAULT 'Get all numbers in the card!',
    "status" TEXT NOT NULL DEFAULT 'ON_GOING',
    "nextNumberCountdown" INTEGER NOT NULL DEFAULT 45,
    "gameName" TEXT NOT NULL DEFAULT 'NovaGame',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoundConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BonusCampaign" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'WELCOME_1000',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "bonusPercent" INTEGER NOT NULL DEFAULT 1000,
    "promoBaseSantim" INTEGER NOT NULL DEFAULT 1000,
    "maxBonusSantim" INTEGER NOT NULL DEFAULT 10000,
    "minDepositSantim" INTEGER NOT NULL DEFAULT 5000,
    "wageringMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "eligibleGames" TEXT NOT NULL DEFAULT 'ALL',
    "expirationDays" INTEGER NOT NULL DEFAULT 14,
    "requireVerification" BOOLEAN NOT NULL DEFAULT true,
    "referralsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "referralRewardSantim" INTEGER NOT NULL DEFAULT 1000,
    "referralMinDepositSantim" INTEGER NOT NULL DEFAULT 5000,
    "referralApprovalMode" TEXT NOT NULL DEFAULT 'AUTO',
    "referralRewardType" TEXT NOT NULL DEFAULT 'PROMOTIONAL',
    "maxReferralsPerUser" INTEGER NOT NULL DEFAULT 50,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BonusCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBonus" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "baseAmountSantim" INTEGER NOT NULL,
    "bonusPercent" INTEGER NOT NULL,
    "bonusAmountSantim" INTEGER NOT NULL,
    "remainingBonusSantim" INTEGER NOT NULL,
    "wagerTargetSantim" INTEGER NOT NULL,
    "wageredSantim" INTEGER NOT NULL DEFAULT 0,
    "eligibleGames" TEXT NOT NULL DEFAULT 'ALL',
    "idempotencyKey" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "UserBonus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BonusTransaction" (
    "id" TEXT NOT NULL,
    "userBonusId" TEXT,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amountSantim" INTEGER NOT NULL,
    "bonusBalanceAfterSantim" INTEGER NOT NULL,
    "lockedWinningsAfterSantim" INTEGER NOT NULL,
    "cashBalanceAfterSantim" INTEGER NOT NULL,
    "gameId" TEXT,
    "betId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BonusTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BonusWageringProgress" (
    "id" TEXT NOT NULL,
    "userBonusId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requiredWagerSantim" INTEGER NOT NULL,
    "completedWagerSantim" INTEGER NOT NULL DEFAULT 0,
    "remainingWagerSantim" INTEGER NOT NULL,
    "gamesPlayedCount" INTEGER NOT NULL DEFAULT 0,
    "lastWageredAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BonusWageringProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WithdrawalEligibility" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "firstDepositCompleted" BOOLEAN NOT NULL DEFAULT false,
    "firstDepositAmountSantim" INTEGER NOT NULL DEFAULT 0,
    "firstDepositTxId" TEXT,
    "wageringCompleted" BOOLEAN NOT NULL DEFAULT false,
    "eligibleToWithdraw" BOOLEAN NOT NULL DEFAULT false,
    "ineligibleReason" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WithdrawalEligibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "referralCodeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "qualifyingDepositTxId" TEXT,
    "qualifyingDepositSantim" INTEGER NOT NULL DEFAULT 0,
    "deviceFingerprint" TEXT,
    "ipHash" TEXT,
    "fraudScore" INTEGER NOT NULL DEFAULT 0,
    "fraudReason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralReward" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "rewardType" TEXT NOT NULL DEFAULT 'PROMOTIONAL',
    "amountSantim" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT NOT NULL,
    "transactionId" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LettiMultiplayerConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "quickMatchEnabled" BOOLEAN NOT NULL DEFAULT true,
    "privateRoomsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "minStakeSantim" INTEGER NOT NULL DEFAULT 1000,
    "maxStakeSantim" INTEGER NOT NULL DEFAULT 500000,
    "platformFeeBps" INTEGER NOT NULL DEFAULT 500,
    "reconnectGraceSeconds" INTEGER NOT NULL DEFAULT 45,
    "maxDisconnects" INTEGER NOT NULL DEFAULT 3,
    "roomExpiryMinutes" INTEGER NOT NULL DEFAULT 15,
    "turnTimeoutSeconds" INTEGER NOT NULL DEFAULT 30,
    "allowBonusBalance" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LettiMultiplayerConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LettiRoom" (
    "id" TEXT NOT NULL,
    "roomCode" TEXT NOT NULL,
    "roomType" TEXT NOT NULL DEFAULT 'PRIVATE',
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "stakeSantim" INTEGER NOT NULL,
    "hostId" TEXT NOT NULL,
    "rematchAcceptedBy" TEXT NOT NULL DEFAULT '[]',
    "rematchNextRoomId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "LettiRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LettiPlayer" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seat" INTEGER NOT NULL,
    "ready" BOOLEAN NOT NULL DEFAULT false,
    "connectionStatus" TEXT NOT NULL DEFAULT 'CONNECTED',
    "disconnectCount" INTEGER NOT NULL DEFAULT 0,
    "stakeLocked" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnectedAt" TIMESTAMP(3),

    CONSTRAINT "LettiPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LettiMatch" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "playerOneId" TEXT NOT NULL,
    "playerTwoId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PICKING',
    "currentTurnUserId" TEXT,
    "gameState" TEXT NOT NULL,
    "winnerId" TEXT,
    "resultType" TEXT,
    "totalPotSantim" INTEGER NOT NULL,
    "platformFeeSantim" INTEGER NOT NULL,
    "payoutSantim" INTEGER NOT NULL DEFAULT 0,
    "serverSeed" TEXT NOT NULL,
    "serverSeedHash" TEXT NOT NULL,
    "clientSeed" TEXT NOT NULL,
    "nonce" INTEGER NOT NULL DEFAULT 1,
    "settled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "LettiMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LettiAction" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "actionData" TEXT,
    "sequenceNumber" INTEGER NOT NULL,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LettiAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Friendship" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "addresseeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBlock" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameInvite" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "gameType" TEXT NOT NULL,
    "roomCode" TEXT NOT NULL,
    "stakeEtb" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyRewardCampaignConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "dailyStreakEnabled" BOOLEAN NOT NULL DEFAULT true,
    "missionsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "dayRewardsJson" TEXT NOT NULL DEFAULT '[5,10,15,20,25,35,50]',
    "wageringMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "requireVerifiedAccount" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyRewardCampaignConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyCheckIn" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "checkInDate" TEXT NOT NULL,
    "streakDay" INTEGER NOT NULL,
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "bonusAwardedSantim" INTEGER NOT NULL DEFAULT 0,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionProgressClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionCode" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "bonusAwardedSantim" INTEGER NOT NULL DEFAULT 0,
    "idempotencyKey" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissionProgressClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChessRoom" (
    "id" TEXT NOT NULL,
    "roomCode" TEXT NOT NULL,
    "roomType" TEXT NOT NULL DEFAULT 'PRIVATE',
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "timeControl" TEXT NOT NULL DEFAULT 'BLITZ_5_0',
    "category" TEXT NOT NULL DEFAULT 'BLITZ',
    "baseTimeMs" INTEGER NOT NULL DEFAULT 300000,
    "incrementMs" INTEGER NOT NULL DEFAULT 0,
    "isRanked" BOOLEAN NOT NULL DEFAULT true,
    "hostId" TEXT NOT NULL,
    "guestId" TEXT,
    "rematchAcceptedBy" TEXT NOT NULL DEFAULT '[]',
    "rematchNextRoomId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ChessRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChessMatch" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "whiteUserId" TEXT NOT NULL,
    "blackUserId" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'PVP',
    "aiDifficulty" TEXT,
    "category" TEXT NOT NULL DEFAULT 'BLITZ',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "fen" TEXT NOT NULL,
    "pgn" TEXT NOT NULL DEFAULT '',
    "movesJson" TEXT NOT NULL DEFAULT '[]',
    "moveCount" INTEGER NOT NULL DEFAULT 0,
    "whiteTimeMs" INTEGER NOT NULL DEFAULT 300000,
    "blackTimeMs" INTEGER NOT NULL DEFAULT 300000,
    "turnColor" TEXT NOT NULL DEFAULT 'w',
    "lastMoveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "drawOfferedBy" TEXT,
    "winnerId" TEXT,
    "winnerColor" TEXT,
    "termination" TEXT,
    "isRanked" BOOLEAN NOT NULL DEFAULT true,
    "ratingsUpdated" BOOLEAN NOT NULL DEFAULT false,
    "whiteEloBefore" INTEGER NOT NULL DEFAULT 1200,
    "whiteEloAfter" INTEGER,
    "blackEloBefore" INTEGER NOT NULL DEFAULT 1200,
    "blackEloAfter" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ChessMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChessMatchParticipant" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "ratingBefore" INTEGER NOT NULL DEFAULT 1200,
    "ratingAfter" INTEGER,
    "ratingDelta" INTEGER NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION,
    "connectionStatus" TEXT NOT NULL DEFAULT 'CONNECTED',
    "disconnectedAt" TIMESTAMP(3),
    "disconnectCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ChessMatchParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChessPlayerRating" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 1200,
    "peakRating" INTEGER NOT NULL DEFAULT 1200,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "winStreak" INTEGER NOT NULL DEFAULT 0,
    "bestWinStreak" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChessPlayerRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChessConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "rankedEnabled" BOOLEAN NOT NULL DEFAULT true,
    "casualEnabled" BOOLEAN NOT NULL DEFAULT true,
    "aiEnabled" BOOLEAN NOT NULL DEFAULT true,
    "maxAiDifficulty" TEXT NOT NULL DEFAULT 'EXPERT',
    "enabledTimeControlsJson" TEXT NOT NULL DEFAULT '["BULLET_1_0","BULLET_2_1","BLITZ_3_0","BLITZ_3_2","BLITZ_5_0","RAPID_10_0","RAPID_10_5","RAPID_15_10","CLASSICAL_30_0"]',
    "disconnectGraceSeconds" INTEGER NOT NULL DEFAULT 45,
    "abortWindowPlies" INTEGER NOT NULL DEFAULT 2,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChessConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChessMove" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "ply" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "uci" TEXT NOT NULL,
    "san" TEXT NOT NULL,
    "fenAfter" TEXT NOT NULL,
    "whiteTimeMs" INTEGER NOT NULL,
    "blackTimeMs" INTEGER NOT NULL,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChessMove_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LudoConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LudoConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LudoRoom" (
    "id" TEXT NOT NULL,
    "roomCode" TEXT NOT NULL,
    "roomType" TEXT NOT NULL DEFAULT 'PRIVATE',
    "playerCount" INTEGER NOT NULL DEFAULT 2,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "stakeSantim" INTEGER NOT NULL DEFAULT 0,
    "hostId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "LudoRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LudoPlayer" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
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

    CONSTRAINT "LudoPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LudoMatch" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
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
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "LudoMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LudoAction" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
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
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LudoAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerEntry_idempotencyKey_key" ON "LedgerEntry"("idempotencyKey");

-- CreateIndex
CREATE INDEX "LedgerEntry_walletId_idx" ON "LedgerEntry"("walletId");

-- CreateIndex
CREATE INDEX "LedgerEntry_idempotencyKey_idx" ON "LedgerEntry"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Match_inviteCode_key" ON "Match"("inviteCode");

-- CreateIndex
CREATE INDEX "Match_status_idx" ON "Match"("status");

-- CreateIndex
CREATE INDEX "Match_whiteUserId_idx" ON "Match"("whiteUserId");

-- CreateIndex
CREATE INDEX "Match_blackUserId_idx" ON "Match"("blackUserId");

-- CreateIndex
CREATE INDEX "MatchMove_matchId_idx" ON "MatchMove"("matchId");

-- CreateIndex
CREATE INDEX "AbuseFlag_userId_idx" ON "AbuseFlag"("userId");

-- CreateIndex
CREATE INDEX "AbuseFlag_type_idx" ON "AbuseFlag"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_referenceId_key" ON "Transaction"("referenceId");

-- CreateIndex
CREATE INDEX "ProvablyFairSeed_userId_active_idx" ON "ProvablyFairSeed"("userId", "active");

-- CreateIndex
CREATE INDEX "Bet_userId_idx" ON "Bet"("userId");

-- CreateIndex
CREATE INDEX "Bet_gameId_idx" ON "Bet"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "LettiRound_roundCode_key" ON "LettiRound"("roundCode");

-- CreateIndex
CREATE UNIQUE INDEX "LettiRound_idempotencyKey_key" ON "LettiRound"("idempotencyKey");

-- CreateIndex
CREATE INDEX "LettiRound_userId_status_idx" ON "LettiRound"("userId", "status");

-- CreateIndex
CREATE INDEX "LettiRound_userId_createdAt_idx" ON "LettiRound"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GameConfig_gameId_key" ON "GameConfig"("gameId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_adminId_idx" ON "AdminAuditLog"("adminId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_action_idx" ON "AdminAuditLog"("action");

-- CreateIndex
CREATE UNIQUE INDEX "RoundConfig_gameId_key" ON "RoundConfig"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "BonusCampaign_code_key" ON "BonusCampaign"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UserBonus_idempotencyKey_key" ON "UserBonus"("idempotencyKey");

-- CreateIndex
CREATE INDEX "UserBonus_userId_status_idx" ON "UserBonus"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UserBonus_userId_campaignId_key" ON "UserBonus"("userId", "campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "BonusTransaction_idempotencyKey_key" ON "BonusTransaction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "BonusTransaction_userId_createdAt_idx" ON "BonusTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "BonusTransaction_walletId_idx" ON "BonusTransaction"("walletId");

-- CreateIndex
CREATE UNIQUE INDEX "BonusWageringProgress_userBonusId_key" ON "BonusWageringProgress"("userBonusId");

-- CreateIndex
CREATE INDEX "BonusWageringProgress_userId_idx" ON "BonusWageringProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WithdrawalEligibility_userId_key" ON "WithdrawalEligibility"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_userId_key" ON "ReferralCode"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_code_key" ON "ReferralCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referredUserId_key" ON "Referral"("referredUserId");

-- CreateIndex
CREATE INDEX "Referral_referrerId_status_idx" ON "Referral"("referrerId", "status");

-- CreateIndex
CREATE INDEX "Referral_status_idx" ON "Referral"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralReward_idempotencyKey_key" ON "ReferralReward"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ReferralReward_referrerId_status_idx" ON "ReferralReward"("referrerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralReward_referredUserId_campaignId_key" ON "ReferralReward"("referredUserId", "campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "LettiRoom_roomCode_key" ON "LettiRoom"("roomCode");

-- CreateIndex
CREATE INDEX "LettiRoom_status_roomType_stakeSantim_idx" ON "LettiRoom"("status", "roomType", "stakeSantim");

-- CreateIndex
CREATE INDEX "LettiRoom_hostId_idx" ON "LettiRoom"("hostId");

-- CreateIndex
CREATE INDEX "LettiPlayer_userId_idx" ON "LettiPlayer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LettiPlayer_roomId_userId_key" ON "LettiPlayer"("roomId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "LettiPlayer_roomId_seat_key" ON "LettiPlayer"("roomId", "seat");

-- CreateIndex
CREATE UNIQUE INDEX "LettiMatch_roomId_key" ON "LettiMatch"("roomId");

-- CreateIndex
CREATE INDEX "LettiMatch_playerOneId_status_idx" ON "LettiMatch"("playerOneId", "status");

-- CreateIndex
CREATE INDEX "LettiMatch_playerTwoId_status_idx" ON "LettiMatch"("playerTwoId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LettiAction_idempotencyKey_key" ON "LettiAction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "LettiAction_matchId_idx" ON "LettiAction"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "LettiAction_matchId_sequenceNumber_key" ON "LettiAction"("matchId", "sequenceNumber");

-- CreateIndex
CREATE INDEX "Friendship_addresseeId_status_idx" ON "Friendship"("addresseeId", "status");

-- CreateIndex
CREATE INDEX "Friendship_requesterId_status_idx" ON "Friendship"("requesterId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_requesterId_addresseeId_key" ON "Friendship"("requesterId", "addresseeId");

-- CreateIndex
CREATE INDEX "UserBlock_blockerId_idx" ON "UserBlock"("blockerId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBlock_blockerId_blockedId_key" ON "UserBlock"("blockerId", "blockedId");

-- CreateIndex
CREATE INDEX "UserReport_status_idx" ON "UserReport"("status");

-- CreateIndex
CREATE INDEX "UserReport_reportedUserId_idx" ON "UserReport"("reportedUserId");

-- CreateIndex
CREATE INDEX "GameInvite_recipientId_status_idx" ON "GameInvite"("recipientId", "status");

-- CreateIndex
CREATE INDEX "GameInvite_senderId_idx" ON "GameInvite"("senderId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCheckIn_idempotencyKey_key" ON "DailyCheckIn"("idempotencyKey");

-- CreateIndex
CREATE INDEX "DailyCheckIn_userId_createdAt_idx" ON "DailyCheckIn"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCheckIn_userId_checkInDate_key" ON "DailyCheckIn"("userId", "checkInDate");

-- CreateIndex
CREATE UNIQUE INDEX "MissionProgressClaim_idempotencyKey_key" ON "MissionProgressClaim"("idempotencyKey");

-- CreateIndex
CREATE INDEX "MissionProgressClaim_userId_idx" ON "MissionProgressClaim"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MissionProgressClaim_userId_missionCode_periodKey_key" ON "MissionProgressClaim"("userId", "missionCode", "periodKey");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_idx" ON "UserAchievement"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_code_key" ON "UserAchievement"("userId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "ChessRoom_roomCode_key" ON "ChessRoom"("roomCode");

-- CreateIndex
CREATE INDEX "ChessRoom_status_roomType_timeControl_isRanked_idx" ON "ChessRoom"("status", "roomType", "timeControl", "isRanked");

-- CreateIndex
CREATE INDEX "ChessRoom_hostId_idx" ON "ChessRoom"("hostId");

-- CreateIndex
CREATE UNIQUE INDEX "ChessMatch_roomId_key" ON "ChessMatch"("roomId");

-- CreateIndex
CREATE INDEX "ChessMatch_whiteUserId_status_idx" ON "ChessMatch"("whiteUserId", "status");

-- CreateIndex
CREATE INDEX "ChessMatch_blackUserId_status_idx" ON "ChessMatch"("blackUserId", "status");

-- CreateIndex
CREATE INDEX "ChessMatch_status_startedAt_idx" ON "ChessMatch"("status", "startedAt");

-- CreateIndex
CREATE INDEX "ChessMatchParticipant_userId_idx" ON "ChessMatchParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChessMatchParticipant_matchId_userId_key" ON "ChessMatchParticipant"("matchId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChessMatchParticipant_matchId_color_key" ON "ChessMatchParticipant"("matchId", "color");

-- CreateIndex
CREATE INDEX "ChessPlayerRating_category_rating_idx" ON "ChessPlayerRating"("category", "rating");

-- CreateIndex
CREATE UNIQUE INDEX "ChessPlayerRating_userId_category_key" ON "ChessPlayerRating"("userId", "category");

-- CreateIndex
CREATE INDEX "ChessMove_matchId_idx" ON "ChessMove"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "ChessMove_matchId_ply_key" ON "ChessMove"("matchId", "ply");

-- CreateIndex
CREATE UNIQUE INDEX "ChessMove_matchId_idempotencyKey_key" ON "ChessMove"("matchId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "LudoRoom_roomCode_key" ON "LudoRoom"("roomCode");

-- CreateIndex
CREATE INDEX "LudoRoom_status_roomType_playerCount_stakeSantim_idx" ON "LudoRoom"("status", "roomType", "playerCount", "stakeSantim");

-- CreateIndex
CREATE INDEX "LudoRoom_hostId_idx" ON "LudoRoom"("hostId");

-- CreateIndex
CREATE INDEX "LudoPlayer_userId_idx" ON "LudoPlayer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LudoPlayer_roomId_userId_key" ON "LudoPlayer"("roomId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "LudoPlayer_roomId_seat_key" ON "LudoPlayer"("roomId", "seat");

-- CreateIndex
CREATE UNIQUE INDEX "LudoMatch_roomId_key" ON "LudoMatch"("roomId");

-- CreateIndex
CREATE INDEX "LudoMatch_status_createdAt_idx" ON "LudoMatch"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LudoAction_idempotencyKey_key" ON "LudoAction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "LudoAction_matchId_idx" ON "LudoAction"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "LudoAction_matchId_sequenceNumber_key" ON "LudoAction"("matchId", "sequenceNumber");

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchMove" ADD CONSTRAINT "MatchMove_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProvablyFairSeed" ADD CONSTRAINT "ProvablyFairSeed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_seedId_fkey" FOREIGN KEY ("seedId") REFERENCES "ProvablyFairSeed"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBonus" ADD CONSTRAINT "UserBonus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBonus" ADD CONSTRAINT "UserBonus_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "BonusCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonusTransaction" ADD CONSTRAINT "BonusTransaction_userBonusId_fkey" FOREIGN KEY ("userBonusId") REFERENCES "UserBonus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonusTransaction" ADD CONSTRAINT "BonusTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonusTransaction" ADD CONSTRAINT "BonusTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonusWageringProgress" ADD CONSTRAINT "BonusWageringProgress_userBonusId_fkey" FOREIGN KEY ("userBonusId") REFERENCES "UserBonus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonusWageringProgress" ADD CONSTRAINT "BonusWageringProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalEligibility" ADD CONSTRAINT "WithdrawalEligibility_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralCode" ADD CONSTRAINT "ReferralCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referralCodeId_fkey" FOREIGN KEY ("referralCodeId") REFERENCES "ReferralCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "BonusCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LettiPlayer" ADD CONSTRAINT "LettiPlayer_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "LettiRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LettiMatch" ADD CONSTRAINT "LettiMatch_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "LettiRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LettiAction" ADD CONSTRAINT "LettiAction_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "LettiMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChessMatch" ADD CONSTRAINT "ChessMatch_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChessRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChessMatchParticipant" ADD CONSTRAINT "ChessMatchParticipant_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "ChessMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChessMove" ADD CONSTRAINT "ChessMove_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "ChessMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LudoPlayer" ADD CONSTRAINT "LudoPlayer_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "LudoRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LudoMatch" ADD CONSTRAINT "LudoMatch_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "LudoRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LudoAction" ADD CONSTRAINT "LudoAction_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "LudoMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- 1. PostgreSQL Ledger Immutability Function & Triggers
CREATE OR REPLACE FUNCTION prevent_ledger_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'LedgerEntry is append-only and cannot be updated or deleted';
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

-- 2. Non-negative Wallet Balance Constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_wallet_balance_non_negative'
  ) THEN
    ALTER TABLE "Wallet" ADD CONSTRAINT chk_wallet_balance_non_negative CHECK (balance >= 0);
  END IF;
END $$;

-- 3. Player Minimal Auth & Verification Schema Extension
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneVerifiedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "locale" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ageVerifiedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone");

CREATE TABLE IF NOT EXISTS "OtpCode" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OtpCode_identifier_purpose_idx" ON "OtpCode"("identifier", "purpose");

CREATE TABLE IF NOT EXISTS "ConsentRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "identifier" TEXT,
    "termsVersion" TEXT NOT NULL DEFAULT '1.0',
    "privacyVersion" TEXT NOT NULL DEFAULT '1.0',
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ConsentRecord_userId_idx" ON "ConsentRecord"("userId");
CREATE INDEX IF NOT EXISTS "ConsentRecord_identifier_idx" ON "ConsentRecord"("identifier");

