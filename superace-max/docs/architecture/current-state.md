# SuperAce-Max — Current Architecture State

**Audit Date:** Phase 0, Checkpoint 0.1
**Repository:** `X:\nexbet65\superace-max`
**Status:** Pre-migration baseline

---

## 1. Executive Summary

SuperAce-Max is a 5×4, 1024-ways cascading video slot game built with React 19, TypeScript, Vite 6, Tailwind CSS 4, and Framer Motion (`motion/react`). It features a Deluxe/VIP theme with Golden Joker expanding wilds, Overdrive multiplier ladder, Mega Symbols, procedural WebAudio sound, and multiple retention UI modules (Vault, Tournament, Jackpot, Beginner Boost, Daily Rewards). The entire game state, UI state, animation orchestration, and business logic reside in a single 1071-line `App.tsx` monolith with **55 `useState` calls**. There are **zero tests**, **no lazy loading**, and **no code splitting**. The deployed version uses CSS/React Motion for reel animations (not Phaser — the Phaser version exists only in the GitHub clone).

---

## 2. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React | 19.0.1 |
| Language | TypeScript | ~5.8.2 |
| Bundler | Vite | 6.2.3 |
| CSS | Tailwind CSS | 4.1.14 |
| Animation | motion/react (Framer Motion) | 12.23.24 |
| Icons | lucide-react | 0.546.0 |
| Confetti | canvas-confetti | 1.9.4 |
| AI (unused) | @google/genai | 2.4.0 |
| Dev server | Express | 4.21.2 |
| Module type | ESM | — |
| Target | ES2022 | — |

**Notable absences:** No state management library (Zustand/Redux). No test framework. No linting (ESLint). No formatter (Prettier). No Phaser in deployed version.

---

## 3. File Structure

```
superace-max/
├── index.html              (1.6 KB)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── dist/
│   ├── index.html
│   └── assets/
│       ├── index-*.js      (475.6 KB / 141.1 KB gzip)
│       └── index-*.css     (131.7 KB / 17.0 KB gzip)
├── src/
│   ├── main.tsx             (6 lines — StrictMode + createRoot)
│   ├── App.tsx              (1071 lines — MONOLITH)
│   ├── types.ts             (162 lines)
│   ├── index.css            (290+ lines — animations, card styles)
│   ├── vite-env.d.ts
│   └── components/
│       ├── ReelGrid.tsx           (170 lines)
│       ├── SpinningReelColumn.tsx (121 lines)
│       ├── GridCellView.tsx       (151 lines)
│       ├── SymbolArtwork.tsx      (200 lines)
│       ├── ControlBar.tsx         (241 lines)
│       ├── HeaderBar.tsx          (115 lines)
│       ├── FooterBar.tsx          (138 lines)
│       ├── MultiplierBar.tsx      (153 lines)
│       ├── NavigationDrawer.tsx   (204 lines)
│       ├── WinningWaysLinePath.tsx(273 lines)
│       ├── GridEnergyRipple.tsx   (252 lines)
│       ├── AztecEnergyParticles.tsx(259 lines)
│       ├── BigWinCoinParticleCanvas.tsx(203 lines)
│       ├── FireflyParticleCanvas.tsx(195 lines)
│       ├── ConfettiCanvas.tsx     (122 lines)
│       ├── VaultCoinFlyingCanvas.tsx(147 lines)
│       ├── VaultHUDButton.tsx     (47 lines)
│       ├── TournamentTicker.tsx   (102 lines)
│       ├── CascadeCounter.tsx     (87 lines)
│       ├── MultiplierBadge.tsx    (—)
│       ├── InfoRibbon.tsx         (124 lines)
│       ├── CardDefs.tsx           (12 lines)
│       ├── WinMultiplierOverlay.tsx(77 lines)
│       ├── WaysToWinOverlay.tsx   (92 lines)
│       ├── PreviousWinFloatOverlay.tsx(75 lines)
│       └── modals/
│           ├── BuyBonusModal.tsx       (167 lines)
│           ├── BetSelectorModal.tsx    (85 lines)
│           ├── AutoplayModal.tsx       (81 lines)
│           ├── FreeSpinsCelebrationModal.tsx(142 lines)
│           ├── BigWinCelebration.tsx   (128 lines)
│           ├── PaytableModal.tsx       (157 lines)
│           ├── HistoryModal.tsx        (118 lines)
│           ├── SettingsModal.tsx       (119 lines)
│           ├── VaultModal.tsx          (145 lines)
│           ├── TournamentModal.tsx     (165 lines)
│           ├── VIPClubModal.tsx        (136 lines)
│           ├── JackpotModal.tsx        (126 lines)
│           ├── DailyRewardModal.tsx    (79 lines)
│           └── WithdrawalInterceptModal.tsx(115 lines)
└── utils/
    ├── mathEngine.ts        (450 lines — game math)
    ├── symbols.ts           (160 lines — payout tables, weights)
    ├── soundEngine.ts       (609 lines — procedural WebAudio)
    └── cardVisuals.ts       (83 lines — SVG artwork)
```

