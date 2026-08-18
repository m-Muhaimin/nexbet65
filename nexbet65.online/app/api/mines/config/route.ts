import { NextResponse } from "next/server";

import { MINES_GRID, MINES_MAX, MINES_MIN, MINES_RTP } from "@/lib/mines";

export async function GET() {
  return NextResponse.json({
    gridSize: MINES_GRID,
    minMines: MINES_MIN,
    maxMines: MINES_MAX,
    rtp: MINES_RTP,
  });
}
