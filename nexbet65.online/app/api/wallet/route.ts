import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session-server";
import {
  getWalletSnapshot,
  recordWalletTransaction,
  refundWalletDebit,
} from "@/lib/wallet-server";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const snapshot = await getWalletSnapshot(user.username);
  if (!snapshot) {
    return NextResponse.json(
      { error: "Account not found" },
      { status: 404 }
    );
  }
  return NextResponse.json(snapshot);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: { kind?: string; amount?: number; ref?: string; meta?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Public wallet POST is client-trust ONLY for bet debits. Every credit
  // (payout, refund, bonus, …) must come from a game server via the internal
  // settle endpoint or an admin/internal flow — never from the browser.
  if (body.kind === "bet_refund" && body.amount !== undefined && body.amount > 0) {
    const result = await refundWalletDebit(user.username, body.ref ?? "");
    if (!result.ok) {
      return NextResponse.json({ error: result.error, balance: result.balance }, { status: 400 });
    }
    return NextResponse.json({ ok: true, balance: result.balance });
  }

  if (body.kind !== "bet" || typeof body.amount !== "number" || body.amount >= 0) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const result = await recordWalletTransaction(user.username, {
    kind: body.kind,
    amount: body.amount,
    ref: body.ref,
    meta: body.meta,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, balance: result.balance },
      result.error === "Insufficient funds" ? { status: 422 } : { status: 400 }
    );
  }
  return NextResponse.json({ ok: true, balance: result.balance });
}
