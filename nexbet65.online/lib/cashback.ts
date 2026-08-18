import { prisma, queryWithRetry } from "@/lib/db";
import { creditLockedReward } from "@/lib/referral";

/**
 * Daily 10% cashback on gambling losses.
 *
 * Each night (cron hits /api/internal/cashback) we process the previous
 * calendar day in Asia/Dhaka (UTC+6). For every player whose net result that
 * day was a loss — net = bets − payouts − refunds < 0 — we credit 10% of the
 * loss as a locked (non-withdrawable, playable) reward.
 *
 * Idempotent: every credit carries a unique ref `cashback-<day>-<userId>`, so
 * re-running a day is a no-op for users already credited.
 */

export const CASHBACK_RATE = 0.1;

const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;

/** UTC instant of the most recent Asia/Dhaka midnight at or before `d`. */
export function dhakaDayStart(d: Date): Date {
  const ms = d.getTime() + DHAKA_OFFSET_MS;
  return new Date(Math.floor(ms / 86400000) * 86400000 - DHAKA_OFFSET_MS);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export type CashbackRunResult = {
  day: string; // ISO date (UTC) of the day processed
  creditedUsers: number;
  totalCredited: number;
};

/** Asia/Dhaka calendar date (YYYY-MM-DD) for a UTC instant. */
function dhakaDateKey(d: Date): string {
  return new Date(d.getTime() + DHAKA_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * Processes the day before `now` (in Asia/Dhaka): credits 10% of each net loss
 * as locked cashback. Safe to call repeatedly for the same day.
 */
export async function runDailyCashback(now = new Date()): Promise<CashbackRunResult> {
  const dayEnd = dhakaDayStart(now); // start of "today" (Dhaka) = end of "yesterday"
  const dayStart = new Date(dayEnd.getTime() - 86400000);
  const dayKey = dhakaDateKey(dayStart);

  return queryWithRetry(async () => {
    const txs = await prisma.winTransaction.findMany({
      where: {
        createdAt: { gte: dayStart, lt: dayEnd },
        kind: { in: ["bet", "payout", "refund"] },
      },
      select: { userId: true, amount: true },
    });

    const netByUser = new Map<string, number>();
    for (const t of txs) {
      const key = t.userId;
      netByUser.set(key, round2((netByUser.get(key) ?? 0) + Number(t.amount)));
    }

    let creditedUsers = 0;
    let totalCredited = 0;

    const entries = Array.from(netByUser.entries());
    // Interactive transaction timeout raised well above the 5s default: the
    // Neon compute may cold-start mid-run and a long tail of users needs time.
    await prisma.$transaction(
      async (tx) => {
        for (let i = 0; i < entries.length; i += 1) {
          const userId = entries[i][0];
          const net = entries[i][1];
          if (net >= 0) continue; // profit or break-even day → no cashback
          const loss = round2(-net);
          const cashback = round2(loss * CASHBACK_RATE);
          if (cashback <= 0) continue;
          const result = await creditLockedReward(
            tx,
            userId,
            cashback,
            "cashback",
            `cashback-${dayKey}-${userId}`,
            `Daily cashback (10% of ৳${loss} net loss)`
          );
          if (result) {
            creditedUsers += 1;
            totalCredited += cashback;
          }
        }
      },
      { maxWait: 20_000, timeout: 120_000 }
    );

    return { day: dayKey, creditedUsers, totalCredited: round2(totalCredited) };
  });
}
