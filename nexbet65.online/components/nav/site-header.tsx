import Link from "next/link";

import { GlobalSearch } from "@/components/nav/global-search";
import { NotificationBell } from "@/components/nav/notification-bell";
import { PageTitle } from "@/components/nav/page-title";
import { UserMenu } from "@/components/nav/user-menu";
import { BalancePill } from "@/components/nav/balance-pill";
import { InstallAppButton } from "@/components/install-app-button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { SessionUser } from "@/lib/auth";

export function SiteHeader({
  user,
  isAdmin = false,
}: {
  user: SessionUser;
  isAdmin?: boolean;
}) {
  return (
    <header className="glass sticky top-0 z-40 border-b border-white/5">
      <div className="mx-auto flex h-12 w-full max-w-[1600px] items-center gap-2 px-3 sm:h-14 sm:gap-3 sm:px-4">
        <SidebarTrigger className="-ml-1 hidden md:inline-flex" />
        <Link
          href="/lobby"
          className="flex shrink-0 items-center md:hidden"
          aria-label="NexBet65"
        >
          <span className="gold-glow flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-black text-black">
            N
          </span>
        </Link>

        <PageTitle />

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <GlobalSearch />
          <InstallAppButton variant="icon" />
          <NotificationBell />
          <BalancePill />
          <UserMenu
            username={user.username}
            avatar={user.avatar}
            memberSince={user.memberSince}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </header>
  );
}
