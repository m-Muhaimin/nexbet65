"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/games";
import { useWallet } from "@/lib/wallet-store";
import { RecentTransactions } from "@/components/wallet/transaction-history";
import { PaymentMethodIcon } from "@/components/wallet/payment-icons";
import { P2PPlayerDeposit } from "@/components/p2p/p2p-player-deposit";

type Method = {
  id: string;
  label: string;
  icon: string;
  accountLabel: string;
  account: string;
  holder: string;
  note?: string;
  qrImage?: string;
  instructions: string[];
  min: number;
  max: number;
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
};

type MethodsResponse = {
  methods: Method[];
  presets: number[];
};

type Tab = "deposit" | "withdraw";

const STEP_LABELS = ["Method", "Amount", "Pay & Confirm"];

function isStableCoin(m: Method | null | undefined): boolean {
  return m?.id === "usdt" || m?.id === "usdc";
}

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

export function WalletPageView({ initialTab }: { initialTab: Tab }) {
  const { balance, lockedBonus, withdrawable, refresh: refreshWallet } = useWallet();
  const [tab, setTab] = useState<Tab>(initialTab);

  const [methods, setMethods] = useState<Method[]>([]);
  const [presets, setPresets] = useState<number[]>([500, 1000, 1500]);
  const [requests, setRequests] = useState<RequestDTO[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  // Withdraw flow
  const [wStep, setWStep] = useState(1);
  const [wMethod, setWMethod] = useState<Method | null>(null);
  const [wAmount, setWAmount] = useState<number | "">(500);
  const [wCustom, setWCustom] = useState(false);
  const [wAccount, setWAccount] = useState("");
  const [wSubmitting, setWSubmitting] = useState(false);
  const [wDone, setWDone] = useState<RequestDTO | null>(null);

  const loadedRef = useRef(false);

  const loadMeta = useCallback(async () => {
    setLoadingMeta(true);
    try {
      const [metaRes, histRes] = await Promise.all([
        fetch("/api/payments/methods", { cache: "no-store" }),
        fetch("/api/payments/history", { cache: "no-store" }),
      ]);
      if (metaRes.ok) {
        const meta = (await metaRes.json()) as MethodsResponse;
        setMethods(meta.methods);
        setPresets(meta.presets);
      }
      if (histRes.ok) {
        const hist = (await histRes.json()) as { requests: RequestDTO[] };
        setRequests(hist.requests);
      }
    } catch {
      toast.error("Could not load payment options");
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      void loadMeta();
    }
  }, [loadMeta]);

  // Sync the open tab with the URL (?tab=deposit|withdraw) so the mobile bottom
  // nav can deep-link into the deposit / withdraw flow even while mounted.
  useEffect(() => {
    setTab(initialTab);
    setWStep(1);
    setWDone(null);
  }, [initialTab]);

  const selectTab = (next: Tab) => {
    setTab(next);
    setWStep(1);
    setWDone(null);
  };

  const amountValid = (method: Method, amount: number | ""): amount is number =>
    typeof amount === "number" && amount >= method.min && amount <= method.max;

  const submitWithdraw = async () => {
    if (!wMethod || !amountValid(wMethod, wAmount) || wAccount.trim().length < 4) {
      toast.error("Please fill in all fields and check the amount range");
      return;
    }
    setWSubmitting(true);
    try {
      const res = await fetch("/api/payments/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: wMethod.id,
          amount: wAmount,
          senderAccount: wAccount.trim(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        request?: RequestDTO;
      };
      if (!res.ok || !data.request) {
        toast.error(data.error ?? "Withdrawal could not be submitted");
        return;
      }
      setWDone(data.request);
      await loadMeta();
    } catch {
      toast.error("Withdrawal could not be submitted");
    } finally {
      setWSubmitting(false);
    }
  };

  const balanceNum = balance ?? 0;
  const lockedNum = lockedBonus ?? 0;
  const withdrawableNum = withdrawable ?? Math.max(0, balanceNum - lockedNum);

  const methodGrid = (
    selected: Method | null,
    onSelect: (m: Method) => void
  ) => (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {methods.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onSelect(m)}
          className={cn(
            "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all",
            selected?.id === m.id
              ? "border-brand/60 bg-brand/10 shadow-[0_0_15px_rgba(163,230,53,0.15)]"
              : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10"
          )}
        >
          <PaymentMethodIcon id={m.id} className="h-9 w-9" />
          <span
            className={cn(
              "text-sm font-semibold",
              selected?.id === m.id ? "text-brand" : "text-white/80"
            )}
          >
            {m.label}
          </span>
        </button>
      ))}
    </div>
  );

  const amountPicker = (
    method: Method,
    value: number | "",
    custom: boolean,
    setValue: (n: number | "") => void,
    setCustom: (b: boolean) => void,
    maxOverride?: number
  ) => {
    const effectiveMax = maxOverride === undefined ? method.max : Math.min(method.max, maxOverride);
    return (
      <div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
          {presets.map((p) => {
            const disabled = p > effectiveMax;
            return (
              <button
                key={p}
                type="button"
                disabled={disabled}
                onClick={() => {
                  setCustom(false);
                  setValue(p);
                }}
                className={cn(
                  "rounded-xl border px-4 py-3 font-instrument text-lg font-black transition-all",
                  !custom && value === p
                    ? "border-brand/60 bg-brand/10 text-brand"
                    : "border-white/10 bg-white/5 text-white hover:border-white/25",
                  disabled && "cursor-not-allowed opacity-30"
                )}
              >
                {formatMoney(p)}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setCustom(true)}
            className={cn(
              "rounded-xl border px-4 py-3 font-instrument text-lg font-black transition-all",
              custom
                ? "border-brand/60 bg-brand/10 text-brand"
                : "border-white/10 bg-white/5 text-white hover:border-white/25"
            )}
          >
            Custom
          </button>
        </div>
        {custom && (
          <div className="mt-3">
            <input
              type="number"
              min={method.min}
              max={effectiveMax}
              placeholder={`Enter amount (${method.min}–${effectiveMax})`}
              value={value === "" ? "" : String(value)}
              onChange={(e) =>
                setValue(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 font-instrument text-lg font-bold text-white focus:border-brand/50 focus:outline-none"
            />
          </div>
        )}
        <div className="mt-3 text-xs text-white/40">
          Min {formatMoney(method.min)} · Max {formatMoney(effectiveMax)}
        </div>
      </div>
    );
  };

  const renderDeposit = () => {
    return <P2PPlayerDeposit />;
  };

  const renderWithdraw = () => {
    if (wDone) {
      return (
        <div className="rounded-2xl border border-brand/30 bg-brand/5 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand/15 text-brand">
            <Check className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-xl font-extrabold">Withdrawal requested</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/50">
            {formatMoney(wDone.amount)} will be sent to your{" "}
            {wDone.method?.label ?? "payout method"} account once an admin
            approves the request.
          </p>
          <button
            type="button"
            onClick={() => {
              setWDone(null);
              setWStep(1);
              setWMethod(null);
              setWAmount(500);
              setWCustom(false);
              setWAccount("");
            }}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-black text-black transition hover:brightness-110"
          >
            New withdrawal <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          {STEP_LABELS.map((label, i) => {
            const step = i + 1;
            const done = step < wStep;
            const active = step === wStep;
            return (
              <div key={label} className="flex flex-1 items-center gap-2">
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                    done && "border-brand/60 bg-brand/15 text-brand",
                    active && "border-brand bg-brand text-black",
                    !done && !active && "border-white/15 text-white/40"
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : step}
                </div>
                <span
                  className={cn(
                    "hidden text-xs font-semibold sm:block",
                    active ? "text-brand" : done ? "text-white/70" : "text-white/40"
                  )}
                >
                  {label}
                </span>
                {step < STEP_LABELS.length && (
                  <div
                    className={cn(
                      "h-px flex-1",
                      step < wStep ? "bg-brand/50" : "bg-white/10"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {wStep === 1 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/50">
              Select payout method
            </h3>
            {methodGrid(wMethod, (m) => {
              setWMethod(m);
              setWStep(2);
            })}
          </div>
        )}

        {wStep === 2 && wMethod && (
          <div>
            <button
              type="button"
              onClick={() => setWStep(1)}
              className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-white/50 hover:text-white"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Change method
            </button>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/50">
              Select amount · {wMethod.label}
            </h3>
            {amountPicker(
              wMethod,
              wAmount,
              wCustom,
              setWAmount,
              setWCustom,
              Math.max(0, Math.floor(withdrawableNum))
            )}
            <div className="mt-3 flex items-center justify-between text-xs text-white/40">
              <span>Withdrawable balance</span>
              <span className="font-instrument font-bold text-white/70">
                {formatMoney(withdrawableNum)}
              </span>
            </div>
            {lockedNum > 0 && (
              <p className="mt-2 rounded-lg border border-brand/20 bg-brand/5 px-3 py-2 text-xs text-white/60">
                <span className="font-semibold text-brand">
                  {formatMoney(lockedNum)}
                </span>{" "}
                of your balance is a first-deposit bonus and can&apos;t be withdrawn — use it to play instead.
              </p>
            )}
            <button
              type="button"
              onClick={() => amountValid(wMethod, wAmount) && setWStep(3)}
              disabled={
                !amountValid(wMethod, wAmount) ||
                Number(wAmount) > Math.floor(withdrawableNum)
              }
              className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand text-sm font-black uppercase tracking-wider text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-8"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {wStep === 3 && wMethod && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setWStep(2)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-white/50 hover:text-white"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Change amount
            </button>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">
                Withdraw {formatMoney(wAmount === "" ? 0 : wAmount)} to
              </p>
              <p className="mt-1 font-instrument text-lg font-black text-brand">
                {wMethod.accountLabel}
              </p>
              <p className="mt-1 text-xs text-white/50">
                Enter the account where the admin should send your payout.
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-white/50">
                Your {wMethod.label} account / wallet
              </label>
              <input
                type="text"
                placeholder={
                  isStableCoin(wMethod)
                    ? "Solana wallet address"
                    : wMethod.id === "bank"
                      ? "Bank account number"
                      : "Phone number"
                }
                value={wAccount}
                onChange={(e) => setWAccount(e.target.value)}
                className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-sm text-white focus:border-brand/50 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => void submitWithdraw()}
              disabled={wSubmitting || wAccount.trim().length < 4}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand text-sm font-black uppercase tracking-wider text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-8"
            >
              {wSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Request Withdraw
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3 sm:space-y-5">
      <div className="grid items-start gap-3 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-3 sm:space-y-5">
          <div className="flex gap-1 rounded-xl border border-white/10 bg-[#111] p-1">
            {(
              [
                { id: "deposit", label: "Deposit" },
                { id: "withdraw", label: "Withdraw" },
              ] as { id: Tab; label: string }[]
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => selectTab(t.id)}
                className={cn(
                  "flex-1 rounded-lg px-4 py-2.5 text-sm font-bold uppercase tracking-wider transition-all",
                  tab === t.id
                    ? "bg-brand text-black"
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#111] p-3 sm:p-5">
            {loadingMeta ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-white/40">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading payment options…
              </div>
            ) : tab === "deposit" ? (
              renderDeposit()
            ) : (
              renderWithdraw()
            )}
          </div>

          {/* Request history */}
          <div className="rounded-2xl border border-white/5 bg-[#111]">
            <div className="flex items-center justify-between border-b border-white/5 p-4">
              <h3 className="font-bold">My requests</h3>
              <button
                type="button"
                onClick={() => {
                  void loadMeta();
                  void refreshWallet();
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-white/50 transition hover:text-brand"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
              {requests.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-white/40">
                  No deposits or withdrawals yet.
                </p>
              )}
              {requests.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2">
                      <span className="font-semibold capitalize">{r.type}</span>
                      <StatusBadge status={r.status} />
                    </p>
                    <p className="mt-0.5 truncate text-xs text-white/40">
                      <span className="inline-flex items-center gap-1.5">
                        <PaymentMethodIcon
                          id={r.method?.id}
                          className="inline-block h-3.5 w-3.5"
                        />
                        {r.method?.label ?? "—"}
                      </span>
                      {r.transactionId ? ` · TX ${r.transactionId}` : ""}
                      {r.senderAccount ? ` · ${r.senderAccount}` : ""}
                      {r.firstDepositBonus !== null && (
                        <span className="text-brand">
                          {" "}· +{formatMoney(r.firstDepositBonus)} bonus
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/30">
                      {new Date(r.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-instrument font-black tabular-nums text-white">
                      {r.type === "deposit" ? "+" : "−"}
                      {formatMoney(r.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-3 sm:space-y-5 lg:sticky lg:top-16">
          <RecentTransactions />
        </aside>
      </div>
    </div>
  );
}
