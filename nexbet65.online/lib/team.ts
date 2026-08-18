import { createHash, createHmac, randomBytes } from "node:crypto";

import type { TeamPermission, TeamRole } from "@/lib/team-types";

/**
 * Access-token authentication for team members (super_admin / moderator /
 * operator). Raw tokens are shown exactly once at creation; only an HMAC hash
 * is persisted. Sessions are short-lived HMAC-signed cookies on a separate
 * cookie from the player session.
 */

export const TEAM_COOKIE = "nexbet65_team";
export const TEAM_TOKEN_PREFIX = "NEXBET65-";

const SECRET: string = (() => {
  const value = process.env.AUTH_SECRET;
  if (!value) {
    throw new Error("AUTH_SECRET is not configured");
  }
  return value;
})();

function hmacHex(data: string): string {
  return createHmac("sha256", SECRET).update(data).digest("hex");
}

function b64url(str: string): string {
  return Buffer.from(str, "utf8").toString("base64url");
}

function b64urlDecode(str: string): string {
  return Buffer.from(str, "base64url").toString("utf8");
}

export interface TeamSession {
  kind: "team";
  memberId: string;
  name: string;
  role: TeamRole;
  permissions: TeamPermission[];
}

/** Generate a fresh access token, e.g. NEXBET65-9F2C…A1B2. */
export function generateAccessToken(): string {
  const rand = randomBytes(20).toString("hex").toUpperCase();
  return `${TEAM_TOKEN_PREFIX}${rand}`;
}

/** Deterministic hash of a raw token (what gets stored in the DB). */
export function hashAccessToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Last-4 display hint shown in the team table. */
export function tokenHint(token: string): string {
  return token.slice(-4).toUpperCase();
}

export async function signTeamSession(session: TeamSession): Promise<string> {
  const body = b64url(JSON.stringify(session));
  const sig = b64url(hmacHex(body));
  return `${body}.${sig}`;
}

export async function verifyTeamSession(
  token: string | null | undefined
): Promise<TeamSession | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (b64url(hmacHex(body)) !== sig) return null;
  try {
    const json = JSON.parse(b64urlDecode(body)) as TeamSession;
    if (json.kind !== "team" || !json.memberId || !json.name) return null;
    json.permissions = Array.isArray(json.permissions) ? json.permissions : [];
    return json;
  } catch {
    return null;
  }
}

export function teamHasPermission(
  session: TeamSession | null | undefined,
  permission: TeamPermission
): boolean {
  if (!session) return false;
  if (session.role === "super_admin") return true;
  return session.permissions.includes(permission);
}
