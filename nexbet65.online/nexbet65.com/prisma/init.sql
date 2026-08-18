-- nexbet65.com additive migration (idempotent).
-- IMPORTANT: never run `prisma db push --accept-data-loss` from nexbet65.com — Prisma
-- treats the shared User/Round/Bet tables as unmanaged drift and would DROP them.
-- This file ONLY creates nexbet65.com's namespaced tables. Safe to re-run.
-- Apply with:  npx prisma db execute --file prisma/init.sql --schema prisma/schema.prisma

CREATE TABLE IF NOT EXISTS "WinUser" (
  "id"           TEXT         NOT NULL,
  "username"     TEXT         NOT NULL,
  "passwordHash" TEXT         NOT NULL,
  "avatar"       TEXT         NOT NULL DEFAULT '#a3e635',
  "memberSince"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "balance"      DECIMAL(16,2) NOT NULL DEFAULT 0,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WinUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WinUser_username_key" ON "WinUser"("username");

-- No signup bonus: new users start at 0. PG has no ADD COLUMN DEFAULT IF NOT
-- EXISTS, so this ALTER is idempotent by construction (same value each run).
ALTER TABLE "WinUser" ALTER COLUMN "balance" SET DEFAULT 0;

-- Non-withdrawable bonus balance (first-deposit bonus, referral rewards,
-- cashback, MLM commission). ADD COLUMN IF NOT EXISTS + constant DEFAULT keeps
-- this idempotent; NOT NULL is satisfiable for existing rows because of DEFAULT.
ALTER TABLE "WinUser" ADD COLUMN IF NOT EXISTS "lockedBonus" DECIMAL(16,2) NOT NULL DEFAULT 0;

-- Referral tree: who referred this user (set once at registration from the
-- referrer's referral code = username). Nullable, SetNull on referrer delete.
ALTER TABLE "WinUser" ADD COLUMN IF NOT EXISTS "referredById" TEXT;
CREATE INDEX IF NOT EXISTS "WinUser_referredById_idx" ON "WinUser"("referredById");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'WinUser_referredById_fkey'
  ) THEN
    ALTER TABLE "WinUser" ADD CONSTRAINT "WinUser_referredById_fkey"
      FOREIGN KEY ("referredById") REFERENCES "WinUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS "WinTransaction" (
  "id"           TEXT         NOT NULL,
  "userId"       TEXT         NOT NULL,
  "kind"         TEXT         NOT NULL,
  "amount"       DECIMAL(16,2) NOT NULL,
  "balanceAfter" DECIMAL(16,2) NOT NULL,
  "ref"          TEXT,
  "meta"         TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WinTransaction_pkey" PRIMARY KEY ("id")
);

-- Payment-request columns (deposit / withdraw flow). Additive & idempotent.
ALTER TABLE "WinTransaction" ADD COLUMN IF NOT EXISTS "type" TEXT;
ALTER TABLE "WinTransaction" ADD COLUMN IF NOT EXISTS "method" TEXT;
ALTER TABLE "WinTransaction" ADD COLUMN IF NOT EXISTS "transactionId" TEXT;
ALTER TABLE "WinTransaction" ADD COLUMN IF NOT EXISTS "senderAccount" TEXT;
ALTER TABLE "WinTransaction" ADD COLUMN IF NOT EXISTS "status" TEXT;
ALTER TABLE "WinTransaction" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
ALTER TABLE "WinTransaction" ADD COLUMN IF NOT EXISTS "firstDepositBonus" DECIMAL(16,2);

CREATE UNIQUE INDEX IF NOT EXISTS "WinTransaction_ref_key" ON "WinTransaction"("ref");
CREATE INDEX IF NOT EXISTS "WinTransaction_userId_idx" ON "WinTransaction"("userId");
CREATE INDEX IF NOT EXISTS "WinTransaction_createdAt_idx" ON "WinTransaction"("createdAt");
CREATE INDEX IF NOT EXISTS "WinTransaction_kind_idx" ON "WinTransaction"("kind");
CREATE INDEX IF NOT EXISTS "WinTransaction_status_idx" ON "WinTransaction"("status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'WinTransaction_userId_fkey'
  ) THEN
    ALTER TABLE "WinTransaction" ADD CONSTRAINT "WinTransaction_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "WinUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END;
