import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session-server";
import { mintTicket } from "@/lib/ticket-server";

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const secret = process.env.AVIATOR_TICKET_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }
  return NextResponse.json({ ticket: mintTicket(secret, user.username) });
}
