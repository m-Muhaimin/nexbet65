import { NextRequest, NextResponse } from "next/server";

import { adminCan, getAdminContext } from "@/lib/admin-access";
import { p2pResponse } from "@/lib/p2p-route";
import { adminP2POverview } from "@/lib/p2p-server";

export async function GET(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx || !adminCan(ctx, "p2p")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const overview = await adminP2POverview();
    return NextResponse.json({ ok: true, ...overview });
  } catch (e) {
    return p2pResponse(e);
  }
}
