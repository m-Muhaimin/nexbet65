"use client";

import { cn } from "@/lib/utils";
import type { LobbyFilter } from "@/lib/lobby-bus";

export const PILLS: { key: LobbyFilter; label: string }[] = [
  { key: "all", label: "🔥 All" },
  { key: "crash", label: "🚀 Crash" },
  { key: "live", label: "🎥 Live" },
  { key: "table", label: "🃏 Table" },
  { key: "hot", label: "⭐ Hot" },
  { key: "new", label: "✨ New" },
];

/**
 * Sticky category pill bar (mockup: `sticky top-14 z-30 glass`). Controlled by
 * GameGrid so sidebar-driven filter changes also light up the active pill.
 */
export function CategoryFilters({
  filter,
  onSelect,
}: {
  filter: LobbyFilter;
  onSelect: (f: LobbyFilter) => void;
}) {
  return (
    <div className="glass sticky top-12 z-30 -mx-3 mt-4 border-b border-white/5 px-3 py-2.5 sm:top-14 sm:-mx-4 sm:mt-6 sm:px-4 sm:py-3">
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto sm:gap-2">
        {PILLS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => onSelect(p.key)}
            className={cn(
              "whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 transition-colors sm:px-4 sm:py-1.5 sm:text-sm",
              filter === p.key && "pill-active"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
