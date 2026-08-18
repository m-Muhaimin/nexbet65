"use client";

import * as React from "react";
import {
  Activity,
  Check,
  Clock,
  Copy,
  Landmark,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Wallet as WalletIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";

import type {
  AgentDTO,
  AgentWalletDTO,
  DashboardMetrics,
  LedgerRow,
  TxnDTO,
  WsError,
  WsHello,
  WsSync,
} from "@/lib/p2p-types";
import { P2P_WS_URL, formatTk, timeAgo } from "@/lib/p2p-client";
import { cn } from "@/lib/utils";

type MetricKey = "floatBalance" | "pending";
type DashMetrics = DashboardMetrics & { floatBalance: number; status: string };

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  PROBATION: "Probation",
  SUSPENDED: "Suspended",
  BANNED: "Banned",
};

function StatusPill({ value }: { value: string }) {
  const cls =
    value === "ACTIVE"
      ? "bg-brand/15 text-brand border-brand/30"
      : "bg-amber-500/15 text-amber-400 border-amber-500/30";
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        cls
      )}
    >
      {STATUS_LABEL[value] ?? value}
    </span>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-card p-4">
      <div className="flex items-center gap-2 text-white/40">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-[0.14em]">
          {label}
        </span>
      </div>
      <p
        className={cn(
          "mt-2 text-xl font-black tracking-tight",
          accent ? "text-brand" : "text-white"
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-white/40">{sub}</p>}
    </div>
  );
}

