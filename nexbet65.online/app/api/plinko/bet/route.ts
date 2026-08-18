import { NextResponse } from "next/server";

import { placePlinkoBet } from "@/lib/plinko";
import { getSessionUser } from "@/lib/session-server";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to play" }, { status: 401 });
  }

  let body: { amount?: unknown; risk?: unknown; rows?: unknown; clientSeed?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await placePlinkoBet(
    user.username,
    Number(body.amount),
    body.risk,
    Number(body.rows),
    typeof body.clientSeed === "string" ? body.clientSeed : undefined
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
