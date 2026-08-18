"use client";

import { useEffect, useMemo, useState } from "react";

import type { LiveWin } from "@/lib/results";

const GAME_EMOJI: Record<string, string> = {
  aviator: "✈️",
  wheel: "🎡",
};

function fmt(n: number): string {
  return "৳" + Math.round(n).toLocaleString("en-IN");
}

function fmtFull(n: number): string {
  return "৳ " + Math.round(n).toLocaleString("en-IN");
}

/**
 * Live wins panel (hidden below lg). Header + JACKPOT POOL + feed, all driven by
 * real settled payouts from the shared game DB, polled every 5s.
 */
export function LiveWinFeed({ initial }: { initial: LiveWin[] }) {
  const [wins, setWins] = useState<LiveWin[]>(initial);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      try {
        const res = await fetch("/api/games/results", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { wins: LiveWin[] };
        if (active && Array.isArray(data.wins)) setWins(data.wins.slice(0, 6));
      } catch {
        /* keep last known feed */
      } finally {
        if (active) timer = setTimeout(load, 5000);
      }
    };
    timer = setTimeout(load, 4000);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  const { hourTotal, pool } = useMemo(() => {
    const now = Date.now();
    const hour = wins
      .filter((w) => now - new Date(w.at).getTime() < 3600_000)
      .reduce((sum, w) => sum + w.amount, 0);
    const sum = wins.reduce((acc, w) => acc + w.amount, 0);
    return { hourTotal: hour, pool: sum };
  }, [wins]);

  return (
    <div className="glass hidden h-[190px] flex-col rounded-2xl border border-white/5 p-3 sm:h-[230px] sm:p-4 md:h-[260px] lg:flex lg:h-[280px]">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-white/50">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          LIVE WINS
        </p>
        <p className="text-[11px] text-white/35">
          Last hour: <b className="text-white/70">{fmtFull(hourTotal)}</b>
        </p>
      </div>
      <div
        className="mt-3 rounded-xl border border-brand/20 bg-black/60 px-4 py-3 text-center"
        title="Running sum of recent settled payouts from the shared game DB"
      >
        <p className="text-[10px] font-semibold tracking-[0.25em] text-white/40">
          JACKPOT POOL
        </p>
        <p className="text-glow font-instrument text-2xl font-black tabular-nums text-brand">
          {fmtFull(pool)}
        </p>
      </div>
      <ul className="no-scrollbar mt-3 flex-1 space-y-2 overflow-y-auto">
        {wins.length === 0 && (
          <li className="rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-xs text-white/40">
            No wins settled yet — rounds are running…
          </li>
        )}
        {wins.slice(0, 6).map((w, i) => (
          <li
            key={`${w.at}-${i}`}
            className="win-in flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-xs"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/15 text-[10px]">
                {GAME_EMOJI[w.game] ?? "🎮"}
              </span>
              <span className="truncate text-white/80">{w.detail}</span>
            </span>
            <b className="shrink-0 font-instrument tabular-nums text-brand">
              +{fmt(w.amount).slice(1)}
            </b>
          </li>
        ))}
      </ul>
    </div>
  );
}
