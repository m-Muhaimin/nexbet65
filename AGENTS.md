# AGENTS.md — nexbet65 monorepo

Two independent projects sharing a Git repo. Neither project has CI or monorepo tooling — they are built/deployed independently.

## Projects

| Directory | Stack | Deploy |
|---|---|---|
| `nexbet65.online/` | Next.js 14 (App Router), Prisma, Neon Postgres | Tarball scp → VPS `root@82.25.105.236` (systemd `nexbet65-web`) |
| `superace-max/` | Vite 6, React 19, TypeScript 5.8, Tailwind v4, Zustand, Phaser 4, Vitest | Google AI Studio / Cloud Run |

Project-level details live in each directory's own `AGENTS.md` (nexbet65.online) or `README.md` (superace-max). Read those before editing either project.

## Key commands

### nexbet65.online (run from `nexbet65.online/`)

```sh
# Typecheck (no npm script — run manually, do this BEFORE build)
npx tsc --noEmit -p tsconfig.json

# Build (the only quality gate — no tests, no lint)
npm run build

# After schema changes
npx prisma generate
npx prisma db execute --file prisma/init.sql --schema prisma/schema.prisma
```

Windows npm ignores the bash tool's `workdir` param — always use `--prefix` or `cd` in the same command.

### superace-max (run from `superace-max/`)

```sh
npm run dev        # Vite dev server on :3000
npm run build      # Production build → dist/
npm run lint       # tsc --noEmit (typecheck only)
npm run test       # vitest run (single pass)
npm run test:watch # vitest watch
```

## Critical constraints

- **nexbet65.online shares Neon Postgres tables with external game servers.** Never run `prisma db push --accept-data-loss` — it will DROP shared `User`/`Round`/`Bet` tables. Schema changes go through `prisma/init.sql` (idempotent `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`). See `nexbet65.online/AGENTS.md` for the full migration flow.
- **Prisma is pinned to v6** — do not bump to v7 (breaking changes with shared-schema workflow).
- **superace-max tsconfig has `noEmit: true`** — the `lint` script is a typecheck only; it does not produce output.
- **superace-max uses Tailwind v4** (`@tailwindcss/vite` plugin), not v3. Do not add `tailwind.config.js` — config is CSS-first.
- **superace-max Phaser 4** is a heavy dep; don't add it to nexbet65.online.

## Windows path gotchas

- `npm install` / `npm run` can ignore the bash tool's `workdir` and run from `C:\Users\muhai` instead. Always use `--prefix <dir>` for project-specific npm commands.
- `tar`, `scp`, and other shell commands respect `workdir` normally.
- On Windows, `npm` inside the project dir is a `.bat` shim — `npx` works fine.

## Deploy — nexbet65.online

Deploy is manual tarball + scp (no git push-to-deploy). The `.env` and `.git` are excluded from the tarball — the VPS keeps its own `.env`. See `nexbet65.online/AGENTS.md` "Deploy" section for exact commands and post-deploy verification.

## Git conventions

- No branch strategy documented — commits go to `main`.
- `node_modules/`, `.next/`, `dist/`, `.env` are gitignored per project.
- `superace-max/bun.lock` and `superace-max/package-lock.json` are both tracked (npm used in practice).
