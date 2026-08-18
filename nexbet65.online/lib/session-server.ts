import { cookies } from "next/headers";

import { verifySession, type SessionUser } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/session";
import { TEAM_COOKIE, verifyTeamSession, type TeamSession } from "@/lib/team";

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySession(token);
}

export async function getTeamSession(): Promise<TeamSession | null> {
  const token = cookies().get(TEAM_COOKIE)?.value;
  return verifyTeamSession(token);
}
