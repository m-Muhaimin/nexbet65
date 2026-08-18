export type Game = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: "Crash" | "Bonus Wheel";
  provider: string;
  rtp: string;
  maxWin: string;
  volatility: string;
  wsPort: number;
  gradient: string;
  accent: string;
  features: string[];
};

export type CatalogueGame = {
  name: string;
  provider: string;
  category: string; // slots | crash | live | fishing | table
  emoji: string;
  rtp: string;
  gradient: string;
  image?: string; // local thumbnail artwork: /thumnails/<slug>-thumbnail.png when present
  tag?: "hot" | "new";
  slug?: string; // only set when playable
  url?: string; // external URL — overrides slug navigation
  playable: boolean;
};

export const GAMES: Game[] = [
  {
    slug: "aviator",
    title: "Aviator",
    tagline: "Watch the plane fly — cash out before it crashes",
    description:
      "A provably fair crash game. Place a bet, watch the multiplier climb as the plane takes off, and cash out before it crashes. The plane always crashes — the question is when.",
    category: "Crash",
    provider: "SUPRBUILD",
    rtp: "97.0%",
    maxWin: "1,000x",
    volatility: "Medium",
    wsPort: 8080,
    gradient: "from-red-500 via-neutral-900 to-black",
    accent: "#f87171",
    features: [
      "Provably fair — seed hash revealed before every round",
      "Auto cash-out at your target multiplier",
      "Round history & big-win feed",
      "Mobile-first responsive layout",
    ],
  },
  {
    slug: "mines",
    title: "Mines",
    tagline: "Reveal gems, dodge the bombs — cash out before you hit a mine",
    description:
      "A provably fair minesweeper-style game. Pick how many mines hide under the 5×5 grid, place a bet, then reveal tiles one by one. Every safe tile raises your multiplier — cash out anytime before you hit a bomb.",
    category: "Crash",
    provider: "SUPRBUILD",
    rtp: "97.0%",
    maxWin: "50,000x",
    volatility: "High",
    wsPort: 0,
    gradient: "from-green-500 via-emerald-950 to-black",
    accent: "#4ade80",
    features: [
      "Provably fair — server seed hash revealed before every round",
      "Auto cash-out when every safe tile is revealed",
      "1–24 mines with a live multiplier preview",
      "Server-verified reveals — the house can't move your mines",
    ],
  },
  {
    slug: "plinko",
    title: "Plinko",
    tagline: "Drop the ball, ride the pegs, land a multiplier",
    description:
      "A provably fair plinko board. Pick a risk level and row count, drop a ball, and watch it bounce through the pegs into a multiplier bucket. 8–16 rows across three risk tiers with payouts up to 1,000x.",
    category: "Crash",
    provider: "SUPRBUILD",
    rtp: "99.0%",
    maxWin: "1,000x",
    volatility: "Low–High",
    wsPort: 0,
    gradient: "from-brand via-emerald-950 to-black",
    accent: "#f6b01a",
    features: [
      "Provably fair — HMAC-SHA256 path, committed seed hash shown before every drop",
      "8–16 rows and three risk tiers with pre-calculated multiplier tables",
      "99% RTP / 1% house edge",
      "PixiJS-rendered board with three ball skins and live effects",
    ],
  },
  {
    slug: "checkers",
    title: "Checkers",
    tagline: "Out-think your challenger — winner takes the pot",
    description:
      "Head-to-head checkers against a live challenger or the tactical bot. Win all of your opponent's pieces to take the full pot. Live matchmaking, 30s turn timer.",
    category: "Crash",
    provider: "SUPRBUILD",
    rtp: "99.0%",
    maxWin: "2x",
    volatility: "Medium",
    wsPort: 8081,
    gradient: "from-indigo-500 via-neutral-900 to-black",
    accent: "#818cf8",
    features: [
      "Live 1v1 matchmaking — gets a challenger or the bot in 15s",
      "Winner takes the full pot, 0% house edge",
      "30-second turn timer — force a win on opponent timeout",
      "Classic 8×8 board with captures and king promotions",
    ],
  },
  {
    slug: "ludo-arena",
    title: "Ludo Arena",
    tagline: "Race your tokens home before the challenger",
    description:
      "A 2-player Ludo Arena. Roll the dice, move all four tokens around the board into your home column — first to finish takes the full pot. Live matchmaking with the tactical bot as backup.",
    category: "Crash",
    provider: "SUPRBUILD",
    rtp: "99.0%",
    maxWin: "2x",
    volatility: "Medium",
    wsPort: 8082,
    gradient: "from-pink-500 via-fuchsia-950 to-black",
    accent: "#f472b6",
    features: [
      "Live 2-player ludo with 15×15 board",
      "Race all four tokens into the home column",
      "6's deploy tokens and give an extra roll",
      "Winner takes the full pot, 0% house edge",
    ],
  },
  {

    slug: "super-ace",

    title: "SuperAce",

    tagline: "Authentic, high-performance 5-Reel x 4-Row video slot",

    description:

      "An authentic, high-performance web-based 5-Reel x 4-Row video slot machine with 1,024 Ways to Win, cascading avalanche mechanics, Golden Card Wild transformations, dynamic compounding multipliers, and rich procedural sound synthesis.",

    category: "Bonus Wheel",

    provider: "SUPRBUILD",

    rtp: "96.5%",

    maxWin: "1,000x",

    volatility: "Medium",

    wsPort: 0,

    gradient: "from-yellow-500 via-amber-900 to-black",

    accent: "#fbbf24",

    features: [

      "1,024 Ways to Win",

      "Cascading Avalanche Reels",

      "Golden Card Wild Conversion",

      "Dynamic Multiplier Ladder",

      "Free Spins Bonus Round",

      "Hyper-Realistic Casino Aesthetics",

      "Built-in Web Audio Synthesizer",

      "Full Slot Control Suite",

    ],

  },
];

