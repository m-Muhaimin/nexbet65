import type { Metadata } from "next";

import { MinesGame } from "@/components/game/mines-game";

export const metadata: Metadata = {
  title: "Mines",
  description:
    "Provably fair grid game. Reveal gems and climb the multiplier — but don't hit a mine.",
};

export const dynamic = "force-dynamic";

export default function MinesPage() {
  return (
    <div className="space-y-5">
      <MinesGame />
    </div>
  );
}
