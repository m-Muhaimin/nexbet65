import { NextRequest, NextResponse } from "next/server";

import { adminCan, getAdminContext } from "@/lib/admin-access";
import { p2pResponse } from "@/lib/p2p-route";
import { approveFloatTopup } from "@/lib/p2p-server";

export async function POST(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx || !adminCan(ctx, "p2p")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { ledgerId?: string | number } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const ledgerId = BigInt(String(body.ledgerId ?? "0"));
  if (ledgerId <= BigInt(0)) {
    return NextResponse.json({ error: "Invalid ledger id" }, { status: 400 });
  }

  try {
    await approveFloatTopup(
      ctx.actor === "super" ? `ADMIN:${ctx.username}` : `TEAM:${ctx.member.name}`,
      ledgerId
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return p2pResponse(e);
  }
}
