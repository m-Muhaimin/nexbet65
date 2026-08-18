import { NextRequest, NextResponse } from "next/server";

import {
  currentAgentFromRequest,
  p2pResponse,
  requireAgent,
} from "@/lib/p2p-route";
import { removeAgentWallet } from "@/lib/p2p-server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await currentAgentFromRequest(req);
  const denied = requireAgent(ctx);
  if (denied) return denied;

  const walletId = Number(params.id);
  if (!Number.isInteger(walletId)) {
    return NextResponse.json({ error: "Invalid wallet id" }, { status: 400 });
  }

  try {
    await removeAgentWallet(ctx!.agentCode, walletId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return p2pResponse(e);
  }
}
