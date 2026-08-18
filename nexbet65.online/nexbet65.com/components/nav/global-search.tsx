"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { setLobbySearch } from "@/lib/lobby-bus";

/**
 * Global search pill (mockup: hidden below md, focus-within brand border).
 * Live-filters the lobby game grid via the lobby bus.
 */
export function GlobalSearch() {
  const [query, setQuery] = useState("");

  useEffect(() => {
    setLobbySearch(query.trim().toLowerCase());
  }, [query]);

  return (
    <div className="hidden w-44 md:flex lg:w-64 xl:w-80">
      <div className="flex w-full items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 transition-colors focus-within:border-brand/50">
        <Search className="h-4 w-4 shrink-0 text-white/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
          placeholder="Search 2,500+ games…"
          aria-label="Search games"
        />
      </div>
    </div>
  );
}
