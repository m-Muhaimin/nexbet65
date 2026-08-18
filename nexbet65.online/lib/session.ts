import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { signSession, sessionCookieName } from "@/lib/auth";

const MAX_AGE = 60 * 60 * 24 * 30;

export async function setSessionCookie(payload: {
  username: string;
  avatar: string;
  memberSince: string;
}) {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(sessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
  return token;
}

export function clearSessionCookie() {
  const store = cookies();
  store.delete(sessionCookieName());
}

export function sessionCookieFromRequest(req: NextRequest): string | undefined {
  return req.cookies.get(sessionCookieName())?.value;
}

export const SESSION_COOKIE = sessionCookieName();
export const SESSION_MAX_AGE = MAX_AGE;
