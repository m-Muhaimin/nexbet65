import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { MobileTabBar } from "@/components/nav/mobile-tabbar";
import { SiteHeader } from "@/components/nav/site-header";
import { TeamHeader } from "@/components/nav/team-header";
import { TeamSidebar } from "@/components/nav/team-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { isAdminUser } from "@/lib/admin-roles";
import { getSessionUser, getTeamSession } from "@/lib/session-server";
import { getWalletSnapshot } from "@/lib/wallet-server";
import { WalletProvider } from "@/lib/wallet-store";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSessionUser();
  const team = user ? null : await getTeamSession();
  if (!user && !team) redirect("/sign-in");

  if (team) {
    return (
      <SidebarProvider>
        <TeamSidebar
          name={team.name}
          role={team.role}
          permissions={team.permissions}
        />
        <SidebarInset>
          <TeamHeader name={team.name} role={team.role} />
          <div className="mx-auto w-full max-w-[1600px] flex-1 px-3 pb-24 pt-3 sm:px-4 sm:pt-4 md:pb-10">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const snapshot = await getWalletSnapshot(user!.username).catch(() => null);

  const bonus =
    snapshot?.transactions
      .filter((t) => (t.kind === "signup_bonus" || t.kind === "deposit_bonus") && t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0) ?? 0;

  return (
    <WalletProvider>
      <SidebarProvider>
        <AppSidebar
          fallbackBalance={snapshot?.balance ?? null}
          fallbackBonus={bonus}
        />
        <SidebarInset>
          <SiteHeader user={user!} isAdmin={isAdminUser(user!.username)} />
          <div className="mx-auto w-full max-w-[1600px] flex-1 px-3 pb-24 pt-3 sm:px-4 sm:pt-4 md:pb-10">
            {children}
          </div>
          <MobileTabBar />
        </SidebarInset>
      </SidebarProvider>
    </WalletProvider>
  );
}
