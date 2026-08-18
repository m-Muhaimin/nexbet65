"use client";

import Link from "next/link";
import { Check, Copy, LogIn, Swords, User, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/games";

const STAKES = [100, 250, 500, 1000];

export function ArenaLobby({
  connected,
  balance,
  walletStatus,
  onSearch,
  onCreate,
  onJoin,
  error,
}: {
  connected: boolean;
  balance: number | null;
  walletStatus: "loading" | "ready" | "error";
  onSearch: (stake: number) => void;
  onCreate?: (stake: number) => void;
  onJoin?: (roomId: string) => void;
  error?: string | null;
}) {
  const [stake, setStake] = useState(250);
  const [mode, setMode] = useState<"search" | "create" | "join">("search");
  const [roomCode, setRoomCode] = useState("");
  const balanceNum = balance ?? 0;
  const multiMode = !!onCreate && !!onJoin;

  const insufficient = walletStatus === "ready" && balanceNum < stake;
  const canAct =
    mode === "join"
      ? connected && roomCode.trim().length > 0
      : connected && !insufficient;

  const submit = () => {
    if (!canAct) return;
    if (mode === "join") {
      onJoin?.(roomCode);
      return;
    }
    if (mode === "create") {
      onCreate?.(stake);
      return;
    }
    onSearch(stake);
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-xl items-center">
      <div className="glass relative w-full overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
        <div className="space-y-5 p-6 sm:p-7">
          {multiMode && (
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { key: "search", label: "Play Now", icon: Swords },
                  { key: "create", label: "Create Table", icon: Users },
                  { key: "join", label: "Join Table", icon: LogIn },
                ] as const
              ).map((t) => {
                const Icon = t.icon;
                const active = mode === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setMode(t.key)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-bold uppercase tracking-widest transition-all",
                      active
                        ? "border-brand/60 bg-brand/10 text-brand ring-1 ring-brand/60"
                        : "border-white/10 bg-white/5 text-white/40 hover:border-white/25 hover:text-white/70"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
              {mode === "join" ? "Private table" : "Configure stake"}
            </p>
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/40">
              <span className={cn("h-1.5 w-1.5 rounded-full", connected ? "bg-brand" : "bg-red-500")} />
              {connected ? "Online" : "Connecting"}
            </span>
          </div>

          {mode === "join" ? (
            <div className="space-y-3">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                placeholder="ENTER TABLE CODE"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3.5 text-center font-mono text-lg font-bold uppercase tracking-[0.35em] text-white placeholder:text-white/20 focus:border-brand/60 focus:outline-none focus:ring-1 focus:ring-brand/40"
              />
              <button
                onClick={submit}
                disabled={!canAct}
                className="group flex w-full items-center justify-center gap-3 rounded-lg bg-brand py-3.5 font-black text-black gold-glow transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="text-sm uppercase tracking-wider">
                  {connected ? "Join Table" : "Connecting to matchmaking…"}
                </span>
                <span className="flex h-5 w-5 items-center justify-center rounded bg-black/15 text-xs transition-transform group-hover:translate-x-1">
                  →
                </span>
              </button>
              <p className="text-center text-[10px] font-medium text-white/30">
                Enter the 6-character code shared by the table host.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {STAKES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStake(s)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-all",
                      stake === s
                        ? "border-brand/60 bg-brand/10 ring-1 ring-brand/60"
                        : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                    )}
                  >
                    <p className={cn("text-lg font-black tracking-tight", stake === s ? "text-white" : "text-white/50")}>
                      {formatMoney(s)}
                    </p>
                    <p className={cn("text-[10px] font-mono uppercase tracking-widest", stake === s ? "text-brand" : "text-white/30")}>
                      {formatMoney(s * 2)} win
                    </p>
                  </button>
                ))}
              </div>

              {insufficient && (
                <p className="text-center text-xs text-red-400">
                  Insufficient balance — top up in the wallet to play.
                </p>
              )}

              <button
                onClick={submit}
                disabled={!canAct}
                className="group flex w-full items-center justify-center gap-3 rounded-lg bg-brand py-3.5 font-black text-black gold-glow transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="text-sm uppercase tracking-wider">
                  {!connected
                    ? "Connecting to matchmaking…"
                    : mode === "create"
                      ? "Create Table"
                      : "Find Opponent"}
                </span>
                <span className="flex h-5 w-5 items-center justify-center rounded bg-black/15 text-xs transition-transform group-hover:translate-x-1">
                  →
                </span>
              </button>
            </>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-xs font-bold uppercase tracking-widest text-red-400">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ArenaMatching({
  stake,
  onCancel,
}: {
  stake: number;
  onCancel: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center py-14">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full border border-brand/30" style={{ animationDuration: "1.6s" }} />
        <span className="absolute inset-0 rounded-full border border-brand/20" />
        <div className="relative z-20 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand shadow-xl shadow-brand/40">
          <User className="h-7 w-7 text-black" />
        </div>
      </div>

      <h2 className="mt-6 text-2xl font-black tracking-tight text-white">
        Matching Opponents
      </h2>

      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-5 py-2.5">
        <span className="font-mono text-sm font-bold uppercase tracking-widest text-brand">
          STAKE: {formatMoney(stake)}
        </span>
      </div>

      <button
        onClick={onCancel}
        className="mt-6 rounded-lg border border-white/10 bg-white/5 px-8 py-3 text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 transition-all hover:bg-white/10 hover:text-white active:scale-95"
      >
        Cancel search
      </button>
    </div>
  );
}

export function ArenaJoining({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center py-10">
      <div className="relative flex h-52 w-52 items-center justify-center">
        <span className="absolute inset-0 rounded-full border border-brand/20" />
        {[1, 2].map((i) => (
          <span
            key={i}
            className="absolute inset-0 animate-ping rounded-full border border-brand/30"
            style={{ animationDuration: "1.8s", animationDelay: `${i * 0.5}s` }}
          />
        ))}
        <div className="relative z-20 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand shadow-2xl shadow-brand/40">
          <LogIn className="h-9 w-9 text-black" />
        </div>
      </div>

      <h2 className="mt-6 text-2xl font-black tracking-tight text-white">
        Joining table
      </h2>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.3em] text-white/40">
        Connecting to the game room
      </p>

      <button
        onClick={onCancel}
        className="mt-8 rounded-lg border border-white/10 bg-white/5 px-8 py-3 text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 transition-all hover:bg-white/10 hover:text-white active:scale-95"
      >
        Cancel
      </button>
    </div>
  );
}

