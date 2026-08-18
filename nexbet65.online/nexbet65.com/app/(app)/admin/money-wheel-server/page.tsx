import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ServerLogViewer } from "@/components/admin/server-log-viewer";
import { adminCan, getAdminContext } from "@/lib/admin-access";

export const metadata: Metadata = {
  title: "Money Wheel Server Log",
  description: "Realtime Money Wheel game-server logs.",
};

export const dynamic = "force-dynamic";

export default async function MoneyWheelServerPage() {
  const ctx = await getAdminContext();
  if (!adminCan(ctx, "wheel-server")) redirect("/");

  return <ServerLogViewer service="wheel" title="Money Wheel Server" />;
}
