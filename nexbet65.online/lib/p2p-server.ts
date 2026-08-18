// P2P deposit-matching service layer. All money movement for P2P deposits goes
// through this module: player gets credited via WinTransaction (kind=deposit,
// method=p2p) and the agent's site-held float is debited 1:1.
import { Prisma, PrismaClient } from "@prisma/client";

import { prisma, queryWithRetry } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { sha256Hex, newSessionToken } from "@/lib/p2p-auth";
import {
  AGENT_STATUS,
  P2P_CONFIG,
  P2P_WALLET_TYPES,
  TXN_STATUS,
  TXN_LIVE,
  TXN_PLAYER_CREDITED,
} from "@/lib/p2p-config";

export class P2PError extends Error {
  code: string;
  constructor(code: string, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

const E = {
  BAD_CREDENTIALS: "E_BAD_CREDENTIALS",
  DEVICE_MISMATCH: "E_DEVICE_MISMATCH",
  ACCOUNT_BANNED: "E_ACCOUNT_BANNED",
  PASSWORD_TOO_SHORT: "E_PASSWORD_TOO_SHORT",
  BAD_AMOUNT: "E_BAD_AMOUNT",
  NO_AGENT: "E_NO_AGENT",
  TXN_NOT_FOUND: "E_TXN_NOT_FOUND",
  TXN_NOT_PENDING: "E_TXN_NOT_PENDING",
  TXN_EXPIRED: "E_TXN_EXPIRED",
  TXN_ID_DUPLICATE: "E_TXN_ID_DUPLICATE",
  AMOUNT_MISMATCH: "E_AMOUNT_MISMATCH",
  NOT_ESCALATED: "E_NOT_ESCALATED",
  INSUFFICIENT_FLOAT: "E_INSUFFICIENT_FLOAT",
  WALLET_COOLDOWN: "E_WALLET_COOLDOWN",
  CANNOT_REMOVE_PRIMARY: "E_CANNOT_REMOVE_PRIMARY",
  RECOVERY_FAILED: "E_RECOVERY_FAILED",
  BAD_WALLET: "E_BAD_WALLET",
  NOT_FOUND: "E_NOT_FOUND",
  UNAUTHORIZED: "E_UNAUTHORIZED",
} as const;

export function p2pErrorStatus(code: string): number {
  switch (code) {
    case E.BAD_CREDENTIALS:
    case E.RECOVERY_FAILED:
    case E.UNAUTHORIZED:
      return 401;
    case E.DEVICE_MISMATCH:
    case E.ACCOUNT_BANNED:
      return 403;
    case E.NO_AGENT:
      return 503;
    case E.TXN_NOT_FOUND:
    case E.NOT_FOUND:
      return 404;
    case E.TXN_NOT_PENDING:
    case E.TXN_EXPIRED:
    case E.TXN_ID_DUPLICATE:
    case E.AMOUNT_MISMATCH:
    case E.NOT_ESCALATED:
    case E.INSUFFICIENT_FLOAT:
    case E.WALLET_COOLDOWN:
    case E.CANNOT_REMOVE_PRIMARY:
      return 409;
    default:
      return 400;
  }
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function maskWallet(number: string): string {
  if (!number) return "—";
  if (number.length <= 6) return "•••" + number.slice(-2);
  return number.slice(0, 3) + "•••" + number.slice(-2);
}

export function playerRef(playerId: string): string {
  return "Player " + playerId.slice(-4).toUpperCase();
}

/** Best-effort notification write. Never throws into the caller's flow. */
function notify(input: {
  type: string;
  category: string;
  priority: string;
  recipientType: string;
  recipientId?: string | null;
  payload?: unknown;
  expiresAt?: Date;
}) {
  prisma.p2PNotification
    .create({
      data: {
        type: input.type,
        category: input.category,
        priority: input.priority,
        recipientType: input.recipientType,
        recipientId: input.recipientId ?? null,
        payload: input.payload ?? undefined,
        expiresAt: input.expiresAt ?? undefined,
      },
    })
    .catch(() => {});
}

// ---------------------------------------------------------------------------
// Types / DTOs
// ---------------------------------------------------------------------------

export type AgentWalletDTO = {
  id: number;
  walletType: string;
  walletNumber: string;
  holderName: string;
  isPrimary: boolean;
  usableAfter: string;
};

export type AgentDTO = {
  agentCode: string;
  status: string;
  floatBalance: number;
  currency: string;
  successRate: number;
  avgResponseSec: number;
  totalTxns: number;
  isOnline: boolean;
  registeredAt: string;
  wallets: AgentWalletDTO[];
};

export type TxnDTO = {
  id: string;
  type: string;
  status: string;
  requestedAmount: number;
  confirmedAmount: number | null;
  referenceCode: string | null;
  playerRef: string;
  playerProof: {
    transactionId: string;
    senderAccount: string;
    sentAmount: number | null;
    screenshotUrl: string | null;
    note: string | null;
    submittedAt: string;
  } | null;
  assignedAt: string;
  completedAt: string | null;
  expiresAt: string;
  agentDeadline: string | null;
  canRespond: boolean;
};

export type PlayerP2PTxnDTO = {
  id: string;
  status: string;
  requestedAmount: number;
  confirmedAmount: number | null;
  referenceCode: string | null;
  agentCode: string | null;
  assignedAt: string;
  completedAt: string | null;
  expiresAt: string;
};

type DbAgent = Prisma.P2PAgentGetPayload<{
  include: { wallets: { orderBy: { id: "asc" } } };
}>;

function agentDTO(a: DbAgent): AgentDTO {
  return {
    agentCode: a.agentCode,
    status: a.status,
    floatBalance: Number(a.floatBalance),
    currency: a.currency,
    successRate: Number(a.successRate),
    avgResponseSec: a.avgResponseSec,
    totalTxns: a.totalTxns,
    isOnline: a.isOnline,
    registeredAt: a.registeredAt.toISOString(),
    wallets: a.wallets.map((w) => ({
      id: w.id,
      walletType: w.walletType,
      walletNumber: w.walletNumber,
      holderName: w.holderName,
      isPrimary: w.isPrimary,
      usableAfter: w.usableAfter.toISOString(),
    })),
  };
}

function txnDTO(
  t: Prisma.P2PTransactionGetPayload<Record<string, never>>
): TxnDTO {
  const proof = t.playerProof as TxnDTO["playerProof"];
  return {
    id: t.id,
    type: t.type,
    status: t.status,
    requestedAmount: Number(t.requestedAmount),
    confirmedAmount: t.confirmedAmount === null ? null : Number(t.confirmedAmount),
    referenceCode: t.referenceCode,
    playerRef: playerRef(t.playerId),
    playerProof: proof,
    assignedAt: t.assignedAt.toISOString(),
    completedAt: t.completedAt?.toISOString() ?? null,
    expiresAt: t.expiresAt.toISOString(),
    agentDeadline: t.agentDeadline?.toISOString() ?? null,
    canRespond: t.status === TXN_STATUS.PENDING,
  };
}

// ---------------------------------------------------------------------------
// Agent registration / auth
// ---------------------------------------------------------------------------

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function genAgentCode(): string {
  let code = "AGT-";
  for (let i = 0; i < 4; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export function genRecoveryKey(): string {
  const group = () =>
    Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
  return `${group()}-${group()}-${group()}-${group()}`;
}

function hashRecoveryKey(key: string): string {
  return sha256Hex(key.toUpperCase());
}

function verifyRecoveryKey(key: string, stored: string): boolean {
  const candidate = hashRecoveryKey(key);
  return candidate.length === stored.length && candidate === stored;
}

export function genTxnId(): string {
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = String(Math.floor(Math.random() * 90000) + 10000);
  return `TXN-${ymd}-${rand}`;
}

/** Player-facing reference code the depositor quotes when sending money: DEP-<epoch>-<rand4>. */
export function genReferenceCode(): string {
  const ts = Math.floor(Date.now() / 1000);
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `DEP-${ts}-${rand}`;
}

function validateWallet(input: {
  walletType: string;
  walletNumber: string;
  holderName: string;
}) {
  if (!(P2P_WALLET_TYPES as readonly string[]).includes(input.walletType)) {
    throw new P2PError(E.BAD_WALLET, "Unsupported wallet type");
  }
  if (input.walletNumber.trim().length < 6) {
    throw new P2PError(E.BAD_WALLET, "Wallet number looks too short");
  }
  if (input.holderName.trim().length < 2) {
    throw new P2PError(E.BAD_WALLET, "Holder name is required");
  }
}

export interface RegisterAgentInput {
  password: string;
  deviceFingerprint: string;
  wallet: { walletType: string; walletNumber: string; holderName: string };
}

export async function registerAgent(
  input: RegisterAgentInput
): Promise<{ agent: AgentDTO; recoveryKey: string; sessionToken: string }> {
  if (input.password.length < 6) {
    throw new P2PError(E.PASSWORD_TOO_SHORT, "Password must be at least 6 characters");
  }
  if (input.deviceFingerprint.length < 16) {
    throw new P2PError(E.BAD_WALLET, "Device fingerprint missing");
  }
  validateWallet(input.wallet);

  return queryWithRetry(() =>
    prisma.$transaction(async (tx) => {
      const recoveryKey = genRecoveryKey();
      let agentCode = genAgentCode();
      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          await tx.p2PAgent.create({
            data: {
              agentCode,
              passwordHash: hashPassword(input.password),
              recoveryKeyHash: hashRecoveryKey(recoveryKey),
              recoveryKeyHint: recoveryKey.slice(0, 4),
              deviceFingerprint: input.deviceFingerprint,
              status: AGENT_STATUS.PROBATION,
              wallets: {
                create: {
                  walletType: input.wallet.walletType,
                  walletNumber: input.wallet.walletNumber.trim(),
                  holderName: input.wallet.holderName.trim(),
                  isPrimary: true,
                },
              },
            },
          });
          break;
        } catch (err) {
          if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            agentCode = genAgentCode();
            continue;
          }
          throw err;
        }
      }

      const token = newSessionToken();
      const agent = await tx.p2PAgent.findUniqueOrThrow({
        where: { agentCode },
        include: { wallets: { orderBy: { id: "asc" } } },
      });
      await tx.p2PAgentSession.create({
        data: {
          agentCode,
          sessionTokenHash: sha256Hex(token),
          deviceFingerprint: input.deviceFingerprint,
          expiresAt: new Date(Date.now() + P2P_CONFIG.sessionTtlSec * 1000),
        },
      });
      await tx.p2PAuditLog.create({
        data: {
          actor: `AGENT:${agentCode}`,
          action: "REGISTER",
          targetType: "P2PAgent",
          targetId: agentCode,
          metadata: { walletType: input.wallet.walletType },
        },
      });
      return { agent: agentDTO(agent), recoveryKey, sessionToken: token };
    })
  );
}

export async function loginAgent(input: {
  agentCode: string;
  password: string;
  deviceFingerprint: string;
  ip?: string;
}): Promise<{ agent: AgentDTO; sessionToken: string }> {
  const agentCode = input.agentCode.trim().toUpperCase();
  const agent = await queryWithRetry(() =>
    prisma.p2PAgent.findUnique({
      where: { agentCode },
      include: { wallets: { orderBy: { id: "asc" } } },
    })
  );
  if (!agent || !verifyPassword(input.password, agent.passwordHash)) {
    throw new P2PError(E.BAD_CREDENTIALS, "Invalid agent code or password");
  }
  if (agent.status === AGENT_STATUS.BANNED) {
    throw new P2PError(E.ACCOUNT_BANNED, "This agent account is banned");
  }
  if (agent.deviceFingerprint !== input.deviceFingerprint) {
    throw new P2PError(
      E.DEVICE_MISMATCH,
      "New device detected — sign in from your original device or use your recovery key"
    );
  }

  return queryWithRetry(() =>
    prisma.$transaction(async (tx) => {
      await tx.p2PAgentSession.deleteMany({ where: { agentCode } });
      const token = newSessionToken();
      await tx.p2PAgentSession.create({
        data: {
          agentCode,
          sessionTokenHash: sha256Hex(token),
          deviceFingerprint: input.deviceFingerprint,
          ipAddress: input.ip ?? null,
          expiresAt: new Date(Date.now() + P2P_CONFIG.sessionTtlSec * 1000),
        },
      });
      const fresh = await tx.p2PAgent.update({
        where: { agentCode },
        data: { lastActiveAt: new Date() },
        include: { wallets: { orderBy: { id: "asc" } } },
      });
      return { agent: agentDTO(fresh), sessionToken: token };
    })
  );
}

export async function logoutAgent(agentCode: string): Promise<void> {
  await queryWithRetry(() =>
    prisma.$transaction(async (tx) => {
      await tx.p2PAgentSession.deleteMany({ where: { agentCode } });
      await tx.p2PAgent.update({
        where: { agentCode },
        data: { isOnline: false, lastActiveAt: new Date() },
      });
    })
  );
}

export async function recoverAgent(input: {
  agentCode: string;
  recoveryKey: string;
  newPassword: string;
  deviceFingerprint: string;
  ip?: string;
}): Promise<{ agent: AgentDTO; sessionToken: string }> {
  const agentCode = input.agentCode.trim().toUpperCase();
  const agent = await queryWithRetry(() =>
    prisma.p2PAgent.findUnique({ where: { agentCode } })
  );
  if (!agent || !verifyRecoveryKey(input.recoveryKey, agent.recoveryKeyHash)) {
    throw new P2PError(E.RECOVERY_FAILED, "Recovery key did not match");
  }
  if (agent.status === AGENT_STATUS.BANNED) {
    throw new P2PError(E.ACCOUNT_BANNED, "This agent account is banned");
  }
  if (input.newPassword.length < 6) {
    throw new P2PError(E.PASSWORD_TOO_SHORT, "Password must be at least 6 characters");
  }

  return queryWithRetry(() =>
    prisma.$transaction(async (tx) => {
      await tx.p2PAgentSession.deleteMany({ where: { agentCode } });
      const token = newSessionToken();
      await tx.p2PAgent.update({
        where: { agentCode },
        data: {
          passwordHash: hashPassword(input.newPassword),
          deviceFingerprint: input.deviceFingerprint,
        },
      });
      await tx.p2PAgentSession.create({
        data: {
          agentCode,
          sessionTokenHash: sha256Hex(token),
          deviceFingerprint: input.deviceFingerprint,
          ipAddress: input.ip ?? null,
          expiresAt: new Date(Date.now() + P2P_CONFIG.sessionTtlSec * 1000),
        },
      });
      const fresh = await tx.p2PAgent.findUniqueOrThrow({
        where: { agentCode },
        include: { wallets: { orderBy: { id: "asc" } } },
      });
      await tx.p2PAuditLog.create({
        data: {
          actor: `AGENT:${agentCode}`,
          action: "RECOVER",
          targetType: "P2PAgent",
          targetId: agentCode,
        },
      });
      return { agent: agentDTO(fresh), sessionToken: token };
    })
  );
}

// ---------------------------------------------------------------------------
// Agent session (from cookie token)
// ---------------------------------------------------------------------------

export async function agentFromSessionToken(
  token: string | undefined | null
): Promise<{ agent: AgentDTO; agentCode: string } | null> {
  if (!token) return null;
  return queryWithRetry(async () => {
    const session = await prisma.p2PAgentSession.findUnique({
      where: { sessionTokenHash: sha256Hex(token) },
      include: { agent: { include: { wallets: { orderBy: { id: "asc" } } } } },
    });
    if (!session) return null;
    if (session.expiresAt.getTime() < Date.now()) {
      await prisma.p2PAgentSession.delete({ where: { id: session.id } });
      return null;
    }
    if (
      session.agent.status === AGENT_STATUS.BANNED ||
      session.agent.status === AGENT_STATUS.SUSPENDED
    ) {
      return null;
    }
    if (Date.now() - session.lastActivityAt.getTime() > 60_000) {
      prisma.p2PAgentSession
        .update({
          where: { id: session.id },
          data: { lastActivityAt: new Date() },
        })
        .catch(() => {});
      prisma.p2PAgent
        .update({
          where: { agentCode: session.agentCode },
          data: { isOnline: true, lastActiveAt: new Date() },
        })
        .catch(() => {});
    }
    return { agent: agentDTO(session.agent), agentCode: session.agentCode };
  });
}

export async function createWsTicket(agentCode: string): Promise<string> {
  const token = newSessionToken();
  await queryWithRetry(() =>
    prisma.p2PAgentSession.updateMany({
      where: { agentCode },
      data: {
        wsTicket: sha256Hex(token),
        wsTicketExpiresAt: new Date(Date.now() + P2P_CONFIG.wsTicketTtlSec * 1000),
      },
    })
  );
  return token;
}

/** Used by the standalone WS engine (plain JS, no @/ alias). */
export async function findAgentByWsTicket(
  ticket: string
): Promise<string | null> {
  const session = await prisma.p2PAgentSession.findFirst({
    where: {
      wsTicket: sha256Hex(ticket),
      wsTicketExpiresAt: { gt: new Date() },
    },
    include: { agent: true },
  });
  if (!session) return null;
  if (
    session.agent.status === AGENT_STATUS.BANNED ||
    session.agent.status === AGENT_STATUS.SUSPENDED
  ) {
    return null;
  }
  return session.agentCode;
}

// ---------------------------------------------------------------------------
// Wallet management
// ---------------------------------------------------------------------------

export async function addAgentWallet(
  agentCode: string,
  input: { walletType: string; walletNumber: string; holderName: string }
): Promise<AgentWalletDTO> {
  validateWallet(input);
  return queryWithRetry(async () => {
    const walletNumber = input.walletNumber.trim();
    const dup = await prisma.p2PAgentWallet.findFirst({
      where: { agentCode, walletType: input.walletType, walletNumber },
    });
    if (dup) throw new P2PError(E.BAD_WALLET, "That wallet number is already bound to this payment method");
    const w = await prisma.p2PAgentWallet.create({
      data: {
        agentCode,
        walletType: input.walletType,
        walletNumber,
        holderName: input.holderName.trim(),
        isPrimary: false,
        usableAfter: new Date(Date.now() + P2P_CONFIG.newWalletCooldownMs),
      },
    });
    return {
      id: w.id,
      walletType: w.walletType,
      walletNumber: w.walletNumber,
      holderName: w.holderName,
      isPrimary: w.isPrimary,
      usableAfter: w.usableAfter.toISOString(),
    };
  });
}

export async function removeAgentWallet(
  agentCode: string,
  walletId: number
): Promise<void> {
  await queryWithRetry(() =>
    prisma.$transaction(async (tx) => {
      const w = await tx.p2PAgentWallet.findFirst({
        where: { id: walletId, agentCode },
      });
      if (!w) throw new P2PError(E.NOT_FOUND, "Wallet not found");
      if (w.isPrimary) {
        throw new P2PError(E.CANNOT_REMOVE_PRIMARY, "Primary wallet cannot be removed");
      }
      await tx.p2PAgentWallet.delete({ where: { id: walletId } });
      await tx.p2PAuditLog.create({
        data: {
          actor: `AGENT:${agentCode}`,
          action: "REMOVE_WALLET",
          targetType: "P2PAgentWallet",
          targetId: String(walletId),
          metadata: { walletType: w.walletType },
        },
      });
    })
  );
}

export async function setPrimaryWallet(
  agentCode: string,
  walletId: number
): Promise<void> {
  await queryWithRetry(() =>
    prisma.$transaction(async (tx) => {
      const w = await tx.p2PAgentWallet.findFirst({
        where: { id: walletId, agentCode },
      });
      if (!w) throw new P2PError(E.NOT_FOUND, "Wallet not found");
      if (w.isPrimary) return;
      if (w.usableAfter.getTime() > Date.now()) {
        throw new P2PError(E.WALLET_COOLDOWN, "New wallets unlock for primary use after 24h");
      }
      await tx.p2PAgentWallet.updateMany({
        where: { agentCode, isPrimary: true },
        data: { isPrimary: false },
      });
      await tx.p2PAgentWallet.update({
        where: { id: walletId },
        data: { isPrimary: true },
      });
      await tx.p2PAuditLog.create({
        data: {
          actor: `AGENT:${agentCode}`,
          action: "SET_PRIMARY_WALLET",
          targetType: "P2PAgentWallet",
          targetId: String(walletId),
        },
      });
    })
  );
}

// ---------------------------------------------------------------------------
// Float top-ups
// ---------------------------------------------------------------------------

export async function createFloatTopup(
  agentCode: string,
  amount: number
): Promise<{ topupId: string; status: string }> {
  if (
    amount < P2P_CONFIG.floatTopupMin ||
    amount > P2P_CONFIG.floatTopupMax
  ) {
    throw new P2PError(E.BAD_AMOUNT, `Top-up must be between ${P2P_CONFIG.floatTopupMin} and ${P2P_CONFIG.floatTopupMax}`);
  }
  return queryWithRetry(() =>
    prisma.$transaction(async (tx) => {
      const agent = await tx.p2PAgent.findUnique({ where: { agentCode } });
      if (!agent) throw new P2PError(E.NOT_FOUND, "Agent not found");
      const seq = await tx.p2PFloatLedger.count({ where: { agentCode } });
      const topupId = `TOP-${agentCode}-${String(seq + 1).padStart(4, "0")}`;
      await tx.p2PFloatLedger.create({
        data: {
          agentCode,
          txnType: "DEPOSIT",
          amount: round2(amount),
          balanceAfter: Number(agent.floatBalance),
          referenceId: topupId,
          status: "PENDING",
        },
      });
      return { topupId, status: "PENDING" };
    })
  );
}

export async function approveFloatTopup(
  actor: string,
  ledgerId: bigint
): Promise<void> {
  await queryWithRetry(() =>
    prisma.$transaction(async (tx) => {
      const row = await tx.p2PFloatLedger.findUnique({ where: { id: ledgerId } });
      if (!row || row.status !== "PENDING") {
        throw new P2PError(E.NOT_FOUND, "Top-up not found or already handled");
      }
      const agent = await tx.p2PAgent.findUniqueOrThrow({
        where: { agentCode: row.agentCode },
      });
      const bal = round2(Number(agent.floatBalance) + Number(row.amount));
      await tx.p2PAgent.update({
        where: { agentCode: row.agentCode },
        data: { floatBalance: bal },
      });
      await tx.p2PFloatLedger.update({
        where: { id: ledgerId },
        data: { status: null, balanceAfter: bal },
      });
      await tx.p2PAuditLog.create({
        data: {
          actor,
          action: "APPROVE_FLOAT_TOPUP",
          targetType: "P2PFloatLedger",
          targetId: String(ledgerId),
          metadata: { amount: Number(row.amount), agentCode: row.agentCode },
        },
      });
    })
  );
}

// ---------------------------------------------------------------------------
// Matching + deposits
// ---------------------------------------------------------------------------

async function pickEligibleAgent(
  tx: Prisma.TransactionClient,
  amount: number,
  method?: string
): Promise<string | null> {
  const agents = await tx.p2PAgent.findMany({
    where: {
      status: { in: [AGENT_STATUS.ACTIVE, AGENT_STATUS.PROBATION] },
      floatBalance: { gte: amount },
      ...(method
        ? {
            wallets: {
              some: {
                walletType: method,
                usableAfter: { lte: new Date() },
              },
            },
          }
        : {}),
    },
    include: {
      _count: { select: { transactions: { where: { status: TXN_STATUS.PENDING } } } },
    },
  });
  const candidates = agents.filter(
    (a) => a._count.transactions < P2P_CONFIG.maxPendingPerAgent
  );
  if (candidates.length === 0) return null;
  // PRD §2: lowest avg_response_sec first (fastest responders), then least
  // loaded, then most float, then most recently active.
  candidates.sort(
    (a, b) =>
      a.avgResponseSec - b.avgResponseSec ||
      a._count.transactions - b._count.transactions ||
      Number(b.floatBalance) - Number(a.floatBalance) ||
      (b.lastActiveAt?.getTime() ?? 0) - (a.lastActiveAt?.getTime() ?? 0)
  );
  return candidates[0].agentCode;
}

/** PRD §2 "quote": is an agent available right now for this amount + method? */
export async function playerDepositQuote(
  amount: number,
  method?: string
): Promise<{ available: boolean }> {
  if (amount < P2P_CONFIG.depositMin || amount > P2P_CONFIG.depositMax) {
    throw new P2PError(
      E.BAD_AMOUNT,
      `Deposit must be between ${P2P_CONFIG.depositMin} and ${P2P_CONFIG.depositMax}`
    );
  }
  const agentCode = await queryWithRetry(() =>
    prisma.$transaction((tx) => pickEligibleAgent(tx, amount, method))
  );
  return { available: !!agentCode };
}

export async function createPlayerDeposit(
  playerId: string,
  amount: number,
  method?: string
): Promise<{
  txn: PlayerP2PTxnDTO;
  agentCode: string | null;
  wallet: { walletType: string; walletNumber: string; holderName: string } | null;
}> {
  if (amount < P2P_CONFIG.depositMin || amount > P2P_CONFIG.depositMax) {
    throw new P2PError(
      E.BAD_AMOUNT,
      `Deposit must be between ${P2P_CONFIG.depositMin} and ${P2P_CONFIG.depositMax}`
    );
  }
  return queryWithRetry(() =>
    prisma.$transaction(async (tx) => {
      const agentCode = await pickEligibleAgent(tx, amount, method);
      if (!agentCode) {
        throw new P2PError(E.NO_AGENT, "No agent available right now — try again in a moment");
      }
      const id = genTxnId();
      const referenceCode = genReferenceCode();
      const txn = await tx.p2PTransaction.create({
        data: {
          id,
          playerId,
          agentCode,
          requestedAmount: round2(amount),
          referenceCode,
          expiresAt: new Date(Date.now() + P2P_CONFIG.matchExpiryMs),
        },
        include: { agent: { include: { wallets: true } } },
      });
      const nowMs = Date.now();
      const usableWallets = txn.agent!.wallets.filter(
        (w) => w.usableAfter.getTime() <= nowMs
      );
      const targetWallet =
        (method
          ? (usableWallets.find((w) => w.walletType === method && w.isPrimary) ??
            usableWallets.find((w) => w.walletType === method))
          : undefined) ??
        usableWallets.find((w) => w.isPrimary) ??
        txn.agent!.wallets[0];
      await tx.p2PAgent.update({
        where: { agentCode },
        data: { lastActiveAt: new Date() },
      });
      notify({
        type: "txn.wallet_ready",
        category: "transaction",
        priority: "high",
        recipientType: "player",
        recipientId: playerId,
        payload: {
          txnId: txn.id,
          referenceCode: txn.referenceCode,
          agentCode,
          wallet: targetWallet
            ? { walletType: targetWallet.walletType, walletNumber: targetWallet.walletNumber, holderName: targetWallet.holderName }
            : null,
        },
        expiresAt: txn.expiresAt,
      });
      notify({
        type: "txn.new_assignment",
        category: "transaction",
        priority: "medium",
        recipientType: "agent",
        recipientId: agentCode,
        payload: {
          txnId: txn.id,
          referenceCode: txn.referenceCode,
          amount: Number(txn.requestedAmount),
          expiresAt: txn.expiresAt.toISOString(),
        },
        expiresAt: txn.expiresAt,
      });
      return {
        txn: {
          id: txn.id,
          status: txn.status,
          requestedAmount: Number(txn.requestedAmount),
          confirmedAmount: null,
          referenceCode: txn.referenceCode,
          agentCode: txn.agentCode,
          assignedAt: txn.assignedAt.toISOString(),
          completedAt: null,
          expiresAt: txn.expiresAt.toISOString(),
        },
        agentCode,
        wallet: targetWallet
          ? {
              walletType: targetWallet.walletType,
              walletNumber: targetWallet.walletNumber,
              holderName: targetWallet.holderName,
            }
          : null,
      };
    })
  );
}

export async function submitPlayerProof(
  playerId: string,
  txnId: string,
  input: {
    transactionId: string;
    senderAccount: string;
    sentAmount?: number;
    screenshotUrl?: string;
    note?: string;
  }
): Promise<void> {
  if (input.transactionId.trim().length < 3) {
    throw new P2PError(E.BAD_WALLET, "Transaction ID is required");
  }
  if (input.senderAccount.trim().length < 3) {
    throw new P2PError(E.BAD_WALLET, "Sender account is required");
  }
  await queryWithRetry(() =>
    prisma.$transaction(async (tx) => {
      const txn = await tx.p2PTransaction.findUnique({ where: { id: txnId } });
      if (!txn || txn.playerId !== playerId) {
        throw new P2PError(E.TXN_NOT_FOUND, "Transaction not found");
      }
      if (txn.status !== TXN_STATUS.PENDING) {
        throw new P2PError(E.TXN_NOT_PENDING, "Transaction is no longer pending");
      }
      // PRD §2 validations: within the 10-min window, TXN id not already used,
      // amount within tolerance.
      if (txn.expiresAt.getTime() < Date.now()) {
        throw new P2PError(E.TXN_EXPIRED, "This deposit window has expired — start a new deposit");
      }
      const requested = Number(txn.requestedAmount);
      if (input.sentAmount !== undefined && input.sentAmount !== null) {
        const sent = Number(input.sentAmount);
        if (!Number.isFinite(sent) || sent <= 0) {
          throw new P2PError(E.BAD_AMOUNT, "Invalid amount sent");
        }
        const diff = Math.abs(sent - requested) / requested;
        if (diff > P2P_CONFIG.proofTolerance) {
          throw new P2PError(
            E.AMOUNT_MISMATCH,
            `Amount sent is outside the ${P2P_CONFIG.proofTolerance * 100}% tolerance band`
          );
        }
      }
      const dup = await tx.p2PTransaction.findFirst({
        where: {
          id: { not: txnId },
          status: { in: [...TXN_LIVE, ...TXN_PLAYER_CREDITED] },
          playerProof: {
            path: ["transactionId"],
            equals: input.transactionId.trim(),
          },
        },
        select: { id: true },
      });
      if (dup) {
        throw new P2PError(E.TXN_ID_DUPLICATE, "This transaction ID was already used");
      }
      const now = new Date();
      await tx.p2PTransaction.update({
        where: { id: txnId },
        data: {
          playerProof: {
            transactionId: input.transactionId.trim(),
            senderAccount: input.senderAccount.trim(),
            sentAmount:
              input.sentAmount !== undefined && input.sentAmount !== null
                ? round2(Number(input.sentAmount))
                : null,
            screenshotUrl: input.screenshotUrl?.trim() || null,
            note: input.note?.trim() ?? null,
            submittedAt: now.toISOString(),
          },
          // PRD §2: agent SLA clock starts once the player has proven the transfer.
          agentDeadline: new Date(now.getTime() + P2P_CONFIG.agentSlaMs),
        },
      });
      notify({
        type: "txn.proof_submitted",
        category: "transaction",
        priority: "critical",
        recipientType: "agent",
        recipientId: txn.agentCode,
        payload: {
          txnId: txn.id,
          referenceCode: txn.referenceCode,
          senderAccount: input.senderAccount.trim(),
          transactionId: input.transactionId.trim(),
          agentDeadline: new Date(now.getTime() + P2P_CONFIG.agentSlaMs).toISOString(),
        },
      });
    })
  );
}

export async function getPlayerDeposits(
  playerId: string
): Promise<PlayerP2PTxnDTO[]> {
  const rows = await queryWithRetry(() =>
    prisma.p2PTransaction.findMany({
      where: { playerId },
      orderBy: { createdAt: "desc" },
      take: 20,
    })
  );
  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    requestedAmount: Number(r.requestedAmount),
    confirmedAmount: r.confirmedAmount === null ? null : Number(r.confirmedAmount),
    referenceCode: r.referenceCode,
    agentCode: r.agentCode,
    assignedAt: r.assignedAt.toISOString(),
    completedAt: r.completedAt?.toISOString() ?? null,
    expiresAt: r.expiresAt.toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// Confirm / deny (the money path)
// ---------------------------------------------------------------------------

async function refreshAgentMetrics(agentCode: string) {
  const recent = await queryWithRetry(() =>
    prisma.p2PTransaction.findMany({
      where: { agentCode },
      select: { status: true, assignedAt: true, completedAt: true },
      orderBy: { assignedAt: "desc" },
      take: 50,
    })
  );
  const completed = recent.filter(
    (r) => r.status !== TXN_STATUS.PENDING
  );
  const confirmed = recent.filter(
    (r) => r.status === TXN_STATUS.CONFIRMED
  ).length;
  const responseMs: number[] = [];
  for (const r of recent) {
    if (r.completedAt && r.completedAt.getTime() >= r.assignedAt.getTime()) {
      responseMs.push(r.completedAt.getTime() - r.assignedAt.getTime());
    }
  }
  const totalTxns = await queryWithRetry(() =>
    prisma.p2PTransaction.count({ where: { agentCode } })
  );
  await queryWithRetry(() =>
    prisma.p2PAgent.update({
      where: { agentCode },
      data: {
        successRate: completed.length > 0 ? confirmed / completed.length : 1,
        avgResponseSec:
          responseMs.length > 0
            ? Math.round(responseMs.reduce((a, b) => a + b, 0) / responseMs.length / 1000)
            : 0,
        totalTxns,
      },
    })
  );
}

export async function confirmTransaction(input: {
  agentCode: string;
  txnId: string;
  confirmedAmount: number;
  transactionId: string;
  note?: string;
}): Promise<{ txnId: string; amount: number; playerRef: string }> {
  const result = await queryWithRetry(() =>
    prisma.$transaction(async (tx) => {
      const txn = await tx.p2PTransaction.findUnique({
        where: { id: input.txnId },
      });
      if (!txn || txn.agentCode !== input.agentCode) {
        throw new P2PError(E.TXN_NOT_FOUND, "Transaction not found");
      }
      if (txn.status !== TXN_STATUS.PENDING) {
        throw new P2PError(E.TXN_NOT_PENDING, "Transaction is no longer pending");
      }
      const amount = round2(Math.min(Number(txn.requestedAmount), input.confirmedAmount));
      if (amount <= 0) throw new P2PError(E.BAD_AMOUNT, "Invalid confirmed amount");

      const agent = await tx.p2PAgent.findUniqueOrThrow({
        where: { agentCode: input.agentCode },
      });
      const float = Number(agent.floatBalance);
      if (float < amount) {
        throw new P2PError(E.INSUFFICIENT_FLOAT, "Insufficient float — top up to confirm");
      }
      const now = new Date();
      const newFloat = round2(float - amount);

      await tx.p2PAgent.update({
        where: { agentCode: input.agentCode },
        data: { floatBalance: newFloat, isOnline: true, lastActiveAt: now },
      });
      await tx.p2PFloatLedger.create({
        data: {
          agentCode: input.agentCode,
          txnType: "PLAYER_DEPOSIT",
          amount: -amount,
          balanceAfter: newFloat,
          referenceId: txn.id,
        },
      });

      const player = await tx.winUser.findUniqueOrThrow({
        where: { id: txn.playerId },
      });
      const playerBalance = round2(Number(player.balance) + amount);
      await tx.winUser.update({
        where: { id: txn.playerId },
        data: { balance: playerBalance },
      });
      await tx.winTransaction.create({
        data: {
          userId: txn.playerId,
          kind: "deposit",
          type: "deposit",
          method: "p2p",
          amount,
          balanceAfter: playerBalance,
          ref: `p2p:${txn.id}`,
          transactionId: input.transactionId.trim(),
          senderAccount:
            (txn.playerProof as { senderAccount?: string } | null)?.senderAccount ?? null,
          status: "approved",
          approvedAt: now,
          meta: JSON.stringify({ agentCode: input.agentCode, p2p: true }),
        },
      });

      await tx.p2PTransaction.update({
        where: { id: txn.id },
        data: {
          status: TXN_STATUS.CONFIRMED,
          confirmedAmount: amount,
          agentConfirmation: {
            confirmedAmount: amount,
            transactionId: input.transactionId.trim(),
            note: input.note?.trim() ?? null,
            respondedAt: now.toISOString(),
          },
          completedAt: now,
        },
      });
      await tx.p2PAuditLog.create({
        data: {
          actor: `AGENT:${input.agentCode}`,
          action: "CONFIRM_TXN",
          targetType: "P2PTransaction",
          targetId: txn.id,
          metadata: { amount, transactionId: input.transactionId.trim() },
        },
      });
      notify({
        type: "txn.confirmed",
        category: "transaction",
        priority: "high",
        recipientType: "player",
        recipientId: txn.playerId,
        payload: {
          txnId: txn.id,
          referenceCode: txn.referenceCode,
          amount,
          balanceAfter: playerBalance,
        },
      });
      return { txnId: txn.id, amount, playerRef: playerRef(txn.playerId) };
    })
  );
  refreshAgentMetrics(input.agentCode).catch(() => {});
  return result;
}

export async function denyTransaction(input: {
  agentCode: string;
  txnId: string;
  reason: string;
}): Promise<void> {
  await queryWithRetry(() =>
    prisma.$transaction(async (tx) => {
      const txn = await tx.p2PTransaction.findUnique({
        where: { id: input.txnId },
      });
      if (!txn || txn.agentCode !== input.agentCode) {
        throw new P2PError(E.TXN_NOT_FOUND, "Transaction not found");
      }
      if (txn.status !== TXN_STATUS.PENDING) {
        throw new P2PError(E.TXN_NOT_PENDING, "Transaction is no longer pending");
      }
      const now = new Date();
      await tx.p2PTransaction.update({
        where: { id: txn.id },
        data: {
          status: TXN_STATUS.DENIED,
          agentConfirmation: {
            respondedAt: now.toISOString(),
            note: input.reason.trim() || null,
          },
          completedAt: now,
        },
      });
      await tx.p2PAgent.update({
        where: { agentCode: input.agentCode },
        data: { isOnline: true, lastActiveAt: now },
      });
      await tx.p2PAuditLog.create({
        data: {
          actor: `AGENT:${input.agentCode}`,
          action: "DENY_TXN",
          targetType: "P2PTransaction",
          targetId: txn.id,
          metadata: { reason: input.reason.trim() || null },
        },
      });
      notify({
        type: "txn.denied",
        category: "transaction",
        priority: "high",
        recipientType: "player",
        recipientId: txn.playerId,
        payload: {
          txnId: txn.id,
          referenceCode: txn.referenceCode,
          requestedAmount: Number(txn.requestedAmount),
          reason: input.reason.trim() || null,
        },
      });
    })
  );
  refreshAgentMetrics(input.agentCode).catch(() => {});
}

// ---------------------------------------------------------------------------
// Dashboards / admin overview
// ---------------------------------------------------------------------------

export async function getAgentDashboard(agentCode: string): Promise<{
  agent: AgentDTO;
  queue: TxnDTO[];
  history: TxnDTO[];
  ledger: Array<{
    id: number;
    txnType: string;
    amount: number;
    balanceAfter: number;
    referenceId: string | null;
    status: string | null;
    createdAt: string;
  }>;
  pendingTopups: Array<{ id: number; referenceId: string | null; amount: number; createdAt: string }>;
  metrics: {
    pending: number;
    todayVolume: number;
    todayCount: number;
    successRate: number;
    avgResponseSec: number;
    totalTxns: number;
  };
}> {
  return queryWithRetry(async () => {
    const [agent, queue, history, ledger, pendingTopups] = await Promise.all([
      prisma.p2PAgent.findUnique({
        where: { agentCode },
        include: { wallets: { orderBy: { id: "asc" } } },
      }),
      prisma.p2PTransaction.findMany({
        where: { agentCode, status: TXN_STATUS.PENDING },
        orderBy: { createdAt: "asc" },
      }),
      prisma.p2PTransaction.findMany({
        where: { agentCode, status: { not: TXN_STATUS.PENDING } },
        orderBy: { completedAt: "desc" },
        take: 20,
      }),
      prisma.p2PFloatLedger.findMany({
        where: { agentCode },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.p2PFloatLedger.findMany({
        where: { agentCode, status: "PENDING" },
        orderBy: { createdAt: "asc" },
      }),
    ]);
    if (!agent) throw new P2PError(E.NOT_FOUND, "Agent not found");

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const today = await prisma.p2PTransaction.findMany({
      where: { agentCode, status: TXN_STATUS.CONFIRMED, completedAt: { gte: todayStart } },
      select: { confirmedAmount: true },
    });
    const todayVolume = today.reduce(
      (s, t) => s + Number(t.confirmedAmount ?? 0),
      0
    );

    return {
      agent: agentDTO(agent),
      queue: queue.map(txnDTO),
      history: history.map(txnDTO),
      ledger: ledger.map((l) => ({
        id: Number(l.id),
        txnType: l.txnType,
        amount: Number(l.amount),
        balanceAfter: Number(l.balanceAfter),
        referenceId: l.referenceId,
        status: l.status,
        createdAt: l.createdAt.toISOString(),
      })),
      pendingTopups: pendingTopups.map((l) => ({
        id: Number(l.id),
        referenceId: l.referenceId,
        amount: Number(l.amount),
        createdAt: l.createdAt.toISOString(),
      })),
      metrics: {
        pending: queue.length,
        todayVolume,
        todayCount: today.length,
        successRate: Number(agent.successRate),
        avgResponseSec: agent.avgResponseSec,
        totalTxns: agent.totalTxns,
      },
    };
  });
}

export async function adminP2POverview(): Promise<{
  stats: {
    agents: number;
    onlineAgents: number;
    pendingTxns: number;
    pendingTopups: number;
    confirmedToday: number;
    volumeToday: number;
    totalVolume: number;
  };
  agents: Array<{
    agentCode: string;
    status: string;
    floatBalance: number;
    successRate: number;
    totalTxns: number;
    isOnline: boolean;
    pendingCount: number;
    registeredAt: string;
    walletTypes: string[];
  }>;
  pendingTopups: Array<{
    id: number;
    agentCode: string;
    referenceId: string | null;
    amount: number;
    createdAt: string;
  }>;
  recentTxns: Array<{
    id: string;
    playerRef: string;
    agentCode: string | null;
    status: string;
    requestedAmount: number;
    confirmedAmount: number | null;
    createdAt: string;
  }>;
}> {
  return queryWithRetry(async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const [agents, pendingTopups, recentTxns, todayTxns] = await Promise.all([
      prisma.p2PAgent.findMany({
        include: {
          _count: { select: { transactions: { where: { status: TXN_STATUS.PENDING } } } },
          wallets: { select: { walletType: true } },
        },
        orderBy: { registeredAt: "desc" },
        take: 200,
      }),
      prisma.p2PFloatLedger.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" },
      }),
      prisma.p2PTransaction.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.p2PTransaction.findMany({
        where: { status: TXN_STATUS.CONFIRMED, completedAt: { gte: todayStart } },
        select: { confirmedAmount: true },
      }),
    ]);
    const [pendingTxns, confirmedTotal] = await Promise.all([
      prisma.p2PTransaction.count({ where: { status: TXN_STATUS.PENDING } }),
      prisma.p2PTransaction.findMany({
        where: { status: TXN_STATUS.CONFIRMED },
        select: { confirmedAmount: true },
      }),
    ]);
    const volumeToday = todayTxns.reduce((s, t) => s + Number(t.confirmedAmount ?? 0), 0);
    const totalVolume = confirmedTotal.reduce((s, t) => s + Number(t.confirmedAmount ?? 0), 0);

    return {
      stats: {
        agents: agents.length,
        onlineAgents: agents.filter((a) => a.isOnline).length,
        pendingTxns,
        pendingTopups: pendingTopups.length,
        confirmedToday: todayTxns.length,
        volumeToday,
        totalVolume,
      },
      agents: agents.map((a) => ({
        agentCode: a.agentCode,
        status: a.status,
        floatBalance: Number(a.floatBalance),
        successRate: Number(a.successRate),
        totalTxns: a.totalTxns,
        isOnline: a.isOnline,
        pendingCount: a._count.transactions,
        registeredAt: a.registeredAt.toISOString(),
        walletTypes: Array.from(new Set(a.wallets.map((w) => w.walletType))),
      })),
      pendingTopups: pendingTopups.map((l) => ({
        id: Number(l.id),
        agentCode: l.agentCode,
        referenceId: l.referenceId,
        amount: Number(l.amount),
        createdAt: l.createdAt.toISOString(),
      })),
      recentTxns: recentTxns.map((t) => ({
        id: t.id,
        playerRef: playerRef(t.playerId),
        agentCode: t.agentCode,
        status: t.status,
        requestedAmount: Number(t.requestedAmount),
        confirmedAmount: t.confirmedAmount === null ? null : Number(t.confirmedAmount),
        createdAt: t.createdAt.toISOString(),
      })),
    };
  });
}

export async function auditLogs(take = 100): Promise<
  Array<{
    actor: string;
    action: string;
    targetType: string | null;
    targetId: string | null;
    metadata: unknown;
    createdAt: string;
  }>
> {
  const rows = await queryWithRetry(() =>
    prisma.p2PAuditLog.findMany({ orderBy: { createdAt: "desc" }, take })
  );
  return rows.map((r) => ({
    actor: r.actor,
    action: r.action,
    targetType: r.targetType,
    targetId: r.targetId,
    metadata: r.metadata,
    createdAt: r.createdAt.toISOString(),
  }));
}

/** Engine hook: mark overdue PENDING matches EXPIRED. Returns count. */
export async function expireStaleTransactions(): Promise<number> {
  const res = await queryWithRetry(() =>
    prisma.p2PTransaction.updateMany({
      where: { status: TXN_STATUS.PENDING, expiresAt: { lt: new Date() } },
      data: { status: TXN_STATUS.EXPIRED, completedAt: new Date() },
    })
  );
  return res.count;
}

/** Engine hook: escalate proven-but-overdue PENDING matches. Returns count. */
export async function escalateStaleTransactions(): Promise<number> {
  const res = await queryWithRetry(() =>
    prisma.$transaction(async (tx) => {
      const rows = await tx.p2PTransaction.findMany({
        where: {
          status: TXN_STATUS.PENDING,
          agentDeadline: { lt: new Date() },
          playerProof: { not: Prisma.DbNull },
        },
        select: { id: true, playerId: true, agentCode: true, referenceCode: true },
      });
      if (rows.length === 0) return 0;
      await tx.p2PTransaction.updateMany({
        where: { id: { in: rows.map((r) => r.id) } },
        data: { status: TXN_STATUS.ESCALATED, escalatedAt: new Date() },
      });
      for (const r of rows) {
        notify({
          type: "txn.escalated",
          category: "transaction",
          priority: "critical",
          recipientType: "admin",
          recipientId: "p2p",
          payload: {
            txnId: r.id,
            referenceCode: r.referenceCode,
            agentCode: r.agentCode,
          },
        });
      }
      return rows.length;
    })
  );
  return res;
}

export type EscalatedTxn = {
  id: string;
  playerRef: string;
  agentCode: string | null;
  requestedAmount: number;
  playerProof: {
    transactionId: string;
    senderAccount: string;
    sentAmount: number | null;
    screenshotUrl: string | null;
    note: string | null;
    submittedAt: string;
  } | null;
  assignedAt: string;
  escalatedAt: string;
  expiresAt: string;
};

export async function adminEscalations(): Promise<EscalatedTxn[]> {
  const rows = await queryWithRetry(() =>
    prisma.p2PTransaction.findMany({
      where: { status: TXN_STATUS.ESCALATED },
      orderBy: { escalatedAt: "asc" },
      take: 100,
    })
  );
  return rows.map((r) => ({
    id: r.id,
    playerRef: playerRef(r.playerId),
    agentCode: r.agentCode,
    requestedAmount: Number(r.requestedAmount),
    playerProof: r.playerProof as EscalatedTxn["playerProof"],
    assignedAt: r.assignedAt.toISOString(),
    escalatedAt: r.escalatedAt?.toISOString() ?? "",
    expiresAt: r.expiresAt.toISOString(),
  }));
}

/** Admin resolution of an escalation — reuses the confirmTransaction money path. */
export async function adminResolveEscalation(
  txnId: string,
  action: "approve" | "reject",
  adminNote?: string
): Promise<{ txnId: string; amount: number } | void> {
  return queryWithRetry(() =>
    prisma.$transaction(async (tx) => {
      const txn = await tx.p2PTransaction.findUnique({ where: { id: txnId } });
      if (!txn) throw new P2PError(E.TXN_NOT_FOUND, "Transaction not found");
      if (txn.status !== TXN_STATUS.ESCALATED) {
        throw new P2PError(E.NOT_ESCALATED, "Transaction is not escalated");
      }
      const now = new Date();
      if (action === "reject") {
        await tx.p2PTransaction.update({
          where: { id: txn.id },
          data: {
            status: TXN_STATUS.ADMIN_REJECTED,
            adminNote: adminNote?.trim() ?? null,
            completedAt: now,
          },
        });
        await tx.p2PAuditLog.create({
          data: {
            actor: "ADMIN",
            action: "ADMIN_REJECT_TXN",
            targetType: "P2PTransaction",
            targetId: txn.id,
            metadata: { adminNote: adminNote?.trim() ?? null },
          },
        });
        notify({
          type: "txn.admin_rejected",
          category: "transaction",
          priority: "high",
          recipientType: "player",
          recipientId: txn.playerId,
          payload: {
            txnId: txn.id,
            referenceCode: txn.referenceCode,
            requestedAmount: Number(txn.requestedAmount),
            adminNote: adminNote?.trim() ?? null,
          },
        });
        return;
      }

      const proof = txn.playerProof as { transactionId?: string; senderAccount?: string } | null;
      const amount = round2(Number(txn.requestedAmount));
      const agentCode = txn.agentCode;
      const agent = agentCode
        ? await tx.p2PAgent.findUnique({ where: { agentCode } })
        : null;
      if (!agentCode || !agent || Number(agent.floatBalance) < amount) {
        throw new P2PError(E.INSUFFICIENT_FLOAT, "Agent float too low — fund the agent before approving");
      }
      const newFloat = round2(Number(agent.floatBalance) - amount);
      await tx.p2PAgent.update({
        where: { agentCode },
        data: { floatBalance: newFloat },
      });
      await tx.p2PFloatLedger.create({
        data: {
          agentCode,
          txnType: "PLAYER_DEPOSIT",
          amount: -amount,
          balanceAfter: newFloat,
          referenceId: txn.id,
        },
      });

      const player = await tx.winUser.findUniqueOrThrow({
        where: { id: txn.playerId },
      });
      const playerBalance = round2(Number(player.balance) + amount);
      await tx.winUser.update({
        where: { id: txn.playerId },
        data: { balance: playerBalance },
      });
      await tx.winTransaction.create({
        data: {
          userId: txn.playerId,
          kind: "deposit",
          type: "deposit",
          method: "p2p",
          amount,
          balanceAfter: playerBalance,
          ref: `p2p:${txn.id}`,
          transactionId: proof?.transactionId ?? null,
          senderAccount: proof?.senderAccount ?? null,
          status: "approved",
          approvedAt: now,
          meta: JSON.stringify({ agentCode, p2p: true, adminApproved: true }),
        },
      });

      await tx.p2PTransaction.update({
        where: { id: txn.id },
        data: {
          status: TXN_STATUS.ADMIN_APPROVED,
          confirmedAmount: amount,
          adminNote: adminNote?.trim() ?? null,
          completedAt: now,
        },
      });
      await tx.p2PAuditLog.create({
        data: {
          actor: "ADMIN",
          action: "ADMIN_APPROVE_TXN",
          targetType: "P2PTransaction",
          targetId: txn.id,
          metadata: { amount, adminNote: adminNote?.trim() ?? null },
        },
      });
      notify({
        type: "txn.admin_approved",
        category: "transaction",
        priority: "high",
        recipientType: "player",
        recipientId: txn.playerId,
        payload: {
          txnId: txn.id,
          referenceCode: txn.referenceCode,
          amount,
          balanceAfter: playerBalance,
          adminNote: adminNote?.trim() ?? null,
        },
      });
      return { txnId: txn.id, amount };
    })
  );
}

export const P2P_ERR = E;
export type TxClient = Prisma.TransactionClient;
