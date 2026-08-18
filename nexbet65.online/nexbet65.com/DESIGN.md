# NexBet65 — Design System

Design reference for the NexBet65 casino platform (`app/(app)` shell, lobby, games catalogue, wallet, auth) — the dark + gold "casino night" theme. Every value here is extracted from the code: `app/globals.css`, `tailwind.config.ts`, `design/tokens.css`, `app/layout.tsx`, `app/(app)/layout.tsx`, the `components/lobby/*`, `components/nav/*` and `components/app-sidebar.tsx` files. Treat this as the source of truth for visual consistency, not the `nexbet65_mockup.html` prototype.

**Look & feel:** a black casino hall with a gold (`#f6b01a`) accent, glassy blur panels, emoji game tiles on per-game gradient fields, subtle casino-grid texture, and big tabular money readouts (৳, en-IN). Brand type is Inter/Plus Jakarta Sans with Unbounded accents; Bengali marketing copy renders in Noto Sans Bengali. Per-game surfaces (Aviator red, Mines green, Plinko gold, Checkers indigo, Ludo pink) give each title a distinct identity inside the shared chrome.

**App canvas:** responsive web app (PWA), not a fixed portrait slot. Shell is capped at `max-width: 1600px` (content `px-3 sm:px-4`, 2xl container padding 1rem). Desktop gets a collapsible icon sidebar + sticky header; mobile gets a sticky header plus a fixed 5-slot bottom tab bar with a raised Deposit FAB. All money is `৳` (BDT) with `en-IN` grouping and `tabular-nums` so digits never reflow.

---

## 1. Surfaces & overlays

1. **Page body** (`bg-bg` = `#0a1526`) — `--foreground` `0 0% 96%`, `antialiased`, `overscroll-behavior-y: none`, smooth scroll, no tap highlight. Selection is gold (`#f6b01a`) on navy.
2. **Glass panels** (`.glass`) — `rgba(17,17,17,.8)` + `backdrop-filter: blur(14px)`, `border-white/5`. Used by header, mobile tab bar, category pill bar, live-wins panel, coming-soon cards. Floats sit on `bg-surface` (`#111`) or `bg-surface2` (`#1a1a1a`).
3. **Texture utilities**:
   - `.bg-casino-grid` — 40px×40px `rgba(255,255,255,.03)` hairlines.
   - `.hero-radial` — `radial-gradient(circle at top right, rgba(246,176,26,.12), transparent 60%)` (lobby multiplier panel, coming-soon hero).
4. **Glow utilities** (gold neon, the signature effect):
   - `.gold-glow` — `box-shadow: 0 0 24px rgba(246,176,26,.35), 0 0 64px rgba(246,176,26,.12)`.
   - `.text-glow` — `text-shadow: 0 0 32px rgba(246,176,26,.45)`.
   - Amber pair (`.amber-glow`, `.text-glow-amber`, `rgba(255,176,32,…)`) and red (`.text-glow-red`, `rgba(255,77,61,…)`) used inside game canvases (Aviator crash, VIP/hub).

---

## 2. Color palette

### Brand (gold)
| Token | Hex | Use |
|---|---|---|
| Brand | `#f6b01a` | primary buttons, active pills/tags, balance, live-dot, links, highlights |
| Brand dim | `#c9a43c` | button hover (`hover:bg-brand-dim`), gradient end |
| Brand tints | `bg-brand/10` `bg-brand/15` `bg-brand/25` `border-brand/20` `border-brand/25` | pills, badges, panels, balance pill |
| Gradient gold | `#f6b01a → #c9a43c 45% → #fffbe8` | `.text-gradient-gold` headline text |

