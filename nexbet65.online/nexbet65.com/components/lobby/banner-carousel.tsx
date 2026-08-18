"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

const SLIDES: {
  badge: string;
  badgeCls: string;
  title: React.ReactNode;
  sub: string;
  grad: string;
  cta: string;
  href: string;
}[] = [
  {
    badge: "WELCOME OFFER",
    badgeCls: "bg-brand text-black",
    title: (
      <>
        প্রথম ডিপোজিটে <span className="text-brand">১০০% বোনাস!</span>
      </>
    ),
    sub: "Deposit ৳500, get up to ৳10,000 bonus instantly.",
    grad: "from-emerald-700 via-emerald-950 to-black",
    cta: "Claim Now →",
    href: "/wallet",
  },
  {
    badge: "DAILY CASHBACK",
    badgeCls: "bg-white text-black",
    title: (
      <>
        দৈনিক <span className="text-brand">১০% ক্যাশব্যাক</span>
      </>
    ),
    sub: "On slots & live casino losses — no wagering requirement.",
    grad: "from-fuchsia-700 via-purple-950 to-black",
    cta: "Learn More",
    href: "/profile",
  },
  {
    badge: "DAILY CHECK-IN",
    badgeCls: "bg-brand text-black",
    title: (
      <>
        দৈনিক চেক-ইন বোনাস <span className="text-brand">৳২০</span>
      </>
    ),
    sub: "Check in every day and earn ৳20 bonus instantly.",
    grad: "from-amber-600 via-orange-950 to-black",
    cta: "Claim Now →",
    href: "/wallet",
  },
  {
    badge: "REFER & EARN",
    badgeCls: "bg-brand text-black",
    title: (
      <>
        রেফার করুন, <span className="text-brand">আয় করুন</span>
      </>
    ),
    sub: "Get ৳200 for every friend's first deposit + lifetime commission.",
    grad: "from-sky-600 via-blue-950 to-black",
    cta: "Invite Friends",
    href: "/profile",
  },
];

/**
 * Hero banner carousel: auto-advance every 4s with a 700ms fade, prev/next
 * chevrons (md+), clickable dots. Copy matches the mockup exactly.
 */
export function BannerCarousel() {
  const [slide, setSlide] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const schedule = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(
      () => setSlide((s) => (s + 1) % SLIDES.length),
      4000
    );
  }, []);

  useEffect(() => {
    schedule();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [schedule]);

  const goTo = useCallback(
    (i: number) => {
      setSlide(((i % SLIDES.length) + SLIDES.length) % SLIDES.length);
      schedule();
    },
    [schedule]
  );

  return (
    <div className="relative h-[190px] overflow-hidden rounded-2xl border border-white/5 bg-surface sm:h-[230px] md:h-[260px] lg:h-[280px]">
      {SLIDES.map((s, i) => (
        <div
          key={s.badge}
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            i === slide ? "opacity-100" : "opacity-0"
          )}
          style={{ zIndex: i === slide ? 1 : 0 }}
          aria-hidden={i !== slide}
        >
          <div
            className={cn(
              "absolute inset-0 flex flex-col justify-center bg-gradient-to-br p-4 sm:p-6 md:p-8",
              s.grad
            )}
          >
            <span
              className={cn(
                "w-fit rounded-full px-2 py-0.5 text-[9px] font-black tracking-widest sm:px-2.5 sm:py-1 sm:text-[10px]",
                s.badgeCls
              )}
            >
              {s.badge}
            </span>
            <h3 className="mt-2 text-xl font-black sm:mt-3 sm:text-2xl md:text-3xl">{s.title}</h3>
            <p className="mt-1 text-xs text-white/60 sm:mt-2 sm:text-sm">{s.sub}</p>
            <Link
              href={s.href}
              className={cn(
                "mt-3 w-fit rounded-full px-4 py-2 text-xs font-bold transition-colors sm:mt-4 sm:px-5 sm:py-2.5 sm:text-sm",
                s.badgeCls === "bg-white text-black"
                  ? "bg-white text-black hover:bg-white/80"
                  : "bg-brand text-black hover:bg-brand-dim"
              )}
            >
              {s.cta}
            </Link>
          </div>
        </div>
      ))}

      <button
        type="button"
        aria-label="Previous slide"
        onClick={() => goTo(slide - 1)}
        className="absolute left-3 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/40 transition-colors hover:border-brand/50 md:flex"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={() => goTo(slide + 1)}
        className="absolute right-3 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/40 transition-colors hover:border-brand/50 md:flex"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => goTo(i)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === slide ? "w-6 bg-brand" : "w-1.5 bg-white/30"
            )}
          />
        ))}
      </div>
    </div>
  );
}
