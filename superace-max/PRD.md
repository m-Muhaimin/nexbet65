# Product Requirements Document (PRD) — Super Ace Slot Machine

## 1. Executive Summary & Overview
**Product Name:** Super Ace (Online Video Slot Engine & Web Application)  
**Target Platform:** Web (Desktop, Tablet, Mobile responsive)  
**Engine Type:** Cascading / Avalanche 5-Reel, 4-Row Ways-to-Win Video Slot  
**Core USP:** High-fidelity luxury card casino aesthetics paired with PG Soft / JILI-inspired cascading mechanics, Golden Card Wild conversions, compounding elimination multipliers, and an explosive Free Spins bonus mode.

---

## 2. Mathematical Specification & Game Engine Core

### 2.1 Reel Layout & Ways-to-Win System
- **Grid Configuration:** 5 Columns $\times$ 4 Rows (20 visible cell positions).
- **Evaluation Rule:** Left-to-right adjacent reel matching starting strictly from Reel 1 (Column 0).
- **Total Ways Calculation:** $4 \times 4 \times 4 \times 4 \times 4 = 1,024\text{ Ways to Win}$.
- **Formula for Way Payout:**
  $$\text{Payout} = \text{Base Bet} \times \text{Symbol Multiplier}(k) \times \prod_{c=0}^{k-1} (\text{Count of Matching Symbols in Reel } c) \times \text{Active Combo Multiplier}$$
  where $k \in \{3, 4, 5\}$ denotes the winning sequence length.

### 2.2 Paytable Multipliers (Relative to Single Way Base Stake)
| Symbol | Code | Type | 3-of-a-Kind | 4-of-a-Kind | 5-of-a-Kind | Special Characteristics |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Ace of Spades (Super Ace)** | `A` | High Pay | $5\times$ | $15\times$ | $50\times$ | Victorian Gold Filigree, Masterpiece 3D Spade |
| **King (Royal Emperor)** | `K` | High Pay | $4\times$ | $10\times$ | $30\times$ | Imperial Crown, Robe & Ceremonial Sword |
| **Queen (Empress)** | `Q` | Mid Pay | $3\times$ | $8\times$ | $20\times$ | Diamond Tiara, Crimson Velvet & Royal Rose |
| **Jack (Knight)** | `J` | Mid Pay | $2\times$ | $5\times$ | $15\times$ | Steel Armor & Halberd |
| **10 / Spade** | `S` | Low Pay | $1\times$ | $3\times$ | $10\times$ | 3D Chiseled Obsidian Spade |
| **Golden Wild Coin** | `G` | Wild | N/A | N/A | N/A | Substitutes for A, K, Q, J, S. Appears on Reels 2, 3, 4, 5. |
| **Ruby Scatter** | `SC` | Bonus Trigger | N/A | N/A | N/A | $3\times \text{SC}$ triggers 10 Free Spins (+2 for each extra SC). |

---

## 3. Core Mechanics & Elimination Loop

### 3.1 Cascading Avalanche Mechanics
1. **Initial Spin Evaluation:** Grid generates symbols. Any matching combinations of $\ge 3$ consecutive adjacent reels from left to right trigger a win.
2. **Golden Card Conversion:**
   - Any winning symbol that is a **Golden Card** does not vanish entirely; upon elimination, it **transforms into a Golden Wild Medallion (`G`)** in the exact same coordinate.
3. **Symbol Removal & Gravity Drop:** Non-golden winning symbols dissolve in golden energy particles. Existing symbols above drop down to fill empty spaces.
4. **Top Reel Replenishment:** Fresh symbols spawn from the top of each reel.
5. **Multiplier Increment:** With every consecutive cascade in the same spin round, the elimination combo multiplier steps up to the next tier.
6. **Cycle Termination:** Cascade continues until no new winning combinations appear on the grid.

