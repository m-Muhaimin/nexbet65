// GENERATED from superace-backend/public/index.html (do not edit by hand)
export const SPADE =
  "M50 6 C39 24 14 43 14 65 C14 79 25 89 37 89 C43 89 48 86 51 82 C49 94 43 101 34 104 L66 104 C57 101 51 94 49 82 C52 86 57 89 63 89 C75 89 86 79 86 65 C86 43 61 24 50 6 Z";

export const miniSpade = (x: number, y: number, s: number, r?: string) =>
  `<path d="${SPADE}" transform="translate(${x},${y}) scale(${s}) ${r || ''}" fill="url(#gGold)"/>`;

export const ART: Record<string, () => string> = {
  A: () =>
    `<svg class="art" viewBox="0 0 100 130">${miniSpade(70, 4, 0.16)}${miniSpade(14, 104, 0.16, 'rotate(180 15 60)')}<circle cx="50" cy="60" r="40" fill="url(#gHalo)"/><g filter="url(#artShadow)"><path d="${SPADE}" fill="url(#gBlack)" stroke-linejoin="round"/><path d="${SPADE}" transform="translate(6,5) scale(.88)" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="2"/><path d="M38 30 C44 22 50 16 50 14 C50 16 56 22 62 30 C56 27 44 27 38 30Z" fill="rgba(255,255,255,.28)"/></g><path d="M18 56 h64 v22 h-64 z" fill="url(#gRed)" filter="url(#artShadow)"/><path d="M14 56 l4 -5 v27 l-4 -5 z M86 56 l-4 -5 v27 l4 -5 z" fill="url(#gGoldDeep)"/><text x="50" y="73" text-anchor="middle" font-family="Georgia" font-weight="900" font-size="17" fill="url(#gGold)" letter-spacing="3">ACE</text></svg>`,
  K: () =>
    `<svg class="art" viewBox="0 0 100 130"><circle cx="50" cy="52" r="44" fill="url(#gHalo)"/><g filter="url(#artShadow)"><path d="M20 42 q-4 26 2 48 h12 v-48 z M80 42 q4 26 -2 48 h-12 v-48 z" fill="url(#gHairB)"/><rect x="31" y="38" width="38" height="46" rx="9" fill="url(#gSkin)"/><ellipse cx="42" cy="56" rx="4" ry="3" fill="#fff"/><ellipse cx="58" cy="56" rx="4" ry="3" fill="#fff"/><circle cx="42.6" cy="56.4" r="1.8" fill="#2b2b33"/><circle cx="57.4" cy="56.4" r="1.8" fill="#2b2b33"/><circle cx="37" cy="66" r="3.4" fill="#e2896a" opacity=".35"/><circle cx="63" cy="66" r="3.4" fill="#e2896a" opacity=".35"/><path d="M40 70 q5 -4 10 -1 q5 -3 10 1 q-4 5 -10 3 q-6 2 -10 -1z" fill="url(#gHairS)"/><path d="M31 66 c1 22 9 30 19 30 c10 0 18 -8 19 -30 c-6 12 -32 12 -38 0z" fill="url(#gHairS)"/><path d="M24 40 L29 14 L40 28 L50 8 L60 28 L71 14 L76 40 Z" fill="url(#gGoldDeep)" stroke-linejoin="round"/><circle cx="29" cy="13" r="2.4" fill="#fff6d8"/><circle cx="50" cy="7" r="2.6" fill="#fff6d8"/><circle cx="71" cy="13" r="2.4" fill="#fff6d8"/><rect x="24" y="33" width="52" height="9" fill="url(#gGold)"/><circle cx="33" cy="37.5" r="2.6" fill="#d43a2a"/><circle cx="50" cy="37.5" r="2.6" fill="#2b4db0"/><circle cx="67" cy="37.5" r="2.6" fill="#2ea05a"/><path d="M16 128 C18 102 32 94 50 94 C68 94 82 102 84 128 Z" fill="url(#gBlue)"/><path d="M28 112 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6" stroke="url(#gGold)" stroke-width="1.6" fill="none" opacity=".8"/><path d="M32 96 q4 8 10 10 h16 q6 -2 10 -10 q-8 -5 -18 -5 t-18 5z" fill="#f5f5f5"/><path d="M38 99 l3 5 M46 101 l2 5 M56 101 l-2 5 M64 99 l-3 5" stroke="#222" stroke-width="1.6"/><circle cx="50" cy="112" r="5" fill="url(#gGoldDeep)"/><circle cx="50" cy="112" r="2" fill="#d43a2a"/></g></svg>`,
  Q: () =>
    `<svg class="art" viewBox="0 0 100 130"><circle cx="50" cy="52" r="44" fill="url(#gHalo)"/><g filter="url(#artShadow)"><path d="M22 60 V30 L37 12 H63 L78 30 V60 Z" fill="url(#gRed)"/><rect x="22" y="25" width="56" height="11" fill="#7a0e0e"/><path d="M31 27v7M28 30.5h7M45 27v7M42 30.5h7M59 27v7M56 30.5h7M71 27v7M68 30.5h7" stroke="url(#gGold)" stroke-width="1.8"/><circle cx="27" cy="42" r="1.8" fill="#fff6d8"/><circle cx="38" cy="42" r="1.8" fill="#fff6d8"/><circle cx="50" cy="42" r="1.8" fill="#fff6d8"/><circle cx="62" cy="42" r="1.8" fill="#fff6d8"/><circle cx="73" cy="42" r="1.8" fill="#fff6d8"/><path d="M25 58 q-3 22 2 38 h10 v-38 z M75 58 q3 22 -2 38 h-10 v-38 z" fill="url(#gHairS)"/><rect x="33" y="40" width="34" height="44" rx="9" fill="url(#gSkin)"/><ellipse cx="42" cy="58" rx="3.6" ry="2.8" fill="#fff"/><ellipse cx="58" cy="58" rx="3.6" ry="2.8" fill="#fff"/><circle cx="42.5" cy="58.4" r="1.7" fill="#2b2b33"/><circle cx="57.5" cy="58.4" r="1.7" fill="#2b2b33"/><path d="M45 74 q5 4 10 0 q-5 6 -10 0z" fill="#c0392b"/><circle cx="37" cy="68" r="3" fill="#e2896a" opacity=".35"/><circle cx="63" cy="68" r="3" fill="#e2896a" opacity=".35"/><path d="M16 128 C18 100 32 92 50 92 C68 92 82 100 84 128 Z" fill="url(#gRed)"/><path d="M28 116 q5 -6 10 0 q5 -6 10 0 q5 -6 10 0 q5 -6 10 0" stroke="url(#gGold)" stroke-width="1.5" fill="none" opacity=".8"/><path d="M30 84 q10 10 20 12 q10 -2 20 -12 v10 q-10 10 -20 12 q-10 -2 -20 -12z" fill="#f5f5f5"/><circle cx="36" cy="92" r="2.4" fill="#fff"/><circle cx="45" cy="97" r="2.4" fill="#fff"/><circle cx="55" cy="97" r="2.4" fill="#fff"/><circle cx="64" cy="92" r="2.4" fill="#fff"/><circle cx="50" cy="104" r="3" fill="#d43a2a"/></g></svg>`,
  J: () =>
    `<svg class="art" viewBox="0 0 100 130"><circle cx="50" cy="52" r="44" fill="url(#gHalo)"/><g filter="url(#artShadow)"><path d="M70 20 q14 -8 16 4 q-10 -2 -14 2 z" fill="url(#gRed)"/><path d="M33 14 h42 v16 h-42 z" fill="url(#gBlue)"/><path d="M29 29 h50 v9 h-50 z" fill="#2b4db0"/><circle cx="38" cy="22" r="1.6" fill="url(#gGold)"/><circle cx="54" cy="22" r="1.6" fill="url(#gGold)"/><circle cx="68" cy="22" r="1.6" fill="url(#gGold)"/><path d="M58 38 h16 v32 c0 9 -9 12 -14 7 z" fill="url(#gHairG)"/><circle cx="68" cy="74" r="5.5" fill="url(#gHairG)"/><circle cx="61" cy="81" r="4.5" fill="url(#gHairG)"/><circle cx="70" cy="62" r="4" fill="url(#gHairG)"/><path d="M36 38 V52 L29 58 L36 63 V78 C42 84 52 84 58 80 V38 Z" fill="url(#gSkin)"/><ellipse cx="43" cy="52" rx="3.2" ry="2.6" fill="#fff"/><circle cx="43.6" cy="52.4" r="1.6" fill="#2b2b33"/><circle cx="45" cy="64" r="2.6" fill="#e2896a" opacity=".35"/><path d="M20 128 C22 102 36 94 50 94 C64 94 78 102 80 128 Z" fill="#f5f5f5"/><path d="M32 100 q4 14 2 26 M46 96 q2 16 0 30 M62 98 q0 14 2 28" stroke="url(#gBlue)" stroke-width="5" fill="none"/><path d="M40 96 L58 124 M64 98 L52 120" stroke="#7a4a1a" stroke-width="5"/><rect x="52" y="106" width="7" height="7" fill="none" transform="rotate(24 55 109)"/><path d="M40 92 h22 l-11 13 z" fill="#2b4db0"/><circle cx="50" cy="118" r="2.4" fill="url(#gGoldDeep)"/></g></svg>`,
  S: () =>
    `<svg class="art" viewBox="0 0 100 130">${miniSpade(12, 8, 0.14)}${miniSpade(74, 102, 0.14, 'rotate(180 12 60)')}<g filter="url(#artShadow)"><path d="${SPADE}" transform="translate(22,28) scale(.56)" fill="url(#gNavy)"/><path d="${SPADE}" transform="translate(25,31) scale(.5)" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="2.4"/></g></svg>`,
  G: () =>
    `<svg class="art" viewBox="0 0 100 130"><rect x="3" y="3" width="94" height="124" rx="10" fill="url(#gCoin)"/><circle cx="50" cy="58" r="34" fill="url(#gHalo)"/><g filter="url(#goldGlow)"><path d="${SPADE}" transform="translate(22,26) scale(.56)" fill="url(#gGoldDeep)"/><path d="${SPADE}" transform="translate(26,30) scale(.48)" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2"/></g><path class="gsp" d="M22 22 l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3z" fill="#fff"/><path class="gsp2" d="M76 92 l2.5 5 5 2.5 -5 2.5 -2.5 5 -2.5 -5 -5 -2.5 5 -2.5z" fill="#fff"/><text x="50" y="118" text-anchor="middle" font-size="10" font-weight="900" fill="#7a4d12" letter-spacing="2" font-family="Arial">GOLDEN</text></svg>`,
  SC: () =>
    `<svg class="art" viewBox="0 0 100 130"><circle cx="50" cy="58" r="45" fill="url(#gHalo)"/><g filter="url(#goldGlow)"><circle cx="50" cy="58" r="38" fill="url(#gGoldDeep)"/><circle cx="50" cy="58" r="34" fill="url(#gCoin)"/><circle cx="50" cy="58" r="31" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="1"/><text x="50" y="73" font-size="42" text-anchor="middle" fill="#7a4d12" font-family="Georgia" font-weight="bold">৳</text><text x="49" y="71" font-size="42" text-anchor="middle" fill="#fff" font-family="Georgia" font-weight="bold" opacity=".85">৳</text><g clip-path="url(#coinClip)"><rect class="shineRect" x="20" y="10" width="15" height="100" fill="rgba(255,255,255,.6)"/></g></g><path d="M15 102 h70 v18 h-70 z" fill="url(#gRed)" filter="url(#artShadow)"/><path d="M11 102 l4 -4 v26 l-4 -4 z M89 102 l-4 -4 v26 l4 -4 z" fill="url(#gGoldDeep)"/><text x="50" y="115" text-anchor="middle" font-size="10.5" fill="#fff" letter-spacing="2.5" font-family="Arial" font-weight="900">SCATTER</text></svg>`,
};

