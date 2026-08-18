"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Loader2, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";

import { formatMoney } from "@/lib/games";
import { cn } from "@/lib/utils";

type Method = {
  id: string;
  label: string;
  icon: string;
};

type RequestDTO = {
  id: string;
  type: "deposit" | "withdraw";
  method: Method | null;
  amount: number;
  status: "pending" | "approved" | "rejected";
  transactionId: string | null;
  senderAccount: string | null;
  firstDepositBonus: number | null;
  approvedAt: string | null;
  createdAt: string;
  username: string;
};

type Filter = "pending" | "approved" | "rejected";

const FILTERS: { id: Filter | "all"; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

function StatusBadge({ status }: { status: RequestDTO["status"] }) {
  const map = {
    pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    approved: "bg-brand/15 text-brand border-brand/30",
    rejected: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        map[status]
      )}
    >
      {status}
    </span>
  );
}

export function PaymentsAdmin() {
  const [filter, setFilter] = useState<Filter | "all">("pending");
  const [requests, setRequests] = useState<RequestDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const prevIdsRef = useRef<Set<string>>(new Set());

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      try {
        const qs = filter === "all" ? "" : `?status=${filter}`;
        const res = await fetch(`/api/admin/payments${qs}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load");
        const data = (await res.json()) as { requests: RequestDTO[] };
        const prevIds = prevIdsRef.current;
        const newcomers = data.requests.filter(
          (r) => !prevIds.has(r.id) && r.status === "pending"
        );
        if (newcomers.length > 0) {
          setNewIds(new Set(newcomers.map((r) => r.id)));
        }
        prevIdsRef.current = new Set(data.requests.map((r) => r.id));
        setRequests(data.requests);
        setLive(true);
      } catch {
        if (!opts?.silent) toast.error("Could not load payment requests");
      } finally {
        setLoading(false);
      }
    },
    [filter]
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.hidden) return;
      void load({ silent: true });
    }, 5000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (newIds.size === 0) return;
    const t = setTimeout(() => setNewIds(new Set()), 2500);
    return () => clearTimeout(t);
  }, [newIds]);

  const review = async (id: string, action: "approve" | "reject") => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Action failed");
        return;
      }
      toast.success(action === "approve" ? "Request approved" : "Request rejected");
      await load();
    } catch {
      toast.error("Action failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl border border-white/10 bg-[#111] p-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all",
                filter === f.id
                  ? "bg-brand text-black"
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {live && (
            <span className="flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-brand">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand" />
              </span>
              Live
            </span>
          )}
          <button
            type="button"
            onClick={() => void load()}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-xs font-semibold text-white/60 transition hover:border-brand/40 hover:text-brand"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#111]">
        <div className="hidden grid-cols-[auto_1fr_auto] gap-3 border-b border-white/5 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white/30 sm:grid">
          <span className="w-48">Request</span>
          <span>Details</span>
          <span className="text-right">Amount / Actions</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-white/40">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading requests…
          </div>
        ) : requests.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-white/40">
            No {filter === "all" ? "" : filter + " "}requests.
          </p>
        ) : (
          <ul className="divide-y divide-white/5">
            {requests.map((r) => (
              <li
                key={r.id}
                className={cn(
                  "flex flex-wrap items-center gap-3 px-4 py-3",
                  newIds.has(r.id) && "bg-brand/[0.04] ring-1 ring-inset ring-brand/30"
                )}
              >
                <div className="w-full sm:w-48">
                  <p className="flex items-center gap-2">
                    <span className="truncate font-semibold">{r.username}</span>
                  </p>
                  <p className="mt-0.5 flex items-center gap-2 text-[11px]">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                        r.type === "deposit"
                          ? "bg-brand/15 text-brand"
                          : "bg-amber-500/15 text-amber-400"
                      )}
                    >
                      {r.type}
                    </span>
                    <span className="text-white/40">
                      {r.method?.icon} {r.method?.label ?? "—"}
                    </span>
                  </p>
                </div>

                <div className="min-w-0 flex-1 text-xs text-white/50">
                  <p className="font-instrument font-bold text-white">
                    {formatMoney(r.amount)}
                    {r.firstDepositBonus !== null && (
                      <span className="ml-2 font-semibold text-brand">
                        + {formatMoney(r.firstDepositBonus)} bonus
                      </span>
                    )}
                  </p>
                  {r.type === "deposit" && r.transactionId && (
                    <p className="mt-0.5 truncate">
                      TX <span className="text-white/70">{r.transactionId}</span>
                      {r.senderAccount ? (
                        <>
                          {" "}· from <span className="text-white/70">{r.senderAccount}</span>
                        </>
                      ) : null}
                    </p>
                  )}
                  {r.type === "withdraw" && r.senderAccount && (
                    <p className="mt-0.5 truncate">
                      To <span className="text-white/70">{r.senderAccount}</span>
                    </p>
                  )}
                  <p className="mt-0.5 text-[10px] text-white/30">
                    {new Date(r.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status} />
                  {r.status === "pending" && (
                    <>
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => void review(r.id, "approve")}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {busyId === r.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => void review(r.id, "reject")}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
