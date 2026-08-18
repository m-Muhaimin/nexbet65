import { NextRequest, NextResponse } from "next/server";

import { createWithdrawRequest } from "@/lib/payments";
import { getSessionUser } from "@/lib/session-server";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: { method?: string; amount?: number; senderAccount?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const result = await createWithdrawRequest(user.username, {
    method: body.method ?? "",
    amount: body.amount ?? 0,
    senderAccount: body.senderAccount ?? "",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, request: result.request });
}