### Neutrals / surfaces
| Token | CSS | Hex (≈) | Use |
|---|---|---|---|
| Body bg | `bg` | `#000000` | page |
| Background | `hsl(var(--background))` | `#080808` | shadcn surface tokens |
| Card | `hsl(var(--card))` | `#121212` | cards, popovers |
| Surface | `bg-surface` | `#111111` | panels, carousel |
| Surface 2 | `bg-surface2` | `#1a1a1a` | game tiles fallback |
| Secondary | `hsl(var(--secondary))` | `#1c1c1c` | — |
| Muted | `hsl(var(--muted))` | `#1a1a1a` | — |
| Border | `hsl(var(--border))` / `border-white/5` | `#2b2b2b` / white 5% | dividers, tile borders |

### Semantic
- Primary: `#f6b01a` (fg black). Destructive: `0 84% 60%` (red). Success dot: `#2ecc71`-ish brand-free — live indicators use `bg-red-500` (LIVE WINS) or `bg-brand` (top multiplier, availability).
- Text: `--foreground` 96% white; `text-white/40`/`/45`/`/50` for captions; `text-white/30` for sidebar group labels / footer.
- Hot tag: `bg-red-500 text-white`. New tag: `bg-brand text-black`.

### Per-game gradients (tiles, sidebar, catalog)
| Game | Tailwind gradient |
|---|---|
| Aviator | `from-red-500 via-neutral-900 to-black` |
| Mines | `from-green-500 via-emerald-950 to-black` |
| Plinko | `from-brand via-emerald-950 to-black` |
| Checkers | `from-indigo-500 via-neutral-900 to-black` |
| Ludo Arena | `from-pink-500 via-fuchsia-950 to-black` |

### Banner / promo accents
- Banner: emerald (Welcome), fuchsia→purple (Cashback), amber→orange (Check-in), sky→blue (Refer).
- Promo cards: brand gold, `text-fuchsia-300`, `text-sky-300` accents with matching `from-*/10` gradients.

---

## 3. Typography

Four Google fonts via `next/font/google`, exposed as CSS vars (set once on `<html>`):
- `--font-inter` (Inter, latin) — default `font-sans` face.
- `--font-bengali` (Noto Sans Bengali) — second in the `font-sans` stack; Bengali marketing copy (`দৈনিক`, `৳২০` etc.).
- `--font-plus-jakarta` (Plus Jakarta Sans) — optional display face.
- `--font-unbounded` (Unbounded) — accent/display face (`font-unbounded`).

**`font-sans` stack:** `var(--font-inter) → var(--font-bengali) → system-ui → -apple-system → sans-serif`.

**`.font-instrument`** — mono numeric readout: `ui-monospace, "SF Mono", "Cascadia Mono", "Segoe UI Mono", Menlo, Consolas` with `font-variant-numeric: tabular-nums`. Required for the balance and any multiplier so digits never reflow while ticking.

### Size rhythm
- Headlines: section titles `text-lg font-bold`; hero banner titles `text-2xl/3xl font-black`; coming-soon `text-3xl/4xl font-black tracking-tight`.
- Big money: `.multiplier-big` `clamp(52px, 7vw, 72px)` line-height 1; balance `text-2xl font-extrabold tabular-nums`.
- Body/microcopy: 10–14px (`text-[10px]` group labels → `text-sm` CTA). Group labels & badges use `font-bold`/`font-black` with `tracking-[0.18em]`–`[0.2em]`.
- Brand wordmark "NexBet65": `text-base font-extrabold tracking-tight`.

---

## 4. Layout regions (app shell → lobby)

### 4.1 Root & shell
- **Root** (`app/layout.tsx`): `<html lang="en">` with 4 font vars, `<body class="min-h-screen bg-bg font-sans">`; `Toaster position="top-center" richColors`; `ServiceWorkerRegister`; viewport `themeColor #000000`, `viewportFit: cover`, PWA manifest + apple meta.
- **App layout** (`app/(app)/layout.tsx`): `SidebarProvider` → `AppSidebar` (desktop, `collapsible="icon"`) → `SidebarInset` → `SiteHeader` → content wrapper `mx-auto w-full max-w-[1600px] flex-1 px-3 pt-4 pb-28 sm:px-4 md:pb-10` → `MobileTabBar`. Session-guarded (`redirect /sign-in`); team users render a separate `TeamSidebar`/`TeamHeader` shell.
- **Header** (`site-header.tsx`): `.glass sticky top-0 z-40 border-b border-white/5`, `h-14` row: sidebar trigger (md+), mobile "N" logo tile, `PageTitle`, then `GlobalSearch` · install icon · `NotificationBell` · `BalancePill` · `UserMenu`.
- **Mobile tab bar** (`mobile-tabbar.tsx`): `.glass safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-white/10 md:hidden`, `h-16` 5-column grid — Lobby, Games, center **Deposit FAB**, Withdraw, Profile. Active tab = `text-brand`. FAB: `.gold-glow fab` 54px circle `translateY(-22px)`, active shows `ring-2 ring-white/60`.

