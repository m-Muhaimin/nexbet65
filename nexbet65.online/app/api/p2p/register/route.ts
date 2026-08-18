import { NextRequest, NextResponse } from "next/server";

import { setAgentSessionCookie } from "@/lib/p2p-auth";
import { p2pResponse } from "@/lib/p2p-route";
import { registerAgent } from "@/lib/p2p-server";

export async function POST(req: NextRequest) {
  let body: {
    password?: string;
    deviceFingerprint?: string;
    wallet?: { walletType?: string; walletNumber?: string; holderName?: string };
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const { agent, recoveryKey, sessionToken } = await registerAgent({
      password: body.password ?? "",
      deviceFingerprint: body.deviceFingerprint ?? "",
      wallet: {
        walletType: body.wallet?.walletType ?? "",
        walletNumber: body.wallet?.walletNumber ?? "",
        holderName: body.wallet?.holderName ?? "",
      },
    });
    await setAgentSessionCookie(sessionToken);
    return NextResponse.json({ ok: true, agent, recoveryKey });
  } catch (e) {
    return p2pResponse(e);
  }
}
