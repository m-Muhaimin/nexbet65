import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session-server";
import {
  getPlayerIdByUsername,
  p2pResponse,
} from "@/lib/p2p-route";
import { submitPlayerProof } from "@/lib/p2p-server";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const playerId = await getPlayerIdByUsername(user.username);
  if (!playerId) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  let body: {
    txnId?: string;
    transactionId?: string;
    senderAccount?: string;
    sentAmount?: number;
    screenshotUrl?: string;
    note?: string;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    await submitPlayerProof(playerId, body.txnId ?? "", {
      transactionId: body.transactionId ?? "",
      senderAccount: body.senderAccount ?? "",
      sentAmount:
        body.sentAmount === undefined || body.sentAmount === null
          ? undefined
          : Number(body.sentAmount),
      screenshotUrl: body.screenshotUrl,
      note: body.note,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return p2pResponse(e);
  }
}
