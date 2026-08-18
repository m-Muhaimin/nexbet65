import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Coins,
  Crown,
  Flame,
  Gift,
  Percent,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserPlus,
  Wallet,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CATALOGUE, formatMoney, GAMES } from "@/lib/games";
import { getRecentResults } from "@/lib/results";

function emojiFor(slug: string): string {
  return CATALOGUE.find((g) => g.slug === slug)?.emoji ?? "🎮";
}

function thumbFor(slug: string): string | undefined {
  return CATALOGUE.find((g) => g.slug === slug)?.image;
}

export const dynamic = "force-dynamic";

const BONUS_TIERS = [
  { rate: "50%", range: "৳500 – ৳999", min: "Deposit ৳500", highlight: false },
  { rate: "100%", range: "৳1,000 – ৳2,000", min: "Deposit ৳1,000", highlight: true },
  { rate: "150%", range: "৳2,001+", min: "Deposit ৳2,000+", highlight: false },
];

const STEPS = [
  { icon: UserPlus, title: "Create your account", sub: "Takes 30 seconds. No download needed." },
  { icon: Wallet, title: "Make a first deposit", sub: "From ৳500 and your bonus kicks in." },
  { icon: Gift, title: "Get your bonus", sub: "Credited to your balance instantly." },
  { icon: Zap, title: "Play and win", sub: "Aviator, Mines, Plinko & Ludo, live now." },
];

const REFERRAL_TIERS = [
  { level: "L1", rate: "1%", sub: "of every bet your direct referrals place" },
  { level: "L2", rate: "0.5%", sub: "of every bet your referrals' referrals place" },
  { level: "L3", rate: "0.25%", sub: "a third level down — forever, lifetime" },
];

