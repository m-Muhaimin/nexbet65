"use client";

import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import { useState } from "react";

import CheckersBoard from "@/components/game/arena/checkers-board";
import { ArenaLobby, ArenaMatching, ArenaFound, ArenaJoining, ArenaTableHost, ArenaEndOverlay } from "@/components/game/arena/arena-ui";
import { useArenaGame } from "@/lib/arena/use-arena-game";
import type { GameState } from "@/lib/arena/types";
import { playerUsername } from "@/lib/arena/bot-name";
import { cn } from "@/lib/utils";

const WS_URL =
  process.env.NEXT_PUBLIC_CHECKERS_WS_URL || "wss://ws-checkers.srv1010179.hstgr.cloud";

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

function isBot(state: GameState, color: string): boolean {
  const p = state.players[color];
  if (typeof p === "string") return p === "BOT_USER";
  return !!p && typeof p === "object" && (p as { id?: string | null }).id === "BOT_USER";
}

export default function CheckersGame({ username }: { username: string | null }) {
  const game = useArenaGame({ wsUrl: WS_URL, gameType: "checkers", username });
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const {
    connected,
    phase,
    gameState,
    playerColor,
    error,
    lastResult,
    foundOpponentName,
    searchMatch,
    createTable,
    joinTable,
    cancelTable,
    cancelSearch,
    playAgain,
    handleMove,
  } = game;

  if (phase === "lobby") {
    return (
      <ArenaLobby
        connected={connected}
        balance={game.balance}
        walletStatus={game.walletStatus}
        onSearch={searchMatch}
        onCreate={createTable}
        onJoin={joinTable}
      />
    );
  }

  if (phase === "matching") {
    return <ArenaMatching stake={gameState?.stake ?? 0} onCancel={cancelSearch} />;
  }

  if (phase === "found") {
    return (
      <ArenaFound opponentName={foundOpponentName ?? "Challenger"} stake={gameState?.stake ?? 0} />
    );
  }

  if (phase === "joining") {
    return <ArenaJoining onCancel={cancelSearch} />;
  }

  if (phase === "table" && gameState) {
    return (
      <ArenaTableHost roomCode={gameState.roomId} stake={gameState.stake} onCancel={cancelTable} />
    );
  }

  if (!gameState) return null;

  const isMyTurn = playerColor === gameState.turn && gameState.status === "playing";
  const opponentColor = Object.keys(gameState.players).find((c) => c !== playerColor);
  const captures = gameState.captures ?? { w: 0, b: 0 };
  const isWinner = gameState.winner === playerColor;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:items-start lg:gap-4">
        {/* Board */}
        <section className="rounded-2xl border border-white/10 bg-card/60 p-4 sm:p-6 lg:col-span-3">
          {/* Player seats with progressive gold turn ring */}
          <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
            <CheckersPlayerBadge
              name={username ?? "You"}
              color={playerColor === "w" ? "#e6ebf2" : "#f87171"}
              active={isMyTurn}
              timeLeft={isMyTurn ? gameState.turnTimer : null}
            />
            <CheckersPlayerBadge
              name={opponentColor ? (playerUsername(gameState, opponentColor) ?? "Challenger") : "Waiting"}
              color={opponentColor === "w" ? "#e6ebf2" : "#f87171"}
              active={gameState.turn === opponentColor && gameState.status === "playing"}
              timeLeft={gameState.turn === opponentColor ? gameState.turnTimer : null}
            />
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-xs font-bold uppercase tracking-widest text-red-400">
              {error}
            </div>
          )}

          <div className="relative">
            <CheckersBoard state={gameState} playerColor={playerColor} onMove={handleMove} />

            {gameState.status === "waiting" && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-black/70 p-8 text-center backdrop-blur-sm">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-brand/40 bg-brand/20">
                  <Trophy className="h-7 w-7 animate-pulse text-brand" />
                </div>
                <h3 className="mb-1 text-xl font-black tracking-tight text-white">
                  Starting match
                </h3>
                <p className="text-xs text-white/50">
                  Room code:{" "}
                  <span className="font-mono tracking-widest text-brand">{gameState.roomId}</span>
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Sidebar */}
        <aside className="mt-4 space-y-4 lg:mt-0 lg:col-span-1">
          <OpponentCard
            color={opponentColor}
            name={opponentColor ? (playerUsername(gameState, opponentColor) ?? "Challenger") : "Waiting"}
            sub={opponentColor && isBot(gameState, opponentColor) ? "ONLINE" : "HUMAN SEAT"}
            active={gameState.turn === opponentColor && gameState.status === "playing"}
            timer={gameState.turn === opponentColor ? formatTime(gameState.turnTimer) : "--:--"}
          />

          <div className="rounded-2xl border border-white/10 bg-card/60 p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Captures</p>
            <div className="mt-2 flex justify-center gap-4 text-sm font-mono">
              <span>
                You <span className="font-black text-brand">{captures[playerColor === "w" ? "w" : "b"] ?? 0}</span>
              </span>
              <span className="text-white/20">·</span>
              <span>
                Opp <span className="font-black text-white/80">{captures[playerColor === "w" ? "b" : "w"] ?? 0}</span>
              </span>
            </div>
          </div>

          <OpponentCard
            color={playerColor}
            name={username ?? "You"}
            sub="YOUR SEAT"
            active={isMyTurn}
            timer={isMyTurn ? formatTime(gameState.turnTimer) : "--:--"}
            highlight
          />

          {gameState.status === "playing" && (
            <div className="rounded-2xl border border-white/10 bg-card/60 p-4 text-center">
              <p className="text-xs text-white/50">
                Stake: <span className="font-bold text-white">{gameState.stake}</span> · Winner takes the pot
              </p>
              <button
                onClick={() => setShowExitConfirm(true)}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-white/50 transition-colors hover:border-brand/50 hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Quit (forfeit)
              </button>
            </div>
          )}
        </aside>
      </div>

      {showExitConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#12141c] p-6 shadow-2xl">
            <h3 className="mb-2 text-xl font-bold text-white">Abandon Arena?</h3>
            <p className="mb-6 text-sm text-white/50">
              You will forfeit your stake and the match progress will be lost. Are you sure you want to leave?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 rounded-xl bg-white/10 px-4 py-2 font-semibold text-white transition-colors hover:bg-white/15"
              >
                Stay
              </button>
              <Link
                href="/games"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-center font-semibold text-white transition-colors hover:bg-red-500"
              >
                Leave
              </Link>
            </div>
          </div>
        </div>
      )}

      {phase === "ended" && (
        <ArenaEndOverlay
          winner={gameState.winner}
          isWinner={isWinner}
          endReason={gameState.endReason}
          lastResult={lastResult}
          onPlayAgain={playAgain}
        />
      )}
    </div>
  );
}

