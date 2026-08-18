import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session-server";
import { recordWalletTransaction } from "@/lib/wallet-server";
import { executeServerSpin } from "@/lib/superace/engine";
import { recordSpinStats } from "@/lib/game-state";
import { BUY_BONUS_COST_CLASSIC, BUY_BONUS_COST_DELUXE } from "@/lib/superace/symbols";

const BET_LADDER = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: {
    bet?: number;
    mode?: "base" | "freespin";
    isBonusBuy?: boolean;
    isDeluxeBonusBuy?: boolean;
    gameMode?: "classic" | "deluxe";
    freeSpinsActive?: boolean;
    freeSpinsRemaining?: number;
    spinIndex?: number;
    loyaltyPoints?: number;
    vipTier?: string;
    [key: string]: unknown;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const bet = body.bet ?? 0;
  if (!BET_LADDER.includes(bet)) {
    return NextResponse.json({ error: "Invalid bet amount" }, { status: 400 });
  }

  const gameMode = body.gameMode ?? "deluxe";
  const isFreeSpin = body.freeSpinsActive ?? false;
  const isBonusBuy = body.isBonusBuy ?? false;
  const isDeluxeBonusBuy = body.isDeluxeBonusBuy ?? false;
  const spinIndex = body.spinIndex ?? 1;

  // Calculate cost
  const bonusBuyCost = isDeluxeBonusBuy
    ? bet * BUY_BONUS_COST_DELUXE
    : bet * BUY_BONUS_COST_CLASSIC;
  const spinCost = isBonusBuy ? bonusBuyCost : isFreeSpin ? 0 : bet;

  const spinRef = `superace_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  // Debit bet (skip for free spins)
  if (spinCost > 0) {
    const debitResult = await recordWalletTransaction(user.username, {
      kind: "bet",
      amount: -spinCost,
      ref: spinRef,
      meta: `SuperAce ${gameMode} bet`,
    });
    if (!debitResult.ok) {
      return NextResponse.json(
        { error: debitResult.error, balance: debitResult.balance },
        debitResult.error === "Insufficient funds" ? { status: 422 } : { status: 400 }
      );
    }
  }

  // Execute game engine
  const forcedScatters = isBonusBuy ? 3 : 0;
  const forceMega = isDeluxeBonusBuy;
  const result = executeServerSpin(bet, isFreeSpin, forcedScatters, gameMode, forceMega, spinIndex);

  // Credit win
  if (result.totalWin > 0) {
    const creditResult = await recordWalletTransaction(user.username, {
      kind: "payout",
      amount: result.totalWin,
      ref: `${spinRef}_win`,
      meta: `SuperAce ${gameMode} win`,
    });
    if (!creditResult.ok) {
      // Log but don't fail — win was computed, credit on retry
      console.error("SuperAce credit failed:", creditResult.error);
    }
  }

  // Fetch updated balance
  const { getWalletSnapshot } = await import("@/lib/wallet-server");
  const snapshot = await getWalletSnapshot(user.username);

  // Persist spin stats (totalBets, totalWins, spinCount, freeSpins, vault, loyalty)
  const prevFreeSpins = body.freeSpinsRemaining ?? 0;
  const freeSpinsLeft = body.freeSpinsActive
    ? Math.max(0, prevFreeSpins - 1) + result.freeSpinsAwarded
    : result.freeSpinsAwarded;

  const vaultDeposit = result.totalWin >= bet * 20 && gameMode === "deluxe"
    ? Math.round(result.totalWin * 0.05 * 100) / 100
    : 0;

  const earnedPoints = Math.round(
    10 + (result.cascades?.length ?? 0) * 50 + (result.totalWin >= bet * 20 ? 500 : 0)
  );

  const gameState = await recordSpinStats(user.username, spinCost, result.totalWin, result.spinId, {
    freeSpinsLeft,
    freeSpinsWin: body.freeSpinsActive ? result.totalWin : 0,
    vaultDeposit,
    loyaltyPoints: earnedPoints,
  });

  return NextResponse.json({
    ok: true,
    ...result,
    balance: snapshot?.balance ?? 0,
    gameState,
  });
}
