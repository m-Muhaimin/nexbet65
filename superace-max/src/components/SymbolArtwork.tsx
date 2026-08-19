import React from 'react';
import { SymbolType } from '../types';
import { ART, RANK } from '../utils/cardVisuals';

// Processed PNG asset paths (from scripts/process-assets.mjs)
const PNG_ASSETS: Partial<Record<SymbolType, string>> = {
  A: './assets/symbols/A.png',
  K: './assets/symbols/K.png',
  Q: './assets/symbols/Q.png',
  J: './assets/symbols/J.png',
  S: './assets/symbols/clubs.png',
  G: './assets/symbols/G.png',
  JK: './assets/symbols/JK.png',
  SC: './assets/symbols/SC.png',
};

interface SymbolArtworkProps {
  symbol: SymbolType;
  isGoldenCard?: boolean;
  isWild?: boolean;
  isGoldenJoker?: boolean;
  isExpandedWild?: boolean;
  isWinning?: boolean;
  isConverting?: boolean;
  megaWidth?: number;
  megaHeight?: number;
  /** Use processed PNG textures instead of SVG rendering. Defaults to true. */
  usePng?: boolean;
}

export const SymbolArtwork: React.FC<SymbolArtworkProps> = React.memo(({
  symbol,
  isGoldenCard = false,
  isWild = false,
  isGoldenJoker = false,
  isExpandedWild = false,
  isWinning = false,
  isConverting = false,
  usePng = true,
}) => {
  // PNG texture mode — render the pre-processed transparent PNG
  if (usePng) {
    const pngPath = PNG_ASSETS[symbol];
    if (pngPath) {
      const glowClass = isWinning
        ? 'drop-shadow-[0_0_12px_rgba(250,204,21,0.9)] animate-winning-pop'
        : isGoldenCard || isGoldenJoker
          ? 'drop-shadow-[0_2px_8px_rgba(236,72,153,0.5)]'
          : '';

      return (
        <div className="relative w-full h-full flex items-center justify-center select-none overflow-hidden">
          <img
            src={pngPath}
            alt={symbol}
            className={`w-full h-full object-contain ${glowClass}`}
            draggable={false}
          />
        </div>
      );
    }
    // Fall through to SVG if no PNG available
  }

  // SVG mode (original rendering)

  // 1. Golden Joker Wild (JK or isGoldenJoker or isExpandedWild)
  if (symbol === 'JK' || isGoldenJoker || isExpandedWild) {
    return (
      <div className="relative w-full h-full flex items-center justify-center p-0.5 select-none overflow-hidden">
        <svg viewBox="0 0 100 130" className="w-full h-full filter drop-shadow-[0_4px_12px_rgba(236,72,153,0.85)]">
          <defs>
            <radialGradient id="jkCoinBase" cx="50%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#fff1f2" />
              <stop offset="25%" stopColor="#fbcfe8" />
              <stop offset="55%" stopColor="#ec4899" />
              <stop offset="85%" stopColor="#be185d" />
              <stop offset="100%" stopColor="#500724" />
            </radialGradient>
            <linearGradient id="jkGoldBorder" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor="#fde047" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="80%" stopColor="#854d0e" />
              <stop offset="100%" stopColor="#fef08a" />
            </linearGradient>
            <linearGradient id="jkBannerGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#db2777" />
              <stop offset="50%" stopColor="#9d174d" />
              <stop offset="100%" stopColor="#4c0519" />
            </linearGradient>
            <linearGradient id="jkJesterCap" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#9333ea" />
              <stop offset="50%" stopColor="#db2777" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <filter id="jkGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.9" />
            </filter>
          </defs>
          <circle cx="50" cy="54" r="44" fill="#500724" />
          <circle cx="50" cy="54" r="41" fill="url(#jkCoinBase)" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <circle key={angle} cx="50" cy="13" r="2" fill="#fde047" transform={`rotate(${angle} 50 54)`} />
          ))}
          <g filter="url(#jkGlow)">
            <path d="M 50 42 C 40 30 25 22 18 34 C 15 40 22 45 32 44 Z" fill="url(#jkJesterCap)" />
            <circle cx="18" cy="34" r="3.2" fill="#fde047" />
            <circle cx="18" cy="34" r="1" fill="#ffffff" />
            <path d="M 50 42 C 60 30 75 22 82 34 C 85 40 78 45 68 44 Z" fill="url(#jkJesterCap)" />
            <circle cx="82" cy="34" r="3.2" fill="#fde047" />
            <circle cx="82" cy="34" r="1" fill="#ffffff" />
            <path d="M 40 44 C 45 25 45 16 50 14 C 55 16 55 25 60 44 Z" fill="url(#jkGoldBorder)" />
            <circle cx="50" cy="14" r="3.5" fill="#fde047" />
            <circle cx="50" cy="14" r="1.2" fill="#ef4444" />
            <ellipse cx="50" cy="54" rx="16" ry="17" fill="#fff1f2" />
            <path d="M 36 48 Q 43 45 50 49 Q 57 45 64 48 Q 66 55 60 56 Q 50 52 40 56 Q 34 55 36 48 Z" fill="#831843" />
            <circle cx="43" cy="51" r="1.8" fill="#fde047" />
            <circle cx="57" cy="51" r="1.8" fill="#fde047" />
            <polygon points="40,58 41.5,60.5 40,63 38.5,60.5" fill="#db2777" />
            <polygon points="60,58 61.5,60.5 60,63 58.5,60.5" fill="#db2777" />
            <path d="M 40 64 Q 50 74 60 64 Q 50 67 40 64 Z" fill="#ffffff" />
            <path d="M 38 63 Q 50 76 62 63" fill="none" />
            <polygon points="34,70 42,78 50,70 58,78 66,70 58,82 42,82" fill="url(#jkGoldBorder)" />
            <circle cx="42" cy="78" r="1.5" fill="#fde047" />
            <circle cx="58" cy="78" r="1.5" fill="#fde047" />
          </g>
          <g filter="url(#jkGlow)">
            <rect x="8" y="86" width="84" height="26" rx="4" fill="#ffd25e" />
            <rect x="10" y="88" width="80" height="22" rx="3" fill="url(#jkBannerGrad)" />
            <circle cx="13" cy="91" r="1.2" fill="#fde047" />
            <circle cx="87" cy="91" r="1.2" fill="#fde047" />
            <circle cx="13" cy="107" r="1.2" fill="#fde047" />
            <circle cx="87" cy="107" r="1.2" fill="#fde047" />
            <text x="50" y="105" textAnchor="middle" fill="url(#jkGoldBorder)" fontSize="14" fontWeight="900" fontFamily="Georgia, serif" letterSpacing="2">
              {isExpandedWild ? 'EXP JOKER' : 'JOKER'}
            </text>
          </g>
        </svg>
      </div>
    );
  }

  // 2. Wild / Golden Wild (G or isWild)
  if (symbol === 'G' || isWild) {
    const svgCode = ART.G ? ART.G() : '';
    return (
      <div
        className="relative w-full h-full flex items-center justify-center select-none overflow-hidden"
        dangerouslySetInnerHTML={{ __html: svgCode }}
      />
    );
  }

  // 3. Scatter (SC)
  if (symbol === 'SC') {
    const svgCode = ART.SC ? ART.SC() : '';
    return (
      <div
        className="relative w-full h-full flex items-center justify-center select-none overflow-hidden animate-scatter-pulse"
        dangerouslySetInnerHTML={{ __html: svgCode }}
      />
    );
  }

  // 4. Standard Playing Cards (A, K, Q, J, S)
  const rank = RANK[symbol];
  const artFn = ART[symbol];
  const svgHtml = artFn ? artFn() : '';

  return (
    <div className="card relative w-full h-full flex items-center justify-center select-none overflow-hidden">
      {rank && (
        <span className="rank absolute top-1 left-1.5 font-['Arial',sans-serif] font-black text-[17px] text-[#111827] drop-shadow-[0_1px_2px_rgba(255,255,255,0.85)] z-10 pointer-events-none">
          {rank}
        </span>
      )}
      <div
        className="w-full h-full flex items-center justify-center"
        dangerouslySetInnerHTML={{ __html: svgHtml }}
      />
    </div>
  );
});
