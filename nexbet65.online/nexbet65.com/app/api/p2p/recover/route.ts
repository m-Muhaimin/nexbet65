import { NextRequest, NextResponse } from "next/server";

import { setAgentSessionCookie } from "@/lib/p2p-auth";
import { p2pResponse } from "@/lib/p2p-route";
import { recoverAgent } from "@/lib/p2p-server";

export async function POST(req: NextRequest) {
  let body: {
    agentCode?: string;
    recoveryKey?: string;
    newPassword?: string;
    deviceFingerprint?: string;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const { agent, sessionToken } = await recoverAgent({
      agentCode: body.agentCode ?? "",
      recoveryKey: body.recoveryKey ?? "",
      newPassword: body.newPassword ?? "",
      deviceFingerprint: body.deviceFingerprint ?? "",
      ip: req.headers.get("x-forwarded-for") ?? undefined,
    });
    await setAgentSessionCookie(sessionToken);
    return NextResponse.json({ ok: true, agent });
  } catch (e) {
    return p2pResponse(e);
  }
}
