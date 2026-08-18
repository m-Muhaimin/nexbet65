"use client";

import { usePathname } from "next/navigation";

const TITLES: [string, string][] = [
  ["/games/aviator", "Aviator"],
  ["/games/mines", "Mines"],
  ["/games/plinko", "Plinko"],
  ["/games/checkers", "Checkers"],
  ["/games/ludo-arena", "Ludo Arena"],
  ["/admin/payments", "Payment Requests"],
  ["/admin/team", "Team Members"],
  ["/admin/aviator-server", "Aviator Server Log"],
  ["/admin/money-wheel-server", "Money Wheel Server Log"],
  ["/lobby", "Lobby"],
  ["/games", "All Games"],
  ["/wallet", "Wallet"],
  ["/profile", "Profile"],
];

export function PageTitle() {
  const pathname = usePathname();
  const match = TITLES.find(
    ([path]) => pathname === path || pathname.startsWith(path + "/")
  );
  const title = match?.[1] ?? "NexBet65";

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="hidden h-6 w-px shrink-0 bg-white/10 md:block" />
      <h1 className="truncate font-instrument text-base font-bold tracking-tight text-white">
        {title}
      </h1>
    </div>
  );
}
