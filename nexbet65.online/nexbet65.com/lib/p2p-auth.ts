import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";

import { P2P_AGENT_SESSION_COOKIE, P2P_CONFIG } from "@/lib/p2p-config";

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** 64-char random token. Stored server-side only as its SHA-256 hash. */
export function newSessionToken(): string {
  return randomBytes(32).toString("hex");
}

/** Stable device signature. `parts` = navigator.userAgent + platform + installId. */
export function deviceFingerprint(parts: string[]): string {
  return sha256Hex(parts.join("|")).slice(0, 40);
}

export async function setAgentSessionCookie(token: string) {
  const store = await cookies();
  store.set(P2P_AGENT_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: P2P_CONFIG.sessionTtlSec,
  });
}

export async function clearAgentSessionCookie() {
  const store = await cookies();
  store.delete(P2P_AGENT_SESSION_COOKIE);
}

export function agentSessionCookieFromRequest(
  req: NextRequest
): string | undefined {
  return req.cookies.get(P2P_AGENT_SESSION_COOKIE)?.value;
}

export async function getAgentSessionCookieForServer(): Promise<
  string | undefined
> {
  return (await cookies()).get(P2P_AGENT_SESSION_COOKIE)?.value;
}
