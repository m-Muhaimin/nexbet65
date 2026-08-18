import { NextRequest, NextResponse } from "next/server";

import {
  currentAgentFromRequest,
  p2pResponse,
  requireAgent,
} from "@/lib/p2p-route";
import { getAgentDashboard } from "@/lib/p2p-server";

export async function GET(req: NextRequest) {
  const ctx = await currentAgentFromRequest(req);
  const denied = requireAgent(ctx);
  if (denied) return denied;

  try {
    const dash = await getAgentDashboard(ctx!.agentCode);
    return NextResponse.json({ ok: true, ...dash });
  } catch (e) {
    return p2pResponse(e);
  }
}
