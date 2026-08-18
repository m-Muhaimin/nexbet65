import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Bell, Clock } from "lucide-react";

import { CATALOGUE, PLAYABLE_SLUGS } from "@/lib/games";

export const metadata: Metadata = {
  title: "Coming soon",
  description: "This game is not available yet.",
};

export default function GameSlugPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;

  if (PLAYABLE_SLUGS.has(slug)) {
    redirect(`/games/${slug}`);
  }

  const game = CATALOGUE.find((g) => g.slug === slug);

  return (
    <div className="mx-auto mt-4 max-w-2xl space-y-4 sm:mt-8 sm:space-y-6">
      <Link
        href="/games"
        className="inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> All games
      </Link>

      <div className="glass relative overflow-hidden rounded-3xl border border-white/10 p-6 text-center sm:p-10">
        <div className="hero-radial pointer-events-none absolute inset-0" />
        <div className="relative">
          <span className="text-5xl sm:text-6xl">{game?.emoji ?? "🎮"}</span>
          <h1 className="font-unbounded mt-3 text-2xl font-black tracking-tight sm:mt-4 sm:text-3xl md:text-4xl">
            {game?.name ?? slug}
          </h1>
          <p className="mt-2 text-sm text-white/50">
            {game ? `${game.provider} · RTP ${game.rtp}%` : "NexBet65 Originals"}
          </p>
          <div className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-[11px] font-bold text-brand sm:mt-6 sm:px-4 sm:py-1.5 sm:text-xs">
            <Clock className="h-3.5 w-3.5" /> Coming soon
          </div>
          <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-white/50 sm:mt-4 sm:text-sm">
            This game isn&apos;t playable yet. We&apos;re rolling out new titles
            all the time — check back soon, or jump into{" "}
            <Link href="/games/aviator" className="font-semibold text-brand hover:underline">
              Aviator
            </Link>{" "}
            or{" "}
            <Link href="/games/mines" className="font-semibold text-brand hover:underline">
              Mines
            </Link>{" "}
            right now.
          </p>
          <button
            type="button"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold transition-colors hover:border-brand/50 sm:mt-7 sm:px-5 sm:py-2.5 sm:text-sm"
          >
            <Bell className="h-4 w-4" /> Notify me when it launches
          </button>
        </div>
      </div>
    </div>
  );
}
