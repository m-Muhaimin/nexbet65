import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session-server";
import {
  DEPOSIT_PRESETS,
  FIRST_DEPOSIT_BONUS_TIERS,
  PAYMENT_METHODS,
} from "@/lib/payments";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  return NextResponse.json({
    methods: PAYMENT_METHODS,
    presets: DEPOSIT_PRESETS,
    bonusTiers: FIRST_DEPOSIT_BONUS_TIERS,
  });
}
