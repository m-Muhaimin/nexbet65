"use client";

import { RefreshCw } from "lucide-react";

import { formatMoney } from "@/lib/games";
import { useWallet } from "@/lib/wallet-store";

const KIND_META: Record<string, { label: string; cls: string }> = {
  signup_bonus: { label: "Signup bonus", cls: "bg-brand/15 text-brand" },
  deposit: { label: "Deposit", cls: "bg-brand/15 text-brand" },
  deposit_bonus: { label: "First-deposit bonus", cls: "bg-brand/15 text-brand" },
  withdraw: { label: "Withdrawal", cls: "bg-amber-500/15 text-amber-400" },
  bet: { label: "Bet", cls: "bg-white/10 text-white/80" },
  payout: { label: "Win", cls: "bg-emerald-500/15 text-emerald-400" },
  bet_loss: { label: "Loss", cls: "bg-red-500/15 text-red-400" },
  refund: { label: "Refund", cls: "bg-sky-500/15 text-sky-400" },
  manual: { label: "Adjustment", cls: "bg-amber-500/15 text-amber-400" },
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RecentTransactions() {
  const { transactions, status, refresh } = useWallet();

  return (
    <div className="rounded-2xl border border-white/5 bg-[#111]">
      <div className="flex items-center justify-between border-b border-white/5 p-4">
        <h3 className="font-bold">Recent transactions</h3>
        <button
          type="button"
          onClick={() => void refresh()}
          className="flex items-center gap-1.5 text-xs font-semibold text-white/50 transition hover:text-brand"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>
      <div className="max-h-[440px] overflow-y-auto p-2">
        {status === "loading" && (
          <p className="px-3 py-8 text-center text-sm text-white/40">
            Loading…
          </p>
        )}
        {status !== "loading" && transactions.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-white/40">
            No transactions yet — play a round to see your history here.
          </p>
        )}
        {transactions.slice(0, 25).map((t) => {
          const meta = KIND_META[t.kind] ?? KIND_META.manual;
          const lossAmount =
            t.kind === "bet_loss" && t.meta
              ? Number(/lost ([0-9.]+)/.exec(t.meta)?.[1] ?? 0)
              : null;
          return (
            <div
              key={t.id}
              className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-white/5"
            >
              <div className="min-w-0">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.cls}`}
                >
                  {meta.label}
                </span>
                {t.meta && (
                  <span className="ml-2 text-xs text-white/40">{t.meta}</span>
                )}
                <p className="mt-1 text-[11px] text-white/35">
                  {fmtDate(t.createdAt)}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`font-instrument font-black tabular-nums ${
                    lossAmount !== null || t.amount < 0
                      ? "text-red-400"
                      : "text-emerald-400"
                  }`}
                >
                  {lossAmount !== null
                    ? `-${formatMoney(lossAmount)}`
                    : `${t.amount >= 0 ? "+" : ""}${formatMoney(t.amount)}`}
                </p>
                <p className="text-[11px] text-white/35">
                  bal {formatMoney(t.balanceAfter)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