export const RANK: Record<string, string> = { A: 'A', K: 'K', Q: 'Q', J: 'J', S: '10' };

export const cardHTML = (s: string) =>
  `<div class="card">${RANK[s] ? `<span class="rank">${RANK[s]}</span>` : ''}${ART[s] ? ART[s]() : ''}</div>`;

export const BETS = [1, 2, 5, 10, 20, 50, 100, 200, 500];
export const PAY = {
  A: [0.05, 0.13, 0.28],
  K: [0.04, 0.11, 0.22],
  Q: [0.03, 0.08, 0.17],
  J: [0.02, 0.055, 0.11],
  S: [0.013, 0.027, 0.08],
};
export const SC_PAY = [0.2, 0.65, 1.8];
export const STRIP = [
  'K',
  'S',
  'Q',
  'A',
  'J',
  'S',
  'Q',
  'K',
  'J',
  'Q',
  'S',
  'K',
  'SC',
  'A',
  'J',
  'Q',
  'S',
  'K',
  'Q',
  'J',
];

export const SVG_DEFS = `<svg width="0" height="0" style="position:absolute;pointer-events:none"><defs>
<filter id="artShadow" x="-20%" y="-20%" width="140%" height="140%">
<feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.45"/>
</filter>
<filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
<feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#ffd76a" flood-opacity="0.7"/>
<feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.5"/>
</filter>
<linearGradient id="gGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff4d0"/><stop offset=".3" stop-color="#f4cf6d"/><stop offset=".7" stop-color="#d89b28"/><stop offset="1" stop-color="#80530b"/></linearGradient>
<linearGradient id="gGoldDeep" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0bd"/><stop offset=".4" stop-color="#e8a827"/><stop offset="1" stop-color="#935b0b"/></linearGradient>
<linearGradient id="gBlack" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a4a54"/><stop offset=".4" stop-color="#222228"/><stop offset="1" stop-color="#060609"/></linearGradient>
<linearGradient id="gNavy" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#415278"/><stop offset=".5" stop-color="#212c45"/><stop offset="1" stop-color="#0b1120"/></linearGradient>
<linearGradient id="gRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0563e"/><stop offset=".5" stop-color="#c42512"/><stop offset="1" stop-color="#700a0a"/></linearGradient>
<linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#698bfb"/><stop offset=".5" stop-color="#3254d1"/><stop offset="1" stop-color="#122470"/></linearGradient>
<linearGradient id="gHairB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ba7d38"/><stop offset=".5" stop-color="#5e3912"/></linearGradient>
<linearGradient id="gHairG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fce388"/><stop offset=".5" stop-color="#ba8c27"/></linearGradient>
<linearGradient id="gHairS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#9d9dae"/></linearGradient>
<radialGradient id="gSkin" cx=".5" cy=".38" r=".8"><stop offset="0" stop-color="#ffebd4"/><stop offset="1" stop-color="#d99b6c"/></radialGradient>
<radialGradient id="gCoin" cx=".4" cy=".3" r=".85"><stop offset="0" stop-color="#ffffff"/><stop offset=".25" stop-color="#fff1b0"/><stop offset=".6" stop-color="#e8a827"/><stop offset="1" stop-color="#935b0b"/></radialGradient>
<radialGradient id="gHalo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe48a" stop-opacity=".45"/><stop offset="1" stop-color="#ffe48a" stop-opacity="0"/></radialGradient>
<clipPath id="coinClip"><circle cx="50" cy="58" r="32"/></clipPath>
</defs></svg>`;
