import type { CSSProperties } from "react";
import { Bomb, Gem } from "lucide-react";

import { cn } from "@/lib/utils";

interface MinesTileProps {
  index: number;
  isRevealed: boolean;
  isMine: boolean;
  status: "idle" | "playing" | "ended";
  revealedCount: number;
  onClick: () => void;
}

export function MinesTile({ index, isRevealed, isMine, status, revealedCount, onClick }: MinesTileProps) {
  const isPlaying = status === "playing";
  const isEnd = status === "ended";

  // A tile is "revealed" either because the user clicked it, or because the
  // game ended and we are showing all mines.
  const showContent = isRevealed || (isEnd && isMine);

  return (
    <button
      type="button"
      aria-label={`Tile ${index + 1}`}
      onClick={onClick}
      disabled={!isPlaying || isRevealed}
      style={{ "--breathe-speed": `${Math.max(0.5, 3 - revealedCount * 0.15)}s` } as CSSProperties}
      className={cn(
        "relative flex aspect-square w-full items-center justify-center rounded-xl border transition-all duration-300",
        isPlaying &&
          !isRevealed &&
          "cursor-pointer active:scale-95 lg:hover:-translate-y-1 lg:hover:scale-[1.06] lg:hover:border-brand/80 lg:hover:shadow-[0_0_20px_rgba(163,230,53,0.3),0_0_40px_rgba(163,230,53,0.12)]",
        !showContent && "border-white/10 bg-white/5 shadow-[0_8px_16px_rgba(0,0,0,0.35)]",
        !showContent && isPlaying && "animate-neon-breathe",
        isRevealed && !isMine && "border-brand/60 bg-brand/15 shadow-[0_0_24px_rgba(163,230,53,0.25)]",
        isMine && isRevealed && "z-10 border-red-500/70 bg-red-500/15 shadow-[0_0_24px_rgba(239,68,68,0.3)]",
        isMine && !isRevealed && isEnd && "scale-90 border-white/10 bg-white/5 opacity-30 grayscale"
      )}
    >
      {/* 3D glass effect */}
      {!showContent && (
        <div className="pointer-events-none absolute inset-[8%] rounded-lg bg-gradient-to-br from-white/5 to-transparent" />
      )}

      {/* Content (flips to reveal) */}
      <div
        className="relative flex h-full w-full items-center justify-center transition-transform duration-300"
        style={{ transform: showContent ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        <div style={{ transform: "rotateY(180deg)" }} className="flex h-full w-full items-center justify-center">
          {isRevealed && !isMine && (
            <div className="relative">
              <Gem className="h-8 w-8 text-brand drop-shadow-[0_0_8px_rgba(163,230,53,0.6)] sm:h-9 sm:w-9 md:h-10 md:w-10" />
              <div className="burst-ring absolute inset-0 rounded-full bg-brand/60 blur-md" />
            </div>
          )}
          {isMine && (
            <div className="relative">
              <Bomb
                className={cn(
                  "h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10",
                  isRevealed ? "text-red-400" : "text-white/40"
                )}
              />
              {isRevealed && <div className="burst-ring absolute inset-0 rounded-full bg-red-500/70 blur-xl" />}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