**Total source lines:** ~8,275 (including CSS)
**Total component lines:** ~5,323 (38 components)

---

## 4. Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                     main.tsx                        │
│                  (StrictMode)                       │
│                       │                             │
│                       ▼                             │
│               ┌──────────────┐                      │
│               │   App.tsx    │  55 useState          │
│               │   1071 lines │  6 useEffect          │
│               │              │  6 useCallback        │
│               │  ALL STATE   │                      │
│               └──────┬───────┘                      │
│                      │                              │
│     ┌────────────────┼────────────────────┐         │
│     │                │                    │         │
│     ▼                ▼                    ▼         │
│ ┌────────┐   ┌──────────────┐    ┌───────────┐     │
│ │ Header │   │  ReelGrid    │    │ ControlBar│     │
│ │  Bar   │   │              │    │           │     │
│ └────────┘   │ ┌──────────┐ │    └───────────┘     │
│              │ │Spinning  │ │                      │
│ ┌────────┐   │ │ReelColumn│ │    ┌───────────┐     │
│ │ Multi- │   │ │(5x CSS)  │ │    │  Footer   │     │
│ │ plier  │   │ └──────────┘ │    │   Bar     │     │
│ │  Bar   │   │              │    └───────────┘     │
│ └────────┘   │ ┌──────────┐ │                      │
│              │ │GridCell  │ │    ┌───────────┐     │
│              │ │  View    │ │    │ Navigation│     │
│              │ └──────────┘ │    │  Drawer   │     │
│              │ ┌──────────┐ │    └───────────┘     │
│              │ │ Symbol   │ │                      │
│              │ │ Artwork  │ │    ┌───────────┐     │
│              │ └──────────┘ │    │  14 Modal │     │
│              └──────────────┘    │  Components│    │
│                                  └───────────┘     │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │              Canvas / Particle Layer          │   │
│  │  FireflyParticleCanvas (requestAnimationFrame)│   │
│  │  ConfettiCanvas                              │   │
│  │  BigWinCoinParticleCanvas                    │   │
│  │  AztecEnergyParticles                        │   │
│  │  VaultCoinFlyingCanvas                       │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │              Utilities Layer                  │   │
│  │  mathEngine.ts  (pure functions)              │   │
│  │  symbols.ts     (static data)                 │   │
│  │  soundEngine.ts (WebAudio singleton)          │   │
│  │  cardVisuals.ts (SVG templates)               │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 5. State Ownership Map

### App.tsx State (55 useState calls)

