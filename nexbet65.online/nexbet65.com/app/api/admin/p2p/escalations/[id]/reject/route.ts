import { NextRequest, NextResponse } from "next/server";

import { adminCan, getAdminContext } from "@/lib/admin-access";
import { p2pResponse } from "@/lib/p2p-route";
import { adminResolveEscalation } from "@/lib/p2p-server";

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const admin = await getAdminContext();
  if (!admin || !adminCan(admin, "p2p")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  let body: { note?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  try {
    await adminResolveEscalation(id, "reject", body.note);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return p2pResponse(e);
  }
}
