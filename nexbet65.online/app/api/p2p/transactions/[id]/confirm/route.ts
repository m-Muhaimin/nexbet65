import { NextRequest, NextResponse } from "next/server";

import {
  currentAgentFromRequest,
  p2pResponse,
  requireAgent,
} from "@/lib/p2p-route";
import { confirmTransaction } from "@/lib/p2p-server";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await currentAgentFromRequest(req);
  const denied = requireAgent(ctx);
  if (denied) return denied;

  let body: { confirmedAmount?: number; transactionId?: string; note?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const result = await confirmTransaction({
      agentCode: ctx!.agentCode,
      txnId: params.id,
      confirmedAmount: Number(body.confirmedAmount ?? 0),
      transactionId: body.transactionId ?? "",
      note: body.note,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return p2pResponse(e);
  }
}
