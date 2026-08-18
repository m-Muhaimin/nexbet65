import type { Metadata } from "next";

import LudoGame from "@/components/game/ludo-game";
import { getSessionUser } from "@/lib/session-server";

export const metadata: Metadata = {
  title: "Ludo Arena",
  description:
    "2-player Ludo Arena. Play Now with live matchmaking, or create a private table and invite a friend by code. Winner takes the pot.",
};

export const dynamic = "force-dynamic";

export default async function LudoArenaPage() {
  const user = await getSessionUser();

  return (
    <div className="mx-auto mt-2 w-full space-y-5">
      <LudoGame username={user?.username ?? null} />
    </div>
  );
}