export function getGame(slug: string): Game | undefined {
  return GAMES.find((g) => g.slug === slug);
}

export const PLAYABLE_SLUGS = new Set(GAMES.map((g) => g.slug));

/**
 * Live catalogue. All five games are playable — every tile links to its
 * game page.
 */
export const CATALOGUE: CatalogueGame[] = [
  { name: "Aviator", provider: "SUPRBUILD", category: "crash", emoji: "✈️", rtp: "97.0", gradient: "from-red-500 via-neutral-900 to-black", tag: "hot", slug: "aviator", image: "/thumnails/vertical/aviator-thumbnail-vertical.png", playable: true },
  { name: "Mines", provider: "SUPRBUILD", category: "crash", emoji: "💣", rtp: "97.0", gradient: "from-green-500 via-emerald-950 to-black", tag: "new", slug: "mines", image: "/thumnails/vertical/mines-thumbnail-vertical.png", playable: true },
  { name: "Plinko", provider: "SUPRBUILD", category: "crash", emoji: "🔴", rtp: "99.0", gradient: "from-brand via-emerald-950 to-black", tag: "new", slug: "plinko", image: "/thumnails/vertical/plinko-thumbnail-vertical.png", playable: true },
  { name: "Checkers", provider: "SUPRBUILD", category: "table", emoji: "♟️", rtp: "99.0", gradient: "from-indigo-500 via-neutral-900 to-black", tag: "new", slug: "checkers", image: "/thumnails/vertical/checkers-thumbnail-vertical.png", playable: true },
  { name: "Ludo Arena", provider: "SUPRBUILD", category: "table", emoji: "🎲", rtp: "99.0", gradient: "from-pink-500 via-fuchsia-950 to-black", tag: "new", slug: "ludo-arena", image: "/thumnails/vertical/ludo-thumbnail-vertical.png", playable: true },
  { name: "SuperAce", provider: "SUPRBUILD", category: "slots", emoji: "🃏", rtp: "96.5", gradient: "from-yellow-500 via-amber-900 to-black", tag: "hot", slug: "super-ace", playable: true },
  { name: "SuperAce Deluxe", provider: "SUPRBUILD", category: "slots", emoji: "👑", rtp: "96.5", gradient: "from-amber-400 via-rose-900 to-black", tag: "hot", url: "https://deluxe.suprbuild.com", playable: true },
];

export function formatMoney(n: number): string {
  return "৳" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}
