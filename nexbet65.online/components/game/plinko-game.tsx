"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Coins,
  PlayCircle,
  RefreshCw,
  Settings,
  ShieldCheck,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";

import { PlinkoBoard } from "@/components/game/plinko-board";
import { formatMoney } from "@/lib/games";
import {
  MAX_ROWS,
  MIN_ROWS,
  PLINKO_MULTIPLIERS,
  type BallSkin,
  type PlinkoGameState,
  type RiskLevel,
} from "@/lib/plinko-constants";
import { plinkoSound } from "@/lib/plinko-audio";
import { cn } from "@/lib/utils";
import { useWallet } from "@/lib/wallet-store";

interface PlinkoConfig {
  multipliers: Record<RiskLevel, Record<number, number[]>>;
  serverSeedHash: string;
  minRows: number;
  maxRows: number;
  rtp: number;
}

interface BetResponse {
  betId: string;
  path: ("L" | "R")[];
  bucket: number;
  multiplier: number;
  payout: number;
  balance: number;
  lockedBonus: number;
  withdrawable: number;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
}

const RISK_STYLES: Record<RiskLevel, string> = {
  low: "bg-blue-500/10 text-blue-400",
  medium: "bg-orange-500/10 text-orange-400",
  high: "bg-red-500/10 text-red-400",
};

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
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

