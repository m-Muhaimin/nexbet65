import { NextRequest, NextResponse } from "next/server";

import { currentAgentFromRequest, requireAgent } from "@/lib/p2p-route";
import { createWsTicket } from "@/lib/p2p-server";

export async function POST(req: NextRequest) {
  const ctx = await currentAgentFromRequest(req);
  const denied = requireAgent(ctx);
  if (denied) return denied;

  const ticket = await createWsTicket(ctx!.agentCode);
  return NextResponse.json({ ok: true, ticket });
}
