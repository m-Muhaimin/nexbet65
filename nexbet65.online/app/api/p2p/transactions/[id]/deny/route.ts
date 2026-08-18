import { NextRequest, NextResponse } from "next/server";

import {
  currentAgentFromRequest,
  p2pResponse,
  requireAgent,
} from "@/lib/p2p-route";
import { denyTransaction } from "@/lib/p2p-server";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await currentAgentFromRequest(req);
  const denied = requireAgent(ctx);
  if (denied) return denied;

  let body: { reason?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    await denyTransaction({
      agentCode: ctx!.agentCode,
      txnId: params.id,
      reason: body.reason ?? "",
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return p2pResponse(e);
  }
}
