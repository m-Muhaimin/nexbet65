import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session-server";
import { createGameSessionToken } from "@/lib/game-session";

/**
 * POST /api/game/session
 *
 * Generates a short-lived game session token for the iframe bridge.
 * Called by the parent page before loading the game iframe.
 * Returns { token, sessionId } with a 15-minute TTL.
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: { gameId?: string } = {};
  try {
    body = await req.json();
  } catch {
    // body stays {}
  }

  const gameId = body.gameId ?? "superace";

  try {
    const { token, sessionId } = await createGameSessionToken(
      user.username,
      user.username,
      gameId
    );

    return NextResponse.json({
      ok: true,
      token,
      sessionId,
      expiresIn: 900, // 15 minutes in seconds
    });
  } catch (err) {
    console.error("Failed to create game session:", err);
    return NextResponse.json(
      { error: "Failed to create game session" },
      { status: 500 }
    );
  }
}
