"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/games";

export type Slot = "a" | "b";

export interface BetConsoleState {
  betPlaced: boolean;
  placingBet: boolean;
  cashedOut: number | null;
  cashingOut: boolean;
  winAmount: number | null;
  winMultiplier: number | null;
}

export const EMPTY_CONSOLE_STATE: BetConsoleState = {
  betPlaced: false,
  placingBet: false,
  cashedOut: null,
  cashingOut: false,
  winAmount: null,
  winMultiplier: null,
};

type RoundState = "betting" | "running" | "crashed";

const QUICK_BETS = [10, 25, 50, 100];
const MAX_BET = 50000;

const rid = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;

interface AviatorBetConsoleProps {
  slot: Slot;
  connected: boolean;
  roundState: RoundState;
  multiplier: number;
  balance: number | null;
  walletStatus: "loading" | "ready" | "error";
  betState: BetConsoleState;
  onPlaceBet: (amount: number, ref: string) => void;
  onCashOut: () => void;
}

export default function AviatorBetConsole({
  slot,
  connected,
  roundState,
  multiplier,
  balance,
  walletStatus,
  betState,
  onPlaceBet,
  onCashOut,
}: AviatorBetConsoleProps) {
  const isA = slot === "a";
  const accent = isA ? "#ffb020" : "#4de8ff";

  const [amountStr, setAmountStr] = useState("10");
  const [autoBet, setAutoBet] = useState(false);
  const [targetStr, setTargetStr] = useState("1.5");

  const amount = Math.floor(Number(amountStr) || 0);
  const inputDisabled = roundState !== "betting" || betState.betPlaced;
  const walletLoading = walletStatus === "loading";
  const insufficient = !walletLoading && balance !== null && amount > balance;
  const autoTarget = autoBet ? Math.max(1.01, Number(targetStr) || 1.5) : null;

  const setAmount = useCallback((v: number) => {
    const clamped = Math.max(1, Math.min(MAX_BET, Math.floor(v)));
    setAmountStr(String(clamped));
  }, []);

  const doPlaceBet = useCallback(() => {
    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_BET) return;
    if (insufficient) return;
    onPlaceBet(amount, rid(`aviator-${slot}-bet`));
  }, [amount, insufficient, onPlaceBet, slot]);

  const doCashOut = useCallback(() => {
    onCashOut();
  }, [onCashOut]);

  useEffect(() => {
    if (!autoBet) return;
    if (roundState !== "betting") return;
    if (betState.betPlaced || betState.placingBet) return;
    if (!connected || walletLoading) return;
    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_BET) return;
    if (balance !== null && amount > balance) return;
    onPlaceBet(amount, rid(`aviator-${slot}-auto`));
  }, [
    autoBet,
    roundState,
    betState.betPlaced,
    betState.placingBet,
    connected,
    walletLoading,
    amount,
    balance,
    onPlaceBet,
    slot,
  ]);

  useEffect(() => {
    if (roundState !== "running") return;
    if (!betState.betPlaced || betState.cashedOut !== null) return;
    if (autoTarget !== null && multiplier >= autoTarget) doCashOut();
  }, [roundState, multiplier, betState.betPlaced, betState.cashedOut, autoTarget, doCashOut]);

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/5 bg-[#111] p-3.5 transition-all duration-300",
        betState.betPlaced && roundState !== "crashed"
          ? "border-brand/40 shadow-[0_0_15px_rgba(163,230,53,0.08)]"
          : ""
      )}
    >
      <div className="mb-2.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-instrument text-xs font-semibold uppercase tracking-wider">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
          />
          <span style={{ color: accent }}>Console {slot.toUpperCase()}</span>
        </span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setAmount(1)}
            disabled={inputDisabled}
            className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-white/50 hover:border-brand/40 hover:bg-brand/10 hover:text-brand disabled:opacity-30"
          >
            MIN
          </button>
          <button
            type="button"
            onClick={() =>
              setAmount(balance !== null ? Math.min(MAX_BET, Math.floor(balance)) : 10)
            }
            disabled={inputDisabled}
            className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-white/50 hover:border-brand/40 hover:bg-brand/10 hover:text-brand disabled:opacity-30"
          >
            MAX
          </button>
        </div>
      </div>

      <div className="mb-2.5 flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 p-2 focus-within:border-brand/50">
        <button
          type="button"
          onClick={() => setAmount(amount - 10)}
          disabled={inputDisabled}
          className="flex h-7 w-7 items-center justify-center rounded bg-white/5 text-white/60 hover:bg-brand/10 hover:text-brand disabled:opacity-30"
        >
          <Minus size={14} />
        </button>
        <div className="flex-1 text-center">
          <span className="mr-1 font-instrument text-xs text-white/40">৳</span>
          <input
            type="number"
            min={1}
            step={1}
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            disabled={inputDisabled}
            className="w-16 bg-transparent text-center font-instrument text-base font-bold text-white focus:outline-none disabled:text-white/40"
          />
        </div>
        <button
          type="button"
          onClick={() => setAmount(amount + 10)}
          disabled={inputDisabled}
          className="flex h-7 w-7 items-center justify-center rounded bg-white/5 text-white/60 hover:bg-brand/10 hover:text-brand disabled:opacity-30"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="mb-2.5 grid grid-cols-4 gap-1.5">
        {QUICK_BETS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setAmount(amount + q)}
            disabled={inputDisabled}
            className="rounded border border-white/10 bg-white/5 py-1 font-instrument text-xs font-semibold text-white/70 hover:border-brand/40 hover:bg-brand/10 hover:text-brand disabled:opacity-30"
          >
            +{q}
          </button>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between border-t border-white/10 pt-2.5">
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-white/60">
          <input
            type="checkbox"
            checked={autoBet}
            onChange={(e) => setAutoBet(e.target.checked)}
            disabled={roundState !== "betting" || !connected}
            className="rounded border-white/20 bg-black/40 accent-brand focus:ring-brand/20"
          />
          Auto Bet
        </label>
        {autoBet && (
          <div className="flex items-center gap-1.5 rounded border border-white/10 bg-black/40 px-2 py-0.5">
            <span className="text-[10px] font-bold text-white/40">@</span>
            <input
              type="number"
              min={1.01}
              step={0.1}
              value={targetStr}
              onChange={(e) => setTargetStr(e.target.value)}
              disabled={roundState !== "betting"}
              className="w-10 bg-transparent text-right font-instrument text-xs font-bold text-white focus:outline-none"
            />
            <span className="text-[10px] font-bold text-white/40">x</span>
          </div>
        )}
      </div>

      {roundState === "betting" &&
        (betState.betPlaced ? (
          <div className="flex h-9 w-full animate-pulse items-center justify-center rounded-lg border border-brand/30 bg-brand/10 text-xs font-semibold uppercase tracking-wider text-brand">
            <Check size={15} className="mr-1.5" /> Bet Registered ({formatMoney(amount)})
          </div>
        ) : (
          <button
            type="button"
            onClick={doPlaceBet}
            onPointerDown={(e) => {
              if (e.pointerType === "mouse" && e.button !== 0) return;
              doPlaceBet();
            }}
            disabled={!connected || walletLoading || insufficient || betState.placingBet}
            className="h-9 w-full rounded-lg bg-brand text-xs font-black uppercase tracking-wider text-black gold-glow transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {betState.placingBet
              ? "Placing…"
              : insufficient
                ? "Insufficient Balance"
                : `Place Bet (${formatMoney(amount)})`}
          </button>
        ))}

      {roundState === "running" &&
        (betState.betPlaced && betState.cashedOut === null ? (
          <button
            type="button"
            onClick={doCashOut}
            onPointerDown={(e) => {
              if (e.pointerType === "mouse" && e.button !== 0) return;
              doCashOut();
            }}
            disabled={betState.cashingOut}
            aria-label={betState.cashingOut ? "Cashing out" : "Cash out"}
            className="group h-9 w-full rounded-lg bg-[#ffb020] font-extrabold uppercase tracking-wider text-black amber-glow transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          >
            <span className="block text-[10px] font-semibold text-black/60 group-hover:text-black">
              {betState.cashingOut ? "CASHING OUT…" : `CASH OUT AT ${multiplier.toFixed(2)}x`}
            </span>
            <span className="block font-instrument text-sm font-black">
              {formatMoney(amount * multiplier)}
            </span>
          </button>
        ) : betState.cashedOut !== null ? (
          <div className="flex h-9 w-full items-center justify-center rounded-lg border border-brand/30 bg-brand/10 text-xs font-bold uppercase tracking-wider text-brand">
            Won {formatMoney(betState.winAmount ?? 0)} @ {betState.cashedOut.toFixed(2)}x ✓
          </div>
        ) : (
          <div className="flex h-9 w-full items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs font-medium uppercase tracking-wider text-white/40">
            Waiting for Next Round
          </div>
        ))}

      {roundState === "crashed" && betState.cashedOut === null && (
        <div className="flex h-9 w-full items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-xs font-semibold uppercase tracking-wider text-red-400">
          Round Crashed
        </div>
      )}
    </div>
  );
}