export function P2PDashboard({
  agent,
  onSignOut,
}: {
  agent: AgentDTO;
  onSignOut: () => void;
}) {
  const [queue, setQueue] = React.useState<TxnDTO[]>([]);
  const [history, setHistory] = React.useState<TxnDTO[]>([]);
  const [metrics, setMetrics] = React.useState<DashMetrics>({
    pending: 0,
    todayVolume: 0,
    todayCount: 0,
    successRate: Number(agent.successRate),
    avgResponseSec: agent.avgResponseSec,
    totalTxns: agent.totalTxns,
    floatBalance: agent.floatBalance,
    status: agent.status,
  });
  const [ledger, setLedger] = React.useState<LedgerRow[]>([]);
  const [wallets, setWallets] = React.useState<AgentWalletDTO[]>(agent.wallets);
  const [pendingTopups, setPendingTopups] = React.useState<
    { id: number; referenceId: string | null; amount: number; createdAt: string }[]
  >([]);
  const [wsConnected, setWsConnected] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  // modals
  const [showWallets, setShowWallets] = React.useState(false);
  const [showTopup, setShowTopup] = React.useState(false);
  const [showLedger, setShowLedger] = React.useState(false);
  const [confirmTxn, setConfirmTxn] = React.useState<TxnDTO | null>(null);
  const [denyTxn, setDenyTxn] = React.useState<TxnDTO | null>(null);

  // wallet form
  const [wType, setWType] = React.useState("bkash");
  const [wNumber, setWNumber] = React.useState("");
  const [wHolder, setWHolder] = React.useState("");
  // topup form
  const [topupAmount, setTopupAmount] = React.useState("");
  // confirm/deny forms
  const [cAmount, setCAmount] = React.useState("");
  const [cRef, setCRef] = React.useState("");
  const [cNote, setCNote] = React.useState("");
  const [dReason, setDReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const wsRef = React.useRef<WebSocket | null>(null);
  const retryRef = React.useRef(0);

  const refreshDashboard = React.useCallback(async () => {
    try {
      const res = await fetch("/api/p2p/dashboard", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load dashboard");
      setQueue(json.queue ?? []);
      setHistory(json.history ?? []);
      setLedger(json.ledger ?? []);
      setWallets(json.agent?.wallets ?? wallets);
      setPendingTopups(json.pendingTopups ?? []);
      setMetrics({
        ...(json.metrics ?? {}),
        floatBalance: json.agent?.floatBalance ?? metrics.floatBalance,
        status: json.agent?.status ?? metrics.status,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [wallets, metrics.floatBalance, metrics.status]);

  const connectWs = React.useCallback(() => {
    let closed = false;
    const wsRefHolder = { ws: null as WebSocket | null };
    (async () => {
      try {
        const res = await fetch("/api/p2p/wsticket", { method: "POST" });
        const json = await res.json();
        if (!res.ok || !json.ticket) {
          throw new Error(json.error ?? "No ticket");
        }
        const ws = new WebSocket(
          `${P2P_WS_URL}?ticket=${encodeURIComponent(json.ticket)}`
        );
        wsRefHolder.ws = ws;
        wsRef.current = ws;
        ws.onopen = () => {
          retryRef.current = 0;
          setWsConnected(true);
        };
        ws.onmessage = (ev) => {
          let msg: WsHello | WsSync | WsError;
          try {
            msg = JSON.parse(ev.data as string);
          } catch {
            return;
          }
          if (msg.type === "hello" || msg.type === "sync") {
            setQueue(msg.queue);
            setMetrics((prev) => ({
              ...prev,
              ...msg.metrics,
            }));
          } else if (msg.type === "error") {
            ws.close();
          }
        };
        ws.onclose = () => {
          setWsConnected(false);
          if (!closed) {
            retryRef.current += 1;
            const delay = Math.min(1000 * 2 ** retryRef.current, 15000);
            setTimeout(connectWs, delay);
          }
        };
        ws.onerror = () => ws.close();
      } catch {
        if (!closed) {
          retryRef.current += 1;
          const delay = Math.min(1000 * 2 ** retryRef.current, 15000);
          setTimeout(connectWs, delay);
        }
      }
    })();
    return () => {
      closed = true;
      if (wsRefHolder.ws) wsRefHolder.ws.close();
    };
  }, []);

  React.useEffect(() => {
    refreshDashboard();
    const cleanup = connectWs();
    const hb = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 20000);
    return () => {
      cleanup();
      clearInterval(hb);
    };
  }, [refreshDashboard, connectWs]);

  const post = async (path: string, body: unknown) => {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? "Request failed");
    return json;
  };

  const doConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmTxn || busy) return;
    setBusy(true);
    try {
      await post(`/api/p2p/transactions/${confirmTxn.id}/confirm`, {
        confirmedAmount: Number(cAmount),
        transactionId: cRef,
        note: cNote || undefined,
      });
      toast.success(`${formatTk(Number(cAmount))} confirmed`);
      setQueue((q) => q.filter((t) => t.id !== confirmTxn.id));
      setConfirmTxn(null);
      setCAmount("");
      setCRef("");
      setCNote("");
      refreshDashboard();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Confirm failed");
    } finally {
      setBusy(false);
    }
  };

  const doDeny = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!denyTxn || busy) return;
    setBusy(true);
    try {
      await post(`/api/p2p/transactions/${denyTxn.id}/deny`, {
        reason: dReason,
      });
      toast("Transaction denied");
      setQueue((q) => q.filter((t) => t.id !== denyTxn.id));
      setDenyTxn(null);
      setDReason("");
      refreshDashboard();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Deny failed");
    } finally {
      setBusy(false);
    }
  };

  const doAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const json = await post("/api/p2p/wallets", {
        walletType: wType,
        walletNumber: wNumber,
        holderName: wHolder,
      });
      setWallets((w) => [...w, json.wallet]);
      setWNumber("");
      setWHolder("");
      toast.success("Wallet bound (usable as primary in 24h)");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Add wallet failed");
    } finally {
      setBusy(false);
    }
  };

  const doRemoveWallet = async (id: number) => {
    try {
      await fetch(`/api/p2p/wallets/${id}`, { method: "DELETE" });
      setWallets((w) => w.filter((x) => x.id !== id));
      toast.success("Wallet removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed");
    }
  };

  const doSetPrimary = async (id: number) => {
    try {
      await post(`/api/p2p/wallets/${id}/primary`, {});
      setWallets((w) =>
        w.map((x) => ({ ...x, isPrimary: x.id === id }))
      );
      toast.success("Primary wallet updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const doTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const json = await post("/api/p2p/topup", {
        amount: Number(topupAmount),
      });
      toast.info(
        `Top-up ${json.topupId} submitted — pending admin approval`
      );
      setTopupAmount("");
      refreshDashboard();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Top-up failed");
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    await fetch("/api/p2p/logout", { method: "POST" }).catch(() => {});
    onSignOut();
  };

  const inputCls =
    "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-brand";

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-base font-black text-black">
              W
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-white">
                  {agent.agentCode}
                </span>
                <StatusPill value={metrics.status} />
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    wsConnected ? "bg-brand" : "bg-red-500"
                  )}
                />
                <span className={wsConnected ? "text-brand" : "text-red-400"}>
                  {wsConnected ? "Live" : "Reconnecting…"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshDashboard}
              title="Refresh"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={signOut}
              title="Sign out"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-5">
        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl border border-white/10 bg-card"
              />
            ))}
          </div>
        ) : (
          <>
            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricCard
                icon={<WalletIcon className="h-4 w-4" />}
                label="Float"
                value={formatTk(metrics.floatBalance)}
                sub={metrics.pending > 0 ? `${metrics.pending} in queue` : "available"}
                accent
              />
              <MetricCard
                icon={<TrendingUp className="h-4 w-4" />}
                label="Today"
                value={formatTk(metrics.todayVolume)}
                sub={`${metrics.todayCount} confirmed`}
              />
              <MetricCard
                icon={<Check className="h-4 w-4" />}
                label="Success"
                value={`${(metrics.successRate * 100).toFixed(0)}%`}
                sub={`${metrics.totalTxns} all-time`}
              />
              <MetricCard
                icon={<Activity className="h-4 w-4" />}
                label="Avg response"
                value={metrics.avgResponseSec ? `${metrics.avgResponseSec}s` : "—"}
                sub="last 50 matches"
              />
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowTopup(true)}
                className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-black transition-opacity hover:opacity-90"
              >
                <Landmark className="h-4 w-4" /> Top up float
              </button>
              <button
                onClick={() => setShowWallets(true)}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <WalletIcon className="h-4 w-4" /> Wallets
              </button>
              <button
                onClick={() => setShowLedger(true)}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Clock className="h-4 w-4" /> Float ledger
              </button>
            </div>

            {/* Queue */}
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-wider text-white/50">
                  Match queue
                </h2>
                <span className="rounded-full bg-brand/15 px-2 py-0.5 text-xs font-bold text-brand">
                  {queue.length}
                </span>
              </div>
              {queue.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-card p-8 text-center">
                  <p className="text-sm font-semibold text-white/40">
                    No pending matches — you&apos;re all caught up.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {queue.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-2xl border border-white/10 bg-card p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-white/40">
                              {t.id}
                            </span>
                            <span className="text-sm font-bold text-white">
                              {t.playerRef}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/50">
                            <span className="font-black text-brand">
                              {formatTk(t.requestedAmount)}
                            </span>
                            <span>·</span>
                            <span>matched {timeAgo(t.assignedAt)}</span>
                            <span>·</span>
                            <span
                              className={cn(
                                "font-semibold",
                                new Date(t.expiresAt).getTime() - Date.now() <
                                  120000
                                  ? "text-red-400"
                                  : "text-amber-400"
                              )}
                            >
                              expires in{" "}
                              {Math.max(
                                0,
                                Math.ceil(
                                  (new Date(t.expiresAt).getTime() -
                                    Date.now()) /
                                    60000
                                )
                              )}
                              m
                            </span>
                          </div>
                          {t.playerProof ? (
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-brand/20 bg-brand/5 px-3 py-2 text-xs text-white/60">
                              <span>
                                TXN:{" "}
                                <b className="font-mono text-white/80">
                                  {t.playerProof.transactionId}
                                </b>
                              </span>
                              <span>
                                From:{" "}
                                <b className="text-white/80">
                                  {t.playerProof.senderAccount}
                                </b>
                              </span>
                              {t.playerProof.note && (
                                <span className="italic">
                                  “{t.playerProof.note}”
                                </span>
                              )}
                            </div>
                          ) : (
                            <p className="mt-2 text-xs text-amber-400/80">
                              Waiting for player proof…
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button
                            onClick={() => {
                              setConfirmTxn(t);
                              setCAmount(String(t.requestedAmount));
                            }}
                            className="flex items-center gap-1 rounded-lg bg-brand px-3 py-2 text-xs font-bold text-black transition-opacity hover:opacity-90"
                          >
                            <Check className="h-3.5 w-3.5" /> Confirm
                          </button>
                          <button
                            onClick={() => {
                              setDenyTxn(t);
                              setDReason("");
                            }}
                            className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/20"
                          >
                            <X className="h-3.5 w-3.5" /> Deny
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* History */}
            <section>
              <h2 className="mb-2 text-sm font-black uppercase tracking-wider text-white/50">
                History
              </h2>
              {history.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-card p-8 text-center text-sm font-semibold text-white/30">
                  No completed matches yet.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-card">
                  <div className="divide-y divide-white/5">
                    {history.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-white/40">
                              {t.id}
                            </span>
                            <span className="font-bold text-white">
                              {t.playerRef}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-white/40">
                            {timeAgo(t.completedAt ?? t.assignedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                              t.status === "CONFIRMED"
                                ? "border-brand/30 bg-brand/15 text-brand"
                                : "border-red-500/30 bg-red-500/10 text-red-400"
                            )}
                          >
                            {t.status}
                          </span>
                          <span className="font-black text-white">
                            {formatTk(t.confirmedAmount ?? t.requestedAmount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Wallets modal */}
      {showWallets && (
        <Modal title="Your wallets" onClose={() => setShowWallets(false)}>
          <div className="space-y-3">
            <div className="space-y-2">
              {wallets.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase text-white">
                        {w.walletType}
                      </span>
                      {w.isPrimary && (
                        <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold text-brand">
                          PRIMARY
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-sm text-white/80">
                      {w.walletNumber}
                    </p>
                    <p className="text-xs text-white/40">{w.holderName}</p>
                    {!w.isPrimary &&
                      new Date(w.usableAfter).getTime() > Date.now() && (
                        <p className="text-[10px] text-amber-400/80">
                          usable as primary{" "}
                          {timeAgo(w.usableAfter).replace(" ago", "")} from now
                        </p>
                      )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {!w.isPrimary && (
                      <>
                        <button
                          onClick={() => doSetPrimary(w.id)}
                          className="rounded-lg border border-brand/30 bg-brand/10 px-2.5 py-1.5 text-xs font-bold text-brand transition-colors hover:bg-brand/20"
                        >
                          Make primary
                        </button>
                        <button
                          onClick={() => doRemoveWallet(w.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={doAddWallet} className="space-y-2 border-t border-white/10 pt-3">
              <p className="text-xs font-bold uppercase tracking-wider text-white/40">
                Bind a new wallet
              </p>
              <select
                className={cn(inputCls, "appearance-none")}
                value={wType}
                onChange={(e) => setWType(e.target.value)}
              >
                {["bkash", "nagad", "bank", "usdt", "usdc"].map((x) => (
                  <option key={x} value={x} className="bg-zinc-900">
                    {x}
                  </option>
                ))}
              </select>
              <input
                className={inputCls}
                placeholder="Wallet / account number"
                value={wNumber}
                onChange={(e) => setWNumber(e.target.value)}
              />
              <input
                className={inputCls}
                placeholder="Account holder name"
                value={wHolder}
                onChange={(e) => setWHolder(e.target.value)}
              />
              <button
                type="submit"
                disabled={busy || wNumber.length < 6}
                className="w-full rounded-lg bg-brand py-2 text-sm font-bold text-black disabled:opacity-40"
              >
                Bind wallet
              </button>
            </form>
          </div>
        </Modal>
      )}

      {/* Top-up modal */}
      {showTopup && (
        <Modal title="Top up your float" onClose={() => setShowTopup(false)}>
          <form onSubmit={doTopup} className="space-y-3">
            <p className="text-xs text-white/50">
              Send <b className="text-white">{formatTk(Number(topupAmount) || 0)}</b>{" "}
              to the site wallet shown on the admin side, then request a top-up.
              An admin approves it into your float. You can only match deposits
              you have float for.
            </p>
            <input
              className={inputCls}
              placeholder="Amount (৳500 – ৳50,000)"
              inputMode="numeric"
              value={topupAmount}
              onChange={(e) =>
                setTopupAmount(e.target.value.replace(/[^\d]/g, ""))
              }
            />
            <button
              type="submit"
              disabled={busy || Number(topupAmount) < 500}
              className="w-full rounded-lg bg-brand py-2 text-sm font-bold text-black disabled:opacity-40"
            >
              {busy ? "Submitting…" : "Request top-up"}
            </button>
            {pendingTopups.length > 0 && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200/80">
                <b>Awaiting approval:</b>
                <ul className="mt-1 space-y-0.5">
                  {pendingTopups.map((t) => (
                    <li key={t.id} className="flex justify-between font-mono">
                      <span>{t.referenceId}</span>
                      <span>{formatTk(t.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </form>
        </Modal>
      )}

      {/* Ledger modal */}
      {showLedger && (
        <Modal title="Float ledger" onClose={() => setShowLedger(false)}>
          {ledger.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/40">No movements yet.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {ledger.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between py-2.5 text-sm"
                >
                  <div>
                    <span className="text-xs font-bold text-white/70">
                      {l.txnType}
                    </span>
                    {l.referenceId && (
                      <p className="font-mono text-[10px] text-white/30">
                        {l.referenceId}
                      </p>
                    )}
                    {l.status === "PENDING" && (
                      <p className="text-[10px] font-bold text-amber-400">
                        pending approval
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span
                      className={cn(
                        "font-mono font-bold",
                        l.amount >= 0 ? "text-brand" : "text-red-400"
                      )}
                    >
                      {l.amount >= 0 ? "+" : ""}
                      {formatTk(l.amount)}
                    </span>
                    <p className="font-mono text-[10px] text-white/30">
                      → {formatTk(l.balanceAfter)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* Confirm modal */}
      {confirmTxn && (
        <Modal title="Confirm deposit" onClose={() => setConfirmTxn(null)}>
          <form onSubmit={doConfirm} className="space-y-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">{confirmTxn.playerRef}</span>
                <span className="font-bold text-white">
                  {confirmTxn.id}
                </span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-white/50">Requested</span>
                <span className="font-black text-brand">
                  {formatTk(confirmTxn.requestedAmount)}
                </span>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-white/50">
                Confirmed amount received
              </label>
              <input
                className={inputCls}
                inputMode="numeric"
                value={cAmount}
                onChange={(e) =>
                  setCAmount(e.target.value.replace(/[^\d.]/g, ""))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-white/50">
                Sender transaction ID
              </label>
              <input
                className={inputCls}
                value={cRef}
                onChange={(e) => setCRef(e.target.value)}
                placeholder="e.g. 8M7C2K9D1"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-white/50">
                Note (optional)
              </label>
              <input
                className={inputCls}
                value={cNote}
                onChange={(e) => setCNote(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={busy || !cAmount || cRef.length < 3}
              className="w-full rounded-lg bg-brand py-2.5 text-sm font-bold text-black disabled:opacity-40"
            >
              {busy ? "Confirming…" : "Confirm & credit player"}
            </button>
            <p className="flex items-center justify-center gap-1 text-center text-[11px] text-white/40">
              <ShieldCheck className="h-3 w-3 text-brand" />
              Your float is debited and the player&apos;s balance credited 1:1.
            </p>
          </form>
        </Modal>
      )}

      {/* Deny modal */}
      {denyTxn && (
        <Modal title="Deny deposit" onClose={() => setDenyTxn(null)}>
          <form onSubmit={doDeny} className="space-y-3">
            <p className="text-sm text-white/50">
              Denying{" "}
              <b className="text-white">
                {formatTk(denyTxn.requestedAmount)}
              </b>{" "}
              from {denyTxn.playerRef}? No money moves.
            </p>
            <textarea
              className={cn(inputCls, "min-h-[80px] resize-none")}
              placeholder="Reason (shown to the player, optional)"
              value={dReason}
              onChange={(e) => setDReason(e.target.value)}
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg border border-red-500/40 bg-red-500/15 py-2.5 text-sm font-bold text-red-300 disabled:opacity-40"
            >
              {busy ? "Denying…" : "Deny deposit"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl border border-white/10 bg-card p-5 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-black text-white">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
