import { NextResponse } from "next/server";

import { getRecentResults } from "@/lib/results";
import { getSessionUser } from "@/lib/session-server";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  try {
    const snapshot = await getRecentResults();
    return NextResponse.json(snapshot);
  } catch (err) {
    console.error("[results] failed:", (err as Error).message);
    return NextResponse.json(
      { error: "Could not load results" },
      { status: 500 }
    );
  }
}