function CheckersPlayerBadge({
  name,
  color,
  active,
  timeLeft,
}: {
  name: string;
  color: string;
  active: boolean;
  timeLeft: number | null;
}) {
  const TURN_TIME = 30;
  const frac = timeLeft !== null ? Math.max(0, Math.min(1, timeLeft / TURN_TIME)) : 0;
  const danger = (timeLeft ?? 0) <= 10;
  const stroke = danger ? "#ef4444" : "#f6b01a";
  const R = 21;
  const C = 2 * Math.PI * R;
  const initials = name.charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        "pulse-badge flex items-center gap-2.5 rounded-full border border-white/10 bg-[#09090d]/80 p-2 pr-3.5 shadow-2xl backdrop-blur-md",
        active && "active"
      )}
    >
      <div
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-xs font-black"
        style={{
          backgroundColor: `${color}33`,
          borderColor: color,
          color,
          boxShadow: active ? `0 0 15px ${color}66` : "none",
        }}
      >
        {active && (
          <svg
            className="pointer-events-none absolute -inset-[3px] -rotate-90"
            viewBox="0 0 48 48"
            fill="none"
          >
            <circle cx="24" cy="24" r={R} stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
            <circle
              cx="24"
              cy="24"
              r={R}
              stroke={stroke}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - frac)}
              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.4s ease" }}
            />
          </svg>
        )}
        {initials}
      </div>
      <div className="flex flex-col">
        <span className="max-w-[110px] truncate text-[10px] font-bold uppercase leading-none tracking-widest text-white/80">
          {name}
        </span>
        <span
          className={cn(
            "mt-1 font-mono text-[10px] tabular-nums leading-none",
            active ? (danger ? "text-red-400" : "text-brand") : "text-slate-500"
          )}
        >
          {active ? formatTime(timeLeft ?? 0) : "--:--"}
        </span>
      </div>
    </div>
  );
}

function OpponentCard({
  color,
  name,
  sub,
  active,
  timer,
  highlight,
}: {
  color?: string | null;
  name: string;
  sub: string;
  active: boolean;
  timer: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-3 transition-all",
        highlight
          ? active
            ? "border-brand/40 bg-brand/10 ring-1 ring-brand/30"
            : "border-white/10 bg-white/5"
          : active
            ? "border-brand/60 bg-brand/10 ring-1 ring-brand/40"
            : "border-white/10 bg-white/5"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-bold text-white"
          style={{ backgroundColor: `${color}66`, borderColor: color || "transparent" }}
        >
          {color?.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{name}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{sub}</p>
        </div>
        <span className={cn("ml-auto font-mono text-sm", active ? "text-brand" : "text-white/40")}>{timer}</span>
      </div>
    </div>
  );
}
