"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Dices } from "lucide-react";

import { LudoBoard, type CoinStyle } from "@/components/game/arena/ludo-board";
import { ArenaLobby, ArenaMatching, ArenaFound, ArenaJoining, ArenaTableHost, ArenaEndOverlay } from "@/components/game/arena/arena-ui";
import { useArenaGame } from "@/lib/arena/use-arena-game";
import type { GameState } from "@/lib/arena/types";
import { playerUsername } from "@/lib/arena/bot-name";
import { cn } from "@/lib/utils";

const WS_URL =
  process.env.NEXT_PUBLIC_LUDO_WS_URL || "wss://ws-ludo.srv1010179.hstgr.cloud";

type LudoPlayerState = {
  id?: string | null;
  tokens?: { id: string; loc: number | "yard"; slot?: number }[];
};

type MovePreview = { i: number; id: string; dest: number; color: string };

function buildPreviewMoves(state: GameState, myColor: string | null): MovePreview[] {
  if (!myColor || !state.diceRolled || !state.lastRoll) return [];
  const player = state.players[myColor] as LudoPlayerState | null;
  if (!player || !player.tokens) return [];
  const moves: MovePreview[] = [];
  player.tokens.forEach((t, i) => {
    if (t.loc === "yard") {
      if (state.lastRoll === 6) moves.push({ i, id: t.id, dest: 0, color: myColor });
      return;
    }
    const dest = (t.loc as number) + (state.lastRoll ?? 0);
    if (dest <= 56) moves.push({ i, id: t.id, dest, color: myColor });
  });
  return moves;
}

