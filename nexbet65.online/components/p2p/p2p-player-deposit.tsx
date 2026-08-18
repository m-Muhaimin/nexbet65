"use client";

import * as React from "react";
import {
  ArrowRight,
  Check,
  Copy,
  Loader2,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import type { PlayerP2PTxnDTO } from "@/lib/p2p-types";
import { formatTk } from "@/lib/p2p-client";
import { cn } from "@/lib/utils";

const MIN = 100;
const MAX = 10000;
const POLL_MS = 4000;
const METHODS = [
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "bank", label: "Bank" },
  { value: "usdt", label: "USDT" },
  { value: "usdc", label: "USDC" },
] as const;

type WalletInfo = {
  walletType: string;
  walletNumber: string;
  holderName: string;
};

const STEPS = [
  { n: 1, label: "Method + Amount" },
  { n: 2, label: "Matching P2P agent" },
  { n: 3, label: "Confirm the transfer" },
] as const;

type Step = "idle" | "matching" | "matched" | "proof" | "done";

function stepState(step: Step): { active: number; done: number } {
  switch (step) {
    case "idle":
      return { active: 1, done: 0 };
    case "matching":
      return { active: 2, done: 1 };
    case "matched":
      return { active: 3, done: 2 };
    case "proof":
      return { active: 3, done: 2 };
    case "done":
      return { active: 3, done: 3 };
  }
}

