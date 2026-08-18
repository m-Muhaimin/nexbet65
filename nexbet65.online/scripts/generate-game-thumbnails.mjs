import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "public", "games");
mkdirSync(OUT, { recursive: true });

const THUMBS = [
  {
    slug: "super-ace",
    title: "Super Ace",
    bg: ["#f43f5e", "#7f1d1d", "#1a0505"],
    glow: "#fbbf24",
    accent: "#fde047",
    motif: "super-ace",
  },
  {
    slug: "aviator",
    title: "Aviator",
    bg: ["#b91c1c", "#3f1d2e", "#05050d"],
    glow: "#fbbf24",
    accent: "#fb923c",
    motif: "aviator",
  },
  {
    slug: "fortune-ox",
    title: "Fortune Ox",
    bg: ["#f59e0b", "#9a3412", "#1c0a02"],
    glow: "#fde047",
    accent: "#fde047",
    motif: "ox",
  },
  {
    slug: "gates-of-olympus",
    title: "Gates of Olympus",
    bg: ["#38bdf8", "#3730a3", "#0a0518"],
    glow: "#e0e7ff",
    accent: "#fbbf24",
    motif: "olympus",
  },
  {
    slug: "money-wheel",
    title: "Money Wheel",
    bg: ["#e879f9", "#581c87", "#140214"],
    glow: "#f0abfc",
    accent: "#ffffff",
    motif: "wheel",
  },
  {
    slug: "sweet-bonanza",
    title: "Sweet Bonanza",
    bg: ["#f9a8d4", "#be185d", "#2a0416"],
    glow: "#fbcfe8",
    accent: "#fde047",
    motif: "candy",
  },
  {
    slug: "fishing-god",
    title: "Fishing God",
    bg: ["#2dd4bf", "#0e7490", "#02121a"],
    glow: "#67e8f9",
    accent: "#fbbf24",
    motif: "fish-god",
  },
  {
    slug: "money-coming",
    title: "Money Coming",
    bg: ["#34d399", "#065f46", "#01150d"],
    glow: "#fde047",
    accent: "#fde047",
    motif: "money",
  },
  {
    slug: "spaceman",
    title: "Spaceman",
    bg: ["#8b5cf6", "#3b0764", "#0b0118"],
    glow: "#c4b5fd",
    accent: "#67e8f9",
    motif: "spaceman",
  },
  {
    slug: "lightning-roulette",
    title: "Lightning Roulette",
    bg: ["#818cf8", "#1e1b4b", "#05040f"],
    glow: "#c7d2fe",
    accent: "#fbbf24",
    motif: "roulette",
  },
  {
    slug: "dragon-gold",
    title: "Dragon Gold",
    bg: ["#facc15", "#92400e", "#1c0a02"],
    glow: "#fef08a",
    accent: "#fde047",
    motif: "dragon",
  },
  {
    slug: "color-game",
    title: "Color Game",
    bg: ["#f6b01a", "#166534", "#020d05"],
    glow: "#d9f99d",
    accent: "#ffffff",
    motif: "color",
  },
  {
    slug: "ocean-king",
    title: "Ocean King",
    bg: ["#38bdf8", "#1e3a8a", "#020617"],
    glow: "#7dd3fc",
    accent: "#fde047",
    motif: "shark",
  },
  {
    slug: "crash-royale",
    title: "Crash Royale",
    bg: ["#f6b01a", "#14532d", "#020d05"],
    glow: "#d9f99d",
    accent: "#fde047",
    motif: "rocket",
  },
  {
    slug: "boxing-king",
    title: "Boxing King",
    bg: ["#f87171", "#7f1d1d", "#170404"],
    glow: "#fecaca",
    accent: "#fca5a5",
    motif: "boxing",
  },
  {
    slug: "mega-wheel",
    title: "Mega Wheel",
    bg: ["#fb923c", "#7c2d12", "#160501"],
    glow: "#fdba74",
    accent: "#fde047",
    motif: "mega-wheel",
  },
  {
    slug: "big-bass-bonanza",
    title: "Big Bass Bonanza",
    bg: ["#22d3ee", "#155e75", "#02141a"],
    glow: "#67e8f9",
    accent: "#fde047",
    motif: "bass",
  },
  {
    slug: "dragon-tiger",
    title: "Dragon Tiger",
    bg: ["#f59e0b", "#7f1d1d", "#120206"],
    glow: "#fdba74",
    accent: "#fde047",
    motif: "dragon-tiger",
  },
  {
    slug: "limbo",
    title: "Limbo",
    bg: ["#2dd4bf", "#134e4a", "#02100e"],
    glow: "#5eead4",
    accent: "#fde047",
    motif: "limbo",
  },
  {
    slug: "happy-fishing",
    title: "Happy Fishing",
    bg: ["#7dd3fc", "#0369a1", "#01131e"],
    glow: "#bae6fd",
    accent: "#fde047",
    motif: "happy-fish",
  },
  {
    slug: "baccarat-deluxe",
    title: "Baccarat Deluxe",
    bg: ["#e4e4e7", "#44403c", "#0c0a09"],
    glow: "#fafafa",
    accent: "#10b981",
    motif: "baccarat",
  },
  {
    slug: "mines",
    title: "Mines",
    bg: ["#22c55e", "#14532d", "#020d05"],
    glow: "#4ade80",
    accent: "#fde047",
    motif: "mines",
  },
];

