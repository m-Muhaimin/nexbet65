"use client";

import { LogOut } from "lucide-react";

import { PageTitle } from "@/components/nav/page-title";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { TEAM_ROLE_LABELS, type TeamRole } from "@/lib/team-types";

export function TeamHeader({
  name,
  role,
}: {
  name: string;
  role: TeamRole;
}) {
  const signOut = async () => {
    await fetch("/api/admin/team/sign-out", { method: "POST" });
    window.location.href = "/admin/sign-in";
  };

  return (
    <header className="glass sticky top-0 z-40 border-b border-white/5">
      <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center gap-3 px-3 sm:px-4">
        <SidebarTrigger className="-ml-1" />
        <PageTitle />
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            <span className="font-semibold text-white">{name}</span>
            <span className="text-white/40">·</span>
            <span className="font-semibold text-brand">
              {TEAM_ROLE_LABELS[role]}
            </span>
          </span>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
