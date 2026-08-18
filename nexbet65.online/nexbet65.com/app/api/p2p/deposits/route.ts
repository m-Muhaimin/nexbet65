import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session-server";
import { getPlayerIdByUsername, p2pResponse } from "@/lib/p2p-route";
import { getPlayerDeposits } from "@/lib/p2p-server";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const playerId = await getPlayerIdByUsername(user.username);
  if (!playerId) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  try {
    const deposits = await getPlayerDeposits(playerId);
    return NextResponse.json({ ok: true, deposits });
  } catch (e) {
    return p2pResponse(e);
  }
}
