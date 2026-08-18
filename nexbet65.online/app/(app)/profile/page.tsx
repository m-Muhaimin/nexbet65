import type { Metadata } from "next";
import Link from "next/link";

import { ProfileCard } from "@/components/profile-card";
import { ReferralCard } from "@/components/profile/referral-card";
import { isAdminUser } from "@/lib/admin-roles";
import { getReferralStats } from "@/lib/referral";
import { getSessionUser } from "@/lib/session-server";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your NexBet65 profile.",
};

export const dynamic = "force-dynamic";

const ADMIN_ITEMS = [
  { label: "Payments", emoji: "💳", href: "/admin/payments", tile: "from-emerald-400 via-green-800 to-black" },
  { label: "Aviator Server", emoji: "🚀", href: "/admin/aviator-server", tile: "from-red-500 via-neutral-900 to-black" },
  { label: "Money Wheel Server", emoji: "🎡", href: "/admin/money-wheel-server", tile: "from-fuchsia-400 via-purple-900 to-black" },
  { label: "Team Members", emoji: "👥", href: "/admin/team", tile: "from-cyan-300 via-sky-900 to-black" },
];

export default async function ProfilePage() {
  const user = await getSessionUser();
  const username = user?.username ?? null;
  const stats = username ? await getReferralStats(username).catch(() => null) : null;
  const isAdmin = isAdminUser(username);

  return (
    <div className="mx-auto mt-1 max-w-3xl space-y-3 sm:mt-2 sm:space-y-5">
      {user && (
        <ProfileCard
          username={user.username}
          avatar={user.avatar}
          memberSince={user.memberSince}
        />
      )}

      {stats && (
        <ReferralCard
          referralCode={stats.referralCode}
          friends={stats.friends}
          earned={stats.earned}
        />
      )}

      {isAdmin && (
        <div className="glass rounded-2xl border border-white/5 p-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="font-bold">Admin</h3>
            <span className="text-[11px] text-white/40">Super admin</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ADMIN_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col items-center gap-2 rounded-xl bg-white/5 p-4 text-sm font-semibold transition-colors hover:bg-white/10"
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-lg ${item.tile}`}
                >
                  {item.emoji}
                </span>
                <span className="text-center text-xs text-white/70 group-hover:text-brand">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
