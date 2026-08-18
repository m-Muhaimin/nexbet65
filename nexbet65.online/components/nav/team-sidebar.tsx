"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

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
import { TEAM_ROLE_LABELS, type TeamPermission, type TeamRole } from "@/lib/team-types";
import { cn } from "@/lib/utils";

function AdminNavTile({
  emoji,
  tile,
}: {
  emoji: string;
  tile: string;
}) {
  return (
    <span
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]",
        "transition-transform duration-200 group-hover/menu-button:scale-110",
        "group-data-[collapsible=icon]:h-4 group-data-[collapsible=icon]:w-4 group-data-[collapsible=icon]:rounded-md group-data-[collapsible=icon]:text-[10px]",
        tile
      )}
    >
      {emoji}
    </span>
  );
}

export function TeamSidebar({
  name,
  role,
  permissions,
}: {
  name: string;
  role: TeamRole;
  permissions: TeamPermission[];
}) {
  const pathname = usePathname();

  const can = (perm: TeamPermission) =>
    role === "super_admin" || permissions.includes(perm);

  const monitoring = [
    can("payments") && {
      label: "Payments",
      emoji: "💳",
      tile: "from-emerald-400 via-green-800 to-black",
      href: "/admin/payments",
    },
    can("aviator-server") && {
      label: "Aviator Server",
      emoji: "🚀",
      tile: "from-red-500 via-neutral-900 to-black",
      href: "/admin/aviator-server",
    },
    can("wheel-server") && {
      label: "Money Wheel Server",
      emoji: "🎡",
      tile: "from-fuchsia-400 via-purple-900 to-black",
      href: "/admin/money-wheel-server",
    },
    can("mines-server") && {
      label: "Mines Server",
      emoji: "💣",
      tile: "from-amber-400 via-amber-900 to-black",
      href: "/admin/mines-server",
    },
    can("p2p") && {
      label: "P2P Agents",
      emoji: "🤝",
      tile: "from-sky-300 via-sky-900 to-black",
      href: "/admin/p2p",
    },
  ].filter(Boolean) as { label: string; emoji: string; tile: string; href: string }[];

  const admin = [
    can("team") && {
      label: "Team Members",
      emoji: "👥",
      tile: "from-cyan-300 via-sky-900 to-black",
      href: "/admin/team",
    },
  ].filter(Boolean) as { label: string; emoji: string; tile: string; href: string }[];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const signOut = async () => {
    await fetch("/api/admin/team/sign-out", { method: "POST" });
    window.location.href = "/admin/sign-in";
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin/payments">
                <div className="gold-glow flex aspect-square size-8 items-center justify-center rounded-lg bg-brand text-sm font-black text-black">
                  W
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="text-base font-extrabold tracking-tight">
                    WIN<span className="text-brand"> 111</span>
                  </span>
                  <span className="text-xs text-white/40">Admin Console</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {monitoring.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-[10px] font-bold tracking-[0.18em] text-white/30">
              MONITORING
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {monitoring.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.href)}
                      tooltip={item.label}
                      className="transition-colors hover:bg-brand/10 hover:text-brand data-[active=true]:bg-brand/10 data-[active=true]:text-brand data-[active=true]:font-semibold"
                    >
                      <Link href={item.href}>
                        <AdminNavTile emoji={item.emoji} tile={item.tile} />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {admin.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-[10px] font-bold tracking-[0.18em] text-white/30">
              ADMIN
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {admin.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.href)}
                      tooltip={item.label}
                      className="transition-colors hover:bg-brand/10 hover:text-brand data-[active=true]:bg-brand/10 data-[active=true]:text-brand data-[active=true]:font-semibold"
                    >
                      <Link href={item.href}>
                        <AdminNavTile emoji={item.emoji} tile={item.tile} />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <div className="group-data-[collapsible=icon]:hidden">
          <div className="relative overflow-hidden rounded-xl border border-brand/20 bg-gradient-to-br from-brand/10 via-white/5 to-transparent p-4">
            <p className="text-[10px] font-bold tracking-[0.18em] text-white/40">
              SIGNED IN AS
            </p>
            <p className="mt-1 truncate text-sm font-bold text-white">{name}</p>
            <p className="mt-0.5 text-xs font-semibold text-brand">
              {TEAM_ROLE_LABELS[role]}
            </p>
            <button
              onClick={signOut}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-bold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
