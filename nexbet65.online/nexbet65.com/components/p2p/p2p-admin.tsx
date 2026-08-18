"use client";

import * as React from "react";
import { AlertTriangle, Check, RefreshCw, Users, Wallet, X } from "lucide-react";
import { toast } from "sonner";

import type { AdminOverviewResponse, EscalatedTxnDTO } from "@/lib/p2p-types";
import { formatTk } from "@/lib/p2p-client";
import { cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-card p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-white/40">{sub}</p>}
    </div>
  );
}

export function P2PAdmin() {
  const [data, setData] = React.useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busyTopup, setBusyTopup] = React.useState<number | null>(null);
  const [escalations, setEscalations] = React.useState<EscalatedTxnDTO[]>([]);
  const [busyEsc, setBusyEsc] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/p2p/overview", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      setData(json);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load overview");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEscalations = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/p2p/escalations", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) return;
      setEscalations(json.escalations ?? []);
    } catch {}
  }, []);

  React.useEffect(() => {
    load();
    loadEscalations();
    const t = setInterval(loadEscalations, 15000);
    return () => clearInterval(t);
  }, [load, loadEscalations]);

  const approve = async (ledgerId: number) => {
    setBusyTopup(ledgerId);
    try {
      const res = await fetch("/api/admin/p2p/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ledgerId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Approval failed");
      toast.success("Top-up approved");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setBusyTopup(null);
    }
  };

  const resolve = async (txnId: string, action: "approve" | "reject") => {
    setBusyEsc(txnId);
    try {
      const res = await fetch(
        `/api/admin/p2p/escalations/${txnId}/${action}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: undefined }),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Resolution failed");
      toast.success(action === "approve" ? "Approved — player credited" : "Rejected");
      load();
      loadEscalations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Resolution failed");
    } finally {
      setBusyEsc(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl border border-white/10 bg-card"
          />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-white">P2P Agents</h1>
        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Agents"
          value={String(data.stats.agents)}
          sub={`${data.stats.onlineAgents} online`}
        />
        <StatCard
          label="Volume (all-time)"
          value={formatTk(data.stats.totalVolume)}
          sub={`${formatTk(data.stats.volumeToday)} today`}
        />
        <StatCard
          label="Pending matches"
          value={String(data.stats.pendingTxns)}
          sub={`${data.stats.confirmedToday} confirmed today`}
        />
        <StatCard
          label="Float top-ups"
          value={String(data.stats.pendingTopups)}
          sub="awaiting approval"
        />
      </div>

      {/* Escalations */}
      {escalations.length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-black uppercase tracking-wider text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" /> Escalations ({escalations.length})
          </h2>
          <div className="space-y-2">
            {escalations.map((e) => (
              <div
                key={e.id}
                className="rounded-2xl border border-amber-500/20 bg-card p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-white/40">
                        {e.id}
                      </span>
                      <span className="text-sm font-bold text-white">
                        {e.playerRef}
                      </span>
                      {e.agentCode && (
                        <span className="font-mono text-xs text-white/40">
                          → {e.agentCode}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-white/40">
                      Requested{" "}
                      <span className="font-black text-brand">
                        {formatTk(e.requestedAmount)}
                      </span>{" "}
                      · sent{" "}
                      <span className="font-black text-white">
                        {e.playerProof?.sentAmount
                          ? formatTk(e.playerProof.sentAmount)
                          : "n/a"}
                      </span>
                      {" · "}
                      {e.playerProof?.transactionId && (
                        <>
                          <span className="font-mono">
                            {e.playerProof.transactionId}
                          </span>
                          {" · "}
                        </>
                      )}
                      <span className="font-mono">
                        {e.playerProof?.senderAccount ?? "no sender"}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-white/40">
                      Escalated {new Date(e.escalatedAt).toLocaleString()}
                      {e.playerProof?.screenshotUrl && (
                        <>
                          {" · "}
                          <a
                            href={e.playerProof.screenshotUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-brand underline"
                          >
                            view screenshot
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => resolve(e.id, "approve")}
                      disabled={busyEsc === e.id}
                      className="flex items-center gap-1 rounded-lg bg-brand px-3 py-2 text-xs font-bold text-black disabled:opacity-40"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {busyEsc === e.id ? "…" : "Approve & credit"}
                    </button>
                    <button
                      onClick={() => resolve(e.id, "reject")}
                      disabled={busyEsc === e.id}
                      className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400 disabled:opacity-40"
                    >
                      <X className="h-3.5 w-3.5" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pending top-ups */}
      {data.pendingTopups.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-black uppercase tracking-wider text-white/50">
            Pending float top-ups
          </h2>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-card">
            <div className="divide-y divide-white/5">
              {data.pendingTopups.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="h-4 w-4 text-amber-400" />
                    <div>
                      <p className="font-mono text-sm font-bold text-white">
                        {t.referenceId}
                      </p>
                      <p className="text-xs text-white/40">
                        {t.agentCode} ·{" "}
                        {new Date(t.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-brand">
                      {formatTk(t.amount)}
                    </span>
                    <button
                      onClick={() => approve(t.id)}
                      disabled={busyTopup === t.id}
                      className="flex items-center gap-1 rounded-lg bg-brand px-3 py-2 text-xs font-bold text-black disabled:opacity-40"
                    >
                      <Check className="h-3.5 w-3.5" />{" "}
                      {busyTopup === t.id ? "Approving…" : "Approve"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Agents */}
      <section>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-black uppercase tracking-wider text-white/50">
          <Users className="h-3.5 w-3.5" /> Agents
        </h2>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-card">
          <div className="divide-y divide-white/5">
            {data.agents.map((a) => (
              <div
                key={a.agentCode}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-white">
                      {a.agentCode}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
                        a.status === "ACTIVE"
                          ? "border-brand/30 bg-brand/15 text-brand"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                      )}
                    >
                      {a.status}
                    </span>
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        a.isOnline ? "bg-brand" : "bg-white/20"
                      )}
                    />
                  </div>
                  <p className="mt-0.5 text-xs text-white/40">
                    {a.walletTypes.join(" · ") || "no wallets"} · joined{" "}
                    {new Date(a.registeredAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-right text-xs">
                  <div>
                    <p className="text-white/40">Float</p>
                    <p className="font-black text-brand">
                      {formatTk(a.floatBalance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/40">Queue</p>
                    <p
                      className={cn(
                        "font-black",
                        a.pendingCount > 0 ? "text-amber-400" : "text-white"
                      )}
                    >
                      {a.pendingCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/40">Success</p>
                    <p className="font-black text-white">
                      {(a.successRate * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-white/40">Total</p>
                    <p className="font-black text-white">{a.totalTxns}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent txns */}
      <section>
        <h2 className="mb-2 text-sm font-black uppercase tracking-wider text-white/50">
          Recent matches
        </h2>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-card">
          <div className="divide-y divide-white/5">
            {data.recentTxns.slice(0, 30).map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <span className="font-mono text-xs text-white/40">
                    {t.id}
                  </span>
                  <span className="ml-2 font-bold text-white">
                    {t.playerRef}
                  </span>
                  {t.agentCode && (
                    <span className="ml-2 font-mono text-xs text-white/40">
                      → {t.agentCode}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
                      t.status === "CONFIRMED"
                        ? "border-brand/30 bg-brand/15 text-brand"
                        : t.status === "PENDING"
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
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
            {data.recentTxns.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-white/30">
                No matches yet.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