$$;

-- Mirrors Prisma's @updatedAt behavior for WinUser.
CREATE OR REPLACE FUNCTION "set_WinUser_updatedAt"() RETURNS trigger AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'WinUser_updatedAt_trigger') THEN
    CREATE TRIGGER "WinUser_updatedAt_trigger"
      BEFORE UPDATE ON "WinUser"
      FOR EACH ROW EXECUTE FUNCTION "set_WinUser_updatedAt"();
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- WinTeamMember: super-admin / moderator / operator accounts that log in with
-- an access token (only the hash is stored). Additive & idempotent.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "WinTeamMember" (
  "id"          TEXT         NOT NULL,
  "name"        TEXT         NOT NULL,
  "role"        TEXT         NOT NULL DEFAULT 'moderator',
  "permissions" TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
  "tokenHash"   TEXT         NOT NULL,
  "tokenHint"   TEXT         NOT NULL,
  "isActive"    BOOLEAN      NOT NULL DEFAULT TRUE,
  "lastLoginAt" TIMESTAMP(3),
  "createdBy"   TEXT         NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WinTeamMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WinTeamMember_tokenHash_key" ON "WinTeamMember"("tokenHash");
CREATE INDEX IF NOT EXISTS "WinTeamMember_createdAt_idx" ON "WinTeamMember"("createdAt");

-- Mirrors Prisma's @updatedAt behavior for WinTeamMember.
CREATE OR REPLACE FUNCTION "set_WinTeamMember_updatedAt"() RETURNS trigger AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'WinTeamMember_updatedAt_trigger') THEN
    CREATE TRIGGER "WinTeamMember_updatedAt_trigger"
      BEFORE UPDATE ON "WinTeamMember"
      FOR EACH ROW EXECUTE FUNCTION "set_WinTeamMember_updatedAt"();
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- P2P deposit matching (zero-KYC agent float), currency BDT. Mirrors the
-- P2P* models in prisma/schema.prisma. Additive & idempotent.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "P2PAgent" (
  "agentCode"         TEXT          NOT NULL,
  "passwordHash"      TEXT          NOT NULL,
  "recoveryKeyHash"   TEXT          NOT NULL,
  "recoveryKeyHint"   TEXT          NOT NULL,
  "deviceFingerprint" TEXT          NOT NULL,
  "status"            TEXT          NOT NULL DEFAULT 'PROBATION',
  "floatBalance"      DECIMAL(16,2) NOT NULL DEFAULT 0,
  "currency"          TEXT          NOT NULL DEFAULT 'BDT',
  "successRate"       DECIMAL(6,4)  NOT NULL DEFAULT 1,
  "avgResponseSec"    INTEGER       NOT NULL DEFAULT 0,
  "totalTxns"         INTEGER       NOT NULL DEFAULT 0,
  "isOnline"          BOOLEAN       NOT NULL DEFAULT FALSE,
  "lastActiveAt"      TIMESTAMP(3),
  "registeredAt"      TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3)  NOT NULL,
  CONSTRAINT "P2PAgent_pkey" PRIMARY KEY ("agentCode")
);

CREATE INDEX IF NOT EXISTS "P2PAgent_status_idx" ON "P2PAgent"("status");
CREATE INDEX IF NOT EXISTS "P2PAgent_isOnline_idx" ON "P2PAgent"("isOnline");

CREATE TABLE IF NOT EXISTS "P2PAgentWallet" (
  "id"           INTEGER       NOT NULL,
  "agentCode"    TEXT          NOT NULL,
  "walletType"   TEXT          NOT NULL,
  "walletNumber" TEXT          NOT NULL,
  "holderName"   TEXT          NOT NULL,
  "isPrimary"    BOOLEAN       NOT NULL DEFAULT FALSE,
  "boundAt"      TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "usableAfter"  TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "P2PAgentWallet_pkey" PRIMARY KEY ("id")
);

CREATE SEQUENCE IF NOT EXISTS "P2PAgentWallet_id_seq" START 1 INCREMENT 1 OWNED BY "P2PAgentWallet"."id";
ALTER TABLE "P2PAgentWallet" ALTER COLUMN "id" SET DEFAULT nextval('"P2PAgentWallet_id_seq"');

