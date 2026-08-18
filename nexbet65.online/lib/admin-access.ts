import { isAdminUser } from "@/lib/admin-roles";
import { getSessionUser, getTeamSession } from "@/lib/session-server";
import { teamHasPermission, type TeamSession } from "@/lib/team";
import type { TeamPermission } from "@/lib/team-types";

/**
 * Unified gate for the /admin surface. Either:
 *  - a player whose username is in ADMIN_USERNAME (super admin), or
 *  - a team member with a valid token session.
 */
export type AdminContext =
  | { actor: "super"; username: string }
  | { actor: "team"; member: TeamSession }
  | null;

export async function getAdminContext(): Promise<AdminContext> {
  const user = await getSessionUser();
  if (user && isAdminUser(user.username)) {
    return { actor: "super", username: user.username };
  }
  const member = await getTeamSession();
  if (member) return { actor: "team", member };
  return null;
}

export function adminCan(
  ctx: AdminContext,
  permission: TeamPermission
): boolean {
  if (!ctx) return false;
  if (ctx.actor === "super") return true;
  return teamHasPermission(ctx.member, permission);
}
