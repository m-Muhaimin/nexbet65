import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { TeamAdmin } from "@/components/admin/team-admin";
import { adminCan, getAdminContext } from "@/lib/admin-access";

export const metadata: Metadata = {
  title: "Team Members",
  description: "Manage admin console access tokens.",
};

export const dynamic = "force-dynamic";

export default async function AdminTeamPage() {
  const ctx = await getAdminContext();
  if (!adminCan(ctx, "team")) redirect("/");

  return (
    <div className="mx-auto mt-2 max-w-5xl space-y-5">
      <TeamAdmin />
    </div>
  );
}
