import type { Metadata } from "next";

import CheckersGame from "@/components/game/checkers-game";
import { getSessionUser } from "@/lib/session-server";

export const metadata: Metadata = {
  title: "Checkers",
  description:
    "Head-to-head checkers. Win all of your opponent's pieces to take the pot. Live matchmaking, provably fair seats.",
};

export const dynamic = "force-dynamic";

export default async function CheckersPage() {
  const user = await getSessionUser();

  return (
    <div className="mx-auto mt-2 w-full space-y-5">
      <CheckersGame username={user?.username ?? null} />
    </div>
  );
}
