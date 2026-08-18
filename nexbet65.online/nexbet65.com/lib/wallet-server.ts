import { prisma, queryWithRetry } from "@/lib/db";
import { creditBetCommissions } from "@/lib/referral";

export type WalletTransactionDTO = {
  id: string;
  kind: string;
  amount: number;
  balanceAfter: number;
  meta: string | null;
  createdAt: string;
};

export type WalletSnapshot = {
  username: string;
  avatar: string;
  memberSince: string;
  balance: number;
  lockedBonus: number; // first-deposit bonus still locked (not withdrawable)
  withdrawable: number; // balance - lockedBonus
  transactions: WalletTransactionDTO[];
};

export type RecordResult =
  | { ok: true; balance: number; lockedBonus: number; withdrawable: number }
  | { ok: false; error: string; balance?: number; lockedBonus?: number; withdrawable?: number };

function toDTO(tx: {
  id: string;
  kind: string;
  amount: unknown;
  balanceAfter: unknown;
  meta: string | null;
  createdAt: Date;
}): WalletTransactionDTO {
  return {
    id: tx.id,
    kind: tx.kind,
    amount: Number(tx.amount),
    balanceAfter: Number(tx.balanceAfter),
    meta: tx.meta,
    createdAt: tx.createdAt.toISOString(),
  };
}

