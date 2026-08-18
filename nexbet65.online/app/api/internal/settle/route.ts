import { NextRequest, NextResponse } from "next/server";

import { recordWalletTransaction } from "@/lib/wallet-server";

/**
 * Server-to-server settlement used by the game WS processes (aviator,
 * checkers/ludo arena). Trusted only via the shared SETTLE_SECRET header.
 *
 * The public /api/wallet route is restricted to bet debits, so every credit
 * (payout, refund, loss bookkeeping) must land here from a game server that
 * already verified the player's identity through a scoped ticket.
 */

const SETTLE_SECRET = process.env.SETTLE_SECRET;

const ALLOWED_KINDS = new Set([
  "bet",
  "payout",
  "bet_refund",
  "bet_loss",
  "bet_adjust",
]);

export async function POST(req: NextRequest) {
  if (!SETTLE_SECRET || req.headers.get("x-settle-secret") !== SETTLE_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    username?: string;
    kind?: string;
    amount?: number;
    ref?: string;
    meta?: string;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.username !== "string" || !body.username) {
    return NextResponse.json({ error: "Missing username" }, { status: 400 });
  }
  if (typeof body.kind !== "string" || !ALLOWED_KINDS.has(body.kind)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }
  if (typeof body.amount !== "number" || !Number.isFinite(body.amount)) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  if (typeof body.ref !== "string" || !body.ref) {
    return NextResponse.json({ error: "Missing ref" }, { status: 400 });
  }

  const result = await recordWalletTransaction(body.username, {
    kind: body.kind,
    amount: body.amount,
    ref: body.ref,
    meta: typeof body.meta === "string" ? body.meta : undefined,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, balance: result.balance },
      result.error === "Insufficient funds" ? { status: 422 } : { status: 400 }
    );
  }
  return NextResponse.json({
    ok: true,
    balance: result.balance,
    lockedBonus: result.lockedBonus,
    withdrawable: result.withdrawable,
  });
}
