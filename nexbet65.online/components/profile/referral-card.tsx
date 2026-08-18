"use client";

import { useState } from "react";
import { Check, Copy, Link2, Share2, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { referralLink } from "@/lib/referral";
import { formatMoney } from "@/lib/games";

export function ReferralCard({
  referralCode,
  friends,
  earned,
}: {
  referralCode: string;
  friends: number;
  earned: number;
}) {
  const [copied, setCopied] = useState(false);
  const link = referralLink(referralCode);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Referral link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.info(link);
    }
  }

  return (
    <div className="glass rounded-2xl border border-white/5 p-4">
      <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-3">
        <h3 className="flex items-center gap-2 font-bold">
          <Share2 className="h-4 w-4 text-brand" /> Refer &amp; earn
        </h3>
        <span className="text-[11px] text-white/40">Lifetime · 3 levels</span>
      </div>

      <p className="mt-3 text-sm text-white/60">
        Share your link — you get <span className="font-semibold text-brand">৳200</span>{" "}
        when a friend makes their first deposit, plus lifetime commission on
        everything they bet (and their referrals bet):{" "}
        <span className="font-semibold text-white/80">1% L1 · 0.5% L2 · 0.25% L3</span>.
      </p>

      <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2">
        <Link2 className="h-4 w-4 shrink-0 text-white/40" />
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-white/70">
          {link}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 gap-1 text-brand hover:text-brand"
          onClick={() => void copyLink()}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 sm:mt-3 sm:gap-3">
        <div className="rounded-xl bg-white/5 p-2.5 sm:p-3">
          <p className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-white/50 sm:text-[11px]">
            <Users className="h-3 w-3" /> Friends joined
          </p>
          <p className="mt-0.5 text-base font-extrabold tabular-nums sm:text-lg">{friends}</p>
        </div>
        <div className="rounded-xl bg-white/5 p-2.5 sm:p-3">
          <p className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-white/50 sm:text-[11px]">
            Earned (locked)
          </p>
          <p className="mt-0.5 text-base font-extrabold tabular-nums text-brand sm:text-lg">
            {formatMoney(earned)}
          </p>
        </div>
      </div>
    </div>
  );
}
