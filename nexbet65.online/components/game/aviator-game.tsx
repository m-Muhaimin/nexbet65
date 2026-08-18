"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/games";
import { useWallet } from "@/lib/wallet-store";
import { createSafeSender, type SafeSender } from "@/lib/ws-sender";
import AviatorBetConsole, {
  EMPTY_CONSOLE_STATE,
  type BetConsoleState,
  type Slot,
} from "@/components/game/aviator-console";
import LiveLobby, {
  type AviatorHistoryEntry,
  type ChatMessage,
} from "@/components/game/live-lobby";

const WS_URL =
  process.env.NEXT_PUBLIC_AVIATOR_WS_URL ||
  "wss://ws-aviator.srv1010179.hstgr.cloud";

type RoundState = "betting" | "running" | "crashed";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type?: "flame" | "smoke" | "spark" | "shockwave";
}

interface SpeedLine {
  x: number;
  y: number;
  length: number;
  speed: number;
  alpha: number;
}

interface Cloud {
  x: number;
  y: number;
  speed: number;
  scale: number;
}

interface ServerMessage {
  type: string;
  balance?: number;
  slot?: Slot;
  multiplier?: number;
  crashPoint?: number;
  payout?: number;
  message?: string;
  serverSeedHash?: string;
  bettingWindowMs?: number;
  chatLog?: ChatMessage[];
  id?: string;
  username?: string;
  text?: string;
  at?: number;
  round?: {
    state: RoundState;
    multiplier: number;
    serverSeedHash?: string;
  };
}

const MAX_BET = 50000;
const BET_TIMEOUT_MS = 8000;
const CASHOUT_TIMEOUT_MS = 8000;
const BETTING_WINDOW_MS = 5000;

const rid = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;

interface SlotBookkeeping {
  betAmount: number;
  betPlaced: boolean;
  cashedOut: boolean;
  lossRecorded: boolean;
  pending: {
    amount: number;
    ref: string;
    timer: ReturnType<typeof setTimeout> | null;
  } | null;
  cashOutInFlight: boolean;
  cashOutPressed: boolean;
  cashOutTimer: ReturnType<typeof setTimeout> | null;
}

const EMPTY_SLOT: SlotBookkeeping = {
  betAmount: 10,
  betPlaced: false,
  cashedOut: false,
  lossRecorded: false,
  pending: null,
  cashOutInFlight: false,
  cashOutPressed: false,
  cashOutTimer: null,
};

const SLOTS: Slot[] = ["a", "b"];

const resolveSlot = (s: Slot | undefined): Slot => (s === "b" ? "b" : "a");