DROP INDEX IF EXISTS "P2PAgentWallet_agentCode_walletNumber_key";
CREATE UNIQUE INDEX IF NOT EXISTS "P2PAgentWallet_agentCode_walletType_walletNumber_key" ON "P2PAgentWallet"("agentCode","walletType","walletNumber");
CREATE INDEX IF NOT EXISTS "P2PAgentWallet_agentCode_isPrimary_idx" ON "P2PAgentWallet"("agentCode","isPrimary");

CREATE TABLE IF NOT EXISTS "P2PFloatLedger" (
  "id"           BIGINT        NOT NULL,
  "agentCode"    TEXT          NOT NULL,
  "txnType"      TEXT          NOT NULL,
  "amount"       DECIMAL(16,2) NOT NULL,
  "balanceAfter" DECIMAL(16,2) NOT NULL,
  "referenceId"  TEXT,
  "status"       TEXT,
  "metadata"     JSONB,
  "createdAt"    TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "P2PFloatLedger_pkey" PRIMARY KEY ("id")
);

CREATE SEQUENCE IF NOT EXISTS "P2PFloatLedger_id_seq" START 1 INCREMENT 1 OWNED BY "P2PFloatLedger"."id";
ALTER TABLE "P2PFloatLedger" ALTER COLUMN "id" SET DEFAULT nextval('"P2PFloatLedger_id_seq"');

CREATE INDEX IF NOT EXISTS "P2PFloatLedger_agentCode_createdAt_idx" ON "P2PFloatLedger"("agentCode","createdAt");

