# Product Requirements Document V2 (PRD_V2.md)
## Project: Super Ace Deluxe (Upgrade from Base "Seper-Ace" Engine)

| Field | Detail |
|---|---|
| **Document Title** | Super Ace Deluxe: Gameplay & Retention Upgrade PRD |
| **Version** | 2.0 |
| **Status** | Approved for Development |
| **Base Repository** | `suprbuildllc/Seper-Ace` (React 18, TS, Vite, Web Audio) |
| **Target Launch** | Phase 3 (Day 5+ Unlock) of the 30-Day Retention Blueprint |
| **Product Owner** | [Name] |

---

## 1. Executive Summary
This document outlines the product and technical requirements for upgrading the existing **Super Ace** base game engine into **Super Ace Deluxe**. 

While the base "Super Ace" serves as the high-frequency, low-volatility "Hero Game" for **Micro-Deposit Testers** in Phase 1 (Days 1–3), **Super Ace Deluxe** is designed specifically as the high-value, tier-gated reward for **App Hoppers** and **VIPs** in Phase 3 and 4 (Days 5–30). 

This upgrade introduces advanced gameplay mechanics (Golden Joker Wilds, Overdrive Multipliers, Mega-Symbols), real-time tournament integrations, and a visual "Vault" UI that directly supports the 30-day retention and profit-locking strategy.

---

## 2. Base Game Analysis (Current State: `Seper-Ace`)
The current repository provides a high-performance 5×4 grid, 1,024 Ways-to-Win engine with the following baseline specifications:
*   **Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, `motion/react` (Framer Motion), Native Web Audio API.
*   **Core Mechanics:** Cascading avalanche reels, standard Golden Card Wild transformations (turn into 3D Minted Wild Coins).
*   **Math Model:** Base Multipliers (1×→2×→3×→5×), Free Spin Multipliers (2×→4×→6×→10×).
*   **Visuals:** Linen cardstock textures, SVG court portraits, basic firefly/confetti particle canvases.
*   **Control Suite:** Turbo spin, Autoplay, Bet Selector ($0.10–$500), Buy Bonus.

---

## 3. Product Vision: The "Deluxe" Evolution
The "Deluxe" upgrade must visually and mathematically feel like a "level up" from the base game. When an App Hopper reaches Day 5 and unlocks Super Ace Deluxe, the transition must trigger a psychological response: *"I have reached VIP status; leaving this app means losing access to this premium experience."*

### 3.1 Core Upgrade Pillars
1.  **Math & Volatility Shift:** Increased max multipliers and the introduction of Mega-Symbols to create "Big Win" dopamine spikes that base Super Ace cannot achieve.
2.  **Visual Overhaul:** Transition from "Classic Casino" to "High-Roller VIP Lounge" aesthetics (neon, gold, obsidian, 3D particle effects).
3.  **Ecosystem Integration:** Native hooks for the **Vault (Piggy Bank)**, **Beginner Boost Meter**, and **Real-Time Tournaments**.

---

## 4. Functional Requirements: Gameplay Upgrades

| ID | Feature | Description | Priority |
|---|---|---|---|
| **GR-1** | **Golden Joker Wilds** | Replaces standard Golden Cards in Deluxe mode. When a Golden Joker lands and contributes to a win, it does not just turn into a coin; it **expands to cover the entire reel** as a Sticky Wild for the remainder of the cascade. | P0 |
| **GR-2** | **Overdrive Multiplier Ladder** | Increases the multiplier caps to reward long sessions.<br>- **Base Game:** 1× → 2× → 3× → 5× → **15× (Overdrive)**<br>- **Free Spins:** 2× → 4× → 6× → 10× → **25× (Overdrive)** | P0 |
| **GR-3** | **Mega-Symbols (Free Spins)** | During the Free Spins bonus round, 2×2 and 3×3 Mega-Symbols (Super Ace & Golden Joker) spawn on the reels, drastically increasing the probability of 5-of-a-kind wins and massive cascade chains. | P0 |
| **GR-4** | **Deluxe Buy-Bonus** | Increases the Buy-Bonus cost from 80x to **120x** bet, but guarantees a minimum starting multiplier of 4× and at least one Mega-Symbol drop on the first spin. | P1 |
| **GR-5** | **Progressive Jackpot Teaser** | Every 100th spin triggers a visual "Jackpot Teaser" animation (screen shakes, gold coins fall) awarding a micro-cash drop (e.g., 5x bet) to maintain engagement during dry spells. | P2 |

---

## 5. Functional Requirements: Retention & Ecosystem Hooks
These features tie the game directly to the **30-Day Retention Blueprint** defined in PRD V1.

| ID | Feature | Description | Priority |
|---|---|---|---|
| **RH-1** | **The "Deluxe Vault" UI** | A persistent, interactive 3D vault icon sits on the Deluxe HUD. When a player hits a "Big Win" (≥20x bet), a custom animation shows coins flying from the win meter into the Vault. This visually reinforces the **Time-Gated Profit Locker** mechanic (5% of wins locked for daily release). | P0 |
| **RH-2** | **Tournament Overlay Mode** | When playing in a Day 10+ Tournament Lobby, a real-time WebSocket-fed leaderboard ticker overlays the top of the `ReelGrid`. Big wins trigger a "Player just overtook [Username]" toast notification. | P0 |
| **RH-3** | **Withdrawal Intercept Modal** | If the backend detects a withdrawal request while the game state is active, the game pauses and triggers the **"Un-Locked Re-Deposit Match"** modal: *"Withdrawal Approved! Keep playing Super Ace Deluxe with 50% extra credits if you re-deposit now."* | P0 |
| **RH-4** | **Beginner Boost HUD** | For players in their first 14 days, a glowing "Beginner Boost" timer overlays the `MultiplierBar`, showing the 2× Loyalty Points multiplier actively ticking down. | P1 |

