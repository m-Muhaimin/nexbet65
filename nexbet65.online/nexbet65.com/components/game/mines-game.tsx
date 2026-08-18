"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bomb, Gem, RotateCcw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { MinesParticles } from "@/components/game/mines-particles";
import { MinesStats } from "@/components/game/mines-stats";
import { MinesTile } from "@/components/game/mines-tile";
import { formatMoney } from "@/lib/games";
import { minesAudio } from "@/lib/mines-audio";
import { cn } from "@/lib/utils";
import { useWallet } from "@/lib/wallet-store";

type Status = "idle" | "playing" | "ended";

interface StartResponse {
  roundId: string;
  gridSize: number;
  mineCount: number;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  balance: number;
}

interface RevealResponse {
  result: "safe" | "mine" | "cashout";
  revealed?: number[];
  multiplier: number;
  nextMultiplier?: number;
  mineLayout?: number[];
  payout?: number;
  balance?: number;
}

interface CashoutResponse {
  result: "cashout";
  multiplier: number;
  payout: number;
  balance: number;
  mineLayout: number[];
}

const RTP = 0.97;
const GRID = 25;
const MINE_PRESETS = [1, 3, 5, 10, 24];

// Client-side display copy of the combinatorial multiplier (matches lib/mines.ts).
function calcMult(k: number, m: number): number {
  if (k === 0) return 1;
  let p = 1;
  for (let i = 0; i < k; i++) p *= (GRID - m - i) / (GRID - i);
  return Math.floor((RTP / p) * 100) / 100;
}

async function postJson(url: string, body: unknown): Promise<any> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

export function MinesGame() {
  const wallet = useWallet();

  const [balance, setBalance] = useState<number>(0);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [mineCount, setMineCount] = useState<number>(3);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1);
  const [nextMultiplier, setNextMultiplier] = useState<number>(calcMult(1, 3));
  const [status, setStatus] = useState<Status>("idle");
  const [lastResult, setLastResult] = useState<"win" | "loss" | null>(null);
  const [payout, setPayout] = useState<number>(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [particleIntensity, setParticleIntensity] = useState<"low" | "medium" | "high" | null>(null);

  // Provably fair metadata for the strip under the board.
  const [fairness, setFairness] = useState<{ hash: string; clientSeed: string; nonce: number } | null>(null);

  // Autobet state.
  const [betMode, setBetMode] = useState<"manual" | "auto">("manual");
  const [autoRounds, setAutoRounds] = useState(0);
  const [autoTarget, setAutoTarget] = useState(0);
  const [autoStopLoss, setAutoStopLoss] = useState(0);
  const [autoRound, setAutoRound] = useState(0);
  const [autoStartBalance, setAutoStartBalance] = useState(0);
  const [isAutoBetting, setIsAutoBetting] = useState(false);

  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoBetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  // Latest revealed indices so the cascading reveal never reads a stale array.
  const revealedRef = useRef<number[]>([]);
  // Live round refs so the unmount/unload handler never reads stale state.
  const roundIdRef = useRef<string | null>(null);
  const statusRef = useRef<Status>("idle");

  // Seed local balance from the wallet store once it loads.
  useEffect(() => {
    if (wallet.balance !== null) setBalance(wallet.balance);
  }, [wallet.balance]);

  useEffect(() => {
    revealedRef.current = revealedIndices;
  }, [revealedIndices]);

  useEffect(() => {
    roundIdRef.current = roundId;
  }, [roundId]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Refund the in-flight round if the user navigates away or closes the tab, so
  // an abandoned bet never silently vanishes. Server-side sweep is the backstop.
  useEffect(() => {
    const abandonActiveRound = () => {
      const id = roundIdRef.current;
      if (!id || statusRef.current !== "playing") return;
      void fetch("/api/mines/abandon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundId: id }),
        keepalive: true,
      });
    };

    const onUnload = () => abandonActiveRound();
    const onPageHide = () => abandonActiveRound();
    window.addEventListener("beforeunload", onUnload);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.removeEventListener("beforeunload", onUnload);
      window.removeEventListener("pagehide", onPageHide);
      abandonActiveRound();
      mountedRef.current = false;
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
      if (autoBetTimeoutRef.current) clearTimeout(autoBetTimeoutRef.current);
    };
  }, []);

  const startGame = useCallback(async () => {
    if (betAmount > balance || betAmount <= 0) return;
    minesAudio.playClick();
    setBusy(true);
    setError(null);
    try {
      const data: StartResponse = await postJson("/api/mines/start", {
        amount: betAmount,
        mineCount,
        clientSeed: "user-seed",
      });

      setRoundId(data.roundId);
      setBalance(data.balance);
      setRevealedIndices([]);
      setMinePositions([]);
      setCurrentMultiplier(1);
      setNextMultiplier(calcMult(1, mineCount));
      setStatus("playing");
      setLastResult(null);
      setPayout(0);
      setParticleIntensity(null);
      setFairness({ hash: data.serverSeedHash, clientSeed: data.clientSeed, nonce: data.nonce });
      void wallet.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start round");
    } finally {
      setBusy(false);
    }
  }, [betAmount, mineCount, balance, wallet]);

  // Reveal all remaining tiles one by one (50ms apart) after a round ends.
  const cascadingReveal = useCallback(() => {
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    const currentRevealed = revealedRef.current || [];
    const remaining = Array.from({ length: GRID }, (_, i) => i).filter(
      (i) => !currentRevealed.includes(i)
    );

    let index = 0;
    const revealNext = () => {
      if (index >= remaining.length) return;
      const tile = remaining[index];
      index++;
      setRevealedIndices((prev) => {
        if (prev.includes(tile)) return prev;
        return [...prev, tile];
      });
      revealTimeoutRef.current = setTimeout(revealNext, 50);
    };

    revealNext();
  }, []);

  const triggerCelebration = useCallback(
    (winAmount: number) => {
      const multiplier = winAmount / betAmount;
      if (multiplier >= 10) setParticleIntensity("high");
      else if (multiplier >= 3) setParticleIntensity("medium");
      else setParticleIntensity("low");
      minesAudio.playCashout();
    },
    [betAmount]
  );

  const scheduleNextAutoBet = useCallback(
    (currentBalance: number) => {
      const totalProfit = currentBalance - autoStartBalance;
      if (autoTarget > 0 && totalProfit >= autoTarget) {
        setIsAutoBetting(false);
        return;
      }
      if (autoStopLoss > 0 && totalProfit <= -autoStopLoss) {
        setIsAutoBetting(false);
        return;
      }
      if (autoRounds > 0 && autoRound >= autoRounds) {
        setIsAutoBetting(false);
        return;
      }

      setAutoRound((r) => r + 1);
      autoBetTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) void startGame();
      }, 2500);
    },
    [autoTarget, autoStopLoss, autoRounds, autoRound, autoStartBalance, startGame]
  );

  const revealTile = useCallback(
    async (index: number) => {
      if (status !== "playing" || revealedRef.current.includes(index) || busy) return;

      setBusy(true);
      setError(null);
      minesAudio.playClick();

      try {
        const data: RevealResponse = await postJson("/api/mines/reveal", {
          roundId,
          tileIndex: index,
        });

        if (data.result === "mine") {
          minesAudio.playMine();
          setMinePositions(data.mineLayout || []);
          setRevealedIndices((prev) => (prev.includes(index) ? prev : [...prev, index]));
          setStatus("ended");
          setLastResult("loss");
          if (typeof data.balance === "number") setBalance(data.balance);
          toast.error(`You lost ${formatMoney(betAmount)}`);

          setTimeout(() => cascadingReveal(), 450);

          if (isAutoBetting) {
            scheduleNextAutoBet(typeof data.balance === "number" ? data.balance : balance);
          }
        } else {
          minesAudio.playGem(revealedRef.current.length);

          if (data.revealed) {
            setRevealedIndices(data.revealed);
          } else if (data.result === "cashout") {
            setRevealedIndices((prev) => (prev.includes(index) ? prev : [...prev, index]));
          }

          setCurrentMultiplier(data.multiplier);
          setNextMultiplier(data.nextMultiplier || 0);

          if (data.result === "cashout") {
            setMinePositions(data.mineLayout || []);
            const winAmount = data.payout || 0;
            setPayout(winAmount);
            if (typeof data.balance === "number") setBalance(data.balance);
            setStatus("ended");
            setLastResult("win");
            triggerCelebration(winAmount);
            toast.success(`WIN ${formatMoney(winAmount)}`);
            setTimeout(() => cascadingReveal(), 450);
            void wallet.refresh();

            if (isAutoBetting) {
              scheduleNextAutoBet(typeof data.balance === "number" ? data.balance : balance);
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to reveal tile");
      } finally {
        setBusy(false);
      }
    },
    [status, busy, roundId, isAutoBetting, balance, cascadingReveal, triggerCelebration, scheduleNextAutoBet, wallet]
  );

  const cashout = useCallback(async () => {
    if (status !== "playing" || revealedRef.current.length === 0 || busy) return;

    setBusy(true);
    setError(null);
    try {
      const data: CashoutResponse = await postJson("/api/mines/cashout", { roundId });

      setPayout(data.payout);
      setBalance(data.balance);
      setMinePositions(data.mineLayout);
      setStatus("ended");
      setLastResult("win");
      triggerCelebration(data.payout);
      toast.success(`WIN ${formatMoney(data.payout)}`);
      void wallet.refresh();

      setTimeout(() => cascadingReveal(), 450);

      if (isAutoBetting) {
        scheduleNextAutoBet(data.balance);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cashout failed");
      setIsAutoBetting(false);
    } finally {
      setBusy(false);
    }
  }, [status, busy, roundId, isAutoBetting, cascadingReveal, triggerCelebration, scheduleNextAutoBet, wallet]);

  const startAutoBet = useCallback(() => {
    setIsAutoBetting(true);
    setAutoRound(1);
    setAutoStartBalance(balance);
    void startGame();
  }, [balance, startGame]);

  const stopAutoBet = useCallback(() => {
    setIsAutoBetting(false);
    if (autoBetTimeoutRef.current) clearTimeout(autoBetTimeoutRef.current);
  }, []);

  const step1 = calcMult(1, mineCount);
  const step2 = calcMult(2, mineCount);
  const canStart = betAmount > 0 && balance >= betAmount;

  return (
    <div className="space-y-4">
      {particleIntensity && (
        <MinesParticles intensity={particleIntensity} onComplete={() => setParticleIntensity(null)} />
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid lg:grid-cols-4 lg:items-start lg:gap-4">
        {/* Board */}
        <section className="rounded-2xl border border-white/10 bg-card/60 p-4 sm:p-6 lg:col-span-3">
          {/* The grid */}
          <div className="relative mx-auto w-full max-w-xl">
            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {Array.from({ length: GRID }).map((_, i) => (
                <MinesTile
                  key={i}
                  index={i}
                  isRevealed={(revealedIndices || []).includes(i)}
                  isMine={(minePositions || []).includes(i)}
                  status={status}
                  revealedCount={(revealedIndices || []).length}
                  onClick={() => void revealTile(i)}
                />
              ))}
            </div>

            {/* Game over overlay */}
            {status === "ended" && lastResult === "loss" && (
              <div className="fade-in absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-black/75 backdrop-blur-md">
                <div className="pop-in flex flex-col items-center p-8 text-center">
                  <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-red-500/40 bg-red-500/10 shadow-[0_0_40px_rgba(239,68,68,0.25)]">
                    <Bomb className="h-10 w-10 text-red-400" />
                  </div>
                  <h2 className="mb-2 text-4xl font-black tracking-tight text-white">BUST!</h2>
                  <p className="mb-6 max-w-[220px] text-sm text-white/50">
                    You hit a mine and lost {formatMoney(betAmount)}.
                  </p>
                  {!isAutoBetting && (
                    <button
                      type="button"
                      onClick={() => void startGame()}
                      className="flex items-center gap-2 rounded-xl bg-brand px-7 py-3 font-black text-black gold-glow transition-all hover:brightness-110 active:scale-[0.98]"
                    >
                      <RotateCcw className="h-4 w-4" />
                      TRY AGAIN
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Provably fair strip */}
          {fairness && (
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-white/10 pt-3 text-[11px] text-white/40">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-brand" />
                Seed hash <span className="font-mono text-white/60">{fairness.hash.slice(0, 16)}…</span>
              </span>
              <span>
                Client seed <span className="font-mono text-white/60">{fairness.clientSeed}</span>
              </span>
              <span>
                Nonce <span className="font-mono text-white/60">{fairness.nonce}</span>
              </span>
            </div>
          )}
        </section>

        {/* Controls */}
        <aside className="mt-4 space-y-4 lg:mt-0 lg:col-span-1">
          {/* Multiplier steps / status header */}
          <div className="flex min-h-[64px] flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-card/60 p-3">
            {status === "playing" ? (
              <>
                <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/40">
                  {step1.toFixed(2)}×
                </span>
                <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/50">
                  {step2.toFixed(2)}×
                </span>
                <span className="rounded-lg bg-brand px-5 py-2 text-lg font-black text-black gold-glow">
                  {currentMultiplier.toFixed(2)}×
                </span>
                <span className="rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 text-xs font-bold text-brand">
                  {nextMultiplier.toFixed(2)}×
                </span>
                <span className="rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/40">
                  …
                </span>
              </>
            ) : (
              <span className="flex items-center gap-5 rounded-xl border border-white/10 bg-white/5 px-5 py-2">
                <span className="flex items-center gap-2">
                  <Bomb className="h-4 w-4 text-brand" />
                  <span className="text-xs font-bold tracking-widest text-white/70">{mineCount} MINES</span>
                </span>
                <span className="h-5 w-px bg-white/10" />
                <span className="flex items-center gap-2">
                  <Gem className="h-4 w-4 text-brand" />
                  <span className="text-xs font-bold tracking-widest text-white/70">{GRID - mineCount} GEMS</span>
                </span>
              </span>
            )}
          </div>

          <div className="space-y-4 rounded-2xl border border-white/10 bg-card/60 p-4">
            {/* Manual / Auto */}
            <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setBetMode("manual")}
                className={cn(
                  "flex-1 rounded-lg py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                  betMode === "manual"
                    ? "bg-brand text-black shadow-[0_0_15px_rgba(163,230,53,0.35)]"
                    : "text-white/40 hover:text-white"
                )}
              >
                Manual
              </button>
              <button
                type="button"
                onClick={() => setBetMode("auto")}
                className={cn(
                  "flex-1 rounded-lg py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                  betMode === "auto"
                    ? "bg-brand text-black shadow-[0_0_15px_rgba(163,230,53,0.35)]"
                    : "text-white/40 hover:text-white"
                )}
              >
                Auto
              </button>
            </div>

            {/* Bet amount */}
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-white/40">
                Bet amount
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min={1}
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.max(0, Number(e.target.value)))}
                    disabled={status === "playing" || isAutoBetting}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 font-mono text-white outline-none transition-all focus:border-brand/60 disabled:opacity-50"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setBetAmount((prev) => prev / 2)}
                  disabled={status === "playing" || isAutoBetting}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2.5 text-xs font-bold text-white/60 transition-all hover:bg-white/10 disabled:opacity-50"
                >
                  1/2
                </button>
                <button
                  type="button"
                  onClick={() => setBetAmount((prev) => prev * 2)}
                  disabled={status === "playing" || isAutoBetting}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2.5 text-xs font-bold text-white/60 transition-all hover:bg-white/10 disabled:opacity-50"
                >
                  x2
                </button>
              </div>
            </div>

            {/* Mines count */}
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-white/40">
                Mines
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {MINE_PRESETS.map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => {
                      setMineCount(count);
                      setNextMultiplier(calcMult(1, count));
                    }}
                    disabled={status === "playing" || isAutoBetting}
                    className={cn(
                      "rounded-lg py-2 text-xs font-bold transition-all",
                      mineCount === count
                        ? "bg-brand text-black shadow-lg shadow-brand/20"
                        : "border border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Autobet config */}
            {betMode === "auto" && (
              <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-3">
                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-white/40">
                    Rounds
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={autoRounds}
                    onChange={(e) => setAutoRounds(Math.max(0, Math.floor(Number(e.target.value))))}
                    disabled={isAutoBetting}
                    placeholder="0"
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-2 font-mono text-sm text-white outline-none transition-all focus:border-brand/60 disabled:opacity-50"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-white/40">
                    Target +
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={autoTarget}
                    onChange={(e) => setAutoTarget(Math.max(0, Number(e.target.value)))}
                    disabled={isAutoBetting}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-2 font-mono text-sm text-white outline-none transition-all focus:border-brand/60 disabled:opacity-50"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-white/40">
                    Stop −
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={autoStopLoss}
                    onChange={(e) => setAutoStopLoss(Math.max(0, Number(e.target.value)))}
                    disabled={isAutoBetting}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-2 font-mono text-sm text-white outline-none transition-all focus:border-brand/60 disabled:opacity-50"
                  />
                </label>
              </div>
            )}

            {/* Current profit / next reveal */}
            {(status === "playing" || isAutoBetting) && (
              <div className="space-y-1.5 rounded-xl border border-brand/20 bg-brand/5 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                    Current profit
                  </span>
                  <span className="font-bold tracking-tight text-brand">
                    +{formatMoney(betAmount * currentMultiplier - betAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Next reveal</span>
                  <span className="font-bold text-white">{nextMultiplier.toFixed(2)}×</span>
                </div>
                {isAutoBetting && (
                  <div className="flex items-center justify-between border-t border-white/10 pt-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Round</span>
                    <span className="font-mono font-bold text-brand">
                      {autoRound}
                      {autoRounds > 0 ? ` / ${autoRounds}` : ""}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Action button */}
            {status === "playing" ? (
              <button
                type="button"
                onClick={() => void cashout()}
                disabled={revealedRef.current.length === 0 || busy}
                className="h-10 w-full rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 text-xs font-black uppercase tracking-wider text-black shadow-[0_0_24px_rgba(245,158,11,0.35)] transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                CASH OUT ({formatMoney(betAmount * currentMultiplier)})
              </button>
            ) : isAutoBetting ? (
              <button
                type="button"
                onClick={stopAutoBet}
                className="h-10 w-full rounded-lg bg-red-600 text-xs font-black uppercase tracking-wider text-white shadow-[0_0_24px_rgba(220,38,38,0.3)] transition-all hover:brightness-110 active:scale-[0.98]"
              >
                STOP AUTO
              </button>
            ) : (
              <button
                type="button"
                onClick={betMode === "auto" ? startAutoBet : () => void startGame()}
                disabled={!canStart || busy}
                className="h-10 w-full rounded-lg bg-brand text-xs font-black uppercase tracking-wider text-black gold-glow transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? "Working…" : betMode === "auto" ? "START AUTO" : `START GAME · ${formatMoney(betAmount)}`}
              </button>
            )}

            {error && <p className="text-xs font-medium text-red-400">{error}</p>}

            {/* Balance */}
            <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs text-white/50">
              <span>Balance</span>
              <span className="font-bold text-white">{formatMoney(balance)}</span>
            </div>
          </div>

          {/* Live drops */}
          <div className="flex h-12 items-center overflow-hidden rounded-2xl border border-white/10 bg-card/60 px-4">
            <span className="mr-4 shrink-0 text-[10px] font-black uppercase tracking-widest text-white/40">
              Live Drops
            </span>
            <div className="flex-1 overflow-hidden">
              <MinesStats />
            </div>
          </div>
        </aside>
      </div>

      <p className="text-center text-xs leading-relaxed text-white/40">
        Provably fair · mine positions are derived from HMAC-SHA256(server seed, client seed, nonce) and
        revealed when the round ends. Wins are synced to your NexBet65 wallet automatically.
      </p>
    </div>
  );
}
