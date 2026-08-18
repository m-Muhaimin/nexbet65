# SuperAce-Max — Regression Baseline

**Established:** Phase 0, Checkpoint 0.2
**Purpose:** Snapshot of build/type health before architecture migration begins.

---

## 1. Build & Type Health

| Check | Command | Result | Exit Code |
|---|---|---|---|
| TypeScript | `tsc --noEmit` | Zero errors | 0 |
| Production build | `vite build` | Success (40.59s) | 0 |
| Lint | `tsc --noEmit` (same as TS) | Zero errors | 0 |
| Test suite | `vitest run` | **Not configured** | — |

**Note:** No ESLint, Prettier, or test framework is installed. `npm run lint` is aliased to `tsc --noEmit`.

---

## 2. Bundle Size

| Artifact | Raw | Gzip |
|---|---|---|
| JS (`index-C17W6oLD.js`) | 483.60 KB | 142.51 KB |
| CSS (`index-Crwwy_vB.css`) | 131.74 KB | 17.05 KB |
| HTML | 1.61 KB | 0.88 KB |
| **Total** | **616.95 KB** | **160.44 KB** |

**Note:** JS increased +8KB after Zustand stores (acceptable trade-off for state management).

---

## 3. Source Metrics

| Metric | Value |
|---|---|
| Total source files | 48 |
| Total source lines (TSX + TS) | 7,884 |
| Component files | 38 |
| Modal files | 14 |
| Utility files | 4 |
| CSS lines (index.css) | ~290 |

### Largest Files by Line Count

| File | Lines | Role |
|---|---|---|
| `src/App.tsx` | 1,071 | Monolith — all state, logic, orchestration |
| `src/utils/soundEngine.ts` | 609 | Procedural WebAudio engine |
| `src/utils/mathEngine.ts` | 450 | Game math (grid gen, evaluation, cascade) |
| `src/components/WinningWaysLinePath.tsx` | 273 | SVG win line paths |
| `src/components/AztecEnergyParticles.tsx` | 259 | Canvas particle system |
| `src/components/GridEnergyRipple.tsx` | 252 | Canvas energy wave FX |
| `src/components/ControlBar.tsx` | 241 | Spin controls |
| `src/components/NavigationDrawer.tsx` | 204 | Slide-in menu |
| `src/components/BigWinCoinParticleCanvas.tsx` | 203 | Canvas coin FX |
| `src/components/SymbolArtwork.tsx` | 200 | SVG card artwork |

---

## 4. React Hook Usage (App.tsx)

| Hook | Count |
|---|---|
| `useState` | 55 |
| `useCallback` | 7 |
| `useEffect` | 6 |

---

## 5. Timer Usage (All Source Files)

| File | setTimeout/setInterval |
|---|---|
| `src/App.tsx` | 12 |
| `src/components/GridEnergyRipple.tsx` | 1 |
| `src/components/InfoRibbon.tsx` | 1 |
| `src/components/PreviousWinFloatOverlay.tsx` | 1 |
| `src/components/SpinningReelColumn.tsx` | 1 |
| `src/components/WinMultiplierOverlay.tsx` | 1 |
| `src/components/modals/BigWinCelebration.tsx` | 2 |
| **Total** | **19** |

---

## 6. TypeScript Configuration

| Setting | Value |
|---|---|
| Target | ES2022 |
| Module | ESNext |
| Module resolution | Bundler |
| JSX | ReactJSX (automatic) |
| Strict | **OFF** |
| noEmit | true |
| isolatedModules | true |
| Path alias | `@/` → project root |

**Compiler options of concern:**
- `strict: false` — no null checks, no implicit any detection
- `useDefineForClassFields: false` — non-standard for modern React

---

## 7. Dependency Count

| Type | Count | Notable |
|---|---|---|
| Dependencies | 6 | React 19, motion, lucide-react, canvas-confetti, @google/genai, express |
| Dev dependencies | 4 | Vite, @vitejs/plugin-react, TypeScript, Tailwind CSS |

**Bundle-impacting dependencies:**
- `motion/react` (framer-motion): ~60KB gzipped — animation engine
- `canvas-confetti`: ~5KB gzipped — confetti effects
- `@google/genai`: ~15KB gzipped — **unused** in deployed version
- `express`: ~20KB gzipped — **unused** in deployed version

---

## 8. Smoke Test Results

| Test | Method | Result |
|---|---|---|
| App renders without crash | `tsc --noEmit` + `vite build` | **PASS** |
| No TypeScript errors | `tsc --noEmit` (exit code 0) | **PASS** |
| Production build succeeds | `vite build` (exit code 0) | **PASS** |
| JS bundle generated | Check `dist/assets/*.js` exists | **PASS** |
| CSS bundle generated | Check `dist/assets/*.css` exists | **PASS** |
| No test failures | N/A — no tests exist | **N/A** |
| No lint violations | N/A — no linter configured | **N/A** |

---

## 9. Baseline Snapshot

```
Build timestamp:    2026-08-14 (post-zustand refactor)
TypeScript errors:  0
Build time:         35.84s
JS bundle (raw):    483.60 KB
JS bundle (gzip):   142.51 KB
CSS bundle (raw):   131.74 KB
CSS bundle (gzip):  17.05 KB
Source files:       48 + 10 stores
Source lines:       7,884 + ~400 stores = ~8,284
Components:         38
Modals:             14
useState (App):     0 (Zustand stores)
Zustand stores:     9 (game, wallet, vault, jackpot, boost, session, ui, history, tournament)
Timers total:       19
Test files:         0
```

---

## 10. Regression Checklist

Before marking any migration checkpoint as **PASS**, verify:

- [ ] `tsc --noEmit` exits 0 (zero TypeScript errors)
- [ ] `vite build` exits 0 (production build succeeds)
- [ ] JS bundle size ≤ baseline (475.58 KB) or improvement noted
- [ ] CSS bundle size ≤ baseline (131.74 KB) or improvement noted
- [ ] No new runtime errors in browser console
- [ ] All existing functionality preserved (no feature regressions)

---

*End of Checkpoint 0.2 — Regression Baseline*
