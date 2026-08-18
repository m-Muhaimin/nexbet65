import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/games";

export interface MinesStat {
  user: string;
  mineCount: number;
  tiles: number;
  mult: number;
  payout: number;
}

const MOCK_STATS: MinesStat[] = [
  { user: "anon-4471", mineCount: 5, tiles: 9, mult: 4.85, payout: 48.5 },
  { user: "jackpot_k", mineCount: 3, tiles: 3, mult: 1.51, payout: 15.1 },
  { user: "lucky_b", mineCount: 10, tiles: 2, mult: 2.1, payout: 21 },
  { user: "mines_pro", mineCount: 3, tiles: 15, mult: 15.2, payout: 152 },
];

export function MinesStats({ stats = MOCK_STATS }: { stats?: MinesStat[] }) {
  return (
    <div className="flex gap-8">
      {stats.map((stat, i) => (
        <div key={i} className="flex shrink-0 items-center gap-2">
          <span className="text-xs font-bold text-white/70">{stat.user}</span>
          <span
            className={cn(
              "rounded border px-1.5 py-0.5 font-mono text-[10px]",
              stat.mult > 1
                ? "border-brand/20 bg-brand/10 text-brand"
                : "border-red-500/20 bg-red-500/10 text-red-400"
            )}
          >
            {stat.mult.toFixed(1)}x
          </span>
          <span className="text-[10px] text-white/40">{formatMoney(stat.payout)}</span>
        </div>
      ))}
    </div>
  );
}
