import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session-server";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  return NextResponse.json(user);
}