### 4.2 Sidebar (`app-sidebar.tsx`)
- Header: "N" logo tile (`.gold-glow`, 8×8, `bg-brand`, black `N`) + wordmark + tagline "Play. Win. Withdraw."
- `NavGroup`s: **Main** (Home, All Games), **Games** (Aviator, Mines, Plinko, Checkers, Ludo Arena), **Wallet** (Deposit, Withdraw, VIP Club "soon").
- `NavTile`: 28px rounded-lg `bg-gradient-to-br` emoji tile with `shadow-[inset_0_1px_0_rgba(255,255,255,.15)]`, hover `scale-110`; collapses to 16px in icon mode.
- Active/emphasis: `bg-brand/10 text-brand font-semibold`; group labels `text-[10px] font-bold tracking-[0.18em] text-white/30`.
- Footer balance card: `border-brand/20` gradient `from-brand/10 via-white/5`, radial gold blob, "AVAILABLE BALANCE" + `font-instrument` number, "Bonus:" gold, `.gold-glow` **Quick Deposit** button, `InstallAppButton`.

### 4.3 Lobby (`app/(app)/lobby/page.tsx`) — top → bottom
1. **Hero** — `grid gap-3 lg:grid-cols-[300px_minmax(0,1fr)_320px]`:
   - **Top multiplier panel** (hidden < lg): glass, `h-[230px] md:h-[260px] lg:h-[280px]`, gold radial wash, "TODAY'S TOP MULTIPLIER" (11px, tracked, pulsing brand dot), `MultiplierTicker` (`.multiplier-big .text-glow` gold, rAF count-up), caption with real crash data.
   - **`BannerCarousel`**: auto-advance 4s / 700ms fade, prev/next chevrons (md+), clickable dots (`w-6 bg-brand` active / `w-1.5 bg-white/30`); each slide = per-promo gradient, badge pill, Bengali headline with `text-brand` spans, sub, gold CTA pill.
   - **`LiveWinFeed`** (hidden < lg): glass; LIVE WINS header (red pulse dot) + "Last hour" total; JACKPOT POOL box (`border-brand/20 bg-black/60`, `text-glow text-2xl font-black tabular-nums text-brand`); 6-row feed polled from `/api/games/results` every 5s, game emoji in `bg-brand/15` circle, `+৳` gold.
2. **`GameGrid`** — sticky pill bar + tile grid (see §5).
3. **Hot Promotions** — `text-lg font-bold` heading + "View all" brand link + `PromoCards` (`grid gap-3 sm:grid-cols-2 lg:grid-cols-3`).
4. **Footer** — `border-t border-white/5`, 18+ / responsible-gaming copy, `© 2026 NexBet65`.

---

## 5. Components