export default function LudoGame({ username }: { username: string | null }) {
  const game = useArenaGame({ wsUrl: WS_URL, gameType: "ludo", username });

  const {
    connected,
    phase,
    gameState,
    playerColor,
    error,
    isShaking,
    lastResult,
    foundOpponentName,
    searchMatch,
    createTable,
    joinTable,
    cancelTable,
    cancelSearch,
    playAgain,
    handleMove,
    handleRoll,
  } = game;

  // Client-side in-flight move lock. A token click is emitted to the server and
  // the interaction is frozen until the next game:update confirms the move
  // (the pending token's loc changed, or the server locked/advanced the turn).
  // A fallback timer unlocks in case the server silently ignored the move
  // (e.g. the roll had already been consumed). Without this, a click that
  // "looked ignored" during the round-trip window gets repeated, the repeat is
  // silently dropped, and the board then jumps once the snapshot lands.
  const [movePending, setMovePending] = useState(false);
  const movePendingRef = useRef(false);
  const pendingTokenRef = useRef<{ id: string; loc: number | "yard" } | null>(null);
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [coinStyle, setCoinStyle] = useState<CoinStyle>("classic");
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const unlockMoves = useCallback(() => {
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
    movePendingRef.current = false;
    pendingTokenRef.current = null;
    setMovePending(false);
  }, []);

  const pickMove = useCallback(
    (move: MovePreview) => {
      if (movePendingRef.current) return;
      const P = gameState?.players[playerColor ?? ""];
      const tok =
        P && typeof P === "object" && P.tokens ? P.tokens[move.i] : null;
      movePendingRef.current = true;
      pendingTokenRef.current = tok ? { id: tok.id, loc: tok.loc } : null;
      setMovePending(true);
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = setTimeout(unlockMoves, 2000);
      handleMove({ tokenId: move.id });
    },
    [gameState, playerColor, handleMove, unlockMoves]
  );

  const rollDice = useCallback(() => {
    if (movePendingRef.current) return;
    handleRoll();
  }, [handleRoll]);

  useEffect(() => {
    if (!movePendingRef.current || !gameState) return;
    const pending = pendingTokenRef.current;
    const me = playerColor ?? "";
    const P = gameState.players[me];
    const token =
      P && typeof P === "object" && P.tokens && pending
        ? P.tokens.find((t) => t.id === pending.id)
        : null;
    if (token && token.loc !== pending?.loc) {
      unlockMoves();
    } else if (gameState.turn !== me || gameState.turnLocked) {
      unlockMoves();
    }
  }, [gameState, playerColor, unlockMoves]);

  useEffect(() => () => {
    if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
  }, []);

  if (phase === "lobby") {
    return (
      <ArenaLobby
        connected={connected}
        balance={game.balance}
        walletStatus={game.walletStatus}
        onSearch={searchMatch}
        onCreate={createTable}
        onJoin={joinTable}
        error={error}
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

  const isMyTurn =
    playerColor === gameState.turn &&
    gameState.status === "playing" &&
    !gameState.turnLocked;
  const opponentColor = Object.keys(gameState.players).find((c) => c !== playerColor);
  const isWinner = gameState.winner === playerColor;
  const previewMoves = isMyTurn && !movePending ? buildPreviewMoves(gameState, playerColor) : [];
  const myTokens = (gameState.players[playerColor ?? ""] as LudoPlayerState | null)?.tokens ?? [];
  const homed = myTokens.filter((t) => t.loc === 56).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:items-start lg:gap-4">
        {/* Board */}
        <section className="rounded-2xl border border-white/10 bg-card/60 lg:col-span-3">
          {gameState.disconnected && Object.keys(gameState.disconnected).length > 0 && (
            <div className="mb-4 flex justify-center">
              <span className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-400">
                {Object.keys(gameState.disconnected).includes(playerColor ?? "")
                  ? "Reconnecting…"
                  : "Opponent disconnected — waiting…"}
              </span>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-xs font-bold uppercase tracking-widest text-red-400">
              {error}
            </div>
          )}

          <div className="relative">
            <LudoBoard
              mirror={gameState}
              myColor={playerColor}
              myName={username ?? "You"}
              opponentName={opponentColor ? (playerUsername(gameState, opponentColor) ?? "Challenger") : "Waiting"}
              onPickMove={(move: MovePreview) => pickMove(move)}
              onRoll={rollDice}
              isMyTurn={isMyTurn}
              diceRolled={gameState.diceRolled}
              lastRoll={gameState.lastRoll}
              isShaking={isShaking}
              coinStyle={coinStyle}
              previewMoves={previewMoves}
            />

            {gameState.status === "waiting" && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-black/70 p-8 text-center backdrop-blur-sm">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-brand/40 bg-brand/20">
                  <Dices className="h-7 w-7 animate-pulse text-brand" />
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
          <SeatCard
            color={opponentColor}
            name={opponentColor ? (playerUsername(gameState, opponentColor) ?? "Challenger") : "Waiting"}
            active={gameState.turn === opponentColor && gameState.status === "playing"}
          />

          <SeatCard
            color={playerColor}
            name={username ?? "You"}
            active={isMyTurn}
            highlight
          />

          <div className="rounded-2xl border border-white/10 bg-card/60 p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Tokens home
            </p>
            <p className="mt-1 text-2xl font-black text-brand">{homed}/4</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-card/60 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Coin style
            </p>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {(["classic", "neon", "metallic"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setCoinStyle(s)}
                  className={cn(
                    "rounded-lg border px-1 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all",
                    coinStyle === s
                      ? "border-brand/60 bg-brand/15 text-brand ring-1 ring-brand/40"
                      : "border-white/10 bg-white/5 text-white/40 hover:border-white/25 hover:text-white/70"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

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
          winnerName={
            gameState.winner ? (playerUsername(gameState, gameState.winner) ?? "Opponent") : null
          }
          onPlayAgain={playAgain}
        />
      )}
    </div>
  );
}

function SeatCard({
  color,
  name,
  active,
  highlight,
}: {
  color?: string | null;
  name: string;
  active: boolean;
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
          className="flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-bold text-white"
          style={{ backgroundColor: `${color}66`, borderColor: color || "transparent" }}
        >
          {color?.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{name}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
            {active ? "In game" : "Online"}
          </p>
        </div>
      </div>
    </div>
  );
}
