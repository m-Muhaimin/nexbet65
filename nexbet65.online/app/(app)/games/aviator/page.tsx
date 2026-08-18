import type { Metadata } from "next";

import AviatorGame from "@/components/game/aviator-game";

export const metadata: Metadata = {
  title: "Aviator",
  description:
    "Provably fair crash game. Place a bet, watch the multiplier climb, cash out before the plane crashes.",
};

export const dynamic = "force-dynamic";

export default function AviatorPage() {
  return (
    <div className="space-y-5">
      <AviatorGame />
    </div>
  );
}
