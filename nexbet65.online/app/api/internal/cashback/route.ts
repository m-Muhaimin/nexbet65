import { NextRequest, NextResponse } from "next/server";

import { runDailyCashback } from "@/lib/cashback";

/**
 * Daily cashback job. Called by the VPS crontab (see AGENTS.md) with an
 * `x-cron-secret` header matching CRON_SECRET. Fails closed when unconfigured.
 */
export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const supplied = req.headers.get("x-cron-secret");
  if (!supplied || supplied !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await runDailyCashback();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cashback] failed:", (err as Error).message);
    return NextResponse.json({ error: "Cashback job failed" }, { status: 500 });
  }
}
