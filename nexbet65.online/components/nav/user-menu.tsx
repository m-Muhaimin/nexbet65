"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bomb, HandCoins, LogOut, PartyPopper, Rocket, ShieldCheck, User, Users, Wallet } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({
  username,
  memberSince,
  isAdmin = false,
}: {
  username: string;
  avatar?: string;
  memberSince?: string;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const initial = username.slice(0, 1).toUpperCase();

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand to-emerald-600 text-sm font-bold text-black">
          {initial}
        </span>
        <span className="hidden text-sm font-semibold xl:block">{username}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="text-sm font-semibold">{username}</p>
          <p className="text-xs font-normal text-muted-foreground">
            Member since{" "}
            {memberSince
              ? new Date(memberSince).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })
              : new Date().toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User className="mr-2" /> My profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/wallet">
            <Wallet className="mr-2" /> Wallet
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Admin
            </DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/admin/payments">
                <ShieldCheck className="mr-2" /> Payments
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/aviator-server">
                <Rocket className="mr-2" /> Aviator Server
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/money-wheel-server">
                <PartyPopper className="mr-2" /> Money Wheel Server
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/mines-server">
                <Bomb className="mr-2" /> Mines Server
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/p2p">
                <HandCoins className="mr-2" /> P2P Agents
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/team">
                <Users className="mr-2" /> Team Members
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()}>
          <LogOut className="mr-2" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
