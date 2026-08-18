import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session-server";
import {
  getPlayerIdByUsername,
  p2pResponse,
} from "@/lib/p2p-route";
import { createPlayerDeposit } from "@/lib/p2p-server";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const playerId = await getPlayerIdByUsername(user.username);
  if (!playerId) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  let body: { amount?: number; method?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const result = await createPlayerDeposit(
      playerId,
      Number(body.amount ?? 0),
      body.method?.trim() || undefined
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return p2pResponse(e);
  }
}
