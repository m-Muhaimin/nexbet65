import type { Metadata } from "next";

import { GameBridge } from "@/components/game-bridge";

export const metadata: Metadata = {
  title: "SuperAce",
  description:
    "Authentic, high-performance 5-Reel × 4-Row video slot with 1,024 Ways to Win, cascading avalanche mechanics, and dynamic multipliers.",
};

export const dynamic = "force-dynamic";

export default function SuperAcePage() {
  return <GameBridge gameId="superace" />;
}
