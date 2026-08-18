import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { TEAM_COOKIE } from "@/lib/team";

export async function POST() {
  const store = await cookies();
  store.delete(TEAM_COOKIE);
  return NextResponse.json({ ok: true });
}