CREATE TABLE IF NOT EXISTS "P2PTransaction" (
  "id"                TEXT          NOT NULL,
  "playerId"          TEXT          NOT NULL,
  "agentCode"         TEXT,
  "type"              TEXT          NOT NULL DEFAULT 'DEPOSIT',
  "requestedAmount"   DECIMAL(16,2) NOT NULL,
  "confirmedAmount"   DECIMAL(16,2),
  "status"            TEXT          NOT NULL DEFAULT 'PENDING',
  "riskScore"         INTEGER,
  "playerProof"       JSONB,
  "agentConfirmation" JSONB,
  "assignedAt"        TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt"       TIMESTAMP(3),
  "expiresAt"         TIMESTAMP(3)  NOT NULL,
  "createdAt"         TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "P2PTransaction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "P2PTransaction_agentCode_status_idx" ON "P2PTransaction"("agentCode","status");
CREATE INDEX IF NOT EXISTS "P2PTransaction_playerId_status_idx" ON "P2PTransaction"("playerId","status");
CREATE INDEX IF NOT EXISTS "P2PTransaction_status_expiresAt_idx" ON "P2PTransaction"("status","expiresAt");

-- P2P deposit-flow columns (PRD v2.0): reference code the player quotes when
-- sending money, proof screenshot + declared sent amount (10% tolerance),
-- agent SLA deadline + escalation timestamp, admin resolution note. Additive
-- & idempotent (NULL columns, no backfill needed).
ALTER TABLE "P2PTransaction" ADD COLUMN IF NOT EXISTS "referenceCode" TEXT;
ALTER TABLE "P2PTransaction" ADD COLUMN IF NOT EXISTS "playerScreenshotUrl" TEXT;
ALTER TABLE "P2PTransaction" ADD COLUMN IF NOT EXISTS "sentAmount" DECIMAL(16,2);
ALTER TABLE "P2PTransaction" ADD COLUMN IF NOT EXISTS "agentDeadline" TIMESTAMP(3);
ALTER TABLE "P2PTransaction" ADD COLUMN IF NOT EXISTS "escalatedAt" TIMESTAMP(3);
ALTER TABLE "P2PTransaction" ADD COLUMN IF NOT EXISTS "adminNote" TEXT;
CREATE INDEX IF NOT EXISTS "P2PTransaction_status_agentDeadline_idx" ON "P2PTransaction"("status","agentDeadline");
CREATE INDEX IF NOT EXISTS "P2PTransaction_status_escalatedAt_idx" ON "P2PTransaction"("status","escalatedAt");

-- In-app notification inbox (P2P PRD §5.8). Additive; no code writes it yet.
CREATE TABLE IF NOT EXISTS "P2PNotification" (
  "id"            TEXT      NOT NULL,
  "type"          TEXT      NOT NULL,
  "category"      TEXT      NOT NULL,
  "priority"      TEXT      NOT NULL,
  "recipientType" TEXT      NOT NULL,
  "recipientId"   TEXT,
  "payload"       JSONB,
  "status"        TEXT      NOT NULL DEFAULT 'PENDING',
  "readAt"        TIMESTAMP(3),
  "expiresAt"     TIMESTAMP(3),
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "P2PNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "P2PNotification_recipientType_recipientId_status_idx"
  ON "P2PNotification"("recipientType","recipientId","status");
CREATE INDEX IF NOT EXISTS "P2PNotification_createdAt_idx" ON "P2PNotification"("createdAt");

CREATE TABLE IF NOT EXISTS "P2PAgentSession" (
  "id"                TEXT        NOT NULL,
  "agentCode"         TEXT        NOT NULL,
  "sessionTokenHash"  TEXT        NOT NULL,
  "deviceFingerprint" TEXT        NOT NULL,
  "ipAddress"         TEXT,
  "wsTicket"          TEXT,
  "wsTicketExpiresAt" TIMESTAMP(3),
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"         TIMESTAMP(3) NOT NULL,
  "lastActivityAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "P2PAgentSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "P2PAgentSession_sessionTokenHash_key" ON "P2PAgentSession"("sessionTokenHash");
CREATE INDEX IF NOT EXISTS "P2PAgentSession_agentCode_idx" ON "P2PAgentSession"("agentCode");

CREATE TABLE IF NOT EXISTS "P2PAuditLog" (
  "id"         BIGINT      NOT NULL,
  "actor"      TEXT        NOT NULL,
  "action"     TEXT        NOT NULL,
  "targetType" TEXT,
  "targetId"   TEXT,
  "metadata"   JSONB,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "P2PAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE SEQUENCE IF NOT EXISTS "P2PAuditLog_id_seq" START 1 INCREMENT 1 OWNED BY "P2PAuditLog"."id";
ALTER TABLE "P2PAuditLog" ALTER COLUMN "id" SET DEFAULT nextval('"P2PAuditLog_id_seq"');

CREATE INDEX IF NOT EXISTS "P2PAuditLog_createdAt_idx" ON "P2PAuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "P2PAuditLog_actor_idx" ON "P2PAuditLog"("actor");

-- FKs (guarded, idempotent).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'P2PAgentWallet_agentCode_fkey') THEN
    ALTER TABLE "P2PAgentWallet" ADD CONSTRAINT "P2PAgentWallet_agentCode_fkey"
      FOREIGN KEY ("agentCode") REFERENCES "P2PAgent"("agentCode") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'P2PFloatLedger_agentCode_fkey') THEN
    ALTER TABLE "P2PFloatLedger" ADD CONSTRAINT "P2PFloatLedger_agentCode_fkey"
      FOREIGN KEY ("agentCode") REFERENCES "P2PAgent"("agentCode") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'P2PTransaction_playerId_fkey') THEN
    ALTER TABLE "P2PTransaction" ADD CONSTRAINT "P2PTransaction_playerId_fkey"
      FOREIGN KEY ("playerId") REFERENCES "WinUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'P2PTransaction_agentCode_fkey') THEN
    ALTER TABLE "P2PTransaction" ADD CONSTRAINT "P2PTransaction_agentCode_fkey"
      FOREIGN KEY ("agentCode") REFERENCES "P2PAgent"("agentCode") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'P2PAgentSession_agentCode_fkey') THEN
    ALTER TABLE "P2PAgentSession" ADD CONSTRAINT "P2PAgentSession_agentCode_fkey"
      FOREIGN KEY ("agentCode") REFERENCES "P2PAgent"("agentCode") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END;
$$;

-- Mirrors Prisma's @updatedAt behavior for P2PAgent.
CREATE OR REPLACE FUNCTION "set_P2PAgent_updatedAt"() RETURNS trigger AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'P2PAgent_updatedAt_trigger') THEN
    CREATE TRIGGER "P2PAgent_updatedAt_trigger"
      BEFORE UPDATE ON "P2PAgent"
      FOR EACH ROW EXECUTE FUNCTION "set_P2PAgent_updatedAt"();
  END IF;
END;
$$;