export function ArenaTableHost({
  roomCode,
  stake,
  onCancel,
}: {
  roomCode: string;
  stake: number;
  onCancel: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard?.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center py-10 text-center">
      <div className="relative flex h-44 w-44 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full border border-brand/30" style={{ animationDuration: "2s" }} />
        <span className="absolute inset-4 rounded-full border border-brand/20" />
        <div className="relative z-20 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand shadow-2xl shadow-brand/40">
          <Users className="h-9 w-9 text-black" />
        </div>
      </div>

      <h2 className="mt-6 text-2xl font-black tracking-tight text-white">
        Table created
      </h2>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.3em] text-white/40">
        Waiting for challenger to join
      </p>

      <div className="mt-6 w-full max-w-xs rounded-2xl border border-brand/30 bg-brand/10 p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
          Share this code
        </p>
        <p className="mt-2 font-mono text-4xl font-black tracking-[0.4em] text-brand">
          {roomCode}
        </p>
        <button
          onClick={copy}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-brand/40 bg-brand/15 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-brand transition-all hover:bg-brand/25 active:scale-95"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy code"}
        </button>
      </div>

      <div className="mt-5 inline-block rounded-xl border border-white/10 bg-white/5 px-6 py-3">
        <span className="font-mono text-sm font-bold uppercase tracking-widest text-white/70">
          STAKE: {formatMoney(stake)}
        </span>
      </div>

      <p className="mt-4 text-[10px] font-medium text-white/30">
        A friend enters the code in Join Table to play. No bot will fill this seat.
      </p>

      <button
        onClick={onCancel}
        className="mt-6 rounded-lg border border-white/10 bg-white/5 px-8 py-3 text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 transition-all hover:bg-white/10 hover:text-white active:scale-95"
      >
        Close table
      </button>
    </div>
  );
}

