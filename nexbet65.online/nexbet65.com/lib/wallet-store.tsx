"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export type WalletTx = {
  id: string;
  kind: string;
  amount: number;
  balanceAfter: number;
  meta: string | null;
  createdAt: string;
};

type RecordInput = {
  kind: string;
  amount: number;
  ref?: string;
  meta?: string;
};

type WalletContextValue = {
  balance: number | null;
  lockedBonus: number | null; // non-withdrawable first-deposit bonus still in the wallet
  withdrawable: number | null; // balance - lockedBonus
  transactions: WalletTx[];
  status: "loading" | "ready" | "error";
  refresh: () => Promise<void>;
  record: (input: RecordInput) => Promise<{ ok: boolean; error?: string }>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState<number | null>(null);
  const [lockedBonus, setLockedBonus] = useState<number | null>(null);
  const [withdrawable, setWithdrawable] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/wallet", { cache: "no-store" });
      if (!res.ok) {
        if (mountedRef.current) {
          setBalance(null);
          setLockedBonus(null);
          setWithdrawable(null);
          setTransactions([]);
          setStatus("error");
        }
        return;
      }
      const data = (await res.json()) as {
        balance: number;
        lockedBonus?: number;
        withdrawable?: number;
        transactions: WalletTx[];
      };
      if (mountedRef.current) {
        setBalance(Number(data.balance));
        setLockedBonus(data.lockedBonus === undefined ? null : Number(data.lockedBonus));
        setWithdrawable(data.withdrawable === undefined ? null : Number(data.withdrawable));
        setTransactions(data.transactions);
        setStatus("ready");
      }
    } catch {
      if (mountedRef.current) setStatus("error");
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void refresh();
    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  const record = useCallback(
    async (input: RecordInput) => {
      // Optimistic update so the nav pill reacts instantly; the server response
      // below is authoritative and reconciles any drift.
      if (mountedRef.current && balance !== null) {
        setBalance((b) => (b === null ? b : Math.round((b + input.amount) * 100) / 100));
      }
      // A bet consumes locked bonus first; a bonus grant adds to it.
      if (mountedRef.current && lockedBonus !== null && balance !== null) {
        if (input.kind === "bet" && input.amount < 0) {
          setLockedBonus((l) => (l === null ? l : Math.max(0, Math.round((l + input.amount) * 100) / 100)));
        } else if ((input.kind === "signup_bonus" || input.kind === "deposit_bonus") && input.amount > 0) {
          setLockedBonus((l) => (l === null ? l : Math.round((l + input.amount) * 100) / 100));
        }
      }
      try {
        const res = await fetch("/api/wallet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify(input),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          balance?: number;
          lockedBonus?: number;
          withdrawable?: number;
        };
        if (!res.ok) {
          await refresh();
          return { ok: false, error: data.error ?? "Wallet update failed" };
        }
        if (mountedRef.current) {
          if (typeof data.balance === "number") setBalance(data.balance);
          if (typeof data.lockedBonus === "number") setLockedBonus(data.lockedBonus);
          if (typeof data.withdrawable === "number") setWithdrawable(data.withdrawable);
        }
        return { ok: true };
      } catch {
        await refresh();
        return { ok: false, error: "Wallet update failed" };
      }
    },
    [balance, lockedBonus, refresh]
  );

  return (
    <WalletContext.Provider
      value={{ balance, lockedBonus, withdrawable, transactions, status, refresh, record }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within a WalletProvider");
  return ctx;
}
