import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { adminCan, getAdminContext } from "@/lib/admin-access";
import {
  MINES_GRID,
  MINES_MAX,
  MINES_MIN,
  MINES_RTP,
  ROUND_TTL_MS,
  listActiveRounds,
} from "@/lib/mines";

export const metadata: Metadata = {
  title: "Mines Server",
  description: "Active Mines round state (in-process).",
};

export const dynamic = "force-dynamic";

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-[10px] font-bold tracking-[0.18em] text-white/40">{label}</p>
      <p className="mt-1.5 font-instrument text-2xl font-extrabold tabular-nums text-white">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-white/40">{hint}</p>}
    </div>
  );
}

function formatTaka(n: number): string {
  return "৳ " + n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatElapsed(ms: number): string {
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  return `${min}m ${sec % 60}s`;
}

export default async function MinesServerPage() {
  const ctx = await getAdminContext();
  if (!adminCan(ctx, "mines-server")) redirect("/");

  const rounds = listActiveRounds();
  const totalInPlay = rounds.reduce((sum, r) => sum + r.betAmount, 0);
  const totalRevealed = rounds.reduce((sum, r) => sum + r.revealedCount, 0);

  return (
    <div className="mx-auto mt-2 max-w-5xl space-y-5">
      <div>
        <h1 className="font-instrument text-2xl font-extrabold text-white">Mines Server</h1>
        <p className="mt-1 text-sm text-white/50">
          Mines runs fully in-process — no external WS server. Rounds live in memory and
          are lost on restart.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Active Rounds" value={String(rounds.length)} hint="in-memory" />
        <StatCard label="Bets in Play" value={formatTaka(totalInPlay)} hint="total wagered" />
        <StatCard label="Tiles Revealed" value={String(totalRevealed)} hint="across rounds" />
        <StatCard label="RTP" value={`${(MINES_RTP * 100).toFixed(0)}%`} hint="payout factor" />
        <StatCard label="Grid" value={`${MINES_GRID} tiles`} hint="5 × 5 board" />
        <StatCard label="Mines" value={`${MINES_MIN}–${MINES_MAX}`} hint="per round" />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-bold text-white">Active Rounds</h2>
          <span className="text-[10px] font-bold tracking-[0.18em] text-white/40">
            TTL {Math.round(ROUND_TTL_MS / 60000)} MIN
          </span>
        </div>
        {rounds.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-white/40">
            No active rounds right now.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-[10px] font-bold tracking-[0.18em] text-white/40">
                  <th className="px-4 py-2.5">Player</th>
                  <th className="px-4 py-2.5">Bet</th>
                  <th className="px-4 py-2.5">Mines</th>
                  <th className="px-4 py-2.5">Revealed</th>
                  <th className="px-4 py-2.5">Multiplier</th>
                  <th className="px-4 py-2.5">Age</th>
                </tr>
              </thead>
              <tbody>
                {rounds.map((r) => (
                  <tr key={r.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-2.5 font-semibold text-white">{r.username}</td>
                    <td className="px-4 py-2.5 tabular-nums text-white/80">{formatTaka(r.betAmount)}</td>
                    <td className="px-4 py-2.5 tabular-nums text-white/80">{r.mineCount}</td>
                    <td className="px-4 py-2.5 tabular-nums text-white/80">{r.revealedCount}</td>
                    <td className="px-4 py-2.5 tabular-nums font-semibold text-brand">
                      {r.multiplier.toFixed(2)}×
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-white/50">{formatElapsed(r.elapsedMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