---

## 6. Technical & Architecture Requirements

The existing `Seper-Ace` repository will be forked/branched for the Deluxe version. The following technical upgrades are required to support the new features:

### 6.1 State Management
*   **Current:** React `useState` / Context API.
*   **Upgrade:** Implement **Zustand** or **Redux Toolkit** to handle complex, concurrent states (e.g., base game spins + real-time tournament updates + Vault animations).

### 6.2 Networking & Multiplayer
*   **Requirement:** Integrate **WebSockets** (via Socket.io or native WS) for the Tournament Overlay (`TournamentOverlay.tsx`).
*   **Data Payload:** Must listen for `player_score_update`, `leaderboard_shift`, and `tournament_end` events without blocking the main render thread.

### 6.3 Rendering & Animation Engine
*   **Current:** `motion/react` and CSS3 transforms.
*   **Upgrade:** 
    *   Introduce **WebGL / Three.js** for the `GoldenJokerEffect` and `VaultMeter` to ensure 60fps performance on mobile devices when complex 3D coin physics are triggered.
    *   Upgrade `FireflyParticleCanvas.tsx` to a full **Ambient VIP Lounge Canvas** (falling gold dust, dynamic lighting reacting to spin outcomes).

### 6.4 Audio Engine Expansion
*   **Current:** Procedural Web Audio API synthesis.
*   **Upgrade:** Introduce **Spatial Audio Stems**. When "Overdrive" (15x/25x multiplier) is hit, the background audio cross-fades into a high-energy "VIP Anthem" with heavy bass and synthesized brass, dynamically mixing with the cascade sound effects.

---

## 7. UI/UX & Art Direction Upgrades

| Component | Base Game (Seper-Ace) | Deluxe Upgrade |
|---|---|---|
| **Color Palette** | Classic Casino Green, Gold, Linen | **Obsidian Black, Neon Crimson, Metallic Gold** |
| **Grid Border** | Standard gold baroque frame | **Animated LED Marquee** that pulses faster as multipliers increase |
| **Symbol Artwork** | Flat/Detailed SVG Court Portraits | **2.5D Parallax SVGs** with dynamic lighting and rim-light shaders |
| **Control Bar** | Standard buttons | **Glassmorphism** UI with haptic feedback triggers (on supported mobile devices) |
| **Paytable** | Static text drawer | **Interactive 3D Carousel** allowing players to spin symbols and view animations |

---

## 8. Data & Analytics Requirements

To measure the success of the Super Ace Deluxe upgrade and its impact on the 30-Day Retention Blueprint, the following events must be fired to the data warehouse:

| Event Name | Trigger | Metadata |
|---|---|---|
| `deluxe_unlock_conversion` | Player accesses Deluxe for the first time | `user_segment`, `days_since_reg` |
| `golden_joker_trigger` | Golden Joker expands a reel | `current_multiplier`, `bet_size` |
| `overdrive_achieved` | Multiplier ladder hits 15x or 25x | `session_length`, `game_mode` (Base/FreeSpin) |
| `vault_coin_deposit` | Animation of coins flying to the Vault | `win_amount`, `vault_percentage` |
| `tournament_overtake` | Player moves up the leaderboard | `rank_change`, `tournament_id` |

---

## 9. Key Performance Indicators (KPIs) for V2

| KPI | Target | Rationale |
|---|---|---|
| **Deluxe Unlock Rate** | ≥ 40% of Day-5 active players | Proves the "Tier-Gated" tease is compelling enough to drive Day 1-5 retention. |
| **Session Length (Deluxe vs Base)** | +35% in Deluxe | Validates that Overdrive multipliers and Mega-Symbols extend engagement. |
| **Tournament Participation** | ≥ 25% of App Hoppers | Measures the effectiveness of the real-time leaderboard hook. |
| **Vault Opt-In / Interaction** | 80% of Big Wins result in Vault interaction | Proves the psychological hook of "locking profits" is visually understood by the player. |
| **Withdrawal Intercept Conversion** | ≥ 12% accept the re-deposit match | Directly impacts the LTV of the App Hopper segment. |

---

## 10. Release Strategy & Milestones

| Phase | Milestone | Acceptance Criteria |
|---|---|---|
| **M1: Core Math & Logic** | `mathEngine.ts` updated with Golden Joker logic, Overdrive caps, and Mega-Symbol generation. | QA verifies 10,000,000 simulation runs match the new Deluxe RTP/Volatility target. |
| **M2: Visual & Audio Overhaul** | UI migrated to Obsidian/Neon theme; WebGL particle effects and Spatial Audio implemented. | Performance profiling shows stable 60fps on mid-tier mobile devices (e.g., iPhone 11, Samsung A52). |
| **M3: Ecosystem Integration** | WebSocket tournament overlay and Vault UI connected to backend CRM/Wallet APIs. | End-to-end test: A win correctly triggers the Vault animation and updates the player's locked balance in the database. |
| **M4: Closed Alpha** | Released to internal team and 1% of VIP player base. | Zero critical bugs; positive qualitative feedback on the "VIP feel." |
| **M5: General Availability** | Unlocked for all players hitting the Day 5 milestone. | Monitored via real-time BI dashboards against the KPIs listed in Section 9. |

---
*End of PRD_V2.md*