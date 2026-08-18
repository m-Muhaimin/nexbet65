import { NextResponse } from "next/server";

import { revealMinesTile } from "@/lib/mines";
import { getSessionUser } from "@/lib/session-server";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to play" }, { status: 401 });
  }

  let body: { roundId?: string; tileIndex?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.roundId) {
    return NextResponse.json({ error: "Missing round" }, { status: 400 });
  }

  const result = await revealMinesTile(user.username, body.roundId, Number(body.tileIndex));

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.data);
}
