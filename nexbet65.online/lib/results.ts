import { prisma, queryWithRetry } from "@/lib/db";

export type LiveWin = {
  game: "aviator" | "wheel";
  detail: string;
  amount: number;
  at: string;
};

export type ResultsSnapshot = {
  wins: LiveWin[];
  topMultiplier: number | null;
  recentCrashes: number[];
};

const WHEEL_LABELS: Record<string, string> = {
  bonus_double_flip: "Double Flip",
  bonus_pin_drop: "Pin Drop",
  bonus_treasure_hunt: "Treasure Hunt",
  bonus_big_spin: "Big Spin",
};

function wheelLabel(id: string): string {
  if (WHEEL_LABELS[id]) return WHEEL_LABELS[id];
  return id
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Reads recent settled wins from the SHARED game tables (User/Round/Bet) in the
 * same Neon DB via raw SQL — nexbet65.com's Prisma schema does not model them, so a
 * `db push` here can never touch them.
 */
export async function getRecentResults(): Promise<ResultsSnapshot> {
  return queryWithRetry(async () => {
    const [winsRows, crashRows] = await Promise.all([
      prisma.$queryRawUnsafe<
        {
          game: string;
          payout: string;
          crash: number | null;
          segment: string | null;
          at: Date;
        }[]
      >(`
        SELECT b."game" AS "game",
               b."payout" AS "payout",
               r."crashPoint" AS "crash",
               r."winningSegment" AS "segment",
               b."createdAt" AS "at"
        FROM "Bet" b
        LEFT JOIN "Round" r ON r."id" = b."roundId"
        WHERE b."status" IN ('cashed_out', 'won')
          AND b."payout" IS NOT NULL
          AND b."payout" > 0
        ORDER BY b."createdAt" DESC
        LIMIT 12
      `),
      prisma.$queryRawUnsafe<{ crash: number | null }[]>(`
        SELECT "crashPoint" AS "crash"
        FROM "Round"
        WHERE "game" = 'aviator'
          AND "crashPoint" IS NOT NULL
          AND "createdAt" >= now() - interval '24 hours'
        ORDER BY "createdAt" DESC
        LIMIT 12
      `),
    ]);

    const wins: LiveWin[] = winsRows.map((row) => ({
      game: row.game === "wheel" ? "wheel" : "aviator",
      detail:
        row.game === "wheel"
          ? wheelLabel(row.segment ?? "wheel")
          : `Aviator ${Number(row.crash ?? 0).toFixed(2)}x`,
      amount: Math.round(Number(row.payout) * 100) / 100,
      at: row.at.toISOString(),
    }));

    const recentCrashes = crashRows
      .map((r) => Number(r.crash))
      .filter((n) => Number.isFinite(n) && n > 0)
      .map((n) => Math.round(n * 100) / 100);

    return {
      wins,
      topMultiplier:
        recentCrashes.length > 0 ? Math.max(...recentCrashes) : null,
      recentCrashes,
    };
  });
}
