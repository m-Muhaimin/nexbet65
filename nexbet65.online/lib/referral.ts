import type { Prisma } from "@prisma/client";

import { prisma, queryWithRetry } from "@/lib/db";

/**
 * Referral system (nexbet65).
 *
 *  - referral code = the username (unique, URL-safe). Share link:
 *      /register?ref=<username>
 *  - A flat REFERRAL_DEPOSIT_BONUS (locked, non-withdrawable) is credited to the
 *    referrer the first time a referred friend's deposit is approved.
 *  - Lifetime MLM commission: the referrer earns a percentage of EVERY bet their
 *    downline places, up to COMMISSION_DEPTH levels deep, forever:
 *      L1 (direct referral)  1.00%
 *      L2                     0.50%
 *      L3                     0.25%
 *    Credited per bet as a locked reward (see wallet-server.ts).
 */

export const REFERRAL_DEPOSIT_BONUS = 200;

export const COMMISSION_LEVELS: ReadonlyArray<{ level: number; rate: number }> = [
  { level: 1, rate: 0.01 },
  { level: 2, rate: 0.005 },
  { level: 3, rate: 0.0025 },
];

export const COMMISSION_DEPTH = COMMISSION_LEVELS.length;

/** Public base URL used for referral links. Overridable per environment. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://nexbet65.suprbuild.com";

export function referralLink(username: string): string {
  return `${SITE_URL}/register?ref=${encodeURIComponent(username)}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Credits a locked (non-withdrawable) reward to a wallet inside an existing
 * transaction: balance += amount AND lockedBonus += amount. Idempotent via a
 * unique `ref` — a second call with the same ref is a no-op. Returns the new
 * (balance, lockedBonus), or null if the user is missing / amount invalid.
 */
export async function creditLockedReward(
  tx: Prisma.TransactionClient,
  userId: string,
  amount: number,
  kind: string,
  ref: string,
  meta: string
): Promise<{ balance: number; lockedBonus: number } | null> {
  const amt = round2(Number(amount));
  if (!Number.isFinite(amt) || amt <= 0) return null;

  const existing = await tx.winTransaction.findUnique({ where: { ref } });
  if (existing) return null;

  const user = await tx.winUser.findUnique({ where: { id: userId } });
  if (!user) return null;

  const balance = round2(Number(user.balance) + amt);
  const lockedBonus = round2(Number(user.lockedBonus ?? 0) + amt);
  await tx.winUser.update({
    where: { id: userId },
    data: { balance, lockedBonus },
  });
  await tx.winTransaction.create({
    data: { userId, kind, amount: amt, balanceAfter: balance, ref, meta },
  });
  return { balance, lockedBonus };
}

/**
 * Walks the referral tree from `bettor` upward (L1 = direct referrer, L2, L3)
 * and credits each ancestor's MLM commission on the staked amount. Runs inside
 * the caller's transaction. Commission txs are idempotent by ref derived from
 * the bet's transaction id.
 */
export async function creditBetCommissions(
  tx: Prisma.TransactionClient,
  bettor: { id: string; username: string; referredById: string | null },
  staked: number,
  betTxId: string
): Promise<void> {
  if (!bettor.referredById) return;
  let cursorId: string | null = bettor.referredById;

  for (const lvl of COMMISSION_LEVELS) {
    if (!cursorId) break;
    const ancestor: { id: string; referredById: string | null } | null =
      await tx.winUser.findFirst({
        where: { id: cursorId },
        select: { id: true, referredById: true },
      });
    if (!ancestor || ancestor.id === bettor.id) break;

    const commission = round2(staked * lvl.rate);
    if (commission > 0) {
      await creditLockedReward(
        tx,
        ancestor.id,
        commission,
        "referral_commission",
        `comm-${betTxId}-l${lvl.level}`,
        `L${lvl.level} commission (${lvl.rate * 100}%) on ${bettor.username}'s bet of ৳${staked}`
      );
    }
    cursorId = ancestor.referredById;
  }
}

export type ReferralStats = {
  referralCode: string;
  friends: number;
  earned: number; // total referral_bonus + referral_commission credited
};

export async function getReferralStats(
  username: string
): Promise<ReferralStats | null> {
  return queryWithRetry(async () => {
    const user = await prisma.winUser.findUnique({ where: { username } });
    if (!user) return null;
    const [agg, friends] = await Promise.all([
      prisma.winTransaction.aggregate({
        where: { userId: user.id, kind: { in: ["referral_bonus", "referral_commission"] } },
        _sum: { amount: true },
      }),
      prisma.winUser.count({ where: { referredById: user.id } }),
    ]);
    return {
      referralCode: user.username,
      friends,
      earned: Number(agg._sum.amount ?? 0),
    };
  });
}