| Domain | State Variables | Count |
|---|---|---|
| **Game Core** | gameMode, balance, level, betAmount, currentWin, displayedWin, isBalancePulsing, lastAddedWin, lastSpinWin | 9 |
| **Grid** | grid, spinningColumns | 2 |
| **Spin Flow** | isSpinning, comboMultiplier, spinCount, cascadeDepth, currentWaysHits, scattersCount, screenShakeClass, activeRippleColumns, activeRippleCells, rippleTriggerKey, isOverdriveActive | 11 |
| **Free Spins** | isFreeSpinsActive, freeSpinsRemaining, freeSpinsTotal, freeSpinsAccumulatedWin | 4 |
| **Settings** | isTurbo, isMuted, autoSpinsRemaining | 3 |
| **Vault** | vaultData (with transactions array), vaultDepositAnimKey | 2 |
| **Tournament** | tournamentData (with entries array), recentOvertakeMessage | 2 |
| **VIP/Boost** | boostData | 1 |
| **Jackpot** | jackpotValue, totalBetsPlaced, hasJackpotIncrement, isJackpotOpen | 4 |
| **Daily Reward** | isDailyRewardOpen, dailyRewardAmount, dailyStreak | 3 |
| **Modals** | isMenuOpen, isBuyBonusOpen, isFreeSpinsIntroOpen, awardedSpinsCount, isFreeSpinsSummaryOpen, isPaytableOpen, isHistoryOpen, isSettingsOpen, isBetSelectorOpen, isAutoplayModalOpen, isVaultOpen, isTournamentOpen, isVIPClubOpen, isWithdrawalInterceptOpen | 14 |
| **Celebration** | celebrationWinAmount | 1 |
| **History** | history | 1 |

**Derived state computed in render:** winMultiple (line 640), effectiveMode (line 381), bonusBuyCost (line 342-343)

---

## 6. Rendering Ownership

| What | How | Where |
|---|---|---|
| Reel symbols | CSS grid + React Motion layout animations | `SpinningReelColumn.tsx` → `GridCellView.tsx` → `SymbolArtwork.tsx` |
| Reel spin | CSS animation (`animate-reel-spin`) triggered by `isSpinning` prop | `SpinningReelColumn.tsx` |
| Winning highlights | Framer Motion infinite scale pulse | `GridCellView.tsx` |
| Firefly particles | HTML5 Canvas + requestAnimationFrame | `FireflyParticleCanvas.tsx` |
| Confetti | HTML5 Canvas + requestAnimationFrame | `ConfettiCanvas.tsx` |
| Big Win coins | HTML5 Canvas + requestAnimationFrame | `BigWinCoinParticleCanvas.tsx` |
| Energy ripple | HTML5 Canvas + requestAnimationFrame | `AztecEnergyParticles.tsx` |
| Vault coin flight | HTML5 Canvas + requestAnimationFrame | `VaultCoinFlyingCanvas.tsx` |
| Grid energy ripple | CSS animation (`animate-energy-wave`, `animate-energy-pillar`) | `GridEnergyRipple.tsx` |
| Multiplier bar | Framer Motion `layoutId` + CSS | `MultiplierBar.tsx` |
| Ways-to-win lines | SVG path drawing via useMemo | `WinningWaysLinePath.tsx` |
| Mega symbols | Framer Motion overlay on CSS grid | `ReelGrid.tsx` inline |
| Modals | Framer Motion AnimatePresence slide/fade | Individual modal components |
| Background | CSS radial-gradient + Framer Motion animate | `App.tsx` inline |

---

## 7. Known Coupling Issues

### CRITICAL: Game Logic in App.tsx
- `handleSpin` (lines 338-690) is a 350-line async function containing:
  - Balance deduction
  - Jackpot contribution calculation
  - Server API call
  - Grid update sequence (column-by-column reel stop)
  - Cascade iteration loop
  - Multiplier updates
  - Golden Joker expansion detection
  - Sound trigger decisions
  - Vault deposit logic
  - Tournament scoring
  - VIP loyalty points
  - History recording
  - Big Win celebration threshold
  - Free Spins management
  - Auto-spin decrement
- This function mixes game math, API calls, UI state mutations, sound triggers, and animation timing.

