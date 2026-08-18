"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CreditCard, Gamepad2, LayoutGrid, User, Wallet } from "lucide-react";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/lobby", label: "Lobby", icon: LayoutGrid },
  { href: "/games", label: "Games", icon: Gamepad2 },
  { href: "/profile", label: "Profile", icon: User },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const walletTab = searchParams.get("tab") === "withdraw" ? "withdraw" : "deposit";

  return (
    <nav className="glass safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-white/10 md:hidden">
      <div className="grid h-14 grid-cols-5 items-center text-[9px] font-medium sm:h-16 sm:text-[10px]">
        {TABS.slice(0, 2).map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-px sm:gap-0.5",
                active ? "text-brand" : "text-white/50"
              )}
            >
              <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
              {label}
            </Link>
          );
        })}

        <div className="relative flex flex-col items-center justify-end pb-0.5 sm:pb-1">
          <Link
            href="/wallet?tab=deposit"
            aria-label="Deposit"
            className={cn(
              "gold-glow fab absolute -top-1 flex items-center justify-center rounded-full bg-brand text-2xl text-black transition-transform active:scale-95",
              pathname === "/wallet" && walletTab === "deposit" && "ring-2 ring-white/60"
            )}
          >
            <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />
          </Link>
          <span className={cn(pathname === "/wallet" && walletTab === "deposit" ? "text-brand" : "text-white/50")}>
            Deposit
          </span>
        </div>

        <Link
          href="/wallet?tab=withdraw"
          className={cn(
            "flex flex-col items-center gap-px sm:gap-0.5",
            pathname === "/wallet" && walletTab === "withdraw" ? "text-brand" : "text-white/50"
          )}
        >
          <Wallet className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
          Withdraw
        </Link>

        {TABS.slice(2).map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-px sm:gap-0.5",
                active ? "text-brand" : "text-white/50"
              )}
            >
              <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
