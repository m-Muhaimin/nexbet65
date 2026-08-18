"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Loader2, Pause, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

type LogStatus = "connecting" | "live" | "error";

function lineClass(line: string): string {
  const l = line.toLowerCase();
  if (l.includes("error") || l.includes("fatal") || l.includes("uncaught")) {
    return "text-red-400";
  }
  if (
    l.includes("listening") ||
    l.includes("leader") ||
    l.includes("connected") ||
    l.includes("started")
  ) {
    return "text-brand";
  }
  if (l.includes("warn")) return "text-amber-400";
  return "text-white/70";
}

export function ServerLogViewer({
  service,
  title,
}: {
  service: "aviator" | "wheel";
  title: string;
}) {
  const [lines, setLines] = useState<string[]>([]);
  const [status, setStatus] = useState<LogStatus>("connecting");
  const [paused, setPaused] = useState(false);
  const [copied, setCopied] = useState(false);
  const bufRef = useRef<string[]>([]);
  const pausedRef = useRef(paused);
  const containerRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(true);
  pausedRef.current = paused;

  useEffect(() => {
    bufRef.current = [];
    setLines([]);
    setStatus("connecting");

    const es = new EventSource(`/api/admin/server-log?service=${service}&lines=200`);
    es.onopen = () => setStatus("live");
    es.onerror = () => setStatus("error");
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as { type: string; text?: string };
        if (data.type === "ready") {
          bufRef.current = [];
          setLines([]);
          setStatus("live");
          return;
        }
        if (data.type === "line" || data.type === "stderr") {
          if (pausedRef.current) return;
          const buf = bufRef.current;
          buf.push(data.text ?? "");
          if (buf.length > 1200) buf.splice(0, buf.length - 1200);
          setLines([...buf]);
        } else if (data.type === "error") {
          if (pausedRef.current) return;
          const buf = bufRef.current;
          buf.push(data.text ?? "error");
          setLines([...buf]);
          setStatus("error");
        }
      } catch {
        /* ignore malformed frames */
      }
    };
    return () => es.close();
  }, [service]);

  useEffect(() => {
    if (paused || !pinnedRef.current) return;
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, paused]);

  const onScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  };

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy log");
    }
  };

  const clear = () => {
    bufRef.current = [];
    setLines([]);
  };

  const statusDot =
    status === "live"
      ? "bg-brand"
      : status === "connecting"
        ? "bg-amber-400 animate-pulse"
        : "bg-red-500";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-[#111] px-3 py-1.5 text-xs font-bold text-white/60">
            <span className="relative flex h-2 w-2">
              {status === "live" && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              )}
              <span className={cn("relative inline-flex h-2 w-2 rounded-full", statusDot)} />
            </span>
            {status === "live" ? "LIVE" : status === "connecting" ? "CONNECTING" : "STREAM ERROR"}
          </span>
          <span className="hidden font-mono text-xs text-white/30 sm:inline">
            journalctl -u {service === "aviator" ? "aviator-ws" : "wheel-ws"} -f
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs tabular-nums text-white/40">
            {lines.length.toLocaleString()} lines
          </span>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition",
              paused
                ? "border-brand/40 bg-brand/10 text-brand"
                : "border-white/10 bg-[#111] text-white/60 hover:border-white/25 hover:text-white"
            )}
          >
            {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            {paused ? "Resume" : "Pause"}
          </button>
          <button
            type="button"
            onClick={() => void copyAll()}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#111] px-3 py-1.5 text-xs font-bold text-white/60 transition hover:border-white/25 hover:text-white"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-brand" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            onClick={clear}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#111] px-3 py-1.5 text-xs font-bold text-white/60 transition hover:border-red-500/40 hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#0a0a0a]">
        <div className="flex items-center gap-1.5 border-b border-white/5 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-brand/70" />
          <span className="ml-2 font-mono text-xs font-semibold text-white/40">
            {title} · realtime log
          </span>
        </div>
        <div
          ref={containerRef}
          onScroll={onScroll}
          className="h-[60vh] overflow-auto bg-[#0a0a0a] p-4 font-mono text-[11px] leading-relaxed"
        >
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-white/30">
              {status === "connecting" ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Connecting to {service} journal…</span>
                </>
              ) : (
                <>
                  <span className="text-lg">📡</span>
                  <span>No log lines yet{status === "error" ? " (stream interrupted — retrying…)" : ""}</span>
                </>
              )}
            </div>
          ) : (
            <pre className="whitespace-pre-wrap break-words">
              {lines.map((line, i) => (
                <span key={i} className={cn("block", lineClass(line))}>
                  {line}
                </span>
              ))}
            </pre>
          )}
        </div>
      </div>

      <p className="text-xs text-white/30">
        {title} streams live from the VPS systemd journal. Pausing freezes the
        buffer; resuming reconnects to the tail.
      </p>
    </div>
  );
}
