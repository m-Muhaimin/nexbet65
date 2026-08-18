import { prisma, queryWithRetry } from "@/lib/db";
import { adminCan, getAdminContext } from "@/lib/admin-access";
import { creditLockedReward, REFERRAL_DEPOSIT_BONUS } from "@/lib/referral";

export type PaymentMethodId = "bkash" | "nagad" | "bank" | "usdt" | "usdc";
export type PaymentRequestType = "deposit" | "withdraw";
export type PaymentRequestStatus = "pending" | "approved" | "rejected";

export const DEPOSIT_PRESETS = [500, 1000, 1500];

export type BonusTier = {
  min: number;
  max: number | null;
  rate: number;
  label: string;
};

/**
 * One-time first-deposit bonus (no signup bonus). Tiers apply on the first
 * approved deposit:
 *   50%  for 500–999 BDT
 *   100% for 1000–2000 BDT
 *   150% for > 2000 BDT
 * Deposits below 500 BDT earn no bonus.
 */
export const FIRST_DEPOSIT_BONUS_TIERS: BonusTier[] = [
  { min: 500, max: 999, rate: 0.5, label: "50%" },
  { min: 1000, max: 2000, rate: 1, label: "100%" },
  { min: 2001, max: null, rate: 1.5, label: "150%" },
];

export function firstDepositBonusRate(amount: number): number {
  if (amount >= 500 && amount < 1000) return 0.5;
  if (amount >= 1000 && amount <= 2000) return 1;
  if (amount > 2000) return 1.5;
  return 0;
}

export function firstDepositBonusFor(amount: number): number {
  return round2(amount * firstDepositBonusRate(amount));
}

export function firstDepositBonusLabel(amount: number): string {
  const rate = firstDepositBonusRate(amount);
  return rate > 0 ? `${Math.round(rate * 100)}%` : "0%";
}

export type PaymentMethodConfig = {
  id: PaymentMethodId;
  label: string;
  icon: string;
  accountLabel: string;
  account: string;
  holder: string;
  note?: string;
  qrImage?: string;
  instructions: string[];
  min: number;
  max: number;
};

/**
 * Platform payout details the player sends money to. Update these with the
 * real NexBet65 receiving accounts before going live.
 */
export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: "bkash",
    label: "bKash",
    icon: "📱",
    accountLabel: "bKash Cash Out Number",
    account: "01755650768",
    holder: "NexBet65",
    instructions: [
      "Open your bKash app → Cash Out.",
      `Cash Out the exact amount to ${"01755650768"} (NexBet65).`,
      "Confirm with your bKash PIN.",
      "Copy the Transaction ID (11-character code starting with 11HJ…).",
    ],
    min: 100,
    max: 100000,
  },
  {
    id: "nagad",
    label: "Nagad",
    icon: "🟠",
    accountLabel: "Nagad Personal Number",
    account: "01800-000000",
    holder: "NexBet65",
    instructions: [
      "Open your Nagad app → Send Money.",
      `Send the exact amount to ${"01800-000000"} (NexBet65).`,
      "Confirm with your Nagad PIN.",
      "Copy the Transaction ID / reference shown after sending.",
    ],
    min: 100,
    max: 100000,
  },
  {
    id: "bank",
    label: "Bank",
    icon: "🏦",
    accountLabel: "Bank Account (DBBL)",
    account: "A/C 123-456-7890 (DBBL, Dhanmondi)",
    holder: "NexBet65 LTD",
    note: "Bank transfers can take a few hours to clear.",
    instructions: [
      "Log into your bank / DBBL Nexus app.",
      "Use Send Money / Transfer to the account above.",
      "Add your NexBet65 username as the reference.",
      "Note the Transaction Reference / Trx ID.",
    ],
    min: 1000,
    max: 1000000,
  },
  {
    id: "usdt",
    label: "USDT",
    icon: "🟢",
    accountLabel: "USDT (Tether) — Solana Network",
    account: "7P44RAps5X1nwQQtYW9cPUFYNNBQtKGCK9pH7zQWBiZo",
    holder: "NexBet65",
    note: "USDT only on the Solana network — any other network will be lost.",
    qrImage: "/usdt-qr.png",
    instructions: [
      "Open your wallet/exchange → Withdraw USDT (Tether).",
      "Choose the Solana network (SOL/SPL).",
      "Scan the QR or send to the wallet address above. Send exactly the amount you want credited.",
      "Copy the Transaction Hash (TXID) after the transfer and paste it below.",
    ],
    min: 500,
    max: 500000,
  },
  {
    id: "usdc",
    label: "USDC",
    icon: "🔵",
    accountLabel: "USDC — Solana Network",
    account: "7P44RAps5X1nwQQtYW9cPUFYNNBQtKGCK9pH7zQWBiZo",
    holder: "NexBet65",
    note: "USDC only on the Solana network — any other network will be lost.",
    qrImage: "/usdc-qr.png",
    instructions: [
      "Open your wallet/exchange → Withdraw USDC.",
      "Choose the Solana network (SOL/SPL).",
      "Scan the QR or send to the wallet address above. Send exactly the amount you want credited.",
      "Copy the Transaction Hash (TXID) after the transfer and paste it below.",
    ],
    min: 500,
    max: 500000,
  },
];

