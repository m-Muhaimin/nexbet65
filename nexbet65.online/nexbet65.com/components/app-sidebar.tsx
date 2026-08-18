"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { setLobbyFilter, type LobbyFilter } from "@/lib/lobby-bus";
import { InstallAppButton } from "@/components/install-app-button";
import { cn } from "@/lib/utils";
import { useWallet } from "@/lib/wallet-store";

type NavItem = {
  label: string;
  emoji: string;
  tile: string;
  href?: string;
  filter?: LobbyFilter;
  soon?: string;
};

const MAIN: NavItem[] = [
  { label: "Home", emoji: "🏠", tile: "from-zinc-300 via-zinc-700 to-black", href: "/lobby" },
  { label: "All Games", emoji: "🎮", tile: "from-brand via-emerald-800 to-black", href: "/games" },
];

const GAMES: NavItem[] = [
  { label: "Aviator", emoji: "✈️", tile: "from-red-500 via-neutral-900 to-black", href: "/games/aviator" },
  { label: "Mines", emoji: "💣", tile: "from-green-500 via-emerald-950 to-black", href: "/games/mines" },
  { label: "Plinko", emoji: "🔴", tile: "from-brand via-emerald-950 to-black", href: "/games/plinko" },
  { label: "Checkers", emoji: "♟️", tile: "from-indigo-500 via-neutral-900 to-black", href: "/games/checkers" },
  { label: "Ludo Arena", emoji: "🎲", tile: "from-pink-500 via-fuchsia-950 to-black", href: "/games/ludo-arena" },
];

const WALLET: NavItem[] = [
  { label: "Deposit", emoji: "💵", tile: "from-emerald-400 via-green-800 to-black", href: "/wallet" },
  { label: "Withdraw", emoji: "💸", tile: "from-amber-400 via-orange-700 to-black", href: "/wallet?tab=withdraw" },
  { label: "VIP Club", emoji: "👑", tile: "from-yellow-300 via-amber-700 to-black", soon: "VIP Club is coming soon." },
];

function formatTaka(n: number | null): string {
  if (n === null) return "৳ ––";
  return (
    "৳ " +
    n.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function NavTile({ item }: { item: NavItem }) {
  return (
    <span
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]",
        "transition-transform duration-200 group-hover/menu-button:scale-110",
        "group-data-[collapsible=icon]:h-4 group-data-[collapsible=icon]:w-4 group-data-[collapsible=icon]:rounded-md group-data-[collapsible=icon]:text-[10px]",
        item.tile
      )}
    >
      {item.emoji}
    </span>
  );
}

function NavButton({ item, active }: { item: NavItem; active?: boolean }) {
  const classes = cn(
    "group/menu-button transition-colors hover:bg-brand/10 hover:text-brand",
    "data-[active=true]:bg-brand/10 data-[active=true]:text-brand data-[active=true]:font-semibold"
  );

  if (item.href) {
    return (
      <SidebarMenuButton asChild isActive={active} tooltip={item.label} className={classes}>
        <Link href={item.href}>
          <NavTile item={item} />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    );
  }

  return (
    <SidebarMenuButton
      tooltip={item.label}
      className={classes}
      onClick={() =>
        item.filter
          ? setLobbyFilter(item.filter)
          : toast.info(item.soon ?? "Coming soon.")
      }
    >
      <NavTile item={item} />
      <span>{item.label}</span>
    </SidebarMenuButton>
  );
}

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
}) {
  const isActive = (href: string) =>
    href === "/lobby"
      ? pathname === "/lobby"
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="px-3 text-[10px] font-bold tracking-[0.18em] text-white/30">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.label}>
              <NavButton item={item} active={item.href ? isActive(item.href.split("?")[0]) : undefined} />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar({
  fallbackBalance = null,
  fallbackBonus = 0,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  fallbackBalance?: number | null;
  fallbackBonus?: number;
}) {
  const pathname = usePathname();
  const { balance: liveBalance, transactions, status } = useWallet();

  const balanceToShow =
    liveBalance !== null
      ? liveBalance
      : status === "error" && fallbackBalance === null
        ? null
        : fallbackBalance;

  const liveBonus = transactions
    .filter(
      (t) => (t.kind === "signup_bonus" || t.kind === "deposit_bonus") && t.amount > 0
    )
    .reduce((sum, t) => sum + t.amount, 0);
  const bonusToShow = transactions.length > 0 ? liveBonus : fallbackBonus;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/lobby">
                <div className="gold-glow flex aspect-square size-8 items-center justify-center rounded-lg bg-brand text-sm font-black text-black">
                  N
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-unbounded text-base font-extrabold tracking-tight">
                    NexBet<span className="text-brand">65</span>
                  </span>
                  <span className="text-xs text-white/40">
                    Play. Win. Withdraw.
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavGroup label="Main" items={MAIN} pathname={pathname} />
        <NavGroup label="Games" items={GAMES} pathname={pathname} />
        <NavGroup label="Wallet" items={WALLET} pathname={pathname} />
      </SidebarContent>

      <SidebarFooter>
        <div className="group-data-[collapsible=icon]:hidden">
          <div className="relative overflow-hidden rounded-xl border border-brand/20 bg-gradient-to-br from-brand/10 via-white/5 to-transparent p-4">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand/10 blur-2xl" />
            <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.18em] text-white/40">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              AVAILABLE BALANCE
            </p>
            <p className="mt-1.5 font-instrument text-2xl font-extrabold tabular-nums text-white">
              {formatTaka(balanceToShow)}
            </p>
            <p className="mt-0.5 text-xs text-white/40">
              Bonus:{" "}
              <span className="font-semibold text-brand">{formatTaka(bonusToShow)}</span>
            </p>
            <Link
              href="/wallet"
              className="gold-glow mt-3 block w-full rounded-lg bg-brand py-2 text-center text-xs font-bold text-black transition-colors hover:bg-brand-dim"
            >
              Quick Deposit
            </Link>
            <InstallAppButton variant="full" />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
