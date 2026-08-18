import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";

import {
  HOUSE_EDGE,
  MIN_ROWS,
  MAX_ROWS,
  PLINKO_MULTIPLIERS,
  isRiskLevel,
  plinkoMultiplier,
} from "@/lib/plinko-constants";
import { recordWalletTransaction } from "@/lib/wallet-server";
import type { RiskLevel } from "@/lib/plinko-constants";

export const PLINKO_MIN_ROWS = MIN_ROWS;
export const PLINKO_MAX_ROWS = MAX_ROWS;
export const PLINKO_RTP = 1 - HOUSE_EDGE;

export function generateServerSeed(): string {
  return randomBytes(32).toString("hex");
}

export function hashSeed(seed: string): string {
  return createHash("sha256").update(seed).digest("hex");
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// HMAC-SHA256(serverSeed, `${clientSeed}:${nonce}`) → one byte per row decides
// L (even byte) or R (odd byte). Mirrors the Plinko-V1 reference server.
export function derivePlinkoPath(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  rows: number
): ("L" | "R")[] {
  const hmac = (msg: string) =>
    createHmac("sha256", serverSeed).update(msg).digest("hex");

  let hash = hmac(`${clientSeed}:${nonce}`);
  let cursor = 0;
  let byteOffset = 0;

  const path: ("L" | "R")[] = [];
  for (let row = 0; row < rows; row++) {
    if (byteOffset >= hash.length / 2) {
      cursor++;
      hash = hmac(`${clientSeed}:${nonce}:${cursor}`);
      byteOffset = 0;
    }
    const byte = parseInt(hash.slice(byteOffset * 2, byteOffset * 2 + 2), 16);
    path.push(byte % 2 === 0 ? "L" : "R");
    byteOffset++;
  }
  return path;
}

/**
 * Provably fair server seed state. The current seed is committed to the client
 * (hash) before the next bet; after every bet the used seed is revealed and
 * rotated, so the pre-committed hash always matches the next round's seed.
 */
let currentSeed = generateServerSeed();
let nextSeed = generateServerSeed();
let globalNonce = 0;

export function getPlinkoServerSeedHash(): string {
  return hashSeed(currentSeed);
}

export function getPlinkoConfig() {
  return {
    multipliers: PLINKO_MULTIPLIERS,
    serverSeedHash: getPlinkoServerSeedHash(),
    minRows: MIN_ROWS,
    maxRows: MAX_ROWS,
    rtp: PLINKO_RTP,
  };
}

export type PlinkoBetResult = {
  ok: true;
  betId: string;
  path: ("L" | "R")[];
  bucket: number;
  multiplier: number;
  payout: number;
  balance: number;
  lockedBonus: number;
  withdrawable: number;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
};

export async function placePlinkoBet(
  username: string,
  amount: number,
  risk: unknown,
  rows: number,
  clientSeed?: string
): Promise<PlinkoBetResult | { ok: false; error: string }> {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Invalid bet amount" };
  }
  if (!isRiskLevel(risk)) {
    return { ok: false, error: "Invalid risk level" };
  }
  const rowCount = Math.floor(rows);
  if (rowCount < MIN_ROWS || rowCount > MAX_ROWS || !PLINKO_MULTIPLIERS[risk][rowCount]) {
    return { ok: false, error: "Invalid row count" };
  }

  globalNonce += 1;
  const nonce = globalNonce;
  const seed = clientSeed || randomBytes(8).toString("hex");
  const path = derivePlinkoPath(currentSeed, seed, nonce, rowCount);
  const bucket = path.filter((d) => d === "R").length;
  const multiplier = plinkoMultiplier(risk, rowCount, bucket);
  const betAmount = round2(amount);
  const payout = round2(betAmount * multiplier);
  const id = randomUUID();

  const debited = await recordWalletTransaction(username, {
    kind: "bet",
    amount: -betAmount,
    ref: `plinko-bet-${id}`,
    meta: `Plinko bet · ${rowCount} rows · ${risk}`,
  });
  if (!debited.ok) {
    return { ok: false, error: debited.error ?? "Bet rejected" };
  }

  // Payout is always >= 0 (min bucket multiplier is 0.1), so crediting can
  // never go negative. A multiplier < 1 simply nets a partial loss.
  const credited = await recordWalletTransaction(username, {
    kind: "payout",
    amount: payout,
    ref: `plinko-payout-${id}`,
    meta: `Plinko payout @ ${multiplier}x`,
  });
  if (!credited.ok) {
    // Refund the bet so the round never disappears from the wallet.
    await recordWalletTransaction(username, {
      kind: "bet_refund",
      amount: betAmount,
      ref: `plinko-refund-${id}`,
      meta: `Plinko payout failed — bet refunded`,
    });
    return { ok: false, error: credited.error ?? "Payout failed — bet refunded" };
  }

  // Reveal + rotate the used seed.
  const usedSeed = currentSeed;
  const usedSeedHash = hashSeed(usedSeed);
  currentSeed = nextSeed;
  nextSeed = generateServerSeed();

  return {
    ok: true,
    betId: id,
    path,
    bucket,
    multiplier,
    payout,
    balance: credited.balance,
    lockedBonus: credited.lockedBonus,
    withdrawable: credited.withdrawable,
    serverSeed: usedSeed,
    serverSeedHash: usedSeedHash,
    clientSeed: seed,
    nonce,
  };
}
