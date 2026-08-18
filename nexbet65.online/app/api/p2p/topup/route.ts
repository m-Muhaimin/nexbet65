import { NextRequest, NextResponse } from "next/server";

import {
  currentAgentFromRequest,
  p2pResponse,
  requireAgent,
} from "@/lib/p2p-route";
import { createFloatTopup } from "@/lib/p2p-server";

export async function POST(req: NextRequest) {
  const ctx = await currentAgentFromRequest(req);
  const denied = requireAgent(ctx);
  if (denied) return denied;

  let body: { amount?: number } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const res = await createFloatTopup(ctx!.agentCode, Number(body.amount ?? 0));
    return NextResponse.json({ ok: true, ...res });
  } catch (e) {
    return p2pResponse(e);
  }
}
