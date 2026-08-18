import { NextRequest, NextResponse } from "next/server";

import {
  currentAgentFromRequest,
  p2pResponse,
  requireAgent,
} from "@/lib/p2p-route";
import { addAgentWallet } from "@/lib/p2p-server";

export async function POST(req: NextRequest) {
  const ctx = await currentAgentFromRequest(req);
  const denied = requireAgent(ctx);
  if (denied) return denied;

  let body: { walletType?: string; walletNumber?: string; holderName?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const wallet = await addAgentWallet(ctx!.agentCode, {
      walletType: body.walletType ?? "",
      walletNumber: body.walletNumber ?? "",
      holderName: body.holderName ?? "",
    });
    return NextResponse.json({ ok: true, wallet });
  } catch (e) {
    return p2pResponse(e);
  }
}
