import { NextRequest, NextResponse } from "next/server";

import { currentAgentFromRequest, requireAgent } from "@/lib/p2p-route";

export async function GET(req: NextRequest) {
  const ctx = await currentAgentFromRequest(req);
  const denied = requireAgent(ctx);
  if (denied) return denied;
  return NextResponse.json({ ok: true, agent: ctx!.agent });
}
