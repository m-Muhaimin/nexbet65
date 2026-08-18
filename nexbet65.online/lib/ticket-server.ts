import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Short-lived, scoped tickets that game WS servers verify with a shared HMAC
 * secret. A ticket binds a nexbet65 username to an expiry; it never leaks the
 * session secret (AUTH_SECRET) to game processes.
 *
 * Format: base64url(JSON {u, e}).base64url(HMAC-SHA256(payload))
 */

export function mintTicket(
  secret: string,
  username: string,
  ttlMs = 10 * 60 * 1000
): string {
  const exp = Date.now() + ttlMs;
  const payload = Buffer.from(JSON.stringify({ u: username, e: exp })).toString(
    "base64url"
  );
  const sig = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyTicket(
  secret: string,
  ticket: string | undefined | null
): string | null {
  if (!ticket) return null;
  const parts = ticket.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  if (
    sig.length !== expected.length ||
    !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof data.u !== "string" || typeof data.e !== "number") return null;
    if (Date.now() > data.e) return null;
    return data.u;
  } catch {
    return null;
  }
}
