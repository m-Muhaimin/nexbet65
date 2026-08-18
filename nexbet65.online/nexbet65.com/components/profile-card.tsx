"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Coins, LogOut, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatMoney } from "@/lib/games";
import { useWallet } from "@/lib/wallet-store";

const KIND_META: Record<string, { label: string; cls: string }> = {
  signup_bonus: { label: "Signup bonus", cls: "bg-brand/15 text-brand" },
  deposit: { label: "Deposit", cls: "bg-brand/15 text-brand" },
  deposit_bonus: { label: "First-deposit bonus", cls: "bg-brand/15 text-brand" },
  withdraw: { label: "Withdrawal", cls: "bg-amber-500/15 text-amber-400" },
  bet: { label: "Bet", cls: "bg-white/10 text-white/80" },
  payout: { label: "Win", cls: "bg-emerald-500/15 text-emerald-400" },
  refund: { label: "Refund", cls: "bg-sky-500/15 text-sky-400" },
  manual: { label: "Adjustment", cls: "bg-amber-500/15 text-amber-400" },
  referral_bonus: { label: "Referral bonus", cls: "bg-violet-500/15 text-violet-400" },
  referral_commission: { label: "Referral commission", cls: "bg-sky-500/15 text-sky-400" },
  cashback: { label: "Cashback", cls: "bg-emerald-500/15 text-emerald-400" },
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ProfileCard({
  username,
  avatar,
  memberSince,
}: {
  username: string;
  avatar: string;
  memberSince?: string;
}) {
  const router = useRouter();
  const { balance, transactions, status } = useWallet();

  const stats = useMemo(() => {
    let bets = 0;
    let wins = 0;
    for (const t of transactions) {
      if (t.kind === "bet") bets += Math.abs(t.amount);
      else if (t.kind === "payout") wins += t.amount;
    }
    const rounds = transactions.filter((t) => t.kind === "bet").length;
    return { bets, wins, rounds };
  }, [transactions]);

  const initials = username.slice(0, 2).toUpperCase();
  const memberDate = memberSince
    ? new Date(memberSince).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Today";

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  }

  return (
    <div className="space-y-3 sm:space-y-5">
      <div className="glass overflow-hidden rounded-2xl border border-white/5">
        <div className="h-20 bg-gradient-to-r from-brand/40 via-emerald-800/30 to-transparent sm:h-24" />
        <div className="p-4 sm:p-5 pt-0">
          <div className="-mt-12 flex items-end gap-3 sm:-mt-14 sm:items-end sm:gap-4">
            <Avatar className="h-16 w-16 border-4 border-black sm:h-20 sm:w-20">
              <AvatarFallback
                className="text-lg font-black text-black"
                style={{ backgroundColor: avatar || "#f6b01a" }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="pb-0.5 sm:pb-1">
              <h2 className="text-xl font-extrabold sm:text-2xl">{username}</h2>
              <p className="text-sm text-white/50">Member since {memberDate}</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-brand/20 bg-brand/10 p-2.5 sm:p-3">
              <p className="flex items-center gap-1 text-[11px] uppercase tracking-widest text-white/50">
                <Coins className="h-3 w-3 text-brand" /> Balance
              </p>
              <p className="mt-0.5 text-lg font-extrabold tabular-nums text-brand">
                {status === "loading"
                  ? "…"
                  : balance === null
                    ? "—"
                    : formatMoney(balance)}
              </p>
            </div>
            <div className="rounded-xl bg-white/5 p-2.5 sm:p-3">
              <p className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-white/50 sm:text-[11px]">
                <TrendingDown className="h-3 w-3" /> Total bets
              </p>
              <p className="mt-0.5 text-base font-extrabold tabular-nums sm:text-lg">
                {formatMoney(stats.bets)}
              </p>
            </div>
            <div className="rounded-xl bg-white/5 p-2.5 sm:p-3">
              <p className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-white/50 sm:text-[11px]">
                <TrendingUp className="h-3 w-3" /> Total winnings
              </p>
              <p className="mt-0.5 text-base font-extrabold tabular-nums text-emerald-400 sm:text-lg">
                {formatMoney(stats.wins)}
              </p>
            </div>
            <div className="rounded-xl bg-white/5 p-2.5 sm:p-3">
              <p className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-white/50 sm:text-[11px]">
                <Trophy className="h-3 w-3" /> Rounds played
              </p>
              <p className="mt-0.5 text-base font-extrabold tabular-nums sm:text-lg">
                {stats.rounds}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl border border-white/5">
        <div className="flex items-center justify-between border-b border-white/5 p-4">
          <h3 className="font-bold">Wallet history</h3>
          <Badge variant="outline" className="text-white/50">
            {transactions.length} entries
          </Badge>
        </div>
        <div className="max-h-72 overflow-y-auto p-2">
          {transactions.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-white/40">
              No transactions yet — play a round to see your history here.
            </p>
          )}
          {transactions.map((t) => {
            const meta = KIND_META[t.kind] ?? KIND_META.manual;
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
                    className={`font-bold tabular-nums ${
                      t.amount >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {t.amount >= 0 ? "+" : ""}
                    {formatMoney(t.amount)}
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

      <div className="glass rounded-2xl border border-white/5 p-4">
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-white/50">Username</span>
            <span className="font-semibold">{username}</span>
          </div>
          <Separator className="bg-white/5" />
          <div className="flex items-center justify-between">
            <span className="text-white/50">Member since</span>
            <span className="font-semibold">{memberDate}</span>
          </div>
          <Separator className="bg-white/5" />
          <div className="flex items-center justify-between">
            <span className="text-white/50">Wallet balance</span>
            <span className="font-semibold">
              {balance === null ? "—" : formatMoney(balance)}
            </span>
          </div>
        </div>
        <Button
          variant="destructive"
          className="mt-4 w-full"
          onClick={() => void signOut()}
        >
          <LogOut className="mr-2" /> Sign out
        </Button>
      </div>
    </div>
  );
}
