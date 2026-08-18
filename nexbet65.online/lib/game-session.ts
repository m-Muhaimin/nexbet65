/**
 * Game Session Token — short-lived HMAC tokens for iframe ↔ parent bridge.
 *
 * The parent (NexBet platform) generates a token when the user opens the game
 * iframe. The game uses this token to authenticate BET/WIN settle calls.
 * Tokens expire after 15 minutes and are single-use per game session.
 */

import { prisma, queryWithRetry } from "@/lib/db";

const SECRET: string = (() => {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not configured");
  return value;
})();

const enc = new TextEncoder();
const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str: string): Uint8Array {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function hmac(data: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, Uint8Array.from(data));
  return new Uint8Array(sig);
}

async function sha256(data: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(data));
  return b64url(new Uint8Array(hash));
}

export interface GameSessionPayload {
  sessionId: string;
  userId: string;
  username: string;
  gameId: string;
  iat: number;   // issued at (ms)
  exp: number;   // expires at (ms)
}

/**
 * Generate a short-lived game session token.
 * Returns { token, sessionId } — the parent passes the token to the iframe.
 */
export async function createGameSessionToken(
  userId: string,
  username: string,
  gameId: string = "superace"
): Promise<{ token: string; sessionId: string }> {
  const now = Date.now();
  const expiresAt = new Date(now + TOKEN_TTL_MS);

  // Generate a unique session ID
  const sessionId = `gs_${now}_${Math.random().toString(36).slice(2, 8)}`;

  // Create the payload
  const payload: GameSessionPayload = {
    sessionId,
    userId,
    username,
    gameId,
    iat: now,
    exp: now + TOKEN_TTL_MS,
  };

  // Sign the token
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = b64url(await hmac(enc.encode(body)));
  const token = `${body}.${sig}`;

  // Hash the token for storage (never store raw token)
  const tokenHash = await sha256(token);

  // Lazy GC: expire old sessions on each creation
  cleanupExpiredSessions().catch(() => {});

  // Persist to DB
  await queryWithRetry(() =>
    prisma.winGameSession.create({
      data: {
        id: sessionId,
        userId,
        gameId,
        status: "active",
        tokenHash,
        expiresAt,
      },
    })
  );

  return { token, sessionId };
}

/**
 * Validate a game session token.
 * Returns the payload if valid, null if expired/invalid/already settled.
 */
export async function validateGameSessionToken(
  token: string
): Promise<GameSessionPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [body, sig] = parts;
  const expected = b64url(await hmac(enc.encode(body)));
  if (expected !== sig) return null;

  let payload: GameSessionPayload;
  try {
    payload = JSON.parse(
      new TextDecoder().decode(b64urlDecode(body))
    ) as GameSessionPayload;
  } catch {
    return null;
  }

  // Check expiry
  if (Date.now() > payload.exp) return null;

  // Check session exists and is active
  const session = await queryWithRetry(() =>
    prisma.winGameSession.findUnique({ where: { id: payload.sessionId } })
  );

  if (!session || session.status !== "active") return null;
  if (session.expiresAt.getTime() < Date.now()) return null;

  return payload;
}

/**
 * Update session totals after a settle call.
 */
export async function updateGameSession(
  sessionId: string,
  betAmount: number,
  winAmount: number
): Promise<void> {
  await queryWithRetry(() =>
    prisma.winGameSession.update({
      where: { id: sessionId },
      data: {
        totalBet: { increment: betAmount },
        totalWin: { increment: winAmount },
        spinCount: { increment: 1 },
      },
    })
  );
}

/**
 * Mark a session as settled (used when game closes or user navigates away).
 */
export async function settleGameSession(sessionId: string): Promise<void> {
  await queryWithRetry(() =>
    prisma.winGameSession.update({
      where: { id: sessionId },
      data: { status: "settled" },
    }).catch(() => {}) // ignore if already settled
  );
}

/**
 * Expire old sessions that passed their TTL.
 * Called lazily during session creation to avoid needing a cron job.
 * Caps at 50 rows per call to bound query time.
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const result = await prisma.winGameSession.updateMany({
      where: {
        status: "active",
        expiresAt: { lt: new Date() },
      },
      data: { status: "expired" },
    });
    return result.count;
  } catch {
    return 0;
  }
}
