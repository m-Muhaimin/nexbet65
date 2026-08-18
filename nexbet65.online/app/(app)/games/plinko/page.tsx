import type { Metadata } from "next";

import { PlinkoGame } from "@/components/game/plinko-game";

export const metadata: Metadata = {
  title: "Plinko",
  description:
    "Provably fair plinko. Drop a ball through 8–16 rows of pegs and land a multiplier — up to 1,000x.",
};

export const dynamic = "force-dynamic";

export default function PlinkoPage() {
  return (
    <div className="space-y-5">
      <PlinkoGame />
    </div>
  );
}
