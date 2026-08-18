import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PaymentsAdmin } from "@/components/admin/payments-admin";
import { adminCan, getAdminContext } from "@/lib/admin-access";

export const metadata: Metadata = {
  title: "Payments",
  description: "Review deposit and withdrawal requests.",
};

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const ctx = await getAdminContext();
  if (!adminCan(ctx, "payments")) redirect("/");

  return (
    <div className="mx-auto mt-2 max-w-5xl space-y-5">
      <PaymentsAdmin />
    </div>
  );
}