export default async function Home() {
  const results = await getRecentResults().catch(() => ({
    wins: [],
    topMultiplier: null,
    recentCrashes: [],
  }));
  const topWin =
    results.wins.length > 0 ? Math.max(...results.wins.map((w) => w.amount)) : null;

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="hero-radial pointer-events-none absolute inset-0"
      />

      <div className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 sm:px-6">
        {/* ── Header ─────────────────────────────────────────────── */}
        <header className="flex items-center justify-between py-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="gold-glow flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-black text-black">
              W
            </span>
            <span className="font-unbounded text-xl font-extrabold tracking-tight">
              WIN<span className="text-brand">111</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-white/60 md:flex">
            <Link href="#promotions" className="transition-colors hover:text-brand">
              Promotions
            </Link>
            <Link href="#offers" className="transition-colors hover:text-brand">
              Offers
            </Link>
            <Link href="#rewards" className="transition-colors hover:text-brand">
              Rewards
            </Link>
            <Link href="#games" className="transition-colors hover:text-brand">
              Games
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">Create account</Link>
            </Button>
          </div>
        </header>

        {/* ── Hero ───────────────────────────────────────────────── */}
        <section className="flex flex-1 flex-col items-center justify-center py-14 text-center sm:py-20">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-1.5 text-xs font-semibold text-brand">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
            Live rounds running right now
          </span>
          <h1 className="font-unbounded max-w-4xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
            One platform.{" "}
            <span className="text-glow text-brand">Four legendary games.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-white/50 sm:text-lg">
            Aviator, Mines, Plinko &amp; Ludo — provably fair, live shared
            game servers, and a welcome bonus worth up to 150% of your first
            deposit.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="xl">
              <Link href="/register">
                Start playing free <ArrowRight className="ml-2" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <Link href="/sign-in">I already have an account</Link>
            </Button>
          </div>

          <div className="mt-14 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: ShieldCheck,
                label: "Provably fair",
                sub: "Seeds revealed every round",
              },
              {
                icon: Zap,
                label: "Real-time",
                sub: "Live shared game servers",
              },
              {
                icon: Trophy,
                label: "Big wins",
                sub: topWin
                  ? `Top win today: ${formatMoney(topWin)}`
                  : "Up to 50,000x multipliers",
              },
              {
                icon: Gift,
                label: "Bonus up to 150%",
                sub: "On your first deposit",
              },
            ].map(({ icon: Icon, label, sub }) => (
              <div
                key={label}
                className="glass flex items-center gap-3 rounded-xl border border-white/5 p-4 text-left"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs text-white/50">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Promotions ─────────────────────────────────────────── */}
        <section id="promotions" className="scroll-mt-24 pb-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="flex items-center gap-2 text-[11px] font-black tracking-widest text-brand">
                <Flame className="h-4 w-4" /> PROMOTIONS
              </p>
              <h2 className="font-unbounded mt-1 text-2xl font-extrabold sm:text-3xl">
                Bonuses that keep coming
              </h2>
            </div>
            <Link
              href="/register"
              className="hidden items-center gap-1 text-sm font-semibold text-brand hover:underline sm:flex"
            >
              View all offers <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {/* Welcome bonus */}
            <div className="relative flex flex-col rounded-2xl border border-brand/25 bg-gradient-to-br from-brand/15 to-transparent p-6">
              <p className="text-[10px] font-black tracking-widest text-brand">
                WELCOME OFFER
              </p>
              <h3 className="mt-2 flex items-center gap-2 text-xl font-extrabold">
                <Gift className="h-5 w-5 text-brand" /> Up to 150% bonus
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                Your first deposit is matched — 50% from ৳500, 100% from ৳1,000,
                and a huge 150% when you go all-in at ৳2,000+.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                {["Credited instantly", "Use it on Aviator, Mines, Plinko & Ludo", "One-time first-deposit offer"].map(
                  (t) => (
                    <li key={t} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-brand" /> {t}
                    </li>
                  )
                )}
              </ul>
              <div className="mt-6 flex-1" />
              <Button asChild size="sm" className="gold-glow">
                <Link href="/register">Claim bonus</Link>
              </Button>
            </div>

            {/* Cashback */}
            <div className="flex flex-col rounded-2xl border border-white/10 bg-gradient-to-br from-fuchsia-500/10 to-transparent p-6">
              <p className="text-[10px] font-black tracking-widest text-fuchsia-300">
                DAILY CASHBACK
              </p>
              <h3 className="mt-2 flex items-center gap-2 text-xl font-extrabold">
                <Coins className="h-5 w-5 text-fuchsia-300" /> 10% back, every day
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                Had a rough day? We refund 10% of your net losses automatically
                — credited to your balance at midnight. No wagering, no strings.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                {["Auto-credited every day", "Calculated on net losses", "No wagering requirement"].map(
                  (t) => (
                    <li key={t} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-fuchsia-300" /> {t}
                    </li>
                  )
                )}
              </ul>
              <div className="mt-6 flex-1" />
              <Button asChild size="sm" variant="outline">
                <Link href="/register">Learn more</Link>
              </Button>
            </div>

            {/* Referral */}
            <div className="flex flex-col rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/10 to-transparent p-6">
              <p className="text-[10px] font-black tracking-widest text-sky-300">
                REFER &amp; EARN
              </p>
              <h3 className="mt-2 flex items-center gap-2 text-xl font-extrabold">
                <UserPlus className="h-5 w-5 text-sky-300" /> ৳200 per friend
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                Invite friends and earn ৳200 for every first deposit — plus a
                lifetime commission on everything they play, down three levels.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                {["৳200 once a friend deposits", "Up to 1% lifetime commission", "3-level referral ladder"].map(
                  (t) => (
                    <li key={t} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-sky-300" /> {t}
                    </li>
                  )
                )}
              </ul>
              <div className="mt-6 flex-1" />
              <Button asChild size="sm" variant="outline">
                <Link href="/register">Get my code</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── Welcome offer: bonus ladder + how it works ─────────── */}
        <section id="offers" className="scroll-mt-24 border-t border-white/5 pb-16 pt-16">
          <div className="mb-8 text-center">
            <p className="flex items-center justify-center gap-2 text-[11px] font-black tracking-widest text-brand">
              <Sparkles className="h-4 w-4" /> WELCOME OFFER
            </p>
            <h2 className="font-unbounded mt-1 text-2xl font-extrabold sm:text-3xl">
              First-deposit bonus ladder
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-white/50">
              The bigger you start, the bigger your match. Pick your tier, then
              watch your balance climb the moment you deposit.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="grid gap-4 sm:grid-cols-3">
              {BONUS_TIERS.map((t) => (
                <div
                  key={t.rate}
                  className={
                    t.highlight
                      ? "relative flex flex-col justify-between rounded-2xl border border-brand/40 bg-brand/10 p-5"
                      : "relative flex flex-col justify-between rounded-2xl border border-white/10 bg-surface p-5"
                  }
                >
                  {t.highlight && (
                    <span className="gold-glow absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-brand px-2.5 py-0.5 text-[9px] font-black tracking-widest text-black">
                      MOST POPULAR
                    </span>
                  )}
                  <div>
                    <p className="flex items-center gap-1.5 text-2xl font-black text-brand">
                      <Percent className="h-5 w-5" /> {t.rate}
                    </p>
                    <p className="mt-1 text-xs text-white/50">match bonus</p>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-semibold">{t.range}</p>
                    <p className="text-xs text-white/45">{t.min}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-surface p-6">
              <h3 className="flex items-center gap-2 text-lg font-extrabold">
                <Crown className="h-5 w-5 text-brand" /> How it works
              </h3>
              <ol className="mt-5 space-y-4">
                {STEPS.map((s, i) => (
                  <li key={s.title} className="flex gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
                      <s.icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-bold">
                        <span className="mr-1.5 text-brand">0{i + 1}.</span>
                        {s.title}
                      </p>
                      <p className="text-xs text-white/50">{s.sub}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-5 rounded-lg border border-white/5 bg-black/20 p-3 text-[11px] leading-relaxed text-white/35">
                Bonus is added to your balance and can be used for betting.
                Minimum deposit to qualify: ৳500. One-time offer, first deposit
                only.
              </p>
            </div>
          </div>
        </section>

        {/* ── Rewards ────────────────────────────────────────────── */}
        <section id="rewards" className="scroll-mt-24 border-t border-white/5 pb-16 pt-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="flex items-center gap-2 text-[11px] font-black tracking-widest text-brand">
                <Trophy className="h-4 w-4" /> REWARDS
              </p>
              <h2 className="font-unbounded mt-1 text-2xl font-extrabold sm:text-3xl">
                Get rewarded for playing &amp; inviting
              </h2>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Referral commission ladder */}
            <div className="rounded-2xl border border-white/10 bg-surface p-6">
              <h3 className="flex items-center gap-2 text-lg font-extrabold">
                <UserPlus className="h-5 w-5 text-sky-300" /> Referral commission
                ladder
              </h3>
              <p className="mt-2 text-sm text-white/50">
                You don't just earn once — every bet your network places earns
                you commission. Forever.
              </p>
              <div className="mt-5 space-y-3">
                {REFERRAL_TIERS.map((t, i) => (
                  <div
                    key={t.level}
                    className="flex items-center gap-4 rounded-xl border border-white/5 bg-black/20 p-4"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sm font-black text-sky-300">
                      {t.level}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-bold">
                        {t.rate}{" "}
                        <span className="font-normal text-white/45">commission</span>
                      </p>
                      <p className="text-xs text-white/50">{t.sub}</p>
                    </div>
                    {i === 0 && (
                      <span className="rounded-full border border-brand/30 bg-brand/10 px-2 py-0.5 text-[9px] font-black tracking-widest text-brand">
                        DIRECT
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-5">
              {/* Cashback reward */}
              <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-surface p-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-fuchsia-500/15 text-fuchsia-300">
                  <Coins className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-lg font-extrabold">Daily 10% cashback</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/50">
                    No wagering to unlock it and nothing to claim — losses are
                    refunded to your balance automatically every single day.
                  </p>
                  <Button asChild size="sm" variant="outline" className="mt-4">
                    <Link href="/register">Start earning</Link>
                  </Button>
                </div>
              </div>

              {/* Live proof */}
              <div className="flex items-start gap-4 rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/10 to-transparent p-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
                  <Trophy className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-lg font-extrabold">
                    {topWin ? `Today's top win: ${formatMoney(topWin)}` : "Real money on the table"}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/50">
                    Every round on Aviator, Mines, Plinko &amp; Ludo is
                    provably fair — seeds are revealed so you can verify each
                    result yourself.
                  </p>
                  <Button asChild size="sm" className="gold-glow mt-4">
                    <Link href="/register">Play now</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Games ──────────────────────────────────────────────── */}
        <section id="games" className="scroll-mt-24 border-t border-white/5 pb-16 pt-16">
          <div className="mb-8 text-center">
            <p className="flex items-center justify-center gap-2 text-[11px] font-black tracking-widest text-brand">
              <Zap className="h-4 w-4" /> PLAY NOW
            </p>
            <h2 className="font-unbounded mt-1 text-2xl font-extrabold sm:text-3xl">
              Pick your game
            </h2>
          </div>

          <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {GAMES.map((game) => (
              <Link
                key={game.slug}
                href={`/games/${game.slug}`}
                className="group overflow-hidden rounded-2xl border border-white/5 bg-surface transition-transform hover:-translate-y-1"
              >
                <div className="relative flex h-44 items-end justify-between overflow-hidden p-5">
                  {thumbFor(game.slug) ? (
                    <img
                      src={thumbFor(game.slug)}
                      alt={game.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${game.gradient}`}
                    />
                  )}
                  <div className="absolute inset-0 bg-black/25" />
                  {!thumbFor(game.slug) && (
                    <span className="relative text-6xl drop-shadow">
                      {emojiFor(game.slug)}
                    </span>
                  )}
                  <div className="relative flex flex-col items-start gap-1.5">
                    <span className="rounded-md bg-black/40 px-2 py-1 text-xs font-semibold text-white backdrop-blur">
                      {game.category}
                    </span>
                    <span className="rounded-md bg-brand px-2 py-1 text-[11px] font-black text-black">
                      UP TO {game.maxWin}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-bold">{game.title}</p>
                    <p className="text-xs text-white/50">
                      {game.tagline} · RTP {game.rtp}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-white/50 transition-transform group-hover:translate-x-1 group-hover:text-brand" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Become an Agent ─────────────────────────────────────── */}
        <section className="scroll-mt-24 border-t border-white/5 pb-16 pt-16">
          <div className="relative overflow-hidden rounded-3xl border border-brand/25 bg-gradient-to-br from-brand/15 via-transparent to-transparent p-8 sm:p-12">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand/10 blur-3xl" />
            <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
              <div>
                <p className="flex items-center gap-2 text-[11px] font-black tracking-widest text-brand">
                  <UserPlus className="h-4 w-4" /> P2P AGENT PROGRAM
                </p>
                <h2 className="font-unbounded mt-2 text-2xl font-extrabold sm:text-3xl">
                  Become an Agent
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/50">
                  Run your own P2P top-up business on NexBet65. Get a dedicated
                  agent console, top up your float in seconds, and keep your
                  players&apos; balance flowing with instant deposits and
                  withdrawals.
                </p>
                <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-brand" /> Dedicated agent dashboard
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-brand" /> Instant player top-ups
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-brand" /> Earn on every deposit
                  </li>
                </ul>
              </div>
              <Button asChild size="xl" className="gold-glow">
                <a
                  href="https://nexbet65.suprbuild.com/p2p"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Become an Agent <ArrowRight className="ml-2" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* ── Final CTA ──────────────────────────────────────────── */}
        <section className="relative mb-16 overflow-hidden rounded-3xl border border-brand/25 bg-gradient-to-br from-brand/15 via-transparent to-transparent p-8 text-center sm:p-14">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-brand/10 blur-3xl" />
          <p className="relative text-[11px] font-black tracking-widest text-brand">
            READY TO PLAY?
          </p>
          <h2 className="font-unbounded relative mx-auto mt-2 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
            Cash out before the crash.{" "}
            <span className="text-glow text-brand">Spin for a bonus.</span>
          </h2>
          <p className="relative mx-auto mt-3 max-w-lg text-sm text-white/50">
            Create a free account and grab up to 150% on your first deposit.
          </p>
          <div className="relative mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="xl">
              <Link href="/register">
                Create free account <ArrowRight className="ml-2" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </div>
        </section>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <footer className="border-t border-white/5 pb-8 pt-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Link href="/" className="flex items-center gap-2">
                <span className="gold-glow flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-xs font-black text-black">
                  W
                </span>
                <span className="font-unbounded font-extrabold tracking-tight">
                  WIN<span className="text-brand">111</span>
                </span>
              </Link>
              <p className="mt-3 max-w-xs text-xs leading-relaxed text-white/40">
                Aviator, Mines, Plinko &amp; Ludo on one provably-fair
                platform. Play smart, cash out early.
              </p>
            </div>

            <div>
              <p className="text-[11px] font-black tracking-widest text-white/40">
                GAMES
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {GAMES.map((g) => (
                  <li key={g.slug}>
                    <Link
                      href={`/games/${g.slug}`}
                      className="text-white/60 transition-colors hover:text-brand"
                    >
                      {g.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-black tracking-widest text-white/40">
                OFFERS
              </p>
              <ul className="mt-3 space-y-2 text-sm text-white/60">
                <li>
                  <Link href="#promotions" className="transition-colors hover:text-brand">
                    Promotions
                  </Link>
                </li>
                <li>
                  <Link href="#offers" className="transition-colors hover:text-brand">
                    Welcome bonus
                  </Link>
                </li>
                <li>
                  <Link href="#rewards" className="transition-colors hover:text-brand">
                    Rewards
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-black tracking-widest text-white/40">
                RESPONSIBLE GAMING
              </p>
              <ul className="mt-3 space-y-2 text-xs text-white/60">
                <li>18+ only · Play responsibly</li>
                <li>Set deposit limits &amp; self-exclusion in your account</li>
                <li>This is a demo with fictional play money</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-white/5 pt-6 text-center text-xs text-white/30">
            © 2026 NexBet65. All rights reserved. · Demo only — no real gambling.
          </div>
        </footer>
      </div>
    </main>
  );
}
