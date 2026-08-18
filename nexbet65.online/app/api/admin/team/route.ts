import { NextRequest, NextResponse } from "next/server";

import { adminCan, getAdminContext } from "@/lib/admin-access";
import {
  createTeamMember,
  listTeamMembers,
} from "@/lib/team-server";
import type { TeamPermission, TeamRole } from "@/lib/team-types";

function actorLabel(
  ctx: NonNullable<Awaited<ReturnType<typeof getAdminContext>>>
): string {
  return ctx.actor === "super" ? ctx.username : ctx.member.name;
}

export async function GET() {
  const ctx = await getAdminContext();
  if (!adminCan(ctx, "team")) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const members = await listTeamMembers();
  return NextResponse.json({ members });
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!adminCan(ctx, "team")) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  if (!ctx) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  let body: {
    name?: string;
    role?: TeamRole;
    permissions?: TeamPermission[];
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.role) {
    return NextResponse.json({ error: "Role is required" }, { status: 400 });
  }

  const result = await createTeamMember({
    name: body.name ?? "",
    role: body.role,
    permissions: body.permissions,
    createdBy: actorLabel(ctx),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, member: result.data.member, token: result.data.token });
}
