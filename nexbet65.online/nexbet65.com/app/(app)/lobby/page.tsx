import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { BannerCarousel } from "@/components/lobby/banner-carousel";
import { GameGrid } from "@/components/lobby/game-grid";
import { LiveWinFeed } from "@/components/lobby/live-win-feed";
import { MultiplierTicker } from "@/components/lobby/multiplier-ticker";
import { PromoCards } from "@/components/lobby/promo-cards";
import { getRecentResults } from "@/lib/results";

export const dynamic = "force-dynamic";

export default async function LobbyPage() {
  const results = await getRecentResults().catch(() => ({
    wins: [],
    topMultiplier: null,
    recentCrashes: [],
  }));

  const caption = results.recentCrashes.length
    ? `Real crash points, best ${results.topMultiplier?.toFixed(2)}x in the last 24h`
    : "Waiting for the next Aviator crash…";

  return (
    <>
      {/* Hero: multiplier | carousel | live wins (mockup three-panel) */}
      <section className="grid gap-2 sm:gap-3 lg:grid-cols-[300px_minmax(0,1fr)_320px]">
        <div className="glass relative hidden h-[190px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/5 p-4 text-center sm:h-[230px] sm:p-6 md:h-[260px] lg:flex lg:h-[280px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(163,230,53,0.08),transparent_70%)]" />
          <p className="relative flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] text-white/40">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
            TODAY&apos;S TOP MULTIPLIER
          </p>
          <div className="relative mt-3">
            <MultiplierTicker
              initial={results.topMultiplier}
              crashes={results.recentCrashes}
            />
          </div>
          <p className="relative mt-4 text-xs text-white/40">{caption}</p>
        </div>

        <BannerCarousel />

        <LiveWinFeed initial={results.wins} />
      </section>

      {/* Games: sticky pill bar + 3:4 grid */}
      <GameGrid />

      {/* Hot promotions */}
      <section className="mt-6 sm:mt-10">
        <div className="mb-2 flex items-center justify-between sm:mb-3">
          <h2 className="text-lg font-bold">🔥 Hot Promotions</h2>
          <Link
            href="/games"
            className="flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <PromoCards />
      </section>

      {/* Responsible-gaming footer */}
      <footer className="mt-8 border-t border-white/5 pb-2 pt-4 text-center text-xs text-white/30 sm:mt-12 sm:pt-6">
        <p>
          18+ • Play responsibly • Deposit limits &amp; self-exclusion
          available in Account → Responsible Gaming
        </p>
        <p className="mt-1">© 2026 NexBet65. All rights reserved.</p>
      </footer>
    </>
  );
}
