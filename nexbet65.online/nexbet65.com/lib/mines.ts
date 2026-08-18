import { createHash, createHmac, randomBytes, randomInt, randomUUID } from "node:crypto";

import { recordWalletTransaction, refundWalletDebit } from "@/lib/wallet-server";

export const MINES_GRID = 25;
export const MINES_MIN = 1;
export const MINES_MAX = 24;
export const MINES_RTP = 0.97;

const ROUND_TTL_MS = 30 * 60 * 1000;
export { ROUND_TTL_MS };

export function generateServerSeed(): string {
  return randomBytes(32).toString("hex");
}

export function hashSeed(seed: string): string {
  return createHash("sha256").update(seed).digest("hex");
}

/** Deterministic float in [0, 1) from HMAC-SHA256(serverSeed, msg). */
export function fairFloat(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  cursor: number
): number {
  const hmac = createHmac("sha256", serverSeed)
    .update(`${clientSeed}:${nonce}:${cursor}`)
    .digest("hex");
  return parseInt(hmac.substring(0, 8), 16) / 2 ** 32;
}

/** Fisher–Yates shuffle driven by the seed to pick the mine tile indices. */
export function deriveMineLayout(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  totalTiles: number,
  mineCount: number
): number[] {
  const indices = Array.from({ length: totalTiles }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(fairFloat(serverSeed, clientSeed, nonce, indices.length - 1 - i) * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, mineCount);
}

/**
 * Combinatorial multiplier: P(safe through k reveals) = Π (n-m-i)/(n-i),
 * multiplier = RTP / P, floored to 2 decimals.
 */
export function calculateMultiplier(k: number, m: number, n: number, rtp = MINES_RTP): number {
  if (k === 0) return 1;
  let p = 1;
  for (let i = 0; i < k; i++) {
    p *= (n - m - i) / (n - i);
  }
  return Math.floor((rtp / p) * 100) / 100;
}

export type MinesRound = {
  id: string;
  username: string;
  betAmount: number;
  mineCount: number;
  gridSize: number;
  minePositions: number[];
  revealedIndices: number[];
  multiplier: number;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  status: "active" | "ended";
  createdAt: number;
};

// Per-user ephemeral round state (single Node process on the VPS). Rounds are
// short-lived; a sweep drops anything stale to avoid unbounded growth.
const rounds = new Map<string, MinesRound>();

export function getRound(roundId: string): MinesRound | undefined {
  return rounds.get(roundId);
}

export type ActiveRoundSummary = {
  id: string;
  username: string;
  betAmount: number;
  mineCount: number;
  revealedCount: number;
  multiplier: number;
  status: MinesRound["status"];
  createdAt: number;
  elapsedMs: number;
};

/** Sanitized view for the admin panel: no mine positions or seeds for live rounds. */
export function listActiveRounds(): ActiveRoundSummary[] {
  sweep();
  return Array.from(rounds.values()).map((r) => ({
    id: r.id,
    username: r.username,
    betAmount: r.betAmount,
    mineCount: r.mineCount,
    revealedCount: r.revealedIndices.length,
    multiplier: r.multiplier,
    status: r.status,
    createdAt: r.createdAt,
    elapsedMs: Date.now() - r.createdAt,
  }));
}

function sweep() {
  const now = Date.now();
  rounds.forEach((round, id) => {
    if (now - round.createdAt > ROUND_TTL_MS) rounds.delete(id);
  });
}

// Refund any abandoned rounds (client left mid-game) so the wallet debit never
// disappears. Idempotent via refundWalletDebit's `refund:<ref>` uniqueness.
async function refundStaleRounds(): Promise<void> {
  const now = Date.now();
  const stale: MinesRound[] = [];
  rounds.forEach((round, id) => {
    if (now - round.createdAt > ROUND_TTL_MS) {
      rounds.delete(id);
      stale.push(round);
    }
  });
  for (const round of stale) {
    await refundWalletDebit(round.username, `mines-bet-${round.id}`);
  }
}

/** Refund an active round immediately (client navigated away / closed the tab). */
export async function abandonMinesRound(
  username: string,
  roundId: string
): Promise<{ ok: boolean; error?: string }> {
  const round = rounds.get(roundId);
  if (!round || round.status !== "active" || round.username !== username) {
    return { ok: false, error: "Round not found or already ended" };
  }
  const refunded = await refundWalletDebit(username, `mines-bet-${round.id}`);
  if (!refunded.ok) {
    return { ok: false, error: refunded.error ?? "Refund failed" };
  }
  rounds.delete(roundId);
  return { ok: true };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function startMinesRound(
  username: string,
  amount: number,
  mineCount: number,
  clientSeed?: string
): Promise<
  | {
      ok: true;
      roundId: string;
      gridSize: number;
      mineCount: number;
      serverSeedHash: string;
      clientSeed: string;
      nonce: number;
      balance: number;
      lockedBonus: number;
      withdrawable: number;
    }
  | { ok: false; error: string }
> {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Invalid bet amount" };
  }
  const mines = Math.floor(mineCount);
  if (mines < MINES_MIN || mines > MINES_MAX) {
    return { ok: false, error: "Invalid mine count" };
  }

  await refundStaleRounds();

  const serverSeed = generateServerSeed();
  const nonce = randomInt(0, 100000);
  const seed = clientSeed || randomBytes(8).toString("hex");
  const minePositions = deriveMineLayout(serverSeed, seed, nonce, MINES_GRID, mines);
  const id = randomUUID();

  const settled = await recordWalletTransaction(username, {
    kind: "bet",
    amount: -round2(amount),
    ref: `mines-bet-${id}`,
    meta: `Mines bet · ${mines} mines`,
  });
  if (!settled.ok) {
    return { ok: false, error: settled.error ?? "Bet rejected" };
  }

  rounds.set(id, {
    id,
    username,
    betAmount: round2(amount),
    mineCount: mines,
    gridSize: MINES_GRID,
    minePositions,
    revealedIndices: [],
    multiplier: 1,
    serverSeed,
    clientSeed: seed,
    nonce,
    status: "active",
    createdAt: Date.now(),
  });

  return {
    ok: true,
    roundId: id,
    gridSize: MINES_GRID,
    mineCount: mines,
    serverSeedHash: hashSeed(serverSeed),
    clientSeed: seed,
    nonce,
    balance: settled.balance,
    lockedBonus: settled.lockedBonus,
    withdrawable: settled.withdrawable,
  };
}

function settleWin(round: MinesRound): Promise<{
  ok: boolean;
  balance: number;
  lockedBonus: number;
  withdrawable: number;
}> {
  const payout = round2(round.betAmount * round.multiplier);
  return recordWalletTransaction(round.username, {
    kind: "payout",
    amount: payout,
    ref: `mines-payout-${round.id}`,
    meta: `Mines win @ ${round.multiplier.toFixed(2)}x`,
  }).then((r) =>
    r.ok
      ? { ok: true, balance: r.balance, lockedBonus: r.lockedBonus, withdrawable: r.withdrawable }
      : { ok: false, balance: 0, lockedBonus: 0, withdrawable: 0 }
  );
}

export type RevealResult =
  | { result: "safe"; revealed: number[]; multiplier: number; nextMultiplier: number }
  | { result: "mine"; tileIndex: number; mineLayout: number[]; serverSeed: string }
  | {
      result: "cashout";
      multiplier: number;
      payout: number;
      mineLayout: number[];
      serverSeed: string;
      balance: number;
      lockedBonus: number;
      withdrawable: number;
    };

export async function revealMinesTile(
  username: string,
  roundId: string,
  tileIndex: number
): Promise<{ ok: true; data: RevealResult } | { ok: false; error: string }> {
  await refundStaleRounds();
  const round = rounds.get(roundId);
  if (!round || round.status !== "active" || round.username !== username) {
    return { ok: false, error: "Round not found or already ended" };
  }
  const idx = Math.floor(tileIndex);
  if (!Number.isInteger(idx) || idx < 0 || idx >= MINES_GRID) {
    return { ok: false, error: "Invalid tile" };
  }
  if (round.revealedIndices.includes(idx)) {
    return { ok: false, error: "Tile already revealed" };
  }

  if (round.minePositions.includes(idx)) {
    round.status = "ended";
    rounds.delete(roundId);
    return {
      ok: true,
      data: { result: "mine", tileIndex: idx, mineLayout: round.minePositions, serverSeed: round.serverSeed },
    };
  }

  round.revealedIndices.push(idx);
  round.multiplier = calculateMultiplier(round.revealedIndices.length, round.mineCount, MINES_GRID);
  const nextMultiplier = calculateMultiplier(round.revealedIndices.length + 1, round.mineCount, MINES_GRID);

  // Auto-cashout when every safe tile is revealed.
  if (round.revealedIndices.length === MINES_GRID - round.mineCount) {
    const settled = await settleWin(round);
    if (!settled.ok) {
      round.status = "active";
      return { ok: false, error: "Payout failed — please retry" };
    }
    rounds.delete(roundId);
    return {
      ok: true,
      data: {
        result: "cashout",
        multiplier: round.multiplier,
        payout: round2(round.betAmount * round.multiplier),
        mineLayout: round.minePositions,
        serverSeed: round.serverSeed,
        balance: settled.balance,
        lockedBonus: settled.lockedBonus,
        withdrawable: settled.withdrawable,
      },
    };
  }

  return {
    ok: true,
    data: { result: "safe", revealed: round.revealedIndices, multiplier: round.multiplier, nextMultiplier },
  };
}

export async function cashOutMines(
  username: string,
  roundId: string
): Promise<
  | {
      ok: true;
      multiplier: number;
      payout: number;
      mineLayout: number[];
      serverSeed: string;
      balance: number;
      lockedBonus: number;
      withdrawable: number;
    }
  | { ok: false; error: string }
> {
  await refundStaleRounds();
  const round = rounds.get(roundId);
  if (!round || round.status !== "active" || round.username !== username) {
    return { ok: false, error: "Round not found or already ended" };
  }
  if (round.revealedIndices.length === 0) {
    return { ok: false, error: "Reveal at least one tile before cashing out" };
  }

  const settled = await settleWin(round);
  if (!settled.ok) {
    return { ok: false, error: "Payout failed — please retry" };
  }
  rounds.delete(roundId);
  return {
    ok: true,
    multiplier: round.multiplier,
    payout: round2(round.betAmount * round.multiplier),
    mineLayout: round.minePositions,
    serverSeed: round.serverSeed,
    balance: settled.balance,
    lockedBonus: settled.lockedBonus,
    withdrawable: settled.withdrawable,
  };
}
