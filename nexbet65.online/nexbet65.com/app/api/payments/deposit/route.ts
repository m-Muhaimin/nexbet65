import { NextRequest, NextResponse } from "next/server";

import { createDepositRequest } from "@/lib/payments";
import { getSessionUser } from "@/lib/session-server";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: {
    method?: string;
    amount?: number;
    senderAccount?: string;
    transactionId?: string;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const result = await createDepositRequest(user.username, {
    method: body.method ?? "",
    amount: body.amount ?? 0,
    senderAccount: body.senderAccount ?? "",
    transactionId: body.transactionId ?? "",
  });

  if (!result.ok) {
    const status =
      result.error === "That transaction ID was already submitted" ? 409 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ ok: true, request: result.request });
}