export function getPaymentMethod(id: string): PaymentMethodConfig | undefined {
  return PAYMENT_METHODS.find((m) => m.id === id);
}

export { isAdminUser } from "@/lib/admin-roles";

export type PaymentRequestDTO = {
  id: string;
  type: PaymentRequestType;
  method: PaymentMethodConfig | null;
  amount: number;
  status: PaymentRequestStatus;
  transactionId: string | null;
  senderAccount: string | null;
  firstDepositBonus: number | null;
  approvedAt: string | null;
  createdAt: string;
};

type RequestRow = {
  id: string;
  type: string | null;
  method: string | null;
  amount: unknown;
  status: string | null;
  transactionId: string | null;
  senderAccount: string | null;
  firstDepositBonus: unknown;
  approvedAt: Date | null;
  createdAt: Date;
};

function toDTO(row: RequestRow): PaymentRequestDTO {
  const method = row.method ? (getPaymentMethod(row.method) ?? null) : null;
  return {
    id: row.id,
    type: (row.type === "withdraw" ? "withdraw" : "deposit") as PaymentRequestType,
    method,
    amount: Number(row.amount),
    status: (row.status === "approved"
      ? "approved"
      : row.status === "rejected"
        ? "rejected"
        : "pending") as PaymentRequestStatus,
    transactionId: row.transactionId,
    senderAccount: row.senderAccount,
    firstDepositBonus:
      row.firstDepositBonus === null || row.firstDepositBonus === undefined
        ? null
        : Number(row.firstDepositBonus),
    approvedAt: row.approvedAt ? row.approvedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

export type PaymentResult =
  | { ok: true; request: PaymentRequestDTO }
  | { ok: false; error: string };

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** What a user may actually withdraw: total balance minus locked bonus funds. */
function withdrawableFor(balance: unknown, lockedBonus: unknown): number {
  return round2(Math.max(0, Number(balance) - Number(lockedBonus ?? 0)));
}

function validateAmount(amount: unknown, method: PaymentMethodConfig): number | null {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n < method.min || n > method.max) return null;
  return round2(n);
}

/**
 * Records a new pending deposit request. The balance is untouched until an
 * admin approves the request (see reviewPaymentRequest).
 */
export async function createDepositRequest(
  username: string,
  input: { method: string; amount: number; senderAccount: string; transactionId: string }
): Promise<PaymentResult> {
  const method = getPaymentMethod(input.method);
  if (!method) return { ok: false, error: "Invalid payment method" };
  const amount = validateAmount(input.amount, method);
  if (amount === null) {
    return {
      ok: false,
      error: `Amount must be between ${method.min} and ${method.max}`,
    };
  }
  const senderAccount = input.senderAccount?.trim() ?? "";
  const transactionId = input.transactionId?.trim() ?? "";
  const isStableCoin = method.id === "usdt" || method.id === "usdc";
  if (!isStableCoin && senderAccount.length < 4) {
    return { ok: false, error: "Please enter the account you sent from" };
  }
  if (transactionId.length < 4) {
    return { ok: false, error: "Please enter a valid transaction ID / reference" };
  }

  const ref = `deposit-${method.id}-${transactionId}`;

  return queryWithRetry<PaymentResult>(async () => {
    const request = await prisma.$transaction(async (tx) => {
      const user = await tx.winUser.findUnique({ where: { username } });
      if (!user) throw new Error("Account not found");

      const existing = await tx.winTransaction.findUnique({ where: { ref } });
      if (existing) {
        const err = new Error("That transaction ID was already submitted");
        (err as { code?: string }).code = "DUP_TX";
        throw err;
      }

      return tx.winTransaction.create({
        data: {
          userId: user.id,
          kind: "deposit",
          type: "deposit",
          status: "pending",
          amount,
          balanceAfter: user.balance,
          method: method.id,
          transactionId,
          senderAccount,
          ref,
          meta: `${method.label} deposit of ৳${amount} from ${senderAccount}`,
        },
      });
    });
    return { ok: true, request: toDTO(request) };
  }).catch((err) => {
    if (
      err &&
      ((err as { code?: string }).code === "DUP_TX" ||
        (err instanceof Error && err.message === "Account not found"))
    ) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : "That transaction ID was already submitted",
      };
    }
    throw err;
  });
}