const P = {
  coin: (cx, cy, r, c1, c2, star = false) => `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${c1}"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#ring)" opacity="0.9"/>
    <circle cx="${cx - r * 0.22}" cy="${cy - r * 0.22}" r="${r * 0.32}" fill="#ffffff" opacity="0.35"/>
    ${star ? `<polygon points="${cx},${cy - r * 0.55} ${cx + r * 0.18},${cy - r * 0.16} ${cx + r * 0.53},${cy - r * 0.16} ${cx + r * 0.25},${cy + r * 0.14} ${cx + r * 0.34},${cy + r * 0.5} ${cx},${cy + r * 0.27} ${cx - r * 0.34},${cy + r * 0.5} ${cx - r * 0.25},${cy + r * 0.14} ${cx - r * 0.53},${cy - r * 0.16} ${cx - r * 0.18},${cy - r * 0.16}" fill="${c2}" opacity="0.85"/>` : ""}`,
  gem: (cx, cy, s, c) => `
    <polygon points="${cx},${cy - s} ${cx + s * 0.85},${cy - s * 0.25} ${cx + s * 0.55},${cy + s * 0.75} ${cx},${cy + s} ${cx - s * 0.55},${cy + s * 0.75} ${cx - s * 0.85},${cy - s * 0.25}" fill="${c}" opacity="0.92"/>
    <polygon points="${cx},${cy - s} ${cx + s * 0.85},${cy - s * 0.25} ${cx},${cy + s * 0.05}" fill="#ffffff" opacity="0.45"/>`,
  card: (x, y, w, h, rot, back, pip = "") => `
    <g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w * 0.09}" fill="${back}" stroke="#ffffff" stroke-opacity="0.85" stroke-width="3"/>
      ${pip ? `<text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" dominant-baseline="central" font-family="Georgia, serif" font-size="${w * 0.55}" font-weight="bold" fill="#e5e7eb">${pip}</text>` : ""}
      <rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h - 12}" rx="${(w - 12) * 0.09}" fill="none" stroke="#ffffff" stroke-opacity="0.3" stroke-width="1.5"/>
    </g>`,
};

const MOTIFS = {
  "super-ace": () => `
    <g transform="translate(300,400)">
      ${P.gem(-60, -120, 70, "#fde047", "#fbbf24")}
      ${P.gem(70, -110, 55, "#f472b6", "#db2777")}
      ${P.gem(0, -10, 82, "#fb7185", "#e11d48")}
      <circle cx="0" cy="110" r="58" fill="#fbbf24"/>
      <circle cx="0" cy="110" r="58" fill="url(#ring)" opacity="0.9"/>
      <text x="0" y="128" text-anchor="middle" dominant-baseline="central" font-family="Georgia, serif" font-size="66" font-weight="bold" fill="#7f1d1d">A</text>
    </g>`,
  aviator: () => `
    <g transform="translate(300,400)">
      <path d="M -210 30 Q -120 -30 -20 -60 L -40 10 Q -140 60 -210 30 Z" fill="#93c5fd" opacity="0.5"/>
      <path d="M -190 20 L -20 -55 L 210 -150" stroke="#fde047" stroke-width="4" fill="none" opacity="0.9"/>
      <circle cx="215" cy="-155" r="10" fill="#fde047"/>
      <path d="M -140 60 C -40 70 60 20 180 -40 C 190 -45 185 -35 175 -30 C 60 30 -40 55 -140 60 Z" fill="#f1f5f9"/>
      <path d="M -60 45 L 20 -5 L 60 20 L -10 65 Z" fill="#fde047" opacity="0.85"/>
      <path d="M 20 -5 L 70 -40 L 95 -25 L 50 10 Z" fill="#94a3b8"/>
      <path d="M -150 62 L -95 78 L -85 62 Z" fill="#f1f5f9"/>
    </g>`,
  ox: () => `
    <g transform="translate(300,430)">
      <path d="M -150 -120 C -110 -160 -40 -160 -10 -110 C 40 -170 110 -160 150 -115 C 165 -95 155 -70 120 -70 C 155 -30 150 10 120 30 L 95 -20 C 50 20 -50 20 -95 -20 L -120 30 C -150 10 -155 -30 -120 -70 C -155 -70 -165 -95 -150 -120 Z" fill="#92400e" stroke="#7c2d12" stroke-width="6"/>
      <circle cx="-105" cy="-95" r="16" fill="#fde68a"/>
      <circle cx="105" cy="-95" r="16" fill="#fde68a"/>
      <circle cx="-105" cy="-95" r="6" fill="#1c0a02"/>
      <circle cx="105" cy="-95" r="6" fill="#1c0a02"/>
      <ellipse cx="0" cy="40" rx="52" ry="42" fill="#fef3c7"/>
      <ellipse cx="0" cy="40" rx="22" ry="18" fill="#d97706"/>
      <rect x="-26" y="110" width="52" height="14" rx="7" fill="#fbbf24"/>
    </g>`,
  olympus: () => `
    <g transform="translate(300,400)">
      <rect x="-150" y="-200" width="52" height="230" rx="8" fill="#e0e7ff" opacity="0.92"/>
      <rect x="-26" y="-200" width="52" height="230" rx="8" fill="#c7d2fe" opacity="0.92"/>
      <rect x="98" y="-200" width="52" height="230" rx="8" fill="#e0e7ff" opacity="0.92"/>
      <rect x="-186" y="-70" width="372" height="30" rx="6" fill="#a5b4fc" opacity="0.85"/>
      <rect x="-186" y="60" width="372" height="26" rx="6" fill="#a5b4fc" opacity="0.85"/>
      <polygon points="0,-150 -34,-60 34,-60" fill="#fbbf24"/>
      <polygon points="0,-60 -54,10 54,10" fill="#fbbf24" opacity="0.8"/>
      <circle cx="0" cy="22" r="24" fill="#fde68a"/>
      <polygon points="0,52 -24,120 24,120" fill="#fbbf24" opacity="0.7"/>
    </g>`,
  wheel: () => `
    <g transform="translate(300,395)">
      <circle cx="0" cy="0" r="180" fill="#1e1b4b" stroke="#c4b5fd" stroke-width="10"/>
      ${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
        const r1 = 14;
        return `<circle cx="${Math.cos((a * Math.PI) / 180) * 138}" cy="${Math.sin((a * Math.PI) / 180) * 138}" r="${r1}" fill="${a % 90 === 0 ? "#fb7185" : a % 45 === 0 ? "#fbbf24" : "#c4b5fd"}" stroke="#1e1b4b" stroke-width="4"/>`;
      }).join("")}
      <circle cx="0" cy="0" r="78" fill="#f0abfc" stroke="#a21caf" stroke-width="8"/>
      <polygon points="0,-40 35,20 -35,20" fill="#701a75"/>
      <circle cx="0" cy="-86" r="14" fill="#fde047" stroke="#b45309" stroke-width="5"/>
    </g>`,
  candy: () => `
    <g transform="translate(300,400)">
      ${[0, 1, 2, 3, 4, 5].map((i) => {
        const cx = (i % 3 - 1) * 108;
        const cy = Math.floor(i / 3) * 96 - 40;
        const c = ["#fb7185", "#f472b6", "#fde047", "#34d399"][i % 4];
        return `<circle cx="${cx}" cy="${cy}" r="${i % 2 === 0 ? 62 : 50}" fill="${c}" stroke="#ffffff" stroke-width="5" stroke-opacity="0.5"/>
          <ellipse cx="${cx - 16}" cy="${cy - 18}" rx="14" ry="10" fill="#ffffff" opacity="0.4" transform="rotate(-25 ${cx} ${cy})"/>`;
      }).join("")}
      <circle cx="-108" cy="-136" r="20" fill="#ffffff" opacity="0.5"/>
      <circle cx="108" cy="-136" r="14" fill="#ffffff" opacity="0.4"/>
      <circle cx="108" cy="152" r="18" fill="#ffffff" opacity="0.4"/>
    </g>`,
  "fish-god": () => `
    <g transform="translate(300,410)">
      <ellipse cx="0" cy="-40" rx="130" ry="70" fill="#f59e0b" stroke="#b45309" stroke-width="6"/>
      <ellipse cx="0" cy="-40" rx="70" ry="46" fill="#fbbf24" stroke="#f59e0b" stroke-width="5"/>
      <polygon points="120,-40 205,-120 205,40" fill="#f59e0b" stroke="#b45309" stroke-width="5"/>
      <polygon points="120,-40 175,-70 175,-15" fill="#fde68a" opacity="0.9"/>
      <circle cx="-52" cy="-55" r="12" fill="#1c0a02"/>
      <circle cx="8" cy="-55" r="12" fill="#1c0a02"/>
      <circle cx="-50" cy="-57" r="4" fill="#ffffff"/>
      <circle cx="10" cy="-57" r="4" fill="#ffffff"/>
      <path d="M -70 -25 Q -40 -8 -10 -25" stroke="#1c0a02" stroke-width="4" fill="none"/>
      <path d="M 60 90 Q 80 120 60 150 M 100 60 Q 120 90 100 120 M -60 100 Q -40 130 -60 160" stroke="#7dd3fc" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.7"/>
      <path d="M -170 -150 Q -120 -160 -90 -120 M 150 180 Q 200 170 220 130" stroke="#a7f3d0" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.5"/>
    </g>`,
  money: () => `
    <g transform="translate(300,400)">
      <rect x="-92" y="60" width="184" height="40" rx="10" fill="#065f46"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<circle cx="${-84 + i * 24}" cy="80" r="7" fill="#fde047" opacity="0.9"/>`).join("")}
      ${[-60, 0, 60].map((x, i) => `${P.coin(x, -90 + i * 40, 60 - i * 8, "#fde047", "#b45309", true)}`).join("")}
      <circle cx="0" cy="10" r="44" fill="#fbbf24"/>
      <polygon points="0,-30 14,-8 40,-4 20,12 25,40 0,26 -25,40 -20,12 -40,-4 -14,-8" fill="#92400e"/>
    </g>`,
  spaceman: () => `
    <g transform="translate(300,410)">
      ${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${-170 + i * 68}" cy="${-150 + (i % 2) * 40}" r="${i % 2 === 0 ? 8 : 5}" fill="#e0e7ff" opacity="0.8"/>`).join("")}
      <circle cx="0" cy="-60" r="52" fill="#e2e8f0" stroke="#94a3b8" stroke-width="6"/>
      <circle cx="0" cy="-60" r="34" fill="#0ea5e9" stroke="#bae6fd" stroke-width="6"/>
      <ellipse cx="-10" cy="-66" rx="9" ry="13" fill="#ffffff" opacity="0.85" transform="rotate(-12 -10 -66)"/>
      <rect x="-70" y="-30" width="140" height="96" rx="34" fill="#f1f5f9" stroke="#94a3b8" stroke-width="6"/>
      <circle cx="-34" cy="66" r="26" fill="#fbbf24" stroke="#d97706" stroke-width="5"/>
      <circle cx="34" cy="66" r="26" fill="#fbbf24" stroke="#d97706" stroke-width="5"/>
      <rect x="-58" y="82" width="116" height="26" rx="13" fill="#64748b"/>
      <path d="M -20 90 Q 0 140 -10 190 M 20 90 Q 0 140 10 190" stroke="#94a3b8" stroke-width="10" fill="none" stroke-linecap="round"/>
      <circle cx="0" cy="-165" r="24" fill="#e2e8f0" stroke="#94a3b8" stroke-width="5"/>
    </g>`,
  roulette: () => `
    <g transform="translate(300,400)">
      ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a = (i * 45 * Math.PI) / 180;
        const c = i % 2 === 0 ? "#dc2626" : "#111827";
        return `<path d="M 0 0 L ${Math.cos(a) * 160} ${Math.sin(a) * 160} L ${Math.cos(a + 0.21) * 160} ${Math.sin(a + 0.21) * 160} Z" fill="${c}" stroke="#facc15" stroke-width="2"/>`;
      }).join("")}
      <circle cx="0" cy="0" r="160" fill="none" stroke="#facc15" stroke-width="8"/>
      <circle cx="0" cy="0" r="66" fill="#0f172a" stroke="#facc15" stroke-width="4"/>
      <polygon points="0,-52 46,26 -46,26" fill="#facc15"/>
      <circle cx="-110" cy="-110" r="9" fill="#fde047"/>
      <polygon points="110,-60 145,-35 135,0 100,0 85,-25" fill="#fde047"/>
      <polygon points="-120,70 -90,95 -80,60 -110,35" fill="#fde047"/>
    </g>`,
  dragon: () => `
    <g transform="translate(300,420)">
      <ellipse cx="0" cy="20" rx="120" ry="100" fill="#16a34a" stroke="#15803d" stroke-width="6"/>
      <ellipse cx="0" cy="0" rx="86" ry="66" fill="#22c55e" stroke="#15803d" stroke-width="5"/>
      <path d="M -90 -70 Q -70 -120 -20 -110 Q -10 -80 -40 -60 Q -60 -40 -90 -70 Z" fill="#fde047" stroke="#b45309" stroke-width="4"/>
      <path d="M 90 -70 Q 70 -120 20 -110 Q 10 -80 40 -60 Q 60 -40 90 -70 Z" fill="#fde047" stroke="#b45309" stroke-width="4"/>
      <polygon points="0,-110 -24,-130 0,-142 24,-130" fill="#fde047" stroke="#b45309" stroke-width="4"/>
      <circle cx="-44" cy="-14" r="12" fill="#b91c1c"/>
      <circle cx="44" cy="-14" r="12" fill="#b91c1c"/>
      <circle cx="-46" cy="-16" r="4" fill="#ffffff"/>
      <circle cx="42" cy="-16" r="4" fill="#ffffff"/>
      <path d="M -120 130 Q -150 180 -90 200 M 120 130 Q 150 180 90 200" stroke="#fde047" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.8"/>
      <circle cx="0" cy="90" r="34" fill="#fbbf24"/>
      <circle cx="0" cy="90" r="34" fill="url(#ring)" opacity="0.9"/>
      <text x="0" y="100" text-anchor="middle" dominant-baseline="central" font-family="Georgia, serif" font-size="30" font-weight="bold" fill="#7c2d12">金</text>
    </g>`,
  color: () => `
    <g transform="translate(300,400)">
      <circle cx="0" cy="0" r="175" fill="#111827"/>
      ${[0, 60, 120, 180, 240, 300].map((a) => {
        const c = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"][a / 60];
        return `<path d="M 0 0 L ${Math.cos((a * Math.PI) / 180) * 175} ${Math.sin((a * Math.PI) / 180) * 175} A 175 175 0 0 1 ${Math.cos(((a + 60) * Math.PI) / 180) * 175} ${Math.sin(((a + 60) * Math.PI) / 180) * 175} Z" fill="${c}"/>`;
      }).join("")}
      <circle cx="0" cy="0" r="175" fill="none" stroke="#ffffff" stroke-width="8"/>
      <circle cx="0" cy="0" r="58" fill="#0f172a" stroke="#ffffff" stroke-width="5"/>
      <polygon points="0,-32 28,24 -28,24" fill="#ffffff"/>
      <circle cx="-118" cy="-118" r="7" fill="#ffffff"/>
    </g>`,
  shark: () => `
    <g transform="translate(300,410)">
      ${[0, 1, 2, 3, 4].map((i) => `<circle cx="${-160 + i * 78}" cy="${-150 + (i % 2) * 30}" r="${Math.max(6, 12 - i)}" fill="#bae6fd" opacity="0.6"/>`).join("")}
      <path d="M -150 20 C -110 140 110 140 160 20 C 120 80 40 90 -20 80 C -80 70 -130 60 -150 20 Z" fill="#0ea5e9" stroke="#075985" stroke-width="6"/>
      <polygon points="-150,20 -210,-30 -205,30" fill="#0ea5e9" stroke="#075985" stroke-width="5"/>
      <polygon points="-185,-8 -150,8 -185,22" fill="#075985" opacity="0.8"/>
      <circle cx="-40" cy="52" r="12" fill="#0f172a"/>
      <circle cx="34" cy="52" r="12" fill="#0f172a"/>
      <circle cx="-38" cy="49" r="4" fill="#ffffff"/>
      <circle cx="36" cy="49" r="4" fill="#ffffff"/>
      <path d="M -70 100 L -50 80 L -30 100 M -20 100 L 0 80 L 20 100 M 30 100 L 50 80 L 70 100" stroke="#bae6fd" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.6"/>
      <path d="M -150 -20 Q 0 -60 160 -20" stroke="#bae6fd" stroke-width="5" fill="none" opacity="0.5"/>
    </g>`,
  rocket: () => `
    <g transform="translate(300,400)">
      <polygon points="0,-190 -60,40 0,90 60,40" fill="#e2e8f0" stroke="#64748b" stroke-width="6"/>
      <circle cx="0" cy="-20" r="30" fill="#0ea5e9" stroke="#bae6fd" stroke-width="6"/>
      <polygon points="-60,40 -120,110 -55,85" fill="#f87171" stroke="#b91c1c" stroke-width="5"/>
      <polygon points="60,40 120,110 55,85" fill="#f87171" stroke="#b91c1c" stroke-width="5"/>
      <path d="M -30 90 L 0 210 M 30 90 L 0 210" stroke="#fbbf24" stroke-width="8" fill="none" stroke-linecap="round"/>
      <circle cx="0" cy="78" r="20" fill="#fbbf24"/>
      <polygon points="0,-250 -14,-215 14,-215" fill="#fde047"/>
      <polygon points="0,-250 -10,-228 10,-228" fill="#f59e0b"/>
    </g>`,
  boxing: () => `
    <g transform="translate(300,400)">
      <path d="M 20 -150 Q 90 -140 95 -70 L 95 10 C 95 50 60 70 20 70 C -20 70 -60 60 -70 20 L -85 -40 C -90 -70 -60 -90 -40 -75 C -60 -120 -40 -160 20 -150 Z" fill="#dc2626" stroke="#991b1b" stroke-width="7"/>
      <ellipse cx="15" cy="30" rx="42" ry="34" fill="#f87171" stroke="#b91c1c" stroke-width="5"/>
      <path d="M -150 200 Q -80 160 -20 70 M 60 70 Q 130 170 170 210" stroke="#fca5a5" stroke-width="14" fill="none" stroke-linecap="round" opacity="0.85"/>
      <circle cx="45" cy="-60" r="34" fill="#fbbf24"/>
      <polygon points="45,-92 59,-68 86,-64 66,-44 72,-17 45,-34 18,-17 24,-44 4,-64 31,-68" fill="#fef3c7"/>
    </g>`,
  "mega-wheel": () => `
    <g transform="translate(300,400)">
      <circle cx="0" cy="0" r="180" fill="#1c0a02" stroke="#fbbf24" stroke-width="10"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const c = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6"][i % 4];
        return `<path d="M 0 0 L ${Math.cos((i * 45 * Math.PI) / 180) * 160} ${Math.sin((i * 45 * Math.PI) / 180) * 160} A 160 160 0 0 1 ${Math.cos(((i + 1) * 45 * Math.PI) / 180) * 160} ${Math.sin(((i + 1) * 45 * Math.PI) / 180) * 160} Z" fill="${c}" stroke="#1c0a02" stroke-width="4"/>`;
      }).join("")}
      <circle cx="0" cy="0" r="46" fill="#fbbf24" stroke="#92400e" stroke-width="6"/>
      <polygon points="0,-26 23,20 -23,20" fill="#1c0a02"/>
      <circle cx="-95" cy="165" r="16" fill="#ffffff" opacity="0.4"/>
      <circle cx="120" cy="-120" r="11" fill="#ffffff" opacity="0.4"/>
    </g>`,
  bass: () => `
    <g transform="translate(300,400)">
      <ellipse cx="0" cy="0" rx="140" ry="80" fill="#0ea5e9" stroke="#075985" stroke-width="7"/>
      <ellipse cx="0" cy="0" rx="74" ry="54" fill="#38bdf8" stroke="#0ea5e9" stroke-width="6"/>
      <path d="M 0 -78 L 26 -120 L 0 -105 L -26 -120 Z" fill="#0ea5e9" stroke="#075985" stroke-width="4"/>
      <polygon points="140,0 230,60 230,-60" fill="#0ea5e9" stroke="#075985" stroke-width="5"/>
      <polygon points="140,0 195,30 195,-30" fill="#7dd3fc"/>
      <circle cx="-62" cy="-22" r="11" fill="#0f172a"/>
      <circle cx="-14" cy="-22" r="11" fill="#0f172a"/>
      <circle cx="-60" cy="-24" r="4" fill="#ffffff"/>
      <circle cx="-12" cy="-24" r="4" fill="#ffffff"/>
      <path d="M -80 10 Q -40 32 0 10 M -70 34 Q -30 56 10 34" stroke="#0f172a" stroke-width="4" fill="none" opacity="0.5"/>
      ${P.coin(90, 90, 30, "#fde047", "#b45309", true)}
      ${P.coin(-100, 100, 24, "#fde047", "#b45309", true)}
      <path d="M -200 -140 Q -150 -160 -110 -120 M 160 140 Q 210 130 240 90" stroke="#a7f3d0" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.5"/>
    </g>`,
  "dragon-tiger": () => `
    <g transform="translate(300,410)">
      <ellipse cx="-70" cy="30" rx="95" ry="80" fill="#dc2626" stroke="#991b1b" stroke-width="6"/>
      <ellipse cx="70" cy="30" rx="95" ry="80" fill="#f59e0b" stroke="#b45309" stroke-width="6"/>
      <polygon points="-70,-110 -46,-50 -70,-70 -94,-50" fill="#fde047" stroke="#b45309" stroke-width="4"/>
      <circle cx="-95" cy="10" r="10" fill="#1c0a02"/>
      <circle cx="-45" cy="10" r="10" fill="#1c0a02"/>
      <path d="M 70 -110 Q 70 -50 40 -20 Q 100 -40 100 -90" stroke="#7c2d12" stroke-width="6" fill="none"/>
      <circle cx="45" cy="10" r="10" fill="#1c0a02"/>
      <circle cx="95" cy="10" r="10" fill="#1c0a02"/>
      <path d="M -40 80 Q -70 120 -100 110 M 40 80 Q 70 120 100 110" stroke="#fca5a5" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.7"/>
      <polygon points="0,-150 -20,-120 20,-120" fill="#fde047"/>
    </g>`,
  limbo: () => `
    <g transform="translate(300,400)">
      <path d="M -170 170 L -120 130 L -60 140 L 0 60 L 70 20 L 150 -90 L 175 -170" stroke="#5eead4" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M -170 170 L -120 130 L -60 140 L 0 60 L 70 20 L 150 -90 L 175 -170" stroke="#fde047" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>
      <circle cx="175" cy="-170" r="16" fill="#fde047"/>
      <path d="M -180 170 L 190 170 M -180 30 L 190 30 M -180 -110 L 190 -110" stroke="#0f766e" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
    </g>`,
  "happy-fish": () => `
    <g transform="translate(300,410)">
      ${[0, 1, 2, 3, 4].map((i) => `<circle cx="${-170 + i * 85}" cy="${-150 + (i % 2) * 36}" r="10" fill="#bae6fd" opacity="0.7"/>`).join("")}
      <circle cx="0" cy="0" r="90" fill="#f472b6" stroke="#db2777" stroke-width="6"/>
      <circle cx="0" cy="0" r="44" fill="#f9a8d4" stroke="#db2777" stroke-width="5"/>
      <polygon points="90,0 175,60 175,-60" fill="#f472b6" stroke="#db2777" stroke-width="5"/>
      <polygon points="90,0 145,28 145,-28" fill="#fbcfe8"/>
      <circle cx="-36" cy="-16" r="9" fill="#1c0a02"/>
      <circle cx="0" cy="-16" r="9" fill="#1c0a02"/>
      <circle cx="-35" cy="-18" r="3" fill="#ffffff"/>
      <circle cx="1" cy="-18" r="3" fill="#ffffff"/>
      <path d="M -50 18 Q -25 36 0 18" stroke="#1c0a02" stroke-width="4" fill="none" opacity="0.5"/>
      <path d="M -130 120 Q -100 150 -130 180 M 140 -130 Q 170 -100 140 -70" stroke="#a5f3fc" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.6"/>
    </g>`,
  baccarat: () => `
    <g transform="translate(300,400)">
      ${P.card(-95, -40, 130, 180, -12, "#064e3b", "♠")}
      ${P.card(10, -60, 130, 180, 4, "#065f46", "♣")}
      ${P.card(95, -30, 130, 180, 16, "#f59e0b", "♦")}
      ${P.coin(-90, 130, 34, "#10b981", "#065f46", true)}
      ${P.coin(60, 140, 26, "#34d399", "#065f46", true)}
      <circle cx="40" cy="196" r="20" fill="#fbbf24"/>
      <polygon points="40,178 48,192 64,194 52,204 55,220 40,212 25,220 28,204 16,194 32,192" fill="#92400e"/>
    </g>`,
  mines: () => `
    <g transform="translate(300,400)">
      ${[0, 1, 2, 3, 4].map((r) =>
        [0, 1, 2, 3, 4]
          .map((c) => {
            const x = -150 + c * 75;
            const y = -150 + r * 75;
            const mine = (r * 5 + c) % 5 === 0;
            return mine
              ? `<circle cx="${x}" cy="${y}" r="27" fill="#111827" stroke="#4ade80" stroke-width="3"/>
                 <path d="M ${x - 8} ${y - 18} L ${x - 18} ${y - 8} M ${x + 8} ${y - 18} L ${x + 18} ${y - 8} M ${x - 8} ${y + 18} L ${x - 18} ${y + 8} M ${x + 8} ${y + 18} L ${x + 18} ${y + 8}" stroke="#4ade80" stroke-width="3" stroke-linecap="round"/>
                 <circle cx="${x}" cy="${y}" r="10" fill="#fde047"/>`
              : `<circle cx="${x}" cy="${y}" r="27" fill="#14532d" stroke="#4ade80" stroke-width="3"/>
                 <polygon points="${x},${y - 13} ${x + 11},${y - 3} ${x + 7},${y + 12} ${x - 7},${y + 12} ${x - 11},${y - 3}" fill="#4ade80" opacity="0.9"/>`;
          })
          .join("")
      ).join("")}
    </g>`,
};

function render(t) {
  const [c1, c2, c3] = t.bg;
  const r1 = 300 - 260 * 0.55;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="0.55" stop-color="${c2}"/>
      <stop offset="1" stop-color="${c3}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.6">
      <stop offset="0" stop-color="${t.glow}" stop-opacity="0.5"/>
      <stop offset="1" stop-color="${t.glow}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="ring">
      <stop offset="0.75" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.35"/>
    </radialGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.22"/>
      <stop offset="0.4" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="600" height="800" fill="url(#bg)"/>
  <rect width="600" height="800" fill="url(#glow)"/>
  <ellipse cx="300" cy="420" rx="${r1 + 60}" ry="${r1 + 60}" fill="url(#sheen)"/>
  <g opacity="0.12">
    <circle cx="60" cy="120" r="120" fill="#ffffff"/>
    <circle cx="540" cy="700" r="150" fill="#ffffff"/>
    <circle cx="530" cy="90" r="60" fill="#ffffff"/>
  </g>
  ${MOTIFS[t.motif]()}
  <rect x="0" y="0" width="600" height="800" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="1"/>
</svg>
`;
}

let n = 0;
for (const t of THUMBS) {
  writeFileSync(join(OUT, `${t.slug}.svg`), render(t));
  n++;
}
console.log(`Wrote ${n} thumbnails to ${OUT}`);