### CRITICAL: Animation-Driven State Updates
- `setSpinningColumns` updated 6 times per spin (once per column stop)
- `setGrid` updated on every cascade step via `requestAnimationFrame`
- `setComboMultiplier` updated per cascade step
- `setCurrentWin` updated per cascade step
- `setScreenShakeClass` updated and cleared via setTimeout
- `setIsOverdriveActive` toggled during cascade

### CRITICAL: Timer-Based Architecture
- 20+ `setTimeout`/`setInterval` calls across the codebase
- Jackpot ticker: `setInterval` every 2.2s (ambient increment)
- Daily reward check: `setTimeout` with 2s delay
- Auto-spin: `setTimeout` with 600-1500ms delay
- Screen shake: `setTimeout` for 400-800ms cleanup
- Balance pulse: `setTimeout` for 1500ms cleanup
- Tournament overtake toast: `setTimeout` for 4000ms cleanup

### HIGH: Duplicated Symbol/State Definitions
- `symbols.ts` defines payout tables and reel weights
- `cardVisuals.ts` defines separate `PAY`, `SC_PAY`, `STRIP` arrays (not used by engine)
- `mathEngine.ts` re-derives Golden Card spawn rates inline (not from symbols.ts)

### HIGH: No Backend Adapter Boundary
- `handleSpin` calls `apiSpin()` directly with hardcoded relative URL
- No error handling for network failures
- No retry logic
- No offline fallback
- Balance is fetched from server but also modified locally before server confirmation

---

## 8. Major Performance Risks

| Risk | Location | Impact |
|---|---|---|
| **55 useState in App.tsx** | `App.tsx` | Any state change triggers full App re-render. During spin cascade, 6+ state changes per cascade step cause ~20-40 unnecessary re-renders per spin. |
| **No memoization** | All components | `ReelGrid`, `ControlBar`, `FooterBar`, `HeaderBar`, `MultiplierBar` all re-render on every App state change despite only needing specific props. |
| **Animation in React** | `GridCellView.tsx` | `motion.div` with `animate={{ scale: [1, 1.14, 0.96, 1.08, 1] }}` and `repeat: Infinity` runs in React render tree, not isolated. |
| **No code splitting** | `main.tsx` | All 14 modals + all canvas components + all utilities load eagerly on startup. 475KB JS bundle loaded entirely before first paint. |
| **Particle canvases re-mount** | `FireflyParticleCanvas.tsx` etc. | Canvas elements are React components that recreate on parent re-render. `useRef` + `useEffect` pattern mitigates, but cleanup depends on correct effect deps. |
| **Inline object/array creation in render** | `App.tsx` | `vaultData`, `tournamentData`, `boostData` initializers create new objects on every render (though `useState` initializer runs once). Derived values like `effectiveMode`, `bonusBuyCost` are computed in the callback, not memoized. |

---

## 9. Major UI Integration Gaps

| Gap | Description |
|---|---|
| **No error boundary** | If any component throws, the entire game crashes with no recovery. |
| **No loading state** | Initial load shows blank white screen until React mounts. |
| **No offline handling** | Network failure during spin results in lost bet (balance deducted but no result). |
| **Hardcoded tournament data** | `tournamentData` initialized with fake player names ("VegasViper99", "DiamondHands88"). No real-time updates. |
| **Hardcoded boost data** | `boostData` initialized with fake values. Timer decrements locally but never syncs. |
| **Fake jackpot ticker** | `jackpotValue` increments randomly via `setInterval`. No server-side jackpot. |
| **Daily reward removed** | Code references `isDailyRewardOpen` in dependency arrays but the feature was previously removed from the deployed version. (Fixed in this audit.) |
| **No wallet integration** | Balance is local state + server fetch on mount. No real-time wallet sync. |
| **No session persistence** | Closing the browser loses all game state (balance, free spins, history). |

---

## 10. Missing Production Boundaries

