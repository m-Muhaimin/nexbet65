import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { P2PAdmin } from "@/components/p2p/p2p-admin";
import { adminCan, getAdminContext } from "@/lib/admin-access";

export const metadata: Metadata = {
  title: "P2P Agents",
  description: "P2P agent overview and float top-up approval.",
};

export const dynamic = "force-dynamic";

export default async function AdminP2PPage() {
  const ctx = await getAdminContext();
  if (!adminCan(ctx, "p2p")) redirect("/");

  return (
    <div className="mx-auto mt-2 max-w-5xl space-y-5">
      <P2PAdmin />
    </div>
  );
}
