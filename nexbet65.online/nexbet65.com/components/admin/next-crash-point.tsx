"use client";

import { useEffect, useState } from "react";
import { Crosshair, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const SEED_RE = /Next round crash point seeded at ([0-9.]+)x/i;
const CRASHED_RE = /Round crashed/i;

type Status = "connecting" | "live" | "error";

/**
 * Live "Next Crash Point" readout for the Aviator admin page. The aviator-ws
 * leader logs `Next round crash point seeded at 1.50x` the moment a round's
 * crash point is revealed to the server (before betting opens), but never
 * publishes it to clients. This component watches the same journalctl SSE
 * stream the log viewer uses and lifts that value out as it streams in.
 */
export function NextCrashPoint() {
  const [value, setValue] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<Status>("connecting");

  useEffect(() => {
    setValue(null);
    setPending(false);
    setStatus("connecting");

    const es = new EventSource("/api/admin/server-log?service=aviator&lines=200");
    es.onopen = () => setStatus("live");
    es.onerror = () => setStatus("error");
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as { type: string; text?: string };
        if (data.type === "ready") {
          setStatus("live");
          return;
        }
        if (data.type === "line" || data.type === "stderr") {
          const text = data.text ?? "";
          const seed = SEED_RE.exec(text);
          if (seed) {
            setValue(Number(seed[1]));
            setPending(true);
            return;
          }
          if (CRASHED_RE.test(text)) {
            setPending(false);
          }
        }
      } catch {
        /* ignore malformed frames */
      }
    };
    return () => es.close();
  }, []);

  const live = status === "live";
  const pulsing = live && value !== null && pending;
  const resolved = live && value !== null && !pending;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-[#0a0a0a] transition-colors",
        pulsing
          ? "animate-neon-pulse-border"
          : live && value !== null
            ? "border-red-500/60 shadow-[0_0_18px_rgba(255,77,61,0.18),inset_0_0_12px_rgba(255,77,61,0.06)]"
            : "border-white/10"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "rounded-lg p-2 transition-colors",
              resolved
                ? "bg-red-500/10 text-red-400 shadow-[0_0_14px_rgba(255,77,61,0.25)]"
                : "gold-glow bg-brand/10 text-brand"
            )}
          >
            <Crosshair size={18} />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
              Next Crash Point
            </div>
            <div className="font-instrument text-lg font-black text-white">
              {value !== null ? (
                <span className={cn(!resolved ? "text-brand text-glow" : "text-red-400 text-glow-red")}>
                  {value.toFixed(2)}x
                </span>
              ) : (
                <span className="text-white/40">awaiting seed…</span>
              )}
            </div>
          </div>
        </div>

        <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-[#111] px-3 py-1.5 text-xs font-bold text-white/60">
          {status === "live" ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
              </span>
              LIVE
            </>
          ) : status === "connecting" ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              CONNECTING
            </>
          ) : (
            <span className="text-red-400">STREAM ERROR</span>
          )}
        </span>
      </div>

      <div className="border-t border-white/5 px-4 py-2 text-[11px] text-white/30 sm:px-5">
        Revealed by the server the instant betting opens — updates automatically
        each round.
      </div>
    </div>
  );
}
