"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Lock, Play } from "lucide-react";

import { CategoryFilters } from "@/components/lobby/category-filters";
import { CATALOGUE, type CatalogueGame } from "@/lib/games";
import {
  subscribeFilter,
  subscribeSearch,
  type LobbyFilter,
} from "@/lib/lobby-bus";
import { cn } from "@/lib/utils";

function matches(g: CatalogueGame, filter: LobbyFilter): boolean {
  if (filter === "all") return true;
  if (filter === "hot") return g.tag === "hot";
  if (filter === "new") return g.tag === "new";
  return g.category === filter;
}

function matchesQuery(g: CatalogueGame, q: string): boolean {
  if (!q) return true;
  return (
    g.name.toLowerCase().includes(q) ||
    g.provider.toLowerCase().includes(q) ||
    g.category.toLowerCase().includes(q)
  );
}

const UPCOMING_LIMIT = 8;

export function GameCard({ game }: { game: CatalogueGame }) {
  const inner = (
    <>
      {game.image ? (
        <img
          src={game.image}
          alt={game.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <>
          <div className={cn("absolute inset-0 bg-gradient-to-br", game.gradient)} />
          <div className="absolute inset-0 flex items-center justify-center text-5xl drop-shadow-[0_6px_18px_rgba(0,0,0,0.65)] sm:text-6xl">
            {game.emoji}
          </div>
        </>
      )}
      {game.tag && (
        <span
          className={cn(
            "absolute left-2 top-2 z-10 rounded px-1.5 py-0.5 text-[9px] font-black tracking-wide",
            game.tag === "hot"
              ? "bg-red-500 text-white"
              : "bg-brand text-black"
          )}
        >
          {game.tag.toUpperCase()}
        </span>
      )}
      {!game.playable && (
        <span className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white/90 backdrop-blur">
          <Lock className="h-2.5 w-2.5" /> SOON
        </span>
      )}
      <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
        {game.playable ? (
          <span className="gold-glow flex h-12 w-12 items-center justify-center rounded-full bg-brand text-lg text-black">
            <Play className="h-5 w-5" />
          </span>
        ) : (
          <span className="rounded-full border border-white/20 bg-black/70 px-3 py-1 text-[10px] font-bold text-white/80 backdrop-blur">
            Coming soon
          </span>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-1.5 sm:p-2">
        <p className="truncate text-[11px] font-semibold sm:text-xs md:text-sm">{game.name}</p>
        <p className="flex justify-between text-[9px] text-white/50 sm:text-[10px]">
          <span>{game.provider}</span>
          <span>RTP {game.rtp}%</span>
        </p>
      </div>
    </>
  );

  const cls = cn(
    "group relative aspect-[3/4] overflow-hidden rounded-xl border bg-surface2 transition duration-200",
    game.playable
      ? "cursor-pointer border-white/5 hover:z-10 hover:scale-105 hover:border-brand/40"
      : "cursor-not-allowed border-white/5 opacity-80"
  );

  if (game.playable && game.url) {
    return (
      <a href={game.url} target="_blank" rel="noopener noreferrer" className={cls}>
        {inner}
      </a>
    );
  }
  if (game.playable && game.slug) {
    return (
      <Link href={`/games/${game.slug}`} className={cls}>
        {inner}
      </Link>
    );
  }
  return <div className={cls} title="Coming soon">{inner}</div>;
}

export function GameGrid({ compact = false }: { compact?: boolean }) {
  const [filter, setFilter] = useState<LobbyFilter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => subscribeFilter(setFilter), []);
  useEffect(() => subscribeSearch(setQuery), []);

  const games = useMemo(() => {
    const filtered = CATALOGUE.filter((g) => matches(g, filter) && matchesQuery(g, query));
    const playable = filtered.filter((g) => g.playable);
    const upcoming = filtered.filter((g) => !g.playable).slice(0, UPCOMING_LIMIT);
    return [...playable, ...upcoming];
  }, [filter, query]);

  return (
    <div>
      {!compact && <CategoryFilters filter={filter} onSelect={setFilter} />}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-7">
        {games.map((g) => (
          <GameCard key={g.name} game={g} />
        ))}
        {games.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-white/40">
            No games match {query ? `“${query}” ` : ""}in this category yet.
          </p>
        )}
      </div>
    </div>
  );
}
