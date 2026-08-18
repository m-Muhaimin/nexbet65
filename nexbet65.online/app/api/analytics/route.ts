import { NextResponse } from 'next/server';

export async function POST() {
  // Beacon endpoint — fire-and-forget from client analytics.
  // For now, accept and discard. Wire up your analytics sink later.
  return NextResponse.json({ ok: true });
}
