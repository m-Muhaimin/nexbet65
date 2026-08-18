import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/session-server";
import { WalletProvider } from "@/lib/wallet-store";

export default async function GameLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  return (
    <WalletProvider>
      <div className="flex h-dvh w-full flex-col bg-black">{children}</div>
    </WalletProvider>
  );
}
