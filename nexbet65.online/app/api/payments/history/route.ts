import { NextResponse } from "next/server";

import { listPaymentRequests } from "@/lib/payments";
import { getSessionUser } from "@/lib/session-server";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const requests = await listPaymentRequests({ username: user.username });
  return NextResponse.json({ requests });
}
