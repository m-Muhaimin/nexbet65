# 🎰 Super Ace — Video Slot Engine & Web Application

An authentic, high-performance web-based 5-Reel $\times$ 4-Row video slot machine with 1,024 Ways to Win, cascading avalanche mechanics, Golden Card Wild transformations, dynamic compounding multipliers, and rich procedural sound synthesis.

---

## 🌟 Key Features

- **1,024 Ways to Win:** Left-to-right adjacent reel matching evaluation across a 5x4 grid.
- **Cascading Avalanche Reels:** Winning combinations vanish with golden energy bursts, dropping remaining symbols and spawning new ones from the top.
- **Golden Card Wild Conversion:** Winning Golden Cards transform into 3D Minted Wild Coins (`G`) on the grid rather than disappearing, generating massive combo chains.
- **Dynamic Multiplier Ladder:**
  - **Base Game:** $1\times \to 2\times \to 3\times \to 5\times$
  - **Free Spins Mode:** $2\times \to 4\times \to 6\times \to 10\times$
- **Free Spins Bonus Round:** Landing $\ge 3$ Ruby Scatter symbols awards 10+ Free Spins with doubled multipliers and boosted Golden Card frequency.
- **Hyper-Realistic Casino Aesthetics:**
  - Linen cardstock textures with dual-corner authentic $180^\circ$ indices.
  - Detailed SVG court portraits (Super Ace, King, Queen, Jack, 10, Golden Wild, and Ruby Scatter).
  - Ambient particle canvases, winning line path overlays, and Big Win celebratory coin fountains.
- **Built-in Web Audio Synthesizer:** Real-time Web Audio API sound generation for spin mechanical clicks, cascade bells, and fanfare trumpets.
- **Full Slot Control Suite:** Turbo spin toggle, Autoplay modal (with loss/win limits), Bet Selector ($0.10 to $500), Buy Bonus feature, and detailed Paytable/History drawer.

---

## 🛠️ Technology Stack

- **UI & Logic:** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build System:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Animations:** [motion/react](https://motion.dev/) & CSS3 Hardware-Accelerated Transforms
- **Icons:** [lucide-react](https://lucide.dev/)
- **Audio Engine:** Native Web Audio API procedural synthesis (`soundEngine.ts`)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0.0 or later)
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Start the local development server
npm run dev
```

The application will be served at `http://localhost:3000`.

### Production Build
```bash
# Compile and build production assets
npm run build

# Preview the production build
npm run preview
```

---

## 📂 Project Architecture

```
├── PRD.md                         # Detailed Product Requirements & Math Spec
├── README.md                      # Project Overview & Guide
├── metadata.json                  # Application metadata & configuration
├── src/
│   ├── App.tsx                    # Master Game Controller & State Coordinator
│   ├── index.css                  # Global styles, card shaders & animations
│   ├── types.ts                   # Core TypeScript types & data schemas
│   ├── components/                # Modular UI Components
│   │   ├── HeaderBar.tsx          # Sound, balance, history & paytable controls
│   │   ├── MultiplierBar.tsx      # Elimination ladder indicator
│   │   ├── ReelGrid.tsx           # 5-reel gold baroque viewport
│   │   ├── SpinningReelColumn.tsx # Independent column animation & landing physics
│   │   ├── GridCellView.tsx       # Individual card & symbol renderer
│   │   ├── SymbolArtwork.tsx      # Vector illustrations for all card ranks
│   │   ├── MultiplierHistoryStrip.tsx # External round multiplier tracking
│   │   ├── ControlBar.tsx         # Bet, Turbo, Auto & Spin controls
│   │   ├── FooterBar.tsx          # System status & game info
│   │   ├── FireflyParticleCanvas.tsx # Ambient background embers
│   │   ├── ConfettiCanvas.tsx     # Celebration confetti FX
│   │   └── modals/                # Paytable, History, Bet Selector & Auto modals
│   └── utils/
│       ├── mathEngine.ts          # Ways-to-Win evaluation & cascade solver
│       ├── soundEngine.ts         # Web Audio API procedural audio synthesizer
│       └── symbols.ts             # Paytable, symbol weights & probabilities
```

---

## 📜 Game Rules & Paytable Summary

- All symbols pay from left to right on adjacent reels starting from Reel 1.
- Only the highest win per winning way is paid.
- Concurrent wins on different ways are added together.
- Multiplier applies to all winning combinations in that specific cascade step.
- See the in-game **Paytable & Rules** dialog (accessible via the `?` icon on the top header) for individual symbol coefficients and mathematical payout details.
