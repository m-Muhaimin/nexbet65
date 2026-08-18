import { NextRequest, NextResponse } from "next/server";

import { adminCan, getAdminContext } from "@/lib/admin-access";
import { reviewPaymentRequest } from "@/lib/payments";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await getAdminContext();
  if (!adminCan(ctx, "payments")) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  let body: { action?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const action = body.action === "reject" ? "reject" : "approve";

  const result = await reviewPaymentRequest(params.id, action);

  if (!result.ok) {
    const status =
      result.error === "Not authorized" ? 403 : result.error === "Payment request not found" ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ ok: true, request: result.request });
}
