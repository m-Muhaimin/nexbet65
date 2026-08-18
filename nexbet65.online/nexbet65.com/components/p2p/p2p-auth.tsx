"use client";

import * as React from "react";
import { AlertTriangle, ArrowLeft, Copy, KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import type { AgentDTO } from "@/lib/p2p-types";
import { computeDeviceFingerprint } from "@/lib/p2p-client";
import { cn } from "@/lib/utils";

const WALLET_TYPES = ["bkash", "nagad", "bank", "usdt", "usdc"] as const;

type Mode = "signin" | "register" | "recover";

function Logo() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-xl font-black text-black shadow-[0_0_30px_rgba(163,230,53,0.35)]">
        W
      </div>
      <div className="text-center">
        <h1 className="text-xl font-black tracking-tight text-white">
          WIN<span className="text-brand"> 111</span> P2P Agent
        </h1>
        <p className="mt-1 text-xs text-white/40">
          Zero-verification deposit matching · BDT
        </p>
      </div>
    </div>
  );
}

function RecoveryKeyModal({
  recoveryKey,
  onDone,
}: {
  recoveryKey: string;
  onDone: () => void;
}) {
  const [copied, setCopied] = React.useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-brand/30 bg-card p-6 shadow-2xl">
        <div className="flex items-center gap-2 text-brand">
          <KeyRound className="h-5 w-5" />
          <h2 className="text-lg font-black">Save your recovery key</h2>
        </div>
        <p className="mt-2 text-sm text-white/50">
          This key is shown <b className="text-white">once</b>. If you ever lose
          your password or change device, it is the only way to recover your
          account.
        </p>
        <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-4 text-center">
          <code className="break-all font-mono text-lg font-bold tracking-widest text-brand">
            {recoveryKey}
          </code>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(recoveryKey);
            setCopied(true);
            toast.success("Recovery key copied");
          }}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 py-2 text-sm font-bold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy key"}
        </button>
        <button
          onClick={onDone}
          className="mt-2 w-full rounded-lg bg-brand py-2.5 text-sm font-bold text-black transition-opacity hover:opacity-90"
        >
          I saved my key — continue
        </button>
      </div>
    </div>
  );
}

export function P2PAuth({ onAuthed }: { onAuthed: (a: AgentDTO) => void }) {
  const [mode, setMode] = React.useState<Mode>("signin");
  const [fp, setFp] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [recoveryKey, setRecoveryKey] = React.useState<string | null>(null);

  const [agentCode, setAgentCode] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [walletType, setWalletType] = React.useState<string>("bkash");
  const [walletNumber, setWalletNumber] = React.useState("");
  const [holderName, setHolderName] = React.useState("");
  const [recoveryKeyInput, setRecoveryKeyInput] = React.useState("");

  React.useEffect(() => {
    computeDeviceFingerprint().then(setFp).catch(() => setFp("device-unknown"));
  }, []);

  const api = async (path: string, body: unknown) => {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.error ?? "Request failed");
    }
    return json;
  };

  const doSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const json = await api("/api/p2p/login", {
        agentCode,
        password,
        deviceFingerprint: fp,
      });
      onAuthed(json.agent as AgentDTO);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
      setLoading(false);
    }
  };

  const doRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const json = await api("/api/p2p/register", {
        password,
        deviceFingerprint: fp,
        wallet: { walletType, walletNumber, holderName },
      });
      setRecoveryKey(json.recoveryKey as string);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      setLoading(false);
    }
  };

  const doRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const json = await api("/api/p2p/recover", {
        agentCode,
        recoveryKey: recoveryKeyInput,
        newPassword: password,
        deviceFingerprint: fp,
      });
      onAuthed(json.agent as AgentDTO);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recovery failed");
      setLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-brand focus:bg-white/[0.07]";

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-10">
      <Logo />
      {mode !== "signin" && (
        <button
          onClick={() => {
            setMode("signin");
            setError(null);
          }}
          className="mt-6 flex items-center gap-1 text-xs font-semibold text-white/40 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
        </button>
      )}

      <div className="mt-6 w-full max-w-sm">
        {mode === "signin" && (
          <form onSubmit={doSignIn} className="space-y-3">
            <input
              className={inputCls}
              placeholder="Agent code (AGT-XXXX)"
              value={agentCode}
              onChange={(e) => setAgentCode(e.target.value.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />
            <input
              className={inputCls}
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="text-xs font-semibold text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading || !agentCode || !password}
              className="w-full rounded-lg bg-brand py-2.5 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
            <div className="flex justify-between pt-1 text-xs font-semibold">
              <button
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
                className="text-brand transition-colors hover:text-white"
              >
                Register as agent
              </button>
              <button
                onClick={() => {
                  setMode("recover");
                  setError(null);
                }}
                className="text-white/40 transition-colors hover:text-white"
              >
                Lost password?
              </button>
            </div>
          </form>
        )}

        {mode === "register" && (
          <form onSubmit={doRegister} className="space-y-3">
            <div className="flex items-start gap-2 rounded-lg border border-brand/20 bg-brand/5 p-3 text-xs text-white/60">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span>
                Your agent code and recovery key are generated after
                registration. A <b className="text-white">৳0</b> balance keeps
                you offline until you top up your float.
              </span>
            </div>
            <input
              className={inputCls}
              placeholder="Password (min 6 chars)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <select
              className={cn(inputCls, "appearance-none")}
              value={walletType}
              onChange={(e) => setWalletType(e.target.value)}
            >
              {WALLET_TYPES.map((w) => (
                <option key={w} value={w} className="bg-zinc-900">
                  {w}
                </option>
              ))}
            </select>
            <input
              className={inputCls}
              placeholder="Wallet / account number"
              value={walletNumber}
              onChange={(e) => setWalletNumber(e.target.value)}
            />
            <input
              className={inputCls}
              placeholder="Account holder name"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
            />
            {error && <p className="text-xs font-semibold text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading || password.length < 6 || walletNumber.length < 6}
              className="w-full rounded-lg bg-brand py-2.5 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {loading ? "Creating account…" : "Create agent account"}
            </button>
          </form>
        )}

        {mode === "recover" && (
          <form onSubmit={doRecover} className="space-y-3">
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200/80">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <span>
                Enter your agent code and the 4×4 recovery key you saved at
                registration. This rebinds your account to this device.
              </span>
            </div>
            <input
              className={inputCls}
              placeholder="Agent code (AGT-XXXX)"
              value={agentCode}
              onChange={(e) => setAgentCode(e.target.value.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />
            <input
              className={inputCls}
              placeholder="Recovery key"
              value={recoveryKeyInput}
              onChange={(e) => setRecoveryKeyInput(e.target.value.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />
            <input
              className={inputCls}
              placeholder="New password (min 6 chars)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="text-xs font-semibold text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={
                loading ||
                password.length < 6 ||
                !agentCode ||
                recoveryKeyInput.length < 16
              }
              className="w-full rounded-lg bg-brand py-2.5 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {loading ? "Recovering…" : "Recover account"}
            </button>
          </form>
        )}
      </div>

      {recoveryKey && (
        <RecoveryKeyModal
          recoveryKey={recoveryKey}
          onDone={() => {
            setRecoveryKey(null);
            // Re-check session (register already set the cookie) → dashboard.
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
