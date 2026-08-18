"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Wallet } from "lucide-react";

import { useWallet } from "@/lib/wallet-store";

function formatTaka(n: number | null): string {
  if (n === null) return "৳ ––";
  return (
    "৳ " +
    n.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function BalancePill() {
  const { balance, status, refresh } = useWallet();

  useEffect(() => {
    const id = setInterval(() => {
      void refresh();
    }, 30_000);
    const onFocus = () => {
      void refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  const compact =
    status === "loading"
      ? "…"
      : balance === null
        ? "৳ –"
        : "৳" + Math.round(balance).toLocaleString("en-IN");

  return (
    <Link
      href="/wallet"
      title="Wallet balance"
      className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-brand/25 bg-brand/10 px-2.5 text-xs font-bold text-brand transition-colors hover:border-brand/50 hover:bg-brand/15 sm:gap-2 sm:px-3"
    >
      <Wallet className="h-3.5 w-3.5" />
      <span className="hidden font-instrument tabular-nums min-[440px]:inline">{formatTaka(balance)}</span>
      <span className="max-w-[76px] truncate font-instrument text-[11px] tabular-nums min-[440px]:hidden">{compact}</span>
    </Link>
  );
}
