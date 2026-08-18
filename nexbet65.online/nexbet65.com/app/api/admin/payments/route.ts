import { NextRequest, NextResponse } from "next/server";

import { adminCan, getAdminContext } from "@/lib/admin-access";
import { listAllPaymentRequestsForAdmin, type PaymentRequestStatus } from "@/lib/payments";

export async function GET(req: NextRequest) {
  const ctx = await getAdminContext();
  if (!adminCan(ctx, "payments")) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const status = req.nextUrl.searchParams.get("status") as PaymentRequestStatus | null;
  const valid =
    status === null || status === "pending" || status === "approved" || status === "rejected";
  const requests = await listAllPaymentRequestsForAdmin(valid ? status ?? undefined : undefined);
  return NextResponse.json({ requests });
}