function Stepper({
  step,
  onGoTo,
}: {
  step: Step;
  onGoTo?: (n: number) => void;
}) {
  const { active, done } = stepState(step);
  const locked = step === "proof" || step === "matching";
  return (
    <ol className="mt-4 flex items-center gap-2">
      {STEPS.map((s, i) => {
        const isDone = s.n <= done;
        const isActive = s.n === active;
        const clickable = !!onGoTo && !locked && s.n === 1 && s.n < active;
        return (
          <li key={s.n} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onGoTo(s.n)}
              className={cn("flex items-center gap-2", clickable && "cursor-pointer")}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black transition",
                  isDone
                    ? "bg-brand text-black"
                    : isActive
                      ? "border-2 border-brand text-brand"
                      : "border border-white/10 text-white/30"
                )}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : s.n}
              </span>
              <span
                className={cn(
                  "hidden whitespace-nowrap text-[11px] font-bold sm:inline",
                  isDone || isActive ? "text-white" : "text-white/30"
                )}
              >
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  "h-px flex-1 transition",
                  s.n < done ? "bg-brand/60" : "bg-white/10"
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function P2PPlayerDeposit() {
  const [step, setStep] = React.useState<Step>("idle");
  const [amount, setAmount] = React.useState("");
  const [method, setMethod] = React.useState<string>("bkash");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [wallet, setWallet] = React.useState<WalletInfo | null>(null);
  const [txn, setTxn] = React.useState<PlayerP2PTxnDTO | null>(null);
  const [copied, setCopied] = React.useState(false);

  const [proofTxnId, setProofTxnId] = React.useState("");
  const [proofSender, setProofSender] = React.useState("");
  const [proofAmount, setProofAmount] = React.useState("");
  const [proofScreenshot, setProofScreenshot] = React.useState("");
  const [proofNote, setProofNote] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  const pollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = React.useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  React.useEffect(() => stopPolling, [stopPolling]);

  const refreshStatus = React.useCallback(async () => {
    try {
      const res = await fetch("/api/p2p/deposits", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.deposits) return;
      const latest = json.deposits[0] as PlayerP2PTxnDTO | undefined;
      if (!latest) return;
      setTxn(latest);
      if (latest.status === "CONFIRMED" || latest.status === "ADMIN_APPROVED") {
        stopPolling();
        setStep("done");
        toast.success(`${formatTk(latest.confirmedAmount ?? latest.requestedAmount)} credited`);
      } else if (
        latest.status === "DENIED" ||
        latest.status === "EXPIRED" ||
        latest.status === "ADMIN_REJECTED"
      ) {
        stopPolling();
        setStep("idle");
        setTxn(null);
        setWallet(null);
        setSubmitted(false);
        toast.error(
          latest.status === "DENIED"
            ? "The agent denied this deposit — no money moved."
            : latest.status === "ADMIN_REJECTED"
              ? "Support rejected this deposit — no money moved."
              : "This deposit expired without a response. Try again."
        );
      } else if (latest.status === "ESCALATED") {
        toast.warning("Escalated to support — they'll resolve it shortly.", { id: "p2p-escalated" });
      }
    } catch {}
  }, [stopPolling]);

  const startMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    setStep("matching");
    try {
      const res = await fetch("/api/p2p/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), method }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStep("idle");
        throw new Error(json.error ?? "Deposit failed");
      }
      setWallet(json.wallet);
      setTxn(json.txn);
      setStep("matched");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deposit failed");
    } finally {
      setBusy(false);
    }
  };

  const submitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !txn) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/p2p/deposit/proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txnId: txn.id,
          transactionId: proofTxnId,
          senderAccount: proofSender,
          sentAmount: proofAmount ? Number(proofAmount) : undefined,
          screenshotUrl: proofScreenshot || undefined,
          note: proofNote || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Submit failed");
      setSubmitted(true);
      setStep("proof");
      pollRef.current = setInterval(refreshStatus, POLL_MS);
      refreshStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setBusy(false);
    }
  };

  const copyNumber = async () => {
    if (!wallet) return;
    await navigator.clipboard.writeText(wallet.walletNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success("Wallet number copied");
  };

  const goToStep1 = () => {
    stopPolling();
    setStep("idle");
    setWallet(null);
    setTxn(null);
    setError(null);
    setSubmitted(false);
  };

  const reset = () => {
    stopPolling();
    setStep("idle");
    setAmount("");
    setWallet(null);
    setTxn(null);
    setError(null);
    setSubmitted(false);
    setProofTxnId("");
    setProofSender("");
    setProofAmount("");
    setProofScreenshot("");
    setProofNote("");
  };

  const inputCls =
    "h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-sm text-white placeholder:text-white/30 focus:border-brand/50 focus:outline-none";

  const sectionTitle = (title: string, sub: string) => (
    <div className="mt-4">
      <h5 className="text-sm font-black text-white">{title}</h5>
      <p className="text-xs text-white/40">{sub}</p>
    </div>
  );

  if (step === "done" && txn) {
    return (
      <div className="rounded-2xl border border-brand/30 bg-brand/5 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand/15 text-brand">
          <Check className="h-6 w-6" />
        </div>
        <h4 className="mt-3 text-lg font-black text-white">Deposit confirmed</h4>
        <p className="mt-1 text-sm text-white/50">
          {formatTk(txn.confirmedAmount ?? txn.requestedAmount)} was credited to
          your wallet instantly.
        </p>
        <button
          onClick={reset}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-black hover:brightness-110"
        >
          New P2P deposit <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
          <Zap className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-black text-white">
            Fast deposit via P2P agent
          </h4>
          <p className="text-xs text-white/40">
            No KYC · instant agent match · credited on confirmation
          </p>
        </div>
      </div>

      <Stepper step={step} onGoTo={(n) => n === 1 && goToStep1()} />

      {step === "idle" && (
        <>
          {sectionTitle(
            "Step 1 · Pick a payment method and amount",
            "Your matched agent's wallet must match this method."
          )}
          <form onSubmit={startMatch} className="mt-3 space-y-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                className={inputCls}
                placeholder={`Amount (${formatTk(MIN)} – ${formatTk(MAX)})`}
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
              />
              <button
                type="submit"
                disabled={busy || Number(amount) < MIN || Number(amount) > MAX}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-sm font-black text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Find agent"}
              </button>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-white/40">
                Payment method
              </p>
              <div className="flex flex-wrap gap-2">
                {METHODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMethod(m.value)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-bold transition",
                      method === m.value
                        ? "border-brand bg-brand/15 text-brand"
                        : "border-white/10 bg-white/5 text-white/50 hover:text-white"
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="text-xs font-semibold text-red-400">{error}</p>}
          </form>
        </>
      )}

      {step === "matching" && (
        <>
          {sectionTitle(
            "Step 2 · Matching P2P agent",
            "Holding your slot — this takes a second."
          )}
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-brand" />
            <div>
              <p className="text-sm font-bold text-white">
                {amount
                  ? `Finding an agent for ${formatTk(Number(amount))} via ${method}`
                  : "Finding an agent…"}
              </p>
              <p className="text-xs text-white/40">
                The fastest available {method} agent will be matched to you.
              </p>
            </div>
          </div>
        </>
      )}

      {step === "matched" && wallet && txn && (
        <>
          {sectionTitle(
            "Step 2 · Agent matched",
            "Send the money to this agent wallet before it expires."
          )}
          <div className="mt-3 space-y-3">
            <div className="rounded-xl border border-brand/20 bg-brand/5 p-4">
              <div className="flex items-center justify-between text-xs text-white/50">
                <span className="inline-flex items-center gap-1.5 font-mono font-bold text-brand">
                  <Users className="h-3.5 w-3.5" /> {txn.agentCode ?? "AGENT"}
                </span>
                <span>{formatTk(txn.requestedAmount)}</span>
              </div>
              <p className="mt-2 text-sm font-bold text-white">
                Send {formatTk(txn.requestedAmount)} to
              </p>
              <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/40 px-3 py-2.5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                    <Wallet className="mr-1 inline h-3 w-3" />
                    {wallet.walletType} · {wallet.holderName}
                  </p>
                  <p className="font-instrument text-lg font-black text-brand">
                    {wallet.walletNumber}
                  </p>
                </div>
                <button
                  onClick={copyNumber}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 hover:text-white"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-brand" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-white/40">
                Ref: <span className="font-mono">{txn.referenceCode ?? txn.id}</span> · expires in{" "}
                {Math.max(
                  0,
                  Math.ceil((new Date(txn.expiresAt).getTime() - Date.now()) / 60000)
                )}{" "}
                min
              </p>
            </div>

            <button
              type="button"
              onClick={() => setStep("proof")}
              className="w-full rounded-xl bg-brand py-3 text-sm font-black text-black transition hover:brightness-110"
            >
              I've sent the money — continue
            </button>

            <button
              type="button"
              onClick={goToStep1}
              className="w-full text-xs font-semibold text-white/40 transition-colors hover:text-white"
            >
              Change method or amount
            </button>
          </div>
        </>
      )}

      {step === "proof" && wallet && txn && (
        <>
          {submitted ? (
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200/80">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                {txn.status === "ESCALATED"
                  ? "Escalated to support — they'll verify and credit your balance shortly."
                  : "Proof received — waiting for the agent to confirm your transfer…"}
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white/50">
                <div className="flex items-center justify-between">
                  <span>
                    Sending to{" "}
                    <span className="font-mono text-brand">
                      {wallet.walletType} · {wallet.walletNumber}
                    </span>
                  </span>
                  <span>{formatTk(txn.requestedAmount)}</span>
                </div>
                <p className="mt-1.5">
                  Ref: <span className="font-mono">{txn.referenceCode ?? txn.id}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={reset}
                className="w-full text-xs font-semibold text-white/40 transition-colors hover:text-white"
              >
                Cancel deposit
              </button>
            </div>
          ) : (
            <>
              {sectionTitle(
                "Step 3 · Confirm the transfer",
                "Enter the exact details so the agent can verify your payment."
              )}
              <form onSubmit={submitProof} className="mt-3 space-y-3">
                <input
                  className={inputCls}
                  placeholder="Sender transaction ID / reference"
                  value={proofTxnId}
                  onChange={(e) => setProofTxnId(e.target.value)}
                />
                <input
                  className={inputCls}
                  placeholder="Your sender account number"
                  value={proofSender}
                  onChange={(e) => setProofSender(e.target.value)}
                />
                <input
                  className={inputCls}
                  placeholder={`Amount you sent (${formatTk(MIN)} – ${formatTk(MAX)})`}
                  inputMode="numeric"
                  value={proofAmount}
                  onChange={(e) => setProofAmount(e.target.value.replace(/[^\d.]/g, ""))}
                />
                <input
                  className={inputCls}
                  placeholder="Screenshot / receipt image URL (optional)"
                  value={proofScreenshot}
                  onChange={(e) => setProofScreenshot(e.target.value)}
                />
                <input
                  className={inputCls}
                  placeholder="Note (optional)"
                  value={proofNote}
                  onChange={(e) => setProofNote(e.target.value)}
                />
                {error && <p className="text-xs font-semibold text-red-400">{error}</p>}
                <button
                  type="submit"
                  disabled={busy || proofTxnId.length < 3 || proofSender.length < 3}
                  className="w-full rounded-xl bg-brand py-3 text-sm font-black text-black transition hover:brightness-110 disabled:opacity-40"
                >
                  {busy ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  ) : (
                    "Submit confirmation"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("matched")}
                  className="w-full text-xs font-semibold text-white/40 transition-colors hover:text-white"
                >
                  Back to agent wallet
                </button>
              </form>
            </>
          )}
        </>
      )}

      {step === "matched" && (
        <button
          onClick={reset}
          className="mt-3 text-xs font-semibold text-white/40 transition-colors hover:text-white"
        >
          Cancel deposit
        </button>
      )}
    </div>
  );
}