export function ArenaFound({
  opponentName,
  stake,
}: {
  opponentName: string;
  stake: number;
}) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    const t = setInterval(() => setCount((c) => (c > 1 ? c - 1 : 1)), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center py-10">
      <div className="relative flex h-48 w-48 items-center justify-center">
        {[1, 2].map((i) => (
          <span
            key={i}
            className="absolute inset-0 animate-ping rounded-full border-2 border-brand/40"
            style={{ animationDuration: "1.6s", animationDelay: `${i * 0.5}s` }}
          />
        ))}
        <div className="relative z-20 flex h-24 w-24 flex-col items-center justify-center rounded-2xl bg-brand shadow-2xl shadow-brand/40">
          <Check className="h-8 w-8 text-black" strokeWidth={3} />
          <span className="mt-0.5 font-mono text-xl font-black leading-none text-black">{count}</span>
        </div>
      </div>

      <h2 className="mt-6 text-2xl font-black tracking-tight text-white">
        Opponent found
      </h2>
      <p className="mt-2 font-mono text-lg font-bold tracking-wide text-brand">{opponentName}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.3em] text-white/40">
        Starting in {count}s
      </p>

      <div className="mt-6 inline-block rounded-xl border border-brand/30 bg-brand/10 px-6 py-3">
        <span className="font-mono text-sm font-bold uppercase tracking-widest text-brand">
          STAKE: {formatMoney(stake)}
        </span>
      </div>
    </div>
  );
}

export function ArenaEndOverlay({
  winner,
  isWinner,
  endReason,
  lastResult,
  onPlayAgain,
  winnerName,
}: {
  winner: string | null;
  isWinner: boolean;
  endReason?: string;
  lastResult: string | null;
  onPlayAgain: () => void;
  winnerName?: string | null;
}) {
  const cancelled = endReason === "cancelled";
  const victory = isWinner && !cancelled;
  const body = cancelled
    ? "The table was closed before the match concluded. No stakes were settled."
    : victory
      ? endReason === "disconnect"
        ? "Opponent left without returning within the grace period. Victory by default — the pot is yours."
        : "Every move paid off. The board is yours — pot secured."
      : endReason === "disconnect"
        ? "You disconnected and did not return within the grace period."
        : "The board slipped away this round. Reset and run it back.";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
      <div
        className={
          "relative w-full max-w-lg overflow-hidden rounded-[2rem] border p-10 text-center shadow-2xl " +
          (cancelled
            ? "border-white/10 bg-[#12141c]"
            : victory
              ? "border-amber-500/30 bg-gradient-to-br from-[#12141c] via-[#1a1608] to-[#12141c] shadow-amber-500/10"
              : "border-red-500/30 bg-gradient-to-br from-[#12141c] via-[#1c1113] to-[#12141c] shadow-red-500/10")
        }
      >
        <div
          className={
            "pointer-events-none absolute inset-0 opacity-10 [background-image:radial-gradient(#f6b01a_1px,transparent_1px)] [background-size:16px_16px]" +
            (victory ? "" : " [filter:invert(1)]")
          }
        />
        <div className="relative">
          <div
            className={
              "mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] border " +
              (cancelled
                ? "border-white/10 bg-white/5"
                : victory
                  ? "border-amber-500/40 bg-amber-500/15 shadow-2xl shadow-amber-500/30"
                  : "border-red-500/40 bg-red-500/15 shadow-2xl shadow-red-500/30")
            }
          >
            <span className="text-5xl">{cancelled ? "🕳️" : victory ? "🏆" : "💀"}</span>
          </div>

          <h2
            className={
              "text-5xl font-black tracking-tighter " +
              (cancelled ? "text-white/60" : victory ? "text-amber-300" : "text-red-400")
            }
          >
            {cancelled ? "MATCH CANCELLED" : victory ? "VICTORY" : "DEFEAT"}
          </h2>

          <p className="mt-2 text-xs font-bold uppercase tracking-[0.4em] text-white/40">
            {cancelled ? "Table closed" : "Match concluded"}
          </p>

          {!cancelled && winnerName && (
            <p className="mt-3 inline-block rounded-lg border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-white/60">
              {victory ? "Winner: You" : `Winner: ${winnerName}`}
            </p>
          )}

          <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-white/50">{body}</p>

          {lastResult && (
            <p
              className={
                "mt-4 text-sm font-bold " +
                (cancelled ? "text-white/40" : victory ? "text-amber-400" : "text-red-400")
              }
            >
              {lastResult}
            </p>
          )}

          <div className="mt-8 space-y-3">
            <button
              onClick={onPlayAgain}
              className={
                "w-full rounded-lg py-4 text-lg font-black text-black transition-all hover:brightness-110 active:scale-[0.95] " +
                (cancelled
                  ? "border border-white/15 bg-white/10 text-white"
                  : victory
                    ? "bg-amber-400 shadow-amber-500/30"
                    : "bg-red-500 shadow-red-500/30")
              }
            >
              PLAY AGAIN
            </button>
            <Link
              href="/games"
              className="block w-full rounded-lg border border-white/15 py-3 text-sm font-bold text-white/60 transition-colors hover:border-brand/60 hover:text-white"
            >
              Back to games
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