/**
 * Records a new pending withdrawal request. The balance is debited only when an
 * admin approves the request (see reviewPaymentRequest).
 */
export async function createWithdrawRequest(
  username: string,
  input: { method: string; amount: number; senderAccount: string }
): Promise<PaymentResult> {
  const method = getPaymentMethod(input.method);
  if (!method) return { ok: false, error: "Invalid payout method" };
  const amount = validateAmount(input.amount, method);
  if (amount === null) {
    return {
      ok: false,
      error: `Amount must be between ${method.min} and ${method.max}`,
    };
  }
  const senderAccount = input.senderAccount?.trim() ?? "";
  if (senderAccount.length < 4) {
    return { ok: false, error: "Please enter the account to receive your payout" };
  }

  return queryWithRetry<PaymentResult>(async () => {
    const request = await prisma.$transaction(async (tx) => {
      const user = await tx.winUser.findUnique({ where: { username } });
      if (!user) throw new Error("Account not found");
      const withdrawable = withdrawableFor(user.balance, user.lockedBonus);
      if (amount > withdrawable) {
        throw new Error("Insufficient withdrawable balance (first-deposit bonus cannot be withdrawn)");
      }

      return tx.winTransaction.create({
        data: {
          userId: user.id,
          kind: "withdraw",
          type: "withdraw",
          status: "pending",
          amount,
          balanceAfter: user.balance,
          method: method.id,
          senderAccount,
          ref: `withdraw-${method.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          meta: `Withdraw to ${method.label} ${senderAccount}`,
        },
      });
    });
    return { ok: true, request: toDTO(request) };
  }).catch((err) => {
    if (
      err instanceof Error &&
      (err.message === "Account not found" ||
        err.message === "Insufficient withdrawable balance (first-deposit bonus cannot be withdrawn)")
    ) {
      return { ok: false as const, error: err.message };
    }
    throw err;
  });
}

export async function listPaymentRequests(input: {
  username?: string;
  status?: PaymentRequestStatus;
  take?: number;
}): Promise<PaymentRequestDTO[]> {
  const { username, status, take = 100 } = input;
  return queryWithRetry(async () => {
    const where: Record<string, unknown> = {
      type: { in: ["deposit", "withdraw"] },
    };
    if (username) {
      const user = await prisma.winUser.findUnique({ where: { username } });
      if (!user) return [];
      where.userId = user.id;
    }
    if (status) where.status = status;

    const rows = await prisma.winTransaction.findMany({
      where: where as never,
      orderBy: { createdAt: "desc" },
      take,
    });
    return rows.map(toDTO);
  });
}

/**
 * Admin review of a payment request.
 *  - deposit  approved → credits the deposit amount (+ 30% one-time bonus on the
 *    FIRST approved deposit) to the user's wallet.
 *  - withdraw approved → debits the amount from the user's wallet.
 *  - reject    → marks the request rejected; no balance moves.
 */
export async function reviewPaymentRequest(
  requestId: string,
  action: "approve" | "reject"
): Promise<PaymentResult> {
  const ctx = await getAdminContext();
  if (!adminCan(ctx, "payments")) {
    return { ok: false, error: "Not authorized" };
  }

  return queryWithRetry<PaymentResult>(async () => {
    const updated = await prisma.$transaction(async (tx) => {
      const request = await tx.winTransaction.findUnique({ where: { id: requestId } });
      if (!request) throw new Error("Payment request not found");
      if (request.status !== "pending") {
        throw new Error("Request was already reviewed");
      }

      if (action === "reject") {
        const rejected = await tx.winTransaction.update({
          where: { id: requestId },
          data: { status: "rejected", approvedAt: new Date() },
        });
        return rejected;
      }

      const user = await tx.winUser.findUnique({ where: { id: request.userId } });
      if (!user) throw new Error("Account not found");

      if (request.type === "deposit") {
        const depositAmount = Number(request.amount);
        const priorDeposits = await tx.winTransaction.count({
          where: {
            userId: user.id,
            type: "deposit",
            status: "approved",
            id: { not: requestId },
          },
        });
        const isFirstDeposit = priorDeposits === 0;
        const bonus = isFirstDeposit ? firstDepositBonusFor(depositAmount) : 0;

        const afterDeposit = round2(Number(user.balance) + depositAmount);
        await tx.winUser.update({
          where: { id: user.id },
          data: { balance: afterDeposit },
        });
        await tx.winTransaction.create({
          data: {
            userId: user.id,
            kind: "deposit",
            amount: depositAmount,
            balanceAfter: afterDeposit,
            ref: `deposit-credit-${requestId}`,
            meta: `Deposit approved (${request.method ?? ""} · ${request.transactionId ?? ""})`,
          },
        });
        if (bonus > 0) {
          const afterBonus = round2(afterDeposit + bonus);
          await tx.winUser.update({
            where: { id: user.id },
            data: { balance: afterBonus, lockedBonus: { increment: bonus } },
          });
          await tx.winTransaction.create({
            data: {
              userId: user.id,
              kind: "deposit_bonus",
              amount: bonus,
              balanceAfter: afterBonus,
              ref: `deposit-bonus-${requestId}`,
              meta: `First-deposit bonus (${firstDepositBonusLabel(depositAmount)})`,
            },
          });
        }

        // Referral: when a referred friend's FIRST deposit is approved, the
        // referrer gets a flat locked reward (idempotent per request).
        if (isFirstDeposit && user.referredById) {
          await creditLockedReward(
            tx,
            user.referredById,
            REFERRAL_DEPOSIT_BONUS,
            "referral_bonus",
            `refbonus-${requestId}`,
            `Referral bonus (৳${REFERRAL_DEPOSIT_BONUS}) for ${user.username}'s first deposit`
          );
        }

        return tx.winTransaction.update({
          where: { id: requestId },
          data: {
            status: "approved",
            approvedAt: new Date(),
            firstDepositBonus: bonus > 0 ? bonus : null,
          },
        });
      }

      // withdraw
      const withdrawAmount = Number(request.amount);
      const withdrawable = withdrawableFor(user.balance, user.lockedBonus);
      if (withdrawAmount > withdrawable) {
        throw new Error("Insufficient withdrawable balance (first-deposit bonus cannot be withdrawn)");
      }
      const after = round2(Number(user.balance) - withdrawAmount);
      await tx.winUser.update({
        where: { id: user.id },
        data: { balance: after },
      });
      await tx.winTransaction.create({
        data: {
          userId: user.id,
          kind: "withdraw",
          amount: -withdrawAmount,
          balanceAfter: after,
          ref: `withdraw-debit-${requestId}`,
          meta: `Withdrawal approved (${request.method ?? ""})`,
        },
      });
      return tx.winTransaction.update({
        where: { id: requestId },
        data: { status: "approved", approvedAt: new Date() },
      });
    });

    return { ok: true, request: toDTO(updated) };
  }).catch((err) => {
    const msg = err instanceof Error ? err.message : "Review failed";
    return { ok: false as const, error: msg };
  });
}

export type PaymentAdminRow = PaymentRequestDTO & { username: string };

export async function listAllPaymentRequestsForAdmin(
  status?: PaymentRequestStatus,
  take = 200
): Promise<PaymentAdminRow[]> {
  return queryWithRetry(async () => {
    const where: Record<string, unknown> = {
      type: { in: ["deposit", "withdraw"] },
    };
    if (status) where.status = status;

    const rows = await prisma.winTransaction.findMany({
      where: where as never,
      orderBy: { createdAt: "desc" },
      take,
      include: { user: { select: { username: true } } },
    });
    return rows.map((row) => ({
      ...toDTO(row),
      username: row.user.username,
    }));
  });
}
