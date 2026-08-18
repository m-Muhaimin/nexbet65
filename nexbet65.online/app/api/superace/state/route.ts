import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session-server";
import { loadGameState, saveGameState } from "@/lib/game-state";

/**
 * GET /api/superace/state — Load the authenticated user's persisted SuperAce game state.
 * Returns default state on first visit (auto-creates the DB row).
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const state = await loadGameState(user.username);
  return NextResponse.json({ ok: true, ...state });
}

/**
 * POST /api/superace/state — Partial-save game state fields.
 * Body: Partial GameStateDTO (only provided fields are upserted).
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Whitelist allowed fields to prevent mass-assignment of computed stats
  const allowed = [
    "gameMode",
    "betAmount",
    "freeSpinsLeft",
    "freeSpinsTotal",
    "freeSpinsWin",
    "vaultBalance",
    "vaultHarvested",
    "loyaltyPoints",
    "vipTier",
    "lastSpinId",
    "isMuted",
    "isTurbo",
  ];
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No valid fields to save" }, { status: 400 });
  }

  const state = await saveGameState(user.username, patch);
  return NextResponse.json({ ok: true, ...state });
}
