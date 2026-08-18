"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

export function AdminSignInForm() {
  const router = useRouter();
  const [token, setToken] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/team/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Invalid access token");
        setLoading(false);
        return;
      }
      router.push("/admin/payments");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl border border-white/5 bg-[#111] p-6 sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/15">
          <ShieldCheck className="h-6 w-6 text-brand" />
        </div>
        <div>
          <h1 className="font-instrument text-xl font-bold text-white">
            Admin Console
          </h1>
          <p className="text-sm text-white/50">
            Sign in with your access token
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label
            htmlFor="team-token"
            className="mb-1.5 block text-xs font-semibold text-white/60"
          >
            ACCESS TOKEN
          </label>
          <input
            id="team-token"
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="NEXBET65-…"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 font-mono text-sm text-white placeholder:text-white/25 focus:border-brand/60 focus:outline-none"
          />
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !token.trim()}
          className="gold-glow w-full rounded-lg bg-brand py-2.5 text-sm font-bold text-black transition-colors hover:bg-brand-dim disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