| Boundary | Status |
|---|---|
| Analytics/telemetry | Not implemented |
| Error boundaries | Not implemented |
| Feature flags | Not implemented |
| Configuration management | Not implemented (hardcoded values throughout) |
| Logging | Not implemented |
| Environment abstraction | Not implemented |
| Backend adapter/interface | Not implemented (direct fetch calls) |
| Transport layer (WebSocket) | Not implemented (tournament is fake) |
| Audio service boundary | Not implemented (singleton with direct calls) |
| Animation orchestration | Not implemented (scattered setTimeout) |
| State persistence | Not implemented |
| Accessibility (ARIA) | Minimal (aria-label on buttons only) |
| Keyboard navigation | Not implemented |
| Reduced motion support | Not implemented |
| Safe area handling (notch) | Not implemented |

---

## 11. Game Engine Analysis (`mathEngine.ts`)

### Capabilities
- **5×4 grid generation** with weighted random symbol selection
- **1024-ways evaluation** (left-to-right adjacent matching)
- **Cascade/avalanche loop** (up to 22 steps)
- **Golden Card → Wild/Joker conversion** (25% Joker chance in Deluxe)
- **Golden Joker expansion** (full reel sticky wild in Deluxe)
- **Mega Symbol spawning** (2×2 and 3×3 in Deluxe free spins)
- **Overdrive multiplier ladder** (Deluxe: 1→2→3→5→15 base / 2→4→6→10→25 free)
- **Scatter → Free Spins** (3+ SC → 10 free spins)
- **Jackpot teaser** (every 100 spins in Deluxe, 5x bet)

### Limitations
- **Not pure:** Imports `REEL_WEIGHTS` and multiplier ladders from `symbols.ts` — coupled to specific configuration
- **Not deterministic:** Uses `Math.random()` — no seeded RNG for testing/replay
- **Not encapsulated:** `makeCellId()` uses `Date.now()` + global counter — not injectable
- **No event model:** Returns a flat `SpinResult` object — no step-by-step event emission
- **Golden Card spawn rates hardcoded inline** (lines 69, 394): `0.22` deluxe / `0.18` classic — should come from symbols.ts
- **Mega Symbol spawn rate hardcoded** (line 90): `0.45` — not configurable
- **Jackpot teaser hardcoded** (line 427): every 100 spins, 1.8% chance — not configurable
- **No validation:** Does not validate bet amount, game mode, or free spin state

---

## 12. Phaser Integration Analysis

**The deployed version does NOT use Phaser.** The GitHub clone (`develover96-gif/SuperAce-Max`) contains `PhaserReelStage.tsx` with a full Phaser 3.80.1 integration, but the local `superace-max` repo uses:

- `SpinningReelColumn.tsx` — CSS animation-based reel spinning
- `GridCellView.tsx` — Framer Motion cell animations
- `SymbolArtwork.tsx` — Inline SVG card rendering

**Implication:** The Phaser rendering engine (Phase 3 target) does not exist in the deployed codebase. It must be either ported from the GitHub clone or built fresh.

---

## 13. Audio Architecture Analysis (`soundEngine.ts`)

### Capabilities
- **Singleton pattern** (`export const sound = new SoundEngine()`)
- **12 sound methods:** spinStart, reelStop, scatterLand, goldFrameConvert, goldWildMagicChime, goldenJokerExpand, overdriveSurge, vaultDepositCoin, jackpotTeaserDrop, tournamentOvertake, cascadeExplode, energyRipple, winChime, multiplierUpgrade, orchestralBigWinFanfare, buttonClick
- **Mute/volume control** via `setMuted()` and `setVolumes()`
- **User gesture unlock** via lazy `AudioContext` initialization

### Limitations
- **No channels:** All sounds share one `AudioContext` — no music/sfx/voice separation
- **No audio graph:** Each method creates fresh `OscillatorNode` + `GainNode` — no shared bus
- **No asset loading:** All procedural synthesis — no pre-recorded audio
- **No spatial audio:** No positional/panned playback
- **No audio sprites:** Each sound is synthesized from scratch
- **Called directly from UI components:** `sound.reelStop(c)` called in `App.tsx` line 415 during reel stop loop — tightly coupled to animation timing
- **No cleanup:** Oscillator nodes are started and auto-stopped, but no explicit disposal tracking