### 3.2 Dynamic Multiplier Ladder
| Cascade Step | Base Game Multiplier | Free Spins Multiplier |
| :--- | :--- | :--- |
| **1st Win (Initial)** | $\mathbf{1\times}$ | $\mathbf{2\times}$ |
| **2nd Win (1st Cascade)** | $\mathbf{2\times}$ | $\mathbf{4\times}$ |
| **3rd Win (2nd Cascade)** | $\mathbf{3\times}$ | $\mathbf{6\times}$ |
| **4th+ Win (3rd+ Cascade)** | $\mathbf{5\times}$ | $\mathbf{10\times}$ |

---

## 4. Free Spins Feature & Bonus Mode

### 4.1 Trigger Conditions
- Landing $\ge 3$ `SC` (Scatter) symbols anywhere on the 5 reels during a single round triggers the **Free Spins Feature**.
- **Base Reward:** 3 Scatters = **10 Free Spins**.
- **Extra Scatter Bounty:** Each additional Scatter beyond 3 awards $+2$ additional Free Spins.
- **Retrigger:** Landing 3 or more Scatters inside Free Spins adds $+5$ Free Spins.

### 4.2 Free Spins Enhancements
- All elimination multipliers are doubled ($2\times \to 4\times \to 6\times \to 10\times$).
- Increased Golden Card spawn weight on Reels 2, 3, and 4 (25% boost).
- Ambient theme transitions from Royal Navy Gold to Mystical Crimson Midnight with intense energy particles and celebratory fireworks.

---

## 5. UI/UX & Visual Architecture

### 5.1 Realism & Visual Asset Directives
- **Card Aesthetics:** Authentic physical playing card proportions, ivory satin linen gradients, micro suit pips, dual-corner $180^\circ$ inverted indices, and high-precision SVG master artwork.
- **Lighting & Depth:** Multi-layer box-shadows, specular glass reflections (`card-glass`, `card-gold`, `card-scatter`), gold baroque bezels, and 3D coin edge milling.
- **Particle & Visual FX:**
  - HTML5 Canvas particle systems for continuous firefly ambient embers, win confetti, gold coin fountains on Big Win ($20\times$), Mega Win ($50\times$), and Super Win ($100\times$).
  - Winning Way SVG connective light beams tracing across adjacent reels.

### 5.2 Layout & Responsiveness
- **Single-Screen Centered Viewport:** Strictly contained within standard desktop/mobile heights without accidental page-level vertical scrolling.
- **Header Bar:** Sound toggle, Turbo Mode toggle, Current Balance display, History modal, and Paytable/Rules modal.
- **Multiplier Bar:** 4-tier interactive multiplier ladder with active glow indicators and Free Spins tier doubling.
- **Reel Grid:** 5-column $\times$ 4-row grid with independent column physics, blur spin effects, and landing bounces.
- **Multiplier History Strip:** External recent cascade history display tracking last round outcomes.
- **Control Bar:** Total Win Display, Bet Selector modal launcher, Quick Turbo toggle, Autoplay trigger (10, 30, 50, 100, $\infty$), and tactile physical Spin Button.

---

## 6. Technical Stack & Architecture

- **Frontend Framework:** React 18+ with TypeScript.
- **Bundler & Tooling:** Vite, ESBuild, PostCSS, Tailwind CSS.
- **Animation System:** `motion/react` (Framer Motion) layout transitions and CSS keyframe physics.
- **Audio Synthesis Engine:** Custom Web Audio API Synthesizer (`soundEngine.ts`) generating multi-octave slot reels clicks, cascade chimes, winning trumpet fanfares, and coin drop sequences without external MP3 asset latency.
- **State Management:** React Functional State & Hooks with modular utility separation (`mathEngine.ts`, `symbols.ts`, `soundEngine.ts`).

---

## 7. Performance & Safety Mandates
- **Target Frame Rate:** 60 FPS on standard mobile and desktop viewports.
- **Audio Safety:** User-gesture gated Web Audio Context initialization with instant mute/unmute control.
- **Local Persistence:** Player balance, sound preferences, and history saved locally across browser reloads.
