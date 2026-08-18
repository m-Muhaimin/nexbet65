import { NextRequest, NextResponse } from "next/server";

import { adminCan, getAdminContext } from "@/lib/admin-access";
import { deleteTeamMember, updateTeamMember } from "@/lib/team-server";
import type { TeamPermission, TeamRole } from "@/lib/team-types";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await getAdminContext();
  if (!adminCan(ctx, "team")) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  let body: {
    name?: string;
    role?: TeamRole;
    permissions?: TeamPermission[];
    isActive?: boolean;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const result = await updateTeamMember(params.id, {
    name: body.name,
    role: body.role,
    permissions: body.permissions,
    isActive: body.isActive,
  });

  if (!result.ok) {
    const status = result.error === "Nothing to update" ? 400 : 404;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ ok: true, member: result.data.member });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await getAdminContext();
  if (!adminCan(ctx, "team")) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const result = await deleteTeamMember(params.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