---

## 14. Asset Inventory

| Asset | Format | Location | Size |
|---|---|---|---|
| Google Fonts (Cinzel, Poppins, Cinzel Decorative) | WOFF2 | External CDN | ~200KB |
| MStiffHei PRC UltraBold | WOFF/TTF | External CDN | ~50KB |
| Background image | JPEG | `src/assets/images/` | Unknown |
| SVG card artwork | Inline TS | `cardVisuals.ts` + `SymbolArtwork.tsx` | ~8KB source |
| Tailwind CSS | Generated | `index.css` | 131.7 KB |

**No audio assets** (all procedural)
**No sprite sheets** (all SVG/CSS)
**No 3D models**

---

## 15. Test Coverage

**Tests: NONE**

- No test files found (`*.test.*`, `*.spec.*`)
- No test framework configured (no vitest, jest, or testing-library)
- No `test` script in `package.json`
- No CI/CD configuration

---

## 16. Build Configuration Analysis

### `vite.config.ts`
- Uses `@tailwindcss/vite` plugin and `@vitejs/plugin-react`
- `base: './'` for relative asset paths (needed for iframe embedding)
- Path alias `@/` → project root
- HMR can be disabled via `DISABLE_HMR` env var

### `tsconfig.json`
- Target: ES2022
- Module: ESNext with bundler resolution
- `noEmit: true` (type checking only)
- `isolatedModules: true` (required for Vite)
- `experimentalDecorators: true` (unused)
- `useDefineForClassFields: false`
- No strict mode enabled
- No `baseUrl` configured (relies on Vite alias)

### Build Output
| Artifact | Raw | Gzip |
|---|---|---|
| JS | 475.6 KB | 141.1 KB |
| CSS | 131.7 KB | 17.0 KB |
| HTML | 1.6 KB | 0.9 KB |
| **Total** | **608.9 KB** | **159.0 KB** |

---

## 17. Summary of Findings (Prioritized)

### P0 — Blocking Production Readiness

1. **Monolithic App.tsx** — 55 useState, 1071 lines, all state/domain/animation in one component
2. **Zero tests** — No test framework, no test files, no CI
3. **No error boundaries** — Single throw crashes entire game
4. **Animation-driven React renders** — Cascade updates trigger 20-40 re-renders per spin
5. **No backend adapter** — Direct fetch with no error handling, retry, or offline support
6. **No code splitting** — 475KB JS loaded eagerly; 14 modals bundled upfront

### P1 — Significant Quality Gaps

7. **No memoization** — No React.memo, useMemo, or useCallback on child components
8. **Timer-based architecture** — 20+ setTimeout/setInterval for animation, UI state, and game logic
9. **Duplicated symbol data** — symbols.ts, cardVisuals.ts, and mathEngine.ts each define overlapping constants
10. **Fake retention features** — Tournament, jackpot, boost, vault all use hardcoded/mock data
11. **No session persistence** — All state lost on page reload
12. **No accessibility** — Minimal ARIA, no keyboard nav, no screen reader support

### P2 — Architecture Debt

13. **No state management** — All state in React useState; no stores, selectors, or subscriptions
14. **No event model** — Game engine returns flat result; no typed events for UI consumption
15. **No Phaser integration** — Deployed version uses CSS reels; Phaser exists only in GitHub clone
16. **No audio service** — Singleton with direct method calls; no channel isolation
17. **No analytics boundary** — No telemetry events
18. **No feature flags** — All features always enabled
19. **No configuration management** — Magic numbers throughout (multipliers, probabilities, timing)
20. **No responsive audit** — Mobile layout not validated across breakpoints

---

*End of Checkpoint 0.1 — Current State Document*
