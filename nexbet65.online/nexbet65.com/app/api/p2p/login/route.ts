import { NextRequest, NextResponse } from "next/server";

import { setAgentSessionCookie } from "@/lib/p2p-auth";
import { p2pResponse } from "@/lib/p2p-route";
import { loginAgent } from "@/lib/p2p-server";

export async function POST(req: NextRequest) {
  let body: {
    agentCode?: string;
    password?: string;
    deviceFingerprint?: string;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const { agent, sessionToken } = await loginAgent({
      agentCode: body.agentCode ?? "",
      password: body.password ?? "",
      deviceFingerprint: body.deviceFingerprint ?? "",
      ip: req.headers.get("x-forwarded-for") ?? undefined,
    });
    await setAgentSessionCookie(sessionToken);
    return NextResponse.json({ ok: true, agent });
  } catch (e) {
    return p2pResponse(e);
  }
}