- **Category pills** (`category-filters.tsx`): `.glass sticky top-14 z-30 -mx-3 border-b border-white/5`, horizontal scroll (`no-scrollbar`). Pills: `rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/70`; active = `.pill-active` (`bg #a3e635`, black text, 600). Keys: all / crash / live / table / hot / new. Sidebar + pill bar share state via `lobby-bus`.
- **`GameCard`**: `aspect-[3/4]`, `rounded-xl border bg-surface2`, playable = `border-white/5 hover:scale-105 hover:border-brand/40`; non-playable = `opacity-80 cursor-not-allowed` + black "SOON" lock chip. Art = thumbnail `img` (from `/thumnails/vertical/<slug>-thumbnail-vertical.png`) or gradient + centered emoji (5xl/6xl, deep drop-shadow). Tag chip top-left (hot=red, new=gold). Hover: gold play circle (`.gold-glow` `bg-brand`) or "Coming soon" pill. Caption: gradient `from-black/95`, name `text-xs sm:text-sm font-semibold`, provider · `RTP {x}%`.
- **`BalancePill`**: `h-9 rounded-full border-brand/25 bg-brand/10 px-2.5`, wallet icon, `৳` en-IN; compact `৳`+rounded under `min-[440px]`; refreshes on focus + every 30s.
- **`PromoCards`**: `rounded-2xl border bg-gradient-to-br p-5`, tag (10px black tracked, colored), bold title, sub `text-white/45`, primary CTA gold pill or ghost `border-white/15 hover:border-brand/50`.
- **Toasts** (`sonner`): `position="top-center"`, `richColors`.

---

## 6. Motion catalog

Tailwind `keyframes` + animation utilities (theme), plus hand-written CSS keyframes in `globals.css`:

| Name | Duration | Easing | Use |
|---|---|---|---|
| `pulse-glow` | 2s | ease-in-out infinite | soft opacity pulse |
| `hub-pulse` | 1.6s | ease-in-out infinite | VIP/hub amber ring `0 0 18→36px rgba(251,191,36,…)` |
| `float` | 6s | ease-in-out infinite | gentle lift −8px |
| `shimmer` | 1.5s | infinite | `translateX(100%)` sweep |
| `marquee` | 32s | linear infinite | `translateX(-50%)` ticker |
| `win-in` | 0.45s | ease | feed row enter (fade + −8px) |
| `crash-flash` | 0.7s | ease-out forwards | Aviator red crash overlay |
| `neon-breathe` | var(--breathe-speed, 3s) | ease-in-out infinite | unrevealed Mines tile gold glow |
| `burst-ring` | 0.7s | ease-out forwards | tile reveal ring (scale .2→2.8) |
| `fade-in` | 0.3s | ease-out forwards | overlays |
| `pop-in` | 0.35s | `cubic-bezier(.34,1.56,.64,1)` forwards | modal/overlay entrances |
| `neon-border-pulse` | 1.8s | ease-in-out infinite | admin "Next Crash Point" border |

`prefers-reduced-motion: reduce` collapses all CSS animations/transitions to 0ms.

---

## 7. Constraints for agents

- This is a real-money platform: never render client-computed wins — game canvases (Aviator/Mines/Plinko/arena games) only present server-verified rounds. There is no dev/guest mode.
- The design is a **hybrid**: hand-written CSS utilities in `app/globals.css` (+ `design/tokens.css`) for effects and keyframes, Tailwind for layout/utility classes. Keep that pattern; `design/tokens.css` defines `--color-*` vars aligned with the gold-navy design system.
- Fonts are Next-managed Google fonts — keep all four `--font-*` vars; Bengali copy needs `--font-bengali` in the stack.
- Money is `৳` + `toLocaleString("en-IN")`, 2 decimals in balance contexts, `tabular-nums` everywhere it ticks; compact pill under 440px.
- Preserve: `max-w-[1600px]` shell, sticky header (`top-14` pill bar below it), fixed mobile tab bar + raised Deposit FAB (`pb-28` clears it), `safe-bottom`, `overscroll-behavior-y: none`, PWA/manifest/apple meta.
- Game catalogue and sidebar links live in `lib/games.ts` (`GAMES`, `CATALOGUE`) and `components/app-sidebar.tsx` — keep them in sync. Local thumbnails live in `public/thumnails/vertical/` (generated by `scripts/generate-game-thumbnails.mjs`).
- Protect `/lobby`, `/games`, `/profile` via `middleware.ts`; keep `/register`, `/sign-in` public and redirected when authed.
