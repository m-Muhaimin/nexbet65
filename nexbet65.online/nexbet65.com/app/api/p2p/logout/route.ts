import { NextRequest, NextResponse } from "next/server";

import { clearAgentSessionCookie } from "@/lib/p2p-auth";
import {
  currentAgentFromRequest,
  requireAgent,
} from "@/lib/p2p-route";
import { logoutAgent } from "@/lib/p2p-server";

export async function POST(req: NextRequest) {
  const ctx = await currentAgentFromRequest(req);
  const denied = requireAgent(ctx);
  if (denied) return denied;

  await logoutAgent(ctx!.agentCode);
  await clearAgentSessionCookie();
  return NextResponse.json({ ok: true });
}
