import type { Metadata } from "next";

import { WalletPageView } from "@/components/wallet/wallet-page";

export const metadata: Metadata = {
  title: "Wallet",
  description: "Deposit funds or request a withdrawal.",
};

export const dynamic = "force-dynamic";

export default async function WalletPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const tab = searchParams.tab === "withdraw" ? "withdraw" : "deposit";
  return <WalletPageView initialTab={tab} />;
}
