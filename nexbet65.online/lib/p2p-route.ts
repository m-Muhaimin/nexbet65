import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { agentSessionCookieFromRequest } from "@/lib/p2p-auth";
import {
  agentFromSessionToken,
  P2PError,
  p2pErrorStatus,
  type AgentDTO,
} from "@/lib/p2p-server";

export async function currentAgentFromRequest(
  req: NextRequest
): Promise<{ agent: AgentDTO; agentCode: string } | null> {
  return agentFromSessionToken(agentSessionCookieFromRequest(req));
}

export function p2pResponse(e: unknown) {
  if (e instanceof P2PError) {
    return NextResponse.json(
      { error: e.message, code: e.code },
      { status: p2pErrorStatus(e.code) }
    );
  }
  console.error("[p2p]", e);
  return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
}

export function requireAgent(
  ctx: { agent: AgentDTO; agentCode: string } | null
): NextResponse | null {
  if (!ctx) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  return null;
}

export async function getPlayerIdByUsername(
  username: string
): Promise<string | null> {
  const user = await prisma.winUser.findUnique({
    where: { username },
    select: { id: true },
  });
  return user?.id ?? null;
}
