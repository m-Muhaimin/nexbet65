import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { findTeamByToken, recordTeamLogin } from "@/lib/team-server";
import { signTeamSession, TEAM_COOKIE } from "@/lib/team";

const MAX_AGE = 60 * 60 * 24 * 30;

export async function POST(req: NextRequest) {
  let body: { token?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const token = (body.token ?? "").trim();
  if (!token) {
    return NextResponse.json({ error: "Access token is required" }, { status: 400 });
  }

  const member = await findTeamByToken(token);
  if (!member) {
    return NextResponse.json({ error: "Invalid or inactive access token" }, { status: 401 });
  }

  await recordTeamLogin(member.id);

  const session = await signTeamSession({
    kind: "team",
    memberId: member.id,
    name: member.name,
    role: member.role,
    permissions: member.permissions,
  });

  const store = await cookies();
  store.set(TEAM_COOKIE, session, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });

  return NextResponse.json({ ok: true, member });
}
