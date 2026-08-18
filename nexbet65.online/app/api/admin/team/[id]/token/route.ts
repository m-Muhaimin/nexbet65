import { NextRequest, NextResponse } from "next/server";

import { adminCan, getAdminContext } from "@/lib/admin-access";
import { rotateTeamToken } from "@/lib/team-server";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await getAdminContext();
  if (!adminCan(ctx, "team")) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const result = await rotateTeamToken(params.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json({ ok: true, member: result.data.member, token: result.data.token });
}