export async function getWalletSnapshot(
  username: string
): Promise<WalletSnapshot | null> {
  return queryWithRetry(async () => {
    const user = await prisma.winUser.findUnique({ where: { username } });
    if (!user) return null;
    const txs = await prisma.winTransaction.findMany({
      where: { userId: user.id, status: null },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return {
      username: user.username,
      avatar: user.avatar,
      memberSince: user.memberSince.toISOString(),
      balance: Number(user.balance),
      lockedBonus: Number(user.lockedBonus ?? 0),
      withdrawable: Math.max(0, round2(Number(user.balance) - Number(user.lockedBonus ?? 0))),
      transactions: txs.map(toDTO),
    };
  });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Reverses a client-placed bet debit (public route). Safe to expose to the
 * browser because it only credits back a transaction that was actually debited
 * with the same `ref` for the same user — a refund can never mint money.
 */
export async function refundWalletDebit(
  username: string,
  originalRef: string
): Promise<RecordResult> {
  if (!originalRef) {
    return { ok: false, error: "Missing ref" };
  }
  return queryWithRetry(async () => {
    return prisma.$transaction(async (tx) => {
      const bet = await tx.winTransaction.findUnique({
        where: { ref: originalRef },
      });
      if (!bet || bet.kind !== "bet" || Number(bet.amount) >= 0) {
        return { ok: false, error: "No matching bet to refund" };
      }
      const user = await tx.winUser.findUnique({ where: { username } });
      if (!user || user.id !== bet.userId) {
        return { ok: false, error: "No matching bet to refund" };
      }

      const refundRef = `refund:${originalRef}`;
      const existing = await tx.winTransaction.findUnique({
        where: { ref: refundRef },
      });
      if (existing) {
        const locked = Number(user.lockedBonus ?? 0);
        return {
          ok: true as const,
          balance: Number(user.balance),
          lockedBonus: locked,
          withdrawable: round2(Math.max(0, Number(user.balance) - locked)),
        };
      }

      const amount = round2(-Number(bet.amount));
      const current = await tx.winUser.findUnique({ where: { id: user.id } });
      if (!current) return { ok: false, error: "Account not found" };
      const currentBalance = Number(current.balance);
      const currentLocked = Number(current.lockedBonus ?? 0);
      const newBalance = round2(currentBalance + amount);
      let newLocked = round2(
        Math.min(newBalance, currentLocked + amount)
      );
      newLocked = round2(Math.min(Math.max(0, newLocked), newBalance));

      const updated = await tx.winUser.update({
        where: { id: user.id },
        data: { balance: newBalance, lockedBonus: newLocked },
      });
      await tx.winTransaction.create({
        data: {
          userId: user.id,
          kind: "bet_refund",
          amount,
          balanceAfter: newBalance,
          ref: refundRef,
          meta: `Refund of ${originalRef}`,
        },
      });
      return {
        ok: true as const,
        balance: Number(updated.balance),
        lockedBonus: Number(updated.lockedBonus),
        withdrawable: round2(
          Math.max(0, Number(updated.balance) - Number(updated.lockedBonus))
        ),
      };
    });
  });
}

export async function recordWalletTransaction(
  username: string,
  input: {
    kind: string;
    amount: number; // signed: -10 for a bet, +payout for a win
    ref?: string;
    meta?: string;
  }
): Promise<RecordResult> {
  const { kind, amount, ref = undefined, meta = undefined } = input;
  if (!Number.isFinite(amount)) {
    return { ok: false, error: "Invalid amount" };
  }
  if (!["signup_bonus", "bet", "payout", "refund", "bet_refund", "bet_adjust", "bet_loss", "manual", "deposit", "withdraw", "deposit_bonus", "referral_bonus", "referral_commission", "cashback", "capture_bonus"].includes(kind)) {
    return { ok: false, error: "Invalid transaction kind" };
  }
  return queryWithRetry(async () => {
    return prisma.$transaction(async (tx) => {
      const user = await tx.winUser.findUnique({ where: { username } });
      if (!user) return { ok: false, error: "Account not found" };

      if (ref) {
        const existing = await tx.winTransaction.findUnique({ where: { ref } });
        if (existing) {
          // Idempotent — already recorded (e.g. after a reconnect).
          const locked = Number(user.lockedBonus ?? 0);
          return {
            ok: true as const,
            balance: Number(user.balance),
            lockedBonus: locked,
            withdrawable: round2(Math.max(0, Number(user.balance) - locked)),
          };
        }
      }

      const current = await tx.winUser.findUnique({ where: { id: user.id } });
      if (!current) return { ok: false, error: "Account not found" };

      const currentBalance = Number(current.balance);
      const currentLocked = Number(current.lockedBonus ?? 0);
      const newBalance = Math.round((currentBalance + amount) * 100) / 100;
      if (newBalance < 0) {
        return {
          ok: false,
          error: "Insufficient funds",
          balance: currentBalance,
          lockedBonus: currentLocked,
          withdrawable: round2(Math.max(0, currentBalance - currentLocked)),
        };
      }

      // A bet consumes the locked (bonus) portion first; a refund of that bet
      // restores it. Granting a bonus / referral reward / cashback locks the
      // credited amount. Payouts from bonus-funded bets are real money and
      // never get locked.
      let newLocked = currentLocked;
      if (kind === "bet" && amount < 0) {
        newLocked = round2(Math.max(0, currentLocked + amount));
      } else if (kind === "refund" && amount > 0) {
        newLocked = round2(Math.min(newBalance, currentLocked + amount));
      } else if (kind === "bet_refund" && amount > 0) {
        newLocked = round2(Math.min(newBalance, currentLocked + amount));
      } else if (kind === "bet_adjust") {
        newLocked = round2(Math.max(0, Math.min(newBalance, currentLocked + amount)));
      } else if (
        ["signup_bonus", "deposit_bonus", "referral_bonus", "referral_commission", "cashback", "capture_bonus"].includes(kind) &&
        amount > 0
      ) {
        newLocked = round2(currentLocked + amount);
      }
      newLocked = round2(Math.min(Math.max(0, newLocked), newBalance));

      const updated = await tx.winUser.update({
        where: { id: user.id },
        data: { balance: newBalance, lockedBonus: newLocked },
      });
      const created = await tx.winTransaction.create({
        data: {
          userId: user.id,
          kind,
          amount,
          balanceAfter: newBalance,
          ref: ref ?? null,
          meta: meta ?? null,
        },
      });

      // Lifetime MLM commission: every bet credits the referrer's upline
      // (L1 1%, L2 0.5%, L3 0.25%) as a locked reward, same transaction.
      if (kind === "bet" && amount < 0) {
        await creditBetCommissions(tx, user, Math.abs(amount), created.id);
      }

      return {
        ok: true,
        balance: Number(updated.balance),
        lockedBonus: Number(updated.lockedBonus),
        withdrawable: round2(Math.max(0, Number(updated.balance) - Number(updated.lockedBonus))),
      };
    });
  });
}
