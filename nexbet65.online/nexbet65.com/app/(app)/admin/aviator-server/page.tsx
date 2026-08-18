import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { NextCrashPoint } from "@/components/admin/next-crash-point";
import { ServerLogViewer } from "@/components/admin/server-log-viewer";
import { adminCan, getAdminContext } from "@/lib/admin-access";

export const metadata: Metadata = {
  title: "Aviator Server Log",
  description: "Realtime Aviator game-server logs.",
};

export const dynamic = "force-dynamic";

export default async function AviatorServerPage() {
  const ctx = await getAdminContext();
  if (!adminCan(ctx, "aviator-server")) redirect("/");

  return (
    <div className="space-y-4">
      <NextCrashPoint />
      <ServerLogViewer service="aviator" title="Aviator Server" />
    </div>
  );
}
