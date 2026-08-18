import { NextResponse } from "next/server";

import { getPlinkoConfig } from "@/lib/plinko";

export async function GET() {
  return NextResponse.json(getPlinkoConfig());
}
