"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import confetti from "canvas-confetti";

import { formatMoney } from "@/lib/games";
import { useWallet } from "@/lib/wallet-store";
import type { GameState } from "@/lib/arena/types";
import { playerUsername } from "@/lib/arena/bot-name";
import { playMoveSound, playRollSound, playCaptureSound, playHomeSound } from "@/lib/arena/audio";

export type ArenaPhase = "lobby" | "matching" | "found" | "joining" | "table" | "playing" | "ended";
export type ArenaMode = "search" | "create" | "join" | null;

interface UseArenaGameOptions {
  wsUrl: string;
  gameType: "checkers" | "ludo";
  username?: string | null;
}

export function useArenaGame({ wsUrl, gameType, username }: UseArenaGameOptions) {
  const { balance, status: walletStatus, refresh } = useWallet();

  const socketRef = useRef<Socket | null>(null);
  const stakeInPlayRef = useRef<number | null>(null);
  const settledRoomRef = useRef<string | null>(null);
  const gameEndedRef = useRef(false);
  const playerColorRef = useRef<string | null>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const prevStateRef = useRef<GameState | null>(null);
  const balanceRef = useRef(balance);
  const walletStatusRef = useRef(walletStatus);
  const usernameRef = useRef<string | null>(username ?? null);
  const phaseRef = useRef<ArenaPhase>("lobby");
  const modeRef = useRef<ArenaMode>(null);

  const [connected, setConnected] = useState(false);
  const [phase, setPhase] = useState<ArenaPhase>("lobby");
  const [mode, setMode] = useState<ArenaMode>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerColor, setPlayerColor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [foundOpponentName, setFoundOpponentName] = useState<string | null>(null);
  const foundTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    balanceRef.current = balance;
    walletStatusRef.current = walletStatus;
  }, [balance, walletStatus]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    playerColorRef.current = playerColor;
  }, [playerColor]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    usernameRef.current = username ?? null;
  }, [username]);

  useEffect(() => {
    if (phase !== "found" || !gameState || !playerColor) return;
    const oppColor = Object.keys(gameState.players).find((c) => c !== playerColor);
    if (!oppColor) return;
    setFoundOpponentName(playerUsername(gameState, oppColor) ?? "Challenger");
  }, [phase, gameState, playerColor]);

  const refundStake = useCallback(
    async (msg?: string) => {
      const amount = stakeInPlayRef.current;
      if (amount === null || amount === undefined) return;
      stakeInPlayRef.current = null;
      void refresh();
      if (msg) toast.info(msg);
    },
    [refresh]
  );

  const settle = useCallback(
    async (state: GameState) => {
      if (settledRoomRef.current === state.roomId) return;
      settledRoomRef.current = state.roomId;
      gameEndedRef.current = true;
      const amount = stakeInPlayRef.current;
      stakeInPlayRef.current = null;
      void refresh();

      const myColor = playerColorRef.current;
      // The server credits the winner via the settle endpoint up to ~1s after
      // the ended game:update, so refresh again once the credit has landed.
      setTimeout(() => void refresh(), 1500);

      if (state.winner === null) {
        setLastResult("Draw — stake refunded");
        return;
      }

      if (state.winner === myColor) {
        const payout = amount ? amount * 2 : 0;
        toast.success(`You won ${formatMoney(payout)}!`);
        setLastResult(`Victory — won ${formatMoney(payout)}`);
      } else {
        setLastResult("Defeat — stake lost");
      }
    },
    [refresh]
  );

  const connectSocket = useCallback(() => {
    if (socketRef.current) return;
    let cancelled = false;
    // Authenticate the WS handshake with a short-lived HMAC ticket minted by
    // the nexbet65.com app server — the arena server trusts only tickets, never the
    // session secret.
    fetch("/api/arena/ticket", { method: "POST", cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("ticket failed"))))
      .then((data: { ticket: string }) => {
        if (cancelled || socketRef.current) return;
        const socket = io(wsUrl, {
          auth: { ticket: data.ticket },
          reconnection: true,
          reconnectionDelay: 1500,
          timeout: 15000,
        });
        socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      // Reclaim the seat if the socket dropped mid-game and reconnected with a new id.
      const rs = gameStateRef.current;
      const pc = playerColorRef.current;
      if (rs?.roomId && pc && (rs.status === "playing" || rs.status === "waiting")) {
        socket.emit("room:join", {
          roomId: rs.roomId,
          username: usernameRef.current ?? undefined,
          color: pc,
        });
      }
    });
    socket.on("disconnect", () => setConnected(false));

    socket.on("match:found", (roomId: string) => {
      socket.emit("room:join", { roomId, username: usernameRef.current ?? undefined });
      if (phaseRef.current === "matching") {
        setPhase("found");
        setFoundOpponentName(null);
        if (foundTimerRef.current) clearTimeout(foundTimerRef.current);
        foundTimerRef.current = setTimeout(() => {
          setPhase((prev) => (prev === "found" ? "playing" : prev));
        }, 3000);
      }
    });

    socket.on("player:assigned", (color: string) => {
      setPlayerColor(color);
    });

    socket.on("game:update", (state: GameState) => {
      const prev = prevStateRef.current;
      if (prev && state.gameType === "ludo") {
        // Dice roll
        if (state.diceRolled && !prev.diceRolled) {
          playRollSound();
        }
        // Token movement, captures, and home arrivals
        Object.keys(state.players).forEach((color) => {
          const p = state.players[color];
          const prevP = prev.players[color];
          if (p && prevP && typeof p === "object" && typeof prevP === "object" && p.tokens && prevP.tokens) {
            p.tokens.forEach((t, i) => {
              const prevT = prevP.tokens[i];
              if (t.loc !== prevT.loc) {
                if (t.loc === "yard" && typeof prevT.loc === "number") {
                  playCaptureSound();
                  confetti({
                    particleCount: 80,
                    spread: 60,
                    origin: { y: 0.5 },
                    colors: ["#ff2e88", "#1fe0ff", "#ffffff"],
                  });
                } else if (t.loc === 56) {
                  playHomeSound();
                  confetti({
                    particleCount: 120,
                    spread: 90,
                    origin: { y: 0.5 },
                    colors: ["#a3e635", "#4f46e5", "#ffffff"],
                  });
                } else {
                  playMoveSound();
                }
              }
            });
          }
        });
      } else if (prev && state.gameType === "checkers") {
        // Checkers captures
        const prevCap = prev.captures ?? { w: 0, b: 0 };
        const curCap = state.captures ?? { w: 0, b: 0 };
        if (curCap.w + curCap.b > prevCap.w + prevCap.b) {
          playCaptureSound();
        }
      }
      // Game end
      if (prev && state.status === "ended" && prev.status !== "ended") {
        playHomeSound();
      }

      setGameState(state);
      prevStateRef.current = state;
      setError(null);

      // Joining a table: the stake is set by the host; the server debits the
      // stake once the match starts. We only track it locally for the UI.
      if (modeRef.current === "join" && stakeInPlayRef.current === null) {
        if (state.status === "playing" || state.status === "waiting") {
          const amount = Math.max(1, Number(state.stake) || 0);
          stakeInPlayRef.current = amount;
          settledRoomRef.current = null;
          gameEndedRef.current = false;
          void refresh();
        }
      }

      if (state.status === "ended") {
        setPhase("ended");
        void settle(state);
      } else if (state.status === "playing") {
        if (phaseRef.current !== "found") setPhase("playing");
      } else if (state.status === "waiting" && modeRef.current === "create") {
        setPhase("table");
      }
    });

    socket.on("game:error", (msg: string) => {
      setError(msg);
      if (phaseRef.current === "matching") {
        void refundStake(msg);
        setPhase("lobby");
      } else if (phaseRef.current === "joining") {
        setMode(null);
        modeRef.current = null;
        setPhase("lobby");
      }
    });
      })
      .catch(() => {
        if (!cancelled) setTimeout(connectSocket, 2000);
      });
  }, [wsUrl, refundStake, settle]);

  useEffect(() => {
    connectSocket();
    return () => {
      if (foundTimerRef.current) clearTimeout(foundTimerRef.current);
      socketRef.current?.disconnect();
      socketRef.current = null;
      if (stakeInPlayRef.current !== null && !gameEndedRef.current) {
        void refresh();
      }
      stakeInPlayRef.current = null;
    };
  }, [connectSocket, gameType, refresh]);

  const searchMatch = useCallback(
    async (stake: number) => {
      if (walletStatusRef.current === "loading") {
        toast.error("Loading your balance…");
        return;
      }
      const bal = balanceRef.current;
      if (bal !== null && stake > bal) {
        toast.error("Insufficient balance");
        return;
      }
      const amount = Math.max(1, Number(stake) || 0);
      stakeInPlayRef.current = amount;
      settledRoomRef.current = null;
      gameEndedRef.current = false;
      setLastResult(null);
      setError(null);
      modeRef.current = "search";
      setMode("search");
      setPhase("matching");
      socketRef.current?.emit("match:search", {
        stake: amount,
        gameType,
        username: usernameRef.current ?? undefined,
      });
    },
    [gameType]
  );

  const resetToLobby = useCallback(() => {
    if (foundTimerRef.current) clearTimeout(foundTimerRef.current);
    socketRef.current?.disconnect();
    socketRef.current = null;
    setGameState(null);
    setPlayerColor(null);
    setFoundOpponentName(null);
    modeRef.current = null;
    setMode(null);
    setPhase("lobby");
    connectSocket();
  }, [connectSocket]);

  const cancelSearch = useCallback(() => {
    const ph = phaseRef.current;
    if (ph === "matching" || ph === "found") {
      void refundStake("Matchmaking cancelled");
    } else if (ph === "table") {
      if (gameStateRef.current?.roomId) {
        socketRef.current?.emit("table:cancel", { roomId: gameStateRef.current.roomId });
      }
      void refundStake("Table closed");
    }
    resetToLobby();
  }, [refundStake, resetToLobby]);

  const createTable = useCallback(
    async (stake: number) => {
      if (walletStatusRef.current === "loading") {
        toast.error("Loading your balance…");
        return;
      }
      const bal = balanceRef.current;
      if (bal !== null && stake > bal) {
        toast.error("Insufficient balance");
        return;
      }
      const amount = Math.max(1, Number(stake) || 0);
      stakeInPlayRef.current = amount;
      settledRoomRef.current = null;
      gameEndedRef.current = false;
      setLastResult(null);
      setError(null);
      modeRef.current = "create";
      setMode("create");
      setPhase("table");
      socketRef.current?.emit("room:create", {
        gameType,
        stake: amount,
        private: true,
        username: usernameRef.current ?? undefined,
      });
    },
    [gameType]
  );

  const joinTable = useCallback(
    (roomId: string) => {
      const code = roomId.trim().toUpperCase();
      if (!code) return;
      setError(null);
      modeRef.current = "join";
      setMode("join");
      setPhase("joining");
      socketRef.current?.emit("room:join", {
        roomId: code,
        username: usernameRef.current ?? undefined,
      });
    },
    [gameType]
  );

  const cancelTable = useCallback(() => {
    if (gameStateRef.current?.roomId) {
      socketRef.current?.emit("table:cancel", { roomId: gameStateRef.current.roomId });
    }
    void refundStake("Table closed");
    resetToLobby();
  }, [refundStake, resetToLobby]);

  const playAgain = useCallback(() => {
    if (foundTimerRef.current) clearTimeout(foundTimerRef.current);
    setGameState(null);
    setPlayerColor(null);
    setFoundOpponentName(null);
    setError(null);
    setLastResult(null);
    modeRef.current = null;
    setMode(null);
    setPhase("lobby");
  }, []);

  const handleMove = useCallback(
    (move: unknown) => {
      if (gameState?.roomId) {
        socketRef.current?.emit("game:move", { roomId: gameState.roomId, move });
      }
    },
    [gameState?.roomId]
  );

  const handleRoll = useCallback(() => {
    if (gameState?.roomId && !isShaking) {
      setIsShaking(true);
      socketRef.current?.emit("game:roll", { roomId: gameState.roomId });
      setTimeout(() => setIsShaking(false), 1000);
    }
  }, [gameState?.roomId, isShaking]);

  return {
    connected,
    phase,
    mode,
    gameState,
    playerColor,
    error,
    isShaking,
    lastResult,
    foundOpponentName,
    balance,
    walletStatus,
    searchMatch,
    createTable,
    joinTable,
    cancelTable,
    cancelSearch,
    playAgain,
    handleMove,
    handleRoll,
  };
}
