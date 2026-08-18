import { NextResponse } from "next/server";

import { startMinesRound } from "@/lib/mines";
import { getSessionUser } from "@/lib/session-server";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to play" }, { status: 401 });
  }

  let body: { amount?: unknown; mineCount?: unknown; clientSeed?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await startMinesRound(
    user.username,
    Number(body.amount),
    Number(body.mineCount),
    typeof body.clientSeed === "string" ? body.clientSeed : undefined
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