export default function AviatorGame() {
  const { balance, status: walletStatus, refresh, transactions } = useWallet();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const senderRef = useRef<SafeSender | null>(null);
  const reconnectRef = useRef(true);
  const slotsRef = useRef<{ a: SlotBookkeeping; b: SlotBookkeeping }>({
    a: { ...EMPTY_SLOT },
    b: { ...EMPTY_SLOT },
  });
  const multiplierRef = useRef(1.0);
  const roundStateRef = useRef<RoundState>("betting");
  const bettingEndsAtRef = useRef(Date.now() + BETTING_WINDOW_MS);
  const lastChatIdsRef = useRef<Set<string>>(new Set());
  const usernameRef = useRef("");

  const planePos = useRef({ x: 90, y: 370, angle: -0.2 });
  const gridOffset = useRef(0);
  const particles = useRef<Particle[]>([]);
  const speedLines = useRef<SpeedLine[]>([]);
  const clouds = useRef<Cloud[]>([]);

  const flewAwayRef = useRef({
    active: false,
    startX: 90,
    startY: 370,
    startTime: 0,
    angle: -0.35,
    currentX: 90,
    currentY: 370,
  });

  const prevStatusRef = useRef<RoundState>("betting");

  const [connected, setConnected] = useState(false);
  const [roundState, setRoundState] = useState<RoundState>("betting");
  const [multiplier, setMultiplier] = useState(1.0);
  const [slots, setSlots] = useState<{ a: BetConsoleState; b: BetConsoleState }>({
    a: { ...EMPTY_CONSOLE_STATE },
    b: { ...EMPTY_CONSOLE_STATE },
  });
  const [serverSeedHash, setServerSeedHash] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<number[]>([]);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [myHistory, setMyHistory] = useState<AviatorHistoryEntry[]>([]);
  const [username, setUsername] = useState("");
  const [timeLeft, setTimeLeft] = useState(5);

  const winTotal = (slots.a.winAmount ?? 0) + (slots.b.winAmount ?? 0);
  const hasCashedOut = slots.a.cashedOut !== null || slots.b.cashedOut !== null;

  const setSlotState = useCallback(
    (slot: Slot, patch: Partial<BetConsoleState>) => {
      setSlots((prev) => ({ ...prev, [slot]: { ...prev[slot], ...patch } }));
    },
    []
  );

  const resetRoundSlots = useCallback(() => {
    setSlots(() => ({
      a: { ...EMPTY_CONSOLE_STATE },
      b: { ...EMPTY_CONSOLE_STATE },
    }));
  }, []);

  const pushMyHistory = useCallback(
    (entry: { kind: AviatorHistoryEntry["kind"]; amount: number; multiplier?: number }) => {
      setMyHistory((h) =>
        [
          {
            id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            at: Date.now(),
            ...entry,
          },
          ...h,
        ].slice(0, 30)
      );
    },
    []
  );

  const sendChat = useCallback(
    (text: string) => {
      const t = text.trim().slice(0, 140);
      if (!t || !connected) return;
      senderRef.current?.send(
        {
          type: "chat_message",
          username: usernameRef.current || "Guest",
          text: t,
        },
        "chat message"
      );
    },
    [connected]
  );

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { username?: string } | null) => {
        if (d?.username) {
          usernameRef.current = d.username;
          setUsername(d.username);
        }
      })
      .catch(() => {});
  }, []);

  const seededHistoryRef = useRef(false);
  useEffect(() => {
    if (seededHistoryRef.current || walletStatus !== "ready") return;
    seededHistoryRef.current = true;
    const entries: AviatorHistoryEntry[] = [];
    for (const tx of transactions) {
      const at = new Date(tx.createdAt).getTime();
      if (!tx.meta?.startsWith("Aviator")) continue;
      if (tx.kind === "bet") {
        entries.push({
          id: `seed-bet-${tx.id}`,
          kind: "bet",
          amount: Math.abs(tx.amount),
          at,
        });
      } else if (tx.kind === "payout" && Number(tx.amount) > 0) {
        const m = /win @ ([0-9.]+)x/.exec(tx.meta);
        entries.push({
          id: `seed-win-${tx.id}`,
          kind: "win",
          amount: Number(tx.amount),
          multiplier: m ? Number(m[1]) : undefined,
          at,
        });
      } else if (tx.kind === "bet_loss") {
        const m = /lost ([0-9.]+) @ ([0-9.]+)x/.exec(tx.meta);
        entries.push({
          id: `seed-loss-${tx.id}`,
          kind: "loss",
          amount: m ? Number(m[1]) : 0,
          multiplier: m ? Number(m[2]) : undefined,
          at,
        });
      } else if (tx.kind === "bet_refund") {
        entries.push({
          id: `seed-refund-${tx.id}`,
          kind: "refund",
          amount: Math.abs(tx.amount),
          at,
        });
      }
    }
    if (entries.length > 0) {
      entries.sort((a, b) => b.at - a.at);
      setMyHistory((h) => [...entries.slice(0, 30), ...h]);
    }
  }, [walletStatus, transactions]);

  const cancelBetPending = useCallback(
    (slot: Slot, rollback: boolean, msg: string) => {
      const bk = slotsRef.current[slot];
      if (!bk.pending) return;
      if (bk.pending.timer) clearTimeout(bk.pending.timer);
      bk.pending = null;
      setSlotState(slot, { placingBet: false });
      if (rollback) {
        bk.betPlaced = false;
        setSlotState(slot, { betPlaced: false });
        setMessage(msg);
      }
    },
    [setSlotState]
  );

  const cancelCashOut = useCallback(
    (slot: Slot) => {
      const bk = slotsRef.current[slot];
      if (bk.cashOutTimer) {
        clearTimeout(bk.cashOutTimer);
        bk.cashOutTimer = null;
      }
      bk.cashOutInFlight = false;
      setSlotState(slot, { cashingOut: false });
    },
    [setSlotState]
  );

  const cashOut = useCallback(
    (slot: Slot) => {
      const bk = slotsRef.current[slot];
      if (bk.cashOutInFlight) return;
      bk.cashOutInFlight = true;
      setSlotState(slot, { cashingOut: true });
      // Optimistic win display at the current multiplier — reconciled with the
      // authoritative value in `cash_out_success`.
      const m = multiplierRef.current;
      setSlotState(slot, {
        winMultiplier: m,
        winAmount: Math.round(bk.betAmount * m * 100) / 100,
      });
      if (bk.cashOutTimer) clearTimeout(bk.cashOutTimer);
      bk.cashOutTimer = setTimeout(() => {
        bk.cashOutInFlight = false;
        bk.cashOutPressed = false;
        setSlotState(slot, { cashingOut: false });
        setMessage("Cash-out is taking longer than usual — tap again to retry");
      }, CASHOUT_TIMEOUT_MS);
      senderRef.current?.send({ type: "cash_out", slot }, "cash-out");
    },
    [setSlotState]
  );

  const placeBet = useCallback(
    (slot: Slot, amount: number, ref: string) => {
      const bk = slotsRef.current[slot];
      if (bk.pending) return;
      if (walletStatus === "loading") {
        toast.error("Loading your balance…");
        return;
      }
      if (!Number.isFinite(amount) || amount <= 0) {
        toast.error("Enter a valid bet amount");
        return;
      }
      if (amount > MAX_BET) {
        toast.error(`Maximum bet is ${formatMoney(MAX_BET)}`);
        return;
      }
      if (balance !== null && amount > balance) {
        toast.error("Insufficient balance");
        return;
      }
      const amt = Math.floor(amount);
      bk.betAmount = amt;
      const pending = {
        amount: amt,
        ref,
        timer: null as null | ReturnType<typeof setTimeout>,
      };
      bk.pending = pending;
      bk.betPlaced = true;
      setSlotState(slot, { placingBet: true, betPlaced: true });
      // The NexBet65 wallet is authoritative: the game server verifies the ticket,
      // debits via /api/internal/settle, then acks with `bet_accepted` (or
      // rejects with `error`). The client records no money itself.
      pending.timer = setTimeout(() => {
        cancelBetPending(slot, false, "Bet not confirmed — please try again");
      }, BET_TIMEOUT_MS);
      senderRef.current?.send({ type: "place_bet", slot, amount: amt, ref }, "bet");
    },
    [walletStatus, balance, cancelBetPending, setSlotState]
  );

  const placeBetA = useCallback((amount: number, ref: string) => placeBet("a", amount, ref), [placeBet]);
  const placeBetB = useCallback((amount: number, ref: string) => placeBet("b", amount, ref), [placeBet]);
  const cashOutA = useCallback(() => cashOut("a"), [cashOut]);
  const cashOutB = useCallback(() => cashOut("b"), [cashOut]);

  const connect = useCallback(() => {
    let cancelled = false;
    fetch("/api/aviator/ticket", { method: "POST", cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("ticket failed"))))
      .then((data: { ticket: string }) => {
        if (cancelled) return;
        const url = new URL(WS_URL);
        url.searchParams.set("ticket", data.ticket);
        const ws = new WebSocket(url.toString());
        wsRef.current = ws;

        ws.onopen = () => senderRef.current?.markOpen();
        ws.onclose = () => {
          senderRef.current?.markClosed();
          if (reconnectRef.current) {
            setTimeout(connect, 2000);
          }
        };
        ws.onerror = () => ws.close();

        ws.onmessage = handleServerMessage;
      })
      .catch(() => {
        if (!cancelled && reconnectRef.current) {
          setTimeout(connect, 2000);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleServerMessage(event: MessageEvent<string>) {
    const data = JSON.parse(event.data) as ServerMessage;
    switch (data.type) {
        case "welcome":
          setRoundState(data.round?.state ?? "betting");
          roundStateRef.current = data.round?.state ?? "betting";
          setMultiplier(data.round?.multiplier ?? 1.0);
          multiplierRef.current = data.round?.multiplier ?? 1.0;
          setServerSeedHash(data.round?.serverSeedHash ?? null);
          if (data.chatLog) {
            for (const m of data.chatLog) lastChatIdsRef.current.add(m.id);
            setChatLog(data.chatLog.slice(-50));
          }
          if ((data.round?.state ?? "betting") === "betting") {
            bettingEndsAtRef.current = Date.now() + BETTING_WINDOW_MS;
            setTimeLeft(BETTING_WINDOW_MS / 1000);
          }
          break;
        case "round_betting":
          setRoundState("betting");
          roundStateRef.current = "betting";
          setMultiplier(1.0);
          multiplierRef.current = 1.0;
          resetRoundSlots();
          for (const s of SLOTS) {
            slotsRef.current[s] = { ...EMPTY_SLOT, betAmount: slotsRef.current[s].betAmount };
            cancelCashOut(s);
            cancelBetPending(s, false, "");
          }
          setCrashPoint(null);
          setServerSeedHash(data.serverSeedHash ?? null);
          const windowMs = data.bettingWindowMs ?? BETTING_WINDOW_MS;
          bettingEndsAtRef.current = Date.now() + windowMs;
          setTimeLeft(windowMs / 1000);
          setMessage("Place your bet…");
          break;
        case "round_start":
          setRoundState("running");
          roundStateRef.current = "running";
          setMessage("");
          break;
        case "tick":
          setMultiplier(data.multiplier ?? 1.0);
          multiplierRef.current = data.multiplier ?? 1.0;
          break;
        case "crash": {
          setRoundState("crashed");
          roundStateRef.current = "crashed";
          // If a cash-out was still in flight when the round crashed (no
          // success ack yet), it was never settled — drop the optimistic win.
          const wasInFlight: Slot[] = [];
          for (const s of SLOTS) {
            slotsRef.current[s].cashOutPressed = false;
            if (slotsRef.current[s].cashOutInFlight) wasInFlight.push(s);
            cancelCashOut(s);
            // a lost ack doesn't mean the bet wasn't accepted — keep betPlaced
            // so the "Crashed — bet lost" overlay reflects reality.
            cancelBetPending(s, false, "");
          }
          for (const s of wasInFlight) {
            setSlotState(s, { winAmount: null, winMultiplier: null });
          }
          if (typeof data.crashPoint === "number") {
            setHistory((h) => [data.crashPoint as number, ...h].slice(0, 12));
            setCrashPoint(data.crashPoint);
            setMessage(`Crashed at ${data.crashPoint.toFixed(2)}x`);
            let lostAny = false;
            for (const s of SLOTS) {
              const bk = slotsRef.current[s];
              if (bk.betPlaced && !bk.cashedOut && !bk.lossRecorded) {
                bk.lossRecorded = true;
                lostAny = true;
                pushMyHistory({
                  kind: "loss",
                  amount: bk.betAmount,
                  multiplier: data.crashPoint,
                });
              }
            }
            if (lostAny) void refresh();
          }
          break;
        }
        case "bet_accepted": {
          const slot = resolveSlot(data.slot);
          const bk = slotsRef.current[slot];
          if (bk.pending) {
            if (bk.pending.timer) clearTimeout(bk.pending.timer);
            bk.pending = null;
            setSlotState(slot, { placingBet: false });
          }
          bk.betPlaced = true;
          setSlotState(slot, { betPlaced: true });
          pushMyHistory({ kind: "bet", amount: bk.betAmount });
          void refresh();
          break;
        }
        case "cash_out_success": {
          const slot = resolveSlot(data.slot);
          const bk = slotsRef.current[slot];
          cancelCashOut(slot);
          bk.cashOutPressed = false;
          // A cash-out success implies the bet went through — drop any
          // lingering unacked bet pending so its timeout can't flip the UI.
          cancelBetPending(slot, false, "");
          if (typeof data.multiplier === "number") {
            bk.cashedOut = true;
            // Reconcile the win with the server's authoritative multiplier.
            const payout =
              data.payout ??
              Math.round(bk.betAmount * data.multiplier * 100) / 100;
            setSlotState(slot, {
              cashedOut: data.multiplier,
              winMultiplier: data.multiplier,
              winAmount: payout,
            });
            pushMyHistory({ kind: "win", amount: payout, multiplier: data.multiplier });
            void refresh();
          }
          if (data.message) setMessage(data.message);
          break;
        }
        case "error":
          setMessage(data.message ?? "");
          for (const s of SLOTS) {
            cancelCashOut(s);
            if (slotsRef.current[s].pending) {
              cancelBetPending(s, true, data.message ?? "Bet rejected");
            }
          }
          void refresh();
          break;
        case "chat_message": {
          const id = data.id ?? "";
          if (id && lastChatIdsRef.current.has(id)) break;
          if (id) {
            lastChatIdsRef.current.add(id);
            if (lastChatIdsRef.current.size > 200) {
              lastChatIdsRef.current = new Set(
                Array.from(lastChatIdsRef.current).slice(-100)
              );
            }
          }
          setChatLog((c) =>
            [
              ...c,
              {
                id,
                username: data.username ?? "Guest",
                text: data.text ?? "",
                at: data.at ?? Date.now(),
              },
            ].slice(-50)
          );
          break;
        }
        default:
          break;
      }
  }

  useEffect(() => {
    senderRef.current = createSafeSender({
      getWs: () => wsRef.current,
      onStatusChange: setConnected,
    });
    const watchdog = setInterval(() => {
      senderRef.current?.sync();
    }, 2000);
    return () => {
      clearInterval(watchdog);
      senderRef.current?.dispose();
      senderRef.current = null;
    };
  }, []);

  useEffect(() => {
    reconnectRef.current = true;
    connect();
    return () => {
      reconnectRef.current = false;
      wsRef.current?.close();
    };
  }, [connect]);

  useEffect(() => {
    if (roundState !== "betting") return;
    const iv = setInterval(() => {
      setTimeLeft(Math.max(0, (bettingEndsAtRef.current - Date.now()) / 1000));
    }, 100);
    return () => clearInterval(iv);
  }, [roundState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dpr = Math.min(
        typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
        2
      );
      canvas.width = 800 * dpr;
      canvas.height = 450 * dpr;
    }

    clouds.current = Array.from({ length: 7 }, () => ({
      x: Math.random() * 800,
      y: Math.random() * 220 + 30,
      speed: Math.random() * 0.4 + 0.15,
      scale: Math.random() * 0.7 + 0.5,
    }));

    speedLines.current = Array.from({ length: 15 }, () => ({
      x: Math.random() * 900,
      y: Math.random() * 450,
      length: Math.random() * 40 + 20,
      speed: Math.random() * 8 + 12,
      alpha: Math.random() * 0.4 + 0.1,
    }));
  }, []);

  useEffect(() => {
    if (roundState === "crashed" && prevStatusRef.current !== "crashed") {
      const currentX = planePos.current.x;
      const currentY = planePos.current.y;
      const flightAngle = -0.62;

      flewAwayRef.current = {
        active: true,
        startX: currentX,
        startY: currentY,
        startTime: Date.now(),
        angle: flightAngle,
        currentX,
        currentY,
      };

      particles.current.push({
        x: currentX,
        y: currentY,
        vx: 0,
        vy: 0,
        radius: 12,
        color: "rgba(255, 176, 32, 0.95)",
        alpha: 1.0,
        life: 25,
        maxLife: 25,
        type: "shockwave",
      });

      for (let i = 0; i < 40; i++) {
        const spread = (Math.random() - 0.5) * 1.3;
        const speed = Math.random() * 16 + 8;
        particles.current.push({
          x: currentX,
          y: currentY,
          vx: Math.cos(flightAngle + Math.PI + spread) * speed,
          vy: Math.sin(flightAngle + Math.PI + spread) * speed,
          radius: Math.random() * 6 + 3,
          color: i % 2 === 0 ? "#ff4d3d" : "#ff8a3d",
          alpha: 1.0,
          life: Math.random() * 22 + 15,
          maxLife: 37,
          type: "flame",
        });
      }
    } else if (roundState === "betting") {
      flewAwayRef.current.active = false;
      particles.current = [];
    }

    prevStatusRef.current = roundState;
  }, [roundState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const canvasWidth = 800;
    const canvasHeight = 450;
    const windowSec = BETTING_WINDOW_MS / 1000;

    let localOffset = 0;
    let raf = 0;

    const render = () => {
      ctx.setTransform(canvas.width / canvasWidth, 0, 0, canvas.height / canvasHeight, 0, 0);
      ctx.fillStyle = "#0a0d14";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      const speedModifier =
        roundState === "running"
          ? Math.min(12, 1.5 + (multiplier - 1) * 0.95)
          : roundState === "crashed" && flewAwayRef.current.active
            ? 18
            : 0.5;

      localOffset = (localOffset + speedModifier) % 40;
      gridOffset.current = localOffset;

      ctx.strokeStyle = "rgba(31, 41, 55, 0.4)";
      ctx.lineWidth = 1;
      for (let x = -40; x < canvasWidth + 40; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x - gridOffset.current, 0);
        ctx.lineTo(x - gridOffset.current, canvasHeight);
        ctx.stroke();
      }
      for (let y = 0; y < canvasHeight; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
      }

      if (
        (roundState === "running" && multiplier > 1.5) ||
        (roundState === "crashed" && flewAwayRef.current.active)
      ) {
        ctx.lineWidth = roundState === "crashed" ? 2.5 : 1.5;
        speedLines.current.forEach((line) => {
          line.x -= line.speed * (roundState === "crashed" ? 2.8 : speedModifier * 0.6);
          if (line.x < -100) {
            line.x = canvasWidth + Math.random() * 100;
            line.y = Math.random() * canvasHeight;
          }

          const grad = ctx.createLinearGradient(line.x, line.y, line.x + line.length, line.y);
          grad.addColorStop(0, "rgba(255, 77, 61, 0)");
          grad.addColorStop(
            1,
            roundState === "crashed" ? "rgba(255, 138, 61, 0.7)" : "rgba(255, 255, 255, 0.3)"
          );

          ctx.strokeStyle = grad;
          ctx.beginPath();
          ctx.moveTo(line.x, line.y);
          ctx.lineTo(line.x + line.length, line.y - line.length * 0.2);
          ctx.stroke();
        });
      }

      ctx.fillStyle = "rgba(51, 65, 85, 0.18)";
      clouds.current.forEach((cloud) => {
        const cloudSpeed = cloud.speed * speedModifier;
        cloud.x -= cloudSpeed;
        if (cloud.x < -160) {
          cloud.x = canvasWidth + 60;
          cloud.y = Math.random() * 220 + 30;
        }

        ctx.beginPath();
        const cx = cloud.x;
        const cy = cloud.y;
        const s = cloud.scale;
        ctx.arc(cx, cy, 32 * s, 0, Math.PI * 2);
        ctx.arc(cx + 28 * s, cy - 12 * s, 38 * s, 0, Math.PI * 2);
        ctx.arc(cx + 56 * s, cy, 32 * s, 0, Math.PI * 2);
        ctx.arc(cx + 28 * s, cy + 16 * s, 28 * s, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      });

      if (roundState === "betting") {
        planePos.current = {
          x: 90,
          y: 370 + Math.sin(Date.now() * 0.004) * 2.5,
          angle: -0.05,
        };
      } else if (roundState === "running") {
        const progress = Math.min(1.0, (multiplier - 1) / 8);
        const px = 90 + progress * 530;
        const py = 370 - Math.pow(progress, 0.55) * 290 + Math.sin(Date.now() * 0.015) * 3;
        const currentAngle = -Math.min(0.58, 0.12 + (multiplier - 1) * 0.055);

        planePos.current = { x: px, y: py, angle: currentAngle };
      } else if (roundState === "crashed" && flewAwayRef.current.active) {
        const elapsedSec = (Date.now() - flewAwayRef.current.startTime) / 1000;
        const initialSpeed = 450;
        const acceleration = 5500;
        const distance =
          initialSpeed * elapsedSec + 0.5 * acceleration * Math.pow(elapsedSec, 2.3);

        const flightAngle = flewAwayRef.current.angle;
        const px = flewAwayRef.current.startX + Math.cos(flightAngle) * distance;
        const py = flewAwayRef.current.startY + Math.sin(flightAngle) * distance;

        flewAwayRef.current.currentX = px;
        flewAwayRef.current.currentY = py;

        planePos.current = {
          x: px,
          y: py,
          angle: flightAngle - Math.min(0.35, elapsedSec * 0.6),
        };

        if (px < canvasWidth + 180 && py > -180) {
          for (let i = 0; i < 3; i++) {
            particles.current.push({
              x: px - Math.cos(flightAngle) * 40 + (Math.random() - 0.5) * 8,
              y: py - Math.sin(flightAngle) * 40 + (Math.random() - 0.5) * 8,
              vx: -Math.cos(flightAngle) * (Math.random() * 10 + 5),
              vy: -Math.sin(flightAngle) * (Math.random() * 10 + 5),
              radius: Math.random() * 5 + 2,
              color: i === 0 ? "#ff8a3d" : i === 1 ? "#ffb020" : "#ff4d3d",
              alpha: 0.9,
              life: 18,
              maxLife: 18,
              type: "flame",
            });
          }
        }
      }

      if (roundState === "running" || roundState === "crashed") {
        const px =
          roundState === "crashed"
            ? Math.min(canvasWidth, flewAwayRef.current.startX)
            : planePos.current.x;
        const py =
          roundState === "crashed" ? flewAwayRef.current.startY : planePos.current.y;

        ctx.beginPath();
        ctx.moveTo(90, 370);
        ctx.quadraticCurveTo(90 + (px - 90) * 0.3, 370, px, py);

        const trailGrad = ctx.createLinearGradient(90, 370, px, py);
        trailGrad.addColorStop(0, "rgba(255, 77, 61, 0.05)");
        trailGrad.addColorStop(0.5, "rgba(255, 176, 32, 0.45)");
        trailGrad.addColorStop(1, "#ff4d3d");

        ctx.strokeStyle = trailGrad;
        ctx.lineWidth = 4;
        ctx.shadowColor = "rgba(255, 77, 61, 0.6)";
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.moveTo(90, 370);
        ctx.quadraticCurveTo(90 + (px - 90) * 0.3, 370, px, py);
        ctx.lineTo(px, 370);
        ctx.closePath();

        const areaGrad = ctx.createLinearGradient(90, 150, 90, 370);
        areaGrad.addColorStop(0, "rgba(255, 77, 61, 0.16)");
        areaGrad.addColorStop(1, "rgba(255, 77, 61, 0.0)");
        ctx.fillStyle = areaGrad;
        ctx.fill();
      }

      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(40, 370);
      ctx.lineTo(760, 370);
      ctx.stroke();

      particles.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.alpha = Math.max(0, p.life / p.maxLife);

        ctx.save();
        if (p.type === "shockwave") {
          p.radius += 4;
          ctx.strokeStyle = `rgba(255, 176, 32, ${p.alpha * 0.8})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      particles.current = particles.current.filter((p) => p.life > 0);

      const shouldDrawPlane =
        roundState !== "crashed" ||
        (roundState === "crashed" &&
          planePos.current.x < canvasWidth + 180 &&
          planePos.current.y > -180);

      if (shouldDrawPlane) {
        const px = planePos.current.x;
        const py = planePos.current.y;
        const tiltAngle = planePos.current.angle;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(tiltAngle);

        const scale = 1.45;
        ctx.scale(scale, scale);

        ctx.fillStyle = "#ff4d3d";
        ctx.strokeStyle = "#c73a2d";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-2, -10);
        ctx.lineTo(-24, -25);
        ctx.lineTo(-12, -26);
        ctx.lineTo(12, -10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#4de8ff";
        ctx.shadowColor = "#4de8ff";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(-18, -25.5, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, 3);
        ctx.lineTo(-15, -23);
        ctx.stroke();

        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(22, 5);
        ctx.lineTo(20, 13);
        ctx.stroke();

        ctx.fillStyle = "#0f172a";
        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(20, 14, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-4, 6);
        ctx.lineTo(-8, 15);
        ctx.stroke();

        ctx.fillStyle = "#0f172a";
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(-8, 16, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        const fuseGrad = ctx.createLinearGradient(0, -12, 0, 10);
        fuseGrad.addColorStop(0, "#ffffff");
        fuseGrad.addColorStop(0.3, "#f8fafc");
        fuseGrad.addColorStop(0.55, "#ff4d3d");
        fuseGrad.addColorStop(1, "#c73a2d");

        ctx.fillStyle = fuseGrad;
        ctx.strokeStyle = "#a33426";
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.moveTo(38, 1);
        ctx.quadraticCurveTo(24, -8, 12, -11);
        ctx.lineTo(-12, -10);
        ctx.quadraticCurveTo(-26, -6, -38, -3);
        ctx.lineTo(-38, 2);
        ctx.quadraticCurveTo(-15, 8, 22, 6);
        ctx.quadraticCurveTo(32, 5, 38, 1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffb020";
        ctx.beginPath();
        ctx.moveTo(35, 1);
        ctx.lineTo(-36, -1);
        ctx.lineTo(-36, 1);
        ctx.lineTo(34, 3);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#ff4d3d";
        ctx.strokeStyle = "#c73a2d";
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.moveTo(-22, -6);
        ctx.lineTo(-36, -26);
        ctx.lineTo(-28, -26);
        ctx.lineTo(-38, -3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(-31, -17);
        ctx.lineTo(-34, -22);
        ctx.lineTo(-30, -22);
        ctx.lineTo(-28, -17);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#c73a2d";
        ctx.beginPath();
        ctx.moveTo(-30, -3);
        ctx.lineTo(-38, -8);
        ctx.lineTo(-34, -8);
        ctx.lineTo(-28, -3);
        ctx.closePath();
        ctx.fill();

        const glassGrad = ctx.createLinearGradient(10, -10, 22, -2);
        glassGrad.addColorStop(0, "rgba(77, 232, 255, 0.95)");
        glassGrad.addColorStop(1, "rgba(164, 240, 255, 0.9)");

        ctx.fillStyle = glassGrad;
        ctx.strokeStyle = "#0891b2";
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(12, -10);
        ctx.lineTo(21, -4);
        ctx.lineTo(21, 1);
        ctx.lineTo(10, 1);
        ctx.lineTo(10, -10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(8, -9);
        ctx.lineTo(-5, -8);
        ctx.lineTo(-5, 0);
        ctx.lineTo(8, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(14, -8);
        ctx.lineTo(19, -4);
        ctx.stroke();

        const nearWingGrad = ctx.createLinearGradient(-5, -10, -15, 22);
        nearWingGrad.addColorStop(0, "#ffffff");
        nearWingGrad.addColorStop(0.3, "#f1f5f9");
        nearWingGrad.addColorStop(0.6, "#ff4d3d");
        nearWingGrad.addColorStop(1, "#c73a2d");

        ctx.fillStyle = nearWingGrad;
        ctx.strokeStyle = "#c73a2d";
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.moveTo(10, -10);
        ctx.lineTo(-12, 22);
        ctx.lineTo(-2, 22);
        ctx.lineTo(16, -10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ff4d3d";
        ctx.shadowColor = "#ff4d3d";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(-8, 22, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(2, 4);
        ctx.lineTo(-5, 14);
        ctx.stroke();

        const spinnerGrad = ctx.createLinearGradient(38, -2, 44, 2);
        spinnerGrad.addColorStop(0, "#ffb020");
        spinnerGrad.addColorStop(1, "#ffe08a");

        ctx.fillStyle = spinnerGrad;
        ctx.strokeStyle = "#b45309";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(38, -2.5);
        ctx.quadraticCurveTo(44, 0, 44, 1);
        ctx.quadraticCurveTo(44, 2, 38, 4.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        const propSpeed = (Date.now() * 0.04) % (Math.PI * 2);
        const propRadius = 22;

        ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(42, 1, 3.5, propRadius, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        const bladeY1 = Math.sin(propSpeed) * propRadius;
        const bladeX1 = Math.cos(propSpeed) * 2;
        ctx.moveTo(42, 1);
        ctx.lineTo(42 + bladeX1, 1 - bladeY1);
        ctx.moveTo(42, 1);
        ctx.lineTo(42 - bladeX1, 1 + bladeY1);
        ctx.stroke();

        ctx.fillStyle = "#ffb020";
        ctx.beginPath();
        ctx.arc(42 + bladeX1, 1 - bladeY1, 2, 0, Math.PI * 2);
        ctx.arc(42 - bladeX1, 1 + bladeY1, 2, 0, Math.PI * 2);
        ctx.fill();

        if (roundState === "running" || roundState === "crashed") {
          const exhaustGlow = ctx.createRadialGradient(28, 6, 1, 28, 6, 12);
          exhaustGlow.addColorStop(0, "rgba(255, 138, 61, 0.5)");
          exhaustGlow.addColorStop(1, "rgba(255, 138, 61, 0)");
          ctx.fillStyle = exhaustGlow;
          ctx.beginPath();
          ctx.arc(28, 6, 12, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      if (roundState === "betting") {
        ctx.fillStyle = "rgba(10, 13, 20, 0.75)";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.font = '600 22px "Inter", "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("NEXT ROUND STARTS IN", canvasWidth / 2, canvasHeight / 2 - 35);

        const radius = 52;
        const cx = canvasWidth / 2;
        const cy = canvasHeight / 2 + 40;

        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();

        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + (Math.max(0, timeLeft) / windowSec) * (Math.PI * 2);
        ctx.strokeStyle = "#ff4d3d";
        ctx.lineWidth = 8;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.stroke();
        ctx.lineCap = "butt";

        ctx.font = '700 34px "Inter", "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`${Math.max(0, timeLeft).toFixed(1)}s`, cx, cy + 1);
      } else if (roundState === "running") {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.font = '800 72px "Inter", "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "rgba(255, 255, 255, 0.25)";
        ctx.shadowBlur = 18;
        ctx.fillText(`${multiplier.toFixed(2)}x`, canvasWidth / 2, 115);
        ctx.shadowBlur = 0;
      } else if (roundState === "crashed") {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const crashElapsed = (Date.now() - flewAwayRef.current.startTime) / 1000;
        const scalePulse = Math.min(1.0, crashElapsed * 4);

        ctx.save();
        ctx.translate(canvasWidth / 2, 115);
        ctx.scale(scalePulse, scalePulse);

        ctx.font = '900 64px "Inter", "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = "#ff4d3d";
        ctx.shadowColor = "rgba(255, 77, 61, 0.6)";
        ctx.shadowBlur = 24;
        ctx.fillText("FLEW AWAY!", 0, 0);
        ctx.shadowBlur = 0;

        ctx.font = '700 34px "Inter", "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = "#cbd5e1";
        ctx.fillText(
          `Crashed @ ${(crashPoint ?? multiplier).toFixed(2)}x`,
          0,
          60
        );

        ctx.restore();
      }

      raf = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(raf);
  }, [multiplier, roundState, timeLeft, crashPoint]);

  return (
    <div className="space-y-4">
      <div className="lg:grid lg:grid-cols-4 lg:items-start lg:gap-4">
        <div className="lg:col-span-3 lg:space-y-4">
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0a0d14] shadow-2xl sm:aspect-[16/9]">
            <canvas
              ref={canvasRef}
              width={800}
              height={450}
              className="block h-full w-full object-cover"
            />

            <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-white/60 backdrop-blur-sm">
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  roundState === "running"
                    ? "animate-pulse bg-red-500"
                    : roundState === "betting"
                      ? "animate-ping bg-amber-500"
                      : "bg-red-600"
                )}
              />
              <span className="font-semibold uppercase tracking-wider">
                {roundState === "running"
                  ? "Active Flight"
                  : roundState === "betting"
                    ? "Betting Open"
                    : "Crashed"}
              </span>
            </div>

            {roundState === "running" && !hasCashedOut && (
              <div className="absolute right-4 top-4 z-10 flex animate-pulse items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 font-instrument text-xs font-semibold text-red-400 backdrop-blur-sm">
                CLIMBING SPEED: {Math.max(100, Math.floor(multiplier * 180))} km/h
              </div>
            )}

            {hasCashedOut && winTotal > 0 && (
              <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-lg border border-brand/30 bg-black/70 px-3 py-1.5 text-right backdrop-blur">
                <div className="font-instrument text-sm font-black text-brand">
                  +{formatMoney(winTotal)}
                </div>
                <div className="font-instrument text-[10px] text-white/40">
                  won this round
                </div>
              </div>
            )}
          </div>

          <div className="flex min-h-[24px] items-center justify-center text-center font-instrument text-sm text-white/50">
            {message || "Waiting for the next round…"}
          </div>

          <div aria-live="polite" className="sr-only">
            {roundState === "betting" && "Betting is open for the next round."}
            {roundState === "running" && "The round has started, the multiplier is climbing."}
            {roundState === "crashed" &&
              `The round crashed at ${(crashPoint ?? 0).toFixed(2)} times.`}
            {slots.a.cashedOut !== null &&
              `Console A cashed out at ${slots.a.cashedOut.toFixed(2)} times.`}
            {slots.b.cashedOut !== null &&
              `Console B cashed out at ${slots.b.cashedOut.toFixed(2)} times.`}
          </div>
        </div>

        <div className="mt-4 lg:mt-0 lg:col-span-1">
          <div className="space-y-3">
            <AviatorBetConsole
              slot="a"
              connected={connected}
              roundState={roundState}
              multiplier={multiplier}
              balance={balance}
              walletStatus={walletStatus}
              betState={slots.a}
              onPlaceBet={placeBetA}
              onCashOut={cashOutA}
            />
            <AviatorBetConsole
              slot="b"
              connected={connected}
              roundState={roundState}
              multiplier={multiplier}
              balance={balance}
              walletStatus={walletStatus}
              betState={slots.b}
              onPlaceBet={placeBetB}
              onCashOut={cashOutB}
            />
          </div>

          <div className="mt-4 flex gap-2 rounded-lg border border-brand/20 bg-brand/5 p-3 text-[11px] text-white/50">
            <AlertCircle size={14} className="mt-0.5 shrink-0 text-brand/70" />
            <div>
              <span className="font-semibold text-brand">PRO TIP:</span> Place a bet before
              the round starts. Once the flight begins, the payout scales up with the multiplier.
              Click <strong className="text-brand">CASH OUT</strong> at any point to secure
              your payout before the plane randomly flies away!
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          <div className="rounded-2xl border border-white/5 bg-[#111] p-4">
            <p className="font-instrument text-xs uppercase tracking-widest text-brand">
              Provably fair
            </p>
            <p className="mt-1.5 break-all text-xs leading-relaxed text-white/50">
              Round seed hash:{" "}
              <span className="font-instrument text-white">{serverSeedHash?.slice(0, 24)}…</span>
              <br />
              The full server seed is revealed after each crash so the result can
              be independently verified.
            </p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#111] p-4">
            <p className="font-instrument text-xs uppercase tracking-widest text-brand">
              Recent crashes
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {history.length === 0 && (
                <span className="text-xs text-white/50">No rounds yet</span>
              )}
              {history.map((crash, i) => (
                <span
                  key={`${crash}-${i}`}
                  className={cn(
                    "rounded px-2 py-0.5 font-instrument text-xs tabular-nums",
                    crash >= 2
                      ? "bg-[#ffb020]/10 text-[#ffb020]"
                      : "bg-[#ff4d3d]/10 text-[#ff4d3d]"
                  )}
                >
                  {crash.toFixed(2)}x
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <LiveLobby
            history={myHistory}
            chatLog={chatLog}
            connected={connected}
            username={username}
            currentBet={
              slotsRef.current.a.betPlaced || slotsRef.current.b.betPlaced
                ? {
                    amount:
                      (slotsRef.current.a.betPlaced
                        ? slotsRef.current.a.betAmount
                        : 0) +
                      (slotsRef.current.b.betPlaced
                        ? slotsRef.current.b.betAmount
                        : 0),
                    status:
                      slotsRef.current.a.cashedOut || slotsRef.current.b.cashedOut
                        ? "won"
                        : roundState === "crashed"
                          ? "lost"
                          : "placed",
                  }
                : null
            }
            multiplier={multiplier}
            onSendChat={sendChat}
          />
        </div>
      </div>
    </div>
  );
}