export function PlinkoGame() {
  const wallet = useWallet();

  const [balance, setBalance] = useState<number>(0);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [risk, setRisk] = useState<RiskLevel>("medium");
  const [rows, setRows] = useState<number>(12);
  const [ballSkin, setBallSkin] = useState<BallSkin>("ruby");

  const [gameState, setGameState] = useState<PlinkoGameState>("idle");
  const [activePath, setActivePath] = useState<("L" | "R")[] | undefined>();
  const [lastBetId, setLastBetId] = useState<string | undefined>();
  const [lastBetAmount, setLastBetAmount] = useState<number>(0);
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [payout, setPayout] = useState<number>(0);

  const [config, setConfig] = useState<PlinkoConfig | null>(null);
  const [fairness, setFairness] = useState<{
    serverSeed: string;
    serverSeedHash: string;
    clientSeed: string;
    nonce: number;
  } | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Seed local balance from the wallet store once it loads.
  useEffect(() => {
    if (wallet.balance !== null) setBalance(wallet.balance);
  }, [wallet.balance]);

  // Fetch the committed seed hash + multiplier tables on mount, and refresh the
  // committed hash after every round so the next bet is covered by a fresh one.
  const refreshConfig = useCallback(async () => {
    try {
      const data = await fetchJson("/api/plinko/config");
      if (mountedRef.current) setConfig(data);
    } catch {
      /* config is optional at runtime — fall back to constants */
    }
  }, []);

  useEffect(() => {
    void refreshConfig();
  }, [refreshConfig]);

  const multipliers =
    config?.multipliers ?? PLINKO_MULTIPLIERS;
  const currentMultipliers =
    multipliers[risk]?.[rows] ?? PLINKO_MULTIPLIERS[risk][rows];

  const handleBallLand = useCallback(
    (bucketIndex: number) => {
      const multiplier = currentMultipliers[bucketIndex];
      const winAmount = Math.round(lastBetAmount * multiplier * 100) / 100;
      setLastResult(multiplier);
      setPayout(winAmount);
      setGameState("result");
      setActivePath(undefined);
      setLastBetId(undefined);
      plinkoSound.playWin(multiplier);
      if (winAmount - lastBetAmount >= 0) {
        toast.success(`WIN ${formatMoney(winAmount)}`);
      } else {
        toast.error(`You lost ${formatMoney(lastBetAmount - winAmount)}`);
      }
      void refreshConfig();
    },
    [currentMultipliers, lastBetAmount, refreshConfig]
  );

  const placeBet = useCallback(async () => {
    if (betAmount > balance || betAmount <= 0) return;
    if (gameState === "dropping") return;

    plinkoSound.playClick();
    setBusy(true);
    setError(null);
    setGameState("dropping");
    setLastResult(null);
    setPayout(0);

    try {
      const data: BetResponse = await postJson("/api/plinko/bet", {
        amount: betAmount,
        risk,
        rows,
        clientSeed: "nexbet65-user-seed",
      });

      setLastBetId(data.betId);
      setLastBetAmount(betAmount);
      setActivePath(data.path);
      setBalance(data.balance);
      setFairness({
        serverSeed: data.serverSeed,
        serverSeedHash: data.serverSeedHash,
        clientSeed: data.clientSeed,
        nonce: data.nonce,
      });
      void wallet.refresh();
    } catch (err) {
      setGameState("idle");
      setError(err instanceof Error ? err.message : "Bet failed");
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }, [betAmount, balance, risk, rows, gameState, wallet]);

  const canBet = betAmount > 0 && balance >= betAmount && !busy;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid lg:grid-cols-4 lg:items-start lg:gap-4">
        {/* Board */}
        <section className="rounded-2xl border border-white/10 bg-card/60 p-4 sm:p-6 lg:col-span-3">
          {/* The board */}
          <div className="relative h-[480px] overflow-hidden rounded-2xl border border-white/10 bg-[#0f1923] shadow-2xl sm:h-[560px] lg:h-[600px]">
            <PlinkoBoard
              rows={rows}
              risk={risk}
              multipliers={currentMultipliers}
              onBallLand={handleBallLand}
              activePath={activePath}
              lastBetId={lastBetId}
              lastBetAmount={lastBetAmount}
              ballSkin={ballSkin}
              gameState={gameState}
              lastResult={lastResult}
            />

            {/* Idle overlay */}
            {gameState === "idle" && (
              <div className="fade-in pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-brand/30 bg-brand/20 shadow-[0_0_30px_rgba(163,230,53,0.2)]">
                    <PlayCircle className="h-8 w-8 text-brand" />
                  </div>
                  <span className="text-sm font-black uppercase tracking-[0.3em] text-white drop-shadow-lg">
                    Place Your Bet
                  </span>
                </div>
              </div>
            )}

            {/* Result overlay */}
            {gameState === "result" && lastResult !== null && (
              <div className="fade-in pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="pop-in flex flex-col items-center rounded-2xl border-2 border-brand/60 bg-[#0f1923]/90 px-8 py-4 shadow-[0_0_50px_rgba(163,230,53,0.3)]">
                    <div className="mb-1 flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-brand" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/50">
                        Multiplier
                      </span>
                    </div>
                    <span className="text-4xl font-black text-white">{lastResult}x</span>
                    <span
                      className={cn(
                        "mt-1 text-sm font-bold",
                        lastResult >= 1 ? "text-brand" : "text-white/40"
                      )}
                    >
                      {formatMoney(payout)}
                    </span>
                    <span
                      className={cn(
                        "text-[11px] font-bold",
                        payout - lastBetAmount >= 0 ? "text-brand" : "text-red-400"
                      )}
                    >
                      {payout - lastBetAmount >= 0 ? "+" : ""}
                      {formatMoney(payout - lastBetAmount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-brand">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span className="text-[9px] font-black uppercase tracking-widest">
                      Waiting for next bet
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Provably fair strip */}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-white/10 pt-3 text-[11px] text-white/40">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-brand" />
              Committed seed
              <span className="font-mono text-white/60">
                {(config?.serverSeedHash ?? "…").slice(0, 16)}
              </span>
            </span>
            {fairness && (
              <>
                <span>
                  Used seed <span className="font-mono text-white/60">{fairness.serverSeed.slice(0, 16)}…</span>
                </span>
                <span>
                  Client seed <span className="font-mono text-white/60">{fairness.clientSeed}</span>
                </span>
                <span>
                  Nonce <span className="font-mono text-white/60">{fairness.nonce}</span>
                </span>
              </>
            )}
          </div>
        </section>

        {/* Controls */}
        <aside className="mt-4 space-y-4 lg:mt-0 lg:col-span-1">
          {/* Status header */}
          <div className="flex min-h-[64px] flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-card/60 p-3">
            {gameState === "result" && lastResult !== null ? (
              <span className="flex items-center gap-3 rounded-xl border border-brand/40 bg-brand/10 px-6 py-2.5">
                <span className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-brand" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand/70">
                    Payout
                  </span>
                </span>
                <span className="text-2xl font-black text-brand">{formatMoney(payout)}</span>
              </span>
            ) : (
              <span className="flex items-center gap-5 rounded-xl border border-white/10 bg-white/5 px-5 py-2">
                <span className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-brand" />
                  <span className="text-xs font-bold tracking-widest text-white/70">
                    {risk.toUpperCase()} RISK
                  </span>
                </span>
                <span className="h-5 w-px bg-white/10" />
                <span className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-brand" />
                  <span className="text-xs font-bold tracking-widest text-white/70">
                    {rows} ROWS
                  </span>
                </span>
              </span>
            )}
          </div>

          <div className="space-y-4 rounded-2xl border border-white/10 bg-card/60 p-4">
            {/* Bet amount */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                <Coins className="h-3.5 w-3.5 text-brand" />
                Bet amount
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(0, Number(e.target.value)))}
                  disabled={gameState === "dropping"}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 font-mono text-white outline-none transition-all focus:border-brand/60 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setBetAmount((prev) => prev / 2)}
                  disabled={gameState === "dropping"}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2.5 text-xs font-bold text-white/60 transition-all hover:bg-white/10 disabled:opacity-50"
                >
                  1/2
                </button>
                <button
                  type="button"
                  onClick={() => setBetAmount((prev) => prev * 2)}
                  disabled={gameState === "dropping"}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2.5 text-xs font-bold text-white/60 transition-all hover:bg-white/10 disabled:opacity-50"
                >
                  x2
                </button>
              </div>
            </div>

            {/* Risk level */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                <TrendingUp className="h-3.5 w-3.5 text-brand" />
                Risk level
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["low", "medium", "high"] as RiskLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setRisk(level)}
                    disabled={gameState === "dropping"}
                    className={cn(
                      "rounded-lg py-2 text-xs font-bold capitalize transition-all",
                      risk === level
                        ? "bg-brand text-black shadow-lg shadow-brand/20"
                        : "border border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Rows */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                <Settings className="h-3.5 w-3.5 text-brand" />
                Rows
              </label>
              <div className="relative">
                <select
                  value={rows}
                  onChange={(e) => setRows(Number(e.target.value))}
                  disabled={gameState === "dropping"}
                  className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm font-bold text-white outline-none transition-all focus:border-brand/60 disabled:opacity-50"
                >
                  {Array.from({ length: MAX_ROWS - MIN_ROWS + 1 }, (_, i) => MIN_ROWS + i).map((r) => (
                    <option key={r} value={r}>
                      {r} Rows
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              </div>
            </div>

            {/* Ball skin */}
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-white/40">
                Ball
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["metallic", "ruby", "diamond"] as BallSkin[]).map((skin) => (
                  <button
                    key={skin}
                    type="button"
                    onClick={() => setBallSkin(skin)}
                    disabled={gameState === "dropping"}
                    className={cn(
                      "rounded-lg py-2 text-xs font-bold capitalize transition-all",
                      ballSkin === skin
                        ? "bg-brand text-black shadow-lg shadow-brand/20"
                        : "border border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {skin}
                  </button>
                ))}
              </div>
            </div>

            {/* Action button */}
            <button
              type="button"
              onClick={() => void placeBet()}
              disabled={!canBet}
              className="h-10 w-full rounded-lg bg-brand text-xs font-black uppercase tracking-wider text-black gold-glow transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {gameState === "dropping"
                ? "DROPPING…"
                : betAmount > balance
                  ? `INSUFFICIENT FUNDS`
                  : `DROP BALL · ${formatMoney(betAmount)}`}
            </button>

            {error && <p className="text-xs font-medium text-red-400">{error}</p>}

            {/* Balance */}
            <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs text-white/50">
              <span>Balance</span>
              <span className="font-bold text-white">{formatMoney(balance)}</span>
            </div>

            {/* Fair system footer */}
            <div className="flex items-center justify-between border-t border-white/10 pt-3 text-[10px] font-black uppercase tracking-widest text-white/40">
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-brand" />
                Fair System
              </span>
              <span>Edge: 1.0%</span>
            </div>
          </div>
        </aside>
      </div>

      <p className="text-center text-xs leading-relaxed text-white/40">
        Provably fair · the ball&apos;s left/right path is derived from HMAC-SHA256(server seed, client
        seed, nonce). The committed seed hash is shown before every drop and the used seed is revealed
        after. Wins and losses settle straight into your NexBet65 wallet.
      </p>
    </div>
  );
}
