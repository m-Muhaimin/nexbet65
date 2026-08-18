# AGENTS.md — nexbet65.com

Next.js 14 (App Router) casino dashboard: public marketing landing (`/`),
lobby, wallet + admin-approval deposit/withdraw flow, and four game apps —
**Aviator**, **Mines**, **Money Wheel** (renamed from Crazy Time) and
**Plinko**. **Not a git repo** — deploys are a manual tarball `scp` + rebuild
on the VPS. Lives under `X:\nextbet65\game-server\nexbet65.com`.

## Commands
- Build = the only gate (no tests, no lint script): run from the home dir —
  `npm run build --prefix "X:/nextbet65/game-server/nexbet65.com"` (Windows npm
  ignores `workdir`; inside the repo dir `npm` is a `.bat` shim).
- Typecheck (no npm script exists): `npx tsc --noEmit -p tsconfig.json` from the
  repo dir — run it before every build.
- After editing `prisma/schema.prisma`: `npx prisma generate` from the repo dir.
  A running `next dev`/`next start` on Windows locks the query-engine DLL, so
  generate fails with `EPERM rename ... query_engine-windows.dll.node` — kill
  the node PID (`tasklist` → it's the one on `next ... start -p 3010`) first,
  then restart the server.

## Database — CRITICAL
- One shared Neon Postgres. nexbet65.com only writes namespaced `WinUser` /
  `WinTransaction` / `WinTeamMember`. The shared `User` / `Round` / `Bet`
  tables are unmanaged (written by external game servers, read via raw SQL in
  `lib/results.ts`).
- **NEVER** `prisma db push --accept-data-loss` — Prisma treats shared tables
  as drift and would DROP them.
- Schema changes: edit `schema.prisma`, append idempotent `ALTER TABLE ...
  ADD COLUMN IF NOT EXISTS` lines to `prisma/init.sql`, then apply on prod with
  `npx prisma db execute --file prisma/init.sql --schema prisma/schema.prisma`.
  PG has no `ADD CONSTRAINT IF NOT EXISTS` — wrap FK adds in a `DO $$`
  block checking `pg_constraint`. Prisma stays pinned to v6 (don't bump v7).
- `db execute` returns no rows; verify columns with a throwaway node script
  using `$queryRaw` against `information_schema.columns`.

## Data model
- `WinUser.balance` is `Decimal(16,2)`, default 0. **No signup bonus** — new
  users register at 0 and must deposit.
- `WinTransaction` rows with `status: NULL` are **ledger entries**; the wallet
  feed is `where status: null` (`lib/wallet-server.ts`). Rows with `type`
  deposit/withdraw are **payment requests** and must never appear in the feed.
- `ref` is a unique idempotency key (prevents double-recording).
- New ledger kinds must be whitelisted in `recordWalletTransaction`
  (`lib/wallet-server.ts`) and documented in the schema's `kind` comment.

## Wallet / payments
- `lib/payments.ts`: `PAYMENT_METHODS` accounts are **placeholders** — update
  them before launch. bKash deposits are Cash Out to `01755650768` (real
  account, not a placeholder). One-time **first-deposit bonus** is tiered:
  `FIRST_DEPOSIT_BONUS_TIERS` = 50% (500–999), 100% (1000–2000), 150% (>2000);
  deposits <500 earn nothing. Bonus logic is `firstDepositBonusRate/For`.
- Deposit/withdraw create pending rows; the balance moves **only** in
  `reviewPaymentRequest`, inside one `$transaction` (deposit credit + bonus /
  withdraw debit / reject = no move).
- **First-deposit bonus is non-withdrawable** (`WinUser.lockedBonus`):
  the bonus is credited to `balance` and usable for betting, but `withdrawable =
  balance - lockedBonus`. `reviewPaymentRequest` locks the bonus on the first
  approved deposit (`lockedBonus += bonus`); `recordWalletTransaction`
  (`lib/wallet-server.ts`) consumes the locked portion first on `bet` debits
  (winning payouts are real and never locked, refunds restore the lock capped at
  balance). Both `createWithdrawRequest` and the approve path reject amounts
  above `withdrawable` with
  `Insufficient withdrawable balance (first-deposit bonus cannot be withdrawn)`.
  Invariant: `0 <= lockedBonus <= balance`, maintained by every write. The wallet
  snapshot (`/api/wallet`, GET) exposes `lockedBonus` + `withdrawable`; the
  wallet page caps the withdrawal picker at `withdrawable` and shows a lock note.
- Admin gating: comma-separated `ADMIN_USERNAME` env, lowercase-matched via
  `isAdminUser()`. `/admin/payments` (server page redirects non-admins) +
  `/api/admin/payments` + `/api/admin/payments/[id]` PATCH (approve|reject).
- Service-layer errors must be **returned** as `{ok:false, error}` and never
  thrown: `queryWithRetry` rethrows, so an uncaught `DUP_TX` / "Insufficient
  balance" becomes a 500. Catch and map them (see `createDepositRequest`).

## Auth
- Sessions are an HMAC-signed cookie `nexbet65_session` (`lib/auth.ts`,
  `AUTH_SECRET` env; demo fallback secret exists). Server code reads via
  `getSessionUser()` (`lib/session-server.ts`).
- `middleware.ts` only guards `/lobby /games /profile`. `/wallet` and
  `/admin/payments` rely on the `(app)` layout redirect + server-side checks —
  keep every new protected page guarded server-side.

## Team / admin console (token auth + server logs)
- `WinTeamMember` (`prisma/init.sql`): `name`, `role`
  (`super_admin|moderator|operator`), `permissions` `TEXT[]`, `tokenHash`
  (HMAC of raw token — **never** store the raw token), `tokenHint` (last 4 of
  raw token, for the table), `isActive`, `lastLoginAt`, `createdBy`. Schema is
  additive; run through the normal `db execute` flow.
- **Roles → default permissions** (`lib/team-types.ts` `ROLE_DEFAULT_PERMISSIONS`,
  editable per member): `super_admin` = team+payments+aviator-server+
  wheel-server+mines-server+p2p; `moderator` = payments; `operator` =
  aviator-server+wheel-server+mines-server.
  Gates use `adminCan(ctx, perm)` where `ctx = getAdminContext()` = the player
  `ADMIN_USERNAME` super admin OR a valid team session (`lib/admin-access.ts`).
- Tokens: `NEXBET65-<40 hex>`, shown **once** at create/rotate
  (`generateAccessToken`, `lib/team.ts`). Login via `POST /api/admin/team/sign-in`
  sets an HMAC `nexbet65_team` cookie (30d). Team sessions never overlap a player
  session: `(app)/layout.tsx` renders a `TeamShell`
  (`components/nav/team-sidebar.tsx` + `team-header.tsx`) when a team cookie is
  present and no player session is.
- Admin pages (all `force-dynamic`, server-gated): `/admin/team` (super only),
  `/admin/payments` (moderator+), `/admin/aviator-server` +
  `/admin/money-wheel-server` + `/admin/mines-server` (operator+),
  `/admin/p2p` (`p2p` perm). The player super admin gets an "Admin" group in
  `components/app-sidebar.tsx` and matching admin links in the top-right
  `UserMenu` dropdown (`components/nav/user-menu.tsx`, `isAdmin` prop —
  includes P2P Agents).
- **`/admin/mines-server` has no journal/SSE** — Mines has no external server.
  The page reads in-process round state directly: `listActiveRounds()` in
  `lib/mines.ts` (sanitized — no mine positions/seeds for live rounds; `sweep()`
  drops 30-min-stale rounds first). Empty table = healthy.
- **Realtime server logs**: `GET /api/admin/server-log?service=aviator|wheel`
  streams SSE from `journalctl -u aviator-ws|-u wheel-ws -f -n <lines> -o short`
  (Node `child_process.spawn`). `nexbet65-web` runs as **root** so journald is
  readable. `components/admin/server-log-viewer.tsx` is the terminal UI
  (EventSource, pause/clear/copy, auto-scroll).
- `components/admin/payments-admin.tsx` polls every 5s (silent) with a LIVE
  badge + flash on new pending rows — the moderator's "realtime request log".
- `isAdminUser` lives in `lib/admin-roles.ts` (re-exported by `lib/payments.ts`)
  to avoid an import cycle with `lib/admin-access.ts` — keep it there.

## P2P agent system
- Public agent console at `/p2p` (`components/p2p/p2p-app.tsx`); admin panel at
  `/admin/p2p` (`components/p2p/p2p-admin.tsx`, gated on the `p2p` permission).
  APIs: `/api/p2p/*` (agent register/login/me/recover/wallets/deposit/topup) and
  `/api/admin/p2p/*` (`overview`, `audit`, `topup` for float top-up approval).
  `/p2p` is **public** (not middleware-guarded) and separate from the player
  wallet flow. Spec: `PRD_P2P.md` (repo root).

## UI conventions
- Brand lime `brand #a3e635` / `brand-dim #84cc16`, black `bg`, panels
  `rounded-2xl border border-white/5 bg-[#111]`; numerals use `font-instrument`; money
  via `formatMoney` (৳, en-IN, `lib/games.ts`).
- Server pages export `export const dynamic = "force-dynamic"`.
- Game round results surface as sonner toasts (`toast.success("WIN ৳X")` /
  `toast.error("You lost ৳X")`); the root `app/layout.tsx` already mounts
  `<Toaster />`. Fire them from event handlers, not effects (avoid StrictMode
  double-toast).

## Layout / sidebar
- The app shell is **shadcn sidebar-04** (converted): `app/(app)/layout.tsx`
  renders `<SidebarProvider><AppSidebar/><SidebarInset><SiteHeader/><main/></SidebarInset></SidebarProvider>`.
  Desktop sidebar is `collapsible="icon"`; on mobile it becomes a Sheet.
- `components/app-sidebar.tsx` holds the real NexBet65 nav: brand header, MAIN
  links, a GAMES group with **direct links** to `/games/aviator`,
  `/games/mines`, `/games/plinko` (not filters), WALLET links, and a footer
  balance card (`fallbackBalance`/`fallbackBonus` props, `useWallet`). Nav items
  use **colored gradient emoji tiles** + themed lime hover/active
  (`hover:bg-brand/10`, `data-[active=true]:bg-brand/10`). Tiles shrink to 16px
  in icon-collapse mode via `group-data-[collapsible=icon]`.
- `components/nav/site-header.tsx` renders inside the inset: `SidebarTrigger`,
  `PageTitle` (`components/nav/page-title.tsx` — maps `usePathname` → title,
  shown in the top bar; add every new game/admin route to its `TITLES` list or
  the header falls back to "NexBet65"), then right-aligned `GlobalSearch` (fixed
  width, sits **before** `NotificationBell`) + `UserMenu`. The balance lives only in the
  sidebar footer — do not re-add a `WalletBalance` to the header (deleted).
- Generated by `npx shadcn@latest add sidebar-04` (needs `@radix-ui/react-tooltip`):
  `components/ui/{sidebar,tooltip,breadcrumb}.tsx`, `hooks/use-mobile.tsx`; it
  also rewrote `ui/{button,separator,sheet,input,skeleton}.tsx`. Button keeps a
  custom `xl` size for `app/page.tsx` — re-add it if the CLI ever clobbers it.
- `components/lobby/lobby-sidebar.tsx` was **deleted** after the conversion;
  `app/dashboard/page.tsx` (sidebar-04 demo) was also removed — `/dashboard` is gone.

## Game apps (Mines + Money Wheel + Plinko)
- All four games are client components under `components/game/` and fully
  server-authoritative: bets settle through `recordWalletTransaction`
  (`lib/wallet-server.ts`), the UI only renders state and sends bets.
- **Shared layout convention (Aviator, Mines, Plinko)**: outer
  `lg:grid lg:grid-cols-4` with the canvas `lg:col-span-3` (left) and the
  betting console `lg:col-span-1` (right). The status strip — Mines
  `N MINES / N GEMS` + live multiplier steps, Plinko `RISK / ROWS` + payout —
  sits at the **top of the right console column**, not above the canvas.
  Round results are sonner toasts (`WIN ৳X` / `You lost ৳X`), not inline
  banners.
- **Consistent compact sizing across games** (Aviator convention): primary
  action buttons are `h-10 w-full rounded-lg text-xs font-black uppercase
  tracking-wider` (START GAME / CASH OUT / DROP BALL). Don't reintroduce large
  `py-3.5 text-lg` pills.
- **Mines** (`lib/mines.ts` + `app/api/mines/{config,start,reveal,cashout}`):
  RTP 0.97, 5×5 grid (25 tiles, 1–24 mines). Multiplier = RTP/P(safe),
  combinatorial (`calculateMultiplier`); the client `calcMult` mirrors it.
  Round state is an **in-memory Map in the Node process** (`rounds`) with a
  30-min TTL sweep — restarting the server drops active rounds. Cashout
  requires ≥1 revealed tile. Reveal/cashout take the round id (username-bound).
- **Plinko** (`lib/plinko.ts`, `lib/plinko-constants.ts`,
  `components/game/plinko-board.tsx` + `plinko-game.tsx`,
  `app/api/plinko/{config,bet}`): native port, **no external WS server**.
  The board renders client-side with **PixiJS v8 + GSAP** (`pixi.js`, `gsap`
  deps). 8–16 rows × 3 risk tiers (`PLINKO_MULTIPLIERS` tables must have exactly
  `rows+1` buckets), RTP 0.99. Server derives the ball path via HMAC-SHA256;
  `currentSeed`/`nextSeed` rotate after every bet with a `globalNonce`
  (in-process — restart rotates seeds). Ledger per round: `bet` debit +
  `payout` credit, `bet_refund` if the payout credit fails. `GET
  /api/plinko/config` returns the committed `serverSeedHash` + tables before
  every drop; the client sends `clientSeed` on each bet.
- **Money Wheel** (`components/game/money-wheel-game.tsx`, renamed from Crazy
  Time): route is `/games/money-wheel`; legacy `/games/crazy-time` redirects to
  it in `app/(app)/games/[slug]/page.tsx`. `components/game/wheel/wheel-svg.tsx`
  renders a 60-slot money wheel. Stripes are seeded — `mulberry32(1337)` (fixed
  seed = same look every render, avoids hydration mismatch),
  `stripeCountFor(weight)` caps 1–5 stripes and never repeats a palette color
  consecutively. Bonus text auto-flips upright on the lower half via
  `readableRotation`. Winner alignment: the server publishes
  `spin_start.winningSegmentId`; `money-wheel-game.tsx` stores it in
  `targetSegmentId` and the SVG animates to `1440 + (360 - (targetMid % 360))`
  so the winner lands under the 12 o'clock pointer and stays highlighted (gold
  `#ffd54f` stroke + drop-shadow). A 24-bulb marquee ring (`#fff3c4`) wraps the
  inner black ring.
- Wheel segment config lives in the wheel WS server
  (`X:\nextbet65\games-server\wheel-live\lib\wheelConfig.js`, redis-pg branch):
  60 slots, weights 23/13/7/4/4/4/3/2 for ids
  `ONE,TWO,FIVE,TEN,DOUBLE_FLIP,PIN_DROP,TREASURE_HUNT,BIG_SPIN`. `spin_start`
  publishes the winner as `winningSegmentId: <id>` using those exact ids —
  the client matches against them (`types.ts`).
- Landing (`/`) is a server component (`force-dynamic`) — hero (covers all four
  live games), Promotions, Welcome-bonus tier ladder, Rewards (cashback +
  referral ladder), games, a Coming-soon strip (the non-playable `CATALOGUE`
  titles), a "Become an Agent" CTA (button → the public P2P console at
  `https://nexbet65.suprbuild.com/p2p`), CTA, footer. Bonus copy must
  match real values in `lib/payments.ts` (`FIRST_DEPOSIT_BONUS_TIERS`
  50/100/150%), `lib/cashback.ts` (`CASHBACK_RATE = 0.1`) and `lib/referral.ts`
  (৳200 + L1/L2/L3 1%/0.5%/0.25%). The lobby hero's `TODAY'S TOP MULTIPLIER`
  panel is `hidden lg:flex` — mobile shows banner first.
- **Lobby filtering** (`lib/lobby-bus.ts`): the `LobbyFilter` type still lists
  every legacy value (`all|slots|crash|live|fishing|table|sports|hot|new`), but
  the pill bar (`components/lobby/category-filters.tsx`) only surfaces
  `all|crash|live|table|hot|new` — there are no slots/fishing/sports titles, so
  don't re-add those pills. Only the pill bar calls `setLobbyFilter`; the
  sidebar links straight to game pages. `game-grid.tsx` matches
  `g.category === filter`, with `hot`/`new` special-cased on `g.tag`.
- **`CATALOGUE`** (`lib/games.ts`) is trimmed to 8 titles: playable Aviator,
  Money Wheel, Mines, Plinko + coming-soon Color Prediction, Limbo, Teen Patti,
  Rummy. Playable tiles use `image: "/thumnails/<slug>-thumbnail.png"` (dir
  spelled **`thumnails`** — typo, don't "fix" it); Color Prediction and Limbo
  keep `/games/<kebab>.svg`. Teen Patti and Rummy intentionally omit `image`
  (no asset) and render the emoji+gradient fallback in `GameCard`. Only set
  `image` when the asset exists — a missing one renders a broken `<img>`.
  `scripts/generate-game-thumbnails.mjs` regenerates only the SVGs into
  `public/games/` and does **not** touch the PNGs.

## Game servers (external)
- Aviator WS: `NEXT_PUBLIC_AVIATOR_WS_URL` (default `wss://ws-aviator.srv1010179.hstgr.cloud`).
- Money Wheel WS: `NEXT_PUBLIC_WHEEL_WS_URL` (default `wss://ws-wheel.srv1010179.hstgr.cloud`).
- The `.env.local.example` names these `NEXT_PUBLIC_WS_URL` /
  `NEXT_PUBLIC_WS_URL_WHEEL` — **stale**, ignore it; use the var names above.
- Aviator WS source lives at `X:\nextbet65\games-server\aviator-nextjs` (node
  CommonJS `server/ws-server.js`, Redis + Postgres). It is **its own deploy**:
  `scp server/ws-server.js root@82.25.105.236:/opt/games/aviator/server/`,
  `node --check`, `systemctl restart aviator-ws`. Chat limits + `welcome.chatLog`
  (the Redis log key `aviator:chat`) live here, not in nexbet65.com.

## Aviator live lobby / chat (client-side bot simulation)
- `components/game/live-lobby.tsx` (tabs **My Bet | Top Bet | Chat**) is mostly
  **cosmetic**: it owns `botWins` (Top Bet = "today's top wins") and `botChat`
  state, seeded on mount + interval-driven (every ~30s / ~12s), mimicking real
  users. Bot content is **never sent to the server or persisted** — don't try to
  sync it. Real chat = WS `chatLog`; real history = `myHistory`
  (`aviator-game.tsx`).
- Chat arrives **twice per sender** (server broadcasts + Redis self-delivery on
  the shared connection) — the client dedupes by message `id`
  (`lastChatIdsRef` in `aviator-game.tsx`; the `welcome` handler pre-seeds ids).
  Any new incoming-message path must do the same.
- My History seeds from wallet txs whose `meta` starts with `"Aviator"`. Aviator
  win/loss ledger kinds record `amount: 0` with the figure in `meta` (e.g.
  `Aviator bet lost 500 @ 1.5x`) — `components/wallet/transaction-history.tsx`
  parses `/lost ([0-9.]+)/` for the display. Keep that pattern for new kinds
  (and whitelist them per the Database section).
- `MAX_BET = 50000` is a const at the top of `aviator-game.tsx`.
- tsconfig has **no `target`** → `[...mySet]` / `for...of` a `Set` fails
  TS2802; use `Array.from(set)` (fixed once already).

## Deploy (no git — tarball scp to VPS)
- Prod: `https://nexbet65.suprbuild.com` · VPS `root@82.25.105.236` ·
  systemd `nexbet65-web` (`next start -p 3010`, cwd `/opt/games/nexbet65`, env in
  `/opt/games/nexbet65/.env`: `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_USERNAME`).
  `ADMIN_USERNAME` must list every player super admin (e.g. `admin111`) — if
  missing, player super admins silently redirect from `/admin/*` to `/`.
  **VPS-side rename required**: after the domain cutover, rename the systemd unit
  (`systemctl disable win111-web && mv /etc/systemd/system/win111-web.service
  /etc/systemd/system/nexbet65-web.service`) and move `/opt/games/win111` →
  `/opt/games/nexbet65` on the VPS. Until the VPS is renamed, the deploy
  commands below reflect the *new* paths — adjust the scp destination and
  `cd` if you're still using the old names on the server.
- **Flow — use the tarball, never per-file scp for a release:**
  ```sh
  # from the repo root (or use -C /x/nextbet65/game-server/nexbet65.com)
  tar czf release.tgz --exclude=node_modules --exclude=.next \
    --exclude=.env --exclude=.git --exclude=tsconfig.tsbuildinfo \
    --exclude=server.log --exclude=server-3010.log --exclude=smoke-ws.js \
    --exclude=smoke-ws2.js --exclude=nexbet65_mockup.html.html .
  scp release.tgz root@82.25.105.236:/opt/games/nexbet65/release.tgz
  # on the VPS:
  cd /opt/games/nexbet65 && tar xzf release.tgz && rm -f release.tgz \
    && npm install --no-audit --no-fund && npx prisma generate \
    && npm run build && systemctl restart nexbet65-web
  ```
  `.env` and `.git` are excluded — the VPS keeps its own
  `/opt/games/nexbet65/.env`; never ship/overwrite it from here.
- **`tar`/npm can ignore the bash tool's `workdir` on Windows** — don't rely on
  it: `cd "X:/nextbet65/game-server/nexbet65.com" && tar ...` (or `-C`) in the same
  command. After creating `release.tgz`, check its size (~10 MB, not multi-GB)
  before `scp` — a home-dir pack stalls the upload.
- **Always verify after deploy**: `systemctl is-active nexbet65-web` (expect
  `active`); curl the changed route/asset — protected `/games/*` 307s to
  `/sign-in`, public assets (e.g. `/thumnails/aviator-thumbnail.png`) return
  200, unauthenticated game APIs return 401/403. Check `journalctl -u
  nexbet65-web` for errors.
- If schema changed: run `npx prisma generate` + `npx prisma db execute --file
  prisma/init.sql` before the build.
- One-off single-file `scp` flattens into the destination dir: upload into the
  exact subdir (`app/`, `components/ui/`, `hooks/`, …) or `mv -f` afterwards,
  `mkdir -p` the target first, and quote parens paths like
  `'app/(app)/layout.tsx'`.
