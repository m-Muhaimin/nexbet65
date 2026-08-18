import { NextRequest, NextResponse } from "next/server";

import { recordWalletTransaction } from "@/lib/wallet-server";
import {
  validateGameSessionToken,
  updateGameSession,
} from "@/lib/game-session";

/**
 * POST /api/game/settle
 *
 * The Game Bridge settlement endpoint. The game iframe sends BET and WIN
 * events here, authenticated via the game session token (not the user's
 * session cookie — the game is an untrusted iframe).
 *
 * Flow:
 *   1. Game places a bet → POST { type: "BET", amount, token }
 *   2. Backend validates token, checks balance, creates ledger entry
 *   3. Returns { success, newBalance }
 *   4. Game spins, wins → POST { type: "WIN", amount, token }
 *   5. Backend validates token, credits win, creates ledger entry
 *   6. Returns { success, newBalance }
 *
 * CRITICAL RULES:
 *   - Never trust the client for balance calculations
 *   - Always use $transaction for atomic ledger + balance update
 *   - Token validation prevents replay attacks and expired sessions
 */

type SettleRequest = {
  token: string;
  type: "BET" | "WIN";
  amount: number;
  ref?: string;
};

export async function POST(req: NextRequest) {
  let body: SettleRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Validate required fields
  if (!body.token || typeof body.token !== "string") {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }
  if (!body.type || !["BET", "WIN"].includes(body.type)) {
    return NextResponse.json({ error: "Invalid type (must be BET or WIN)" }, { status: 400 });
  }
  if (typeof body.amount !== "number" || !Number.isFinite(body.amount) || body.amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  // Validate the game session token
  const payload = await validateGameSessionToken(body.token);
  if (!payload) {
    return NextResponse.json(
      { error: "Invalid or expired game session" },
      { status: 401 }
    );
  }

  const username = payload.username;
  const amount = Math.round(body.amount * 100) / 100; // Ensure 2 decimal places

  if (body.type === "BET") {
    // Deduct from wallet
    const ref = body.ref || `game_bet_${payload.sessionId}_${Date.now()}`;
    const result = await recordWalletTransaction(username, {
      kind: "bet",
      amount: -amount, // Negative for bet
      ref,
      meta: `Game bet - ${payload.gameId} session ${payload.sessionId}`,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          newBalance: result.balance,
        },
        result.error === "Insufficient funds" ? { status: 422 } : { status: 400 }
      );
    }

    // Update session totals
    await updateGameSession(payload.sessionId, amount, 0);

    return NextResponse.json({
      success: true,
      newBalance: result.balance,
      withdrawable: result.withdrawable,
    });
  }

  // type === "WIN"
  const ref = body.ref || `game_win_${payload.sessionId}_${Date.now()}`;
  const result = await recordWalletTransaction(username, {
    kind: "payout",
    amount: amount, // Positive for win
    ref,
    meta: `Game win - ${payload.gameId} session ${payload.sessionId}`,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    );
  }

  // Update session totals
  await updateGameSession(payload.sessionId, 0, amount);

  return NextResponse.json({
    success: true,
    newBalance: result.balance,
    withdrawable: result.withdrawable,
  });
}
