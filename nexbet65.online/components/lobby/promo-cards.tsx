"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

const CARDS: {
  tag: string;
  tagCls: string;
  title: string;
  sub: string;
  border: string;
  grad: string;
  cta: string;
  primary: boolean;
  href: string;
}[] = [
  {
    tag: "WELCOME",
    tagCls: "text-brand",
    title: "100% Bonus up to ৳10,000",
    sub: "On your first deposit. 15x wagering.",
    border: "border-brand/25",
    grad: "from-brand/15 to-transparent",
    cta: "Claim Now",
    primary: true,
    href: "/wallet",
  },
  {
    tag: "DAILY",
    tagCls: "text-fuchsia-300",
    title: "10% Cashback, Every Day",
    sub: "Auto-credited at midnight. No wagering.",
    border: "border-white/10",
    grad: "from-fuchsia-500/10 to-transparent",
    cta: "Learn More",
    primary: false,
    href: "/profile",
  },
  {
    tag: "REFERRAL",
    tagCls: "text-sky-300",
    title: "Invite Friends, Earn ৳200 Each",
    sub: "Plus 1% lifetime commission on their play.",
    border: "border-white/10",
    grad: "from-sky-500/10 to-transparent",
    cta: "Get My Code",
    primary: false,
    href: "/profile",
  },
];

export function PromoCards() {
  return (
    <div className="grid gap-2 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {CARDS.map((c) => (
        <div
          key={c.tag}
          className={cn(
            "rounded-2xl border bg-gradient-to-br p-3 sm:p-5",
            c.border,
            c.grad
          )}
        >
          <p className={cn("text-[9px] font-black tracking-widest sm:text-[10px]", c.tagCls)}>
            {c.tag}
          </p>
          <h3 className="mt-0.5 text-sm font-bold sm:mt-1 sm:text-base">{c.title}</h3>
          <p className="mt-0.5 text-[11px] text-white/45 sm:mt-1 sm:text-xs">{c.sub}</p>
          <Link
            href={c.href}
            className={cn(
              "mt-2.5 inline-block rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors sm:mt-4 sm:px-4 sm:py-2 sm:text-xs",
              c.primary
                ? "bg-brand text-black hover:bg-brand-dim"
                : "border border-white/15 hover:border-brand/50"
            )}
          >
            {c.cta}
          </Link>
        </div>
      ))}
    </div>
  );
}
