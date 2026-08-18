import { SymbolInfo, SymbolType } from '../types';

export const SYMBOLS: Record<SymbolType, SymbolInfo> = {
  A: {
    type: 'A',
    name: 'Ace',
    tier: 'high',
    color: '#c9a65a',
    bgGradient: 'from-[#ffffff] via-[#f7f8fc] to-[#e2e7f2]',
    borderStroke: '#c9a65a',
    rankColor: '#15161c',
    payouts: {
      3: 0.5,
      4: 1.5,
      5: 2.5,
    },
    description: 'High-paying Ace of Spades card with royal gold filigree.',
  },
  K: {
    type: 'K',
    name: 'King',
    tier: 'high',
    color: '#4a6edb',
    bgGradient: 'from-[#ffffff] via-[#f0f4ff] to-[#d8e3fb]',
    borderStroke: '#4a6edb',
    rankColor: '#0d2870',
    payouts: {
      3: 0.4,
      4: 1.0,
      5: 2.0,
    },
    description: 'Royal King portrait with crown and royal blue mantle.',
  },
  Q: {
    type: 'Q',
    name: 'Queen',
    tier: 'mid',
    color: '#db4a4a',
    bgGradient: 'from-[#ffffff] via-[#fff0f0] to-[#fbd4d4]',
    borderStroke: '#db4a4a',
    rankColor: '#8c0c0c',
    payouts: {
      3: 0.3,
      4: 0.8,
      5: 1.5,
    },
    description: 'Royal Queen portrait with tiara and crimson rose accents.',
  },
  J: {
    type: 'J',
    name: 'Jack',
    tier: 'mid',
    color: '#2ea05a',
    bgGradient: 'from-[#ffffff] via-[#f0fcf4] to-[#d2f7de]',
    borderStroke: '#2ea05a',
    rankColor: '#095427',
    payouts: {
      3: 0.2,
      4: 0.5,
      5: 1.0,
    },
    description: 'Royal Jack knight portrait with emerald helm.',
  },
  S: {
    type: 'S',
    name: 'Spade',
    tier: 'low',
    color: '#7b8fae',
    bgGradient: 'from-[#ffffff] via-[#f4f6fb] to-[#dce2ee]',
    borderStroke: '#7b8fae',
    rankColor: '#334155',
    payouts: {
      3: 0.1,
      4: 0.3,
      5: 0.6,
    },
    description: 'Classic ornate black spade crest.',
  },
  G: {
    type: 'G',
    name: 'Golden Wild',
    tier: 'special',
    color: '#f6b01a',
    bgGradient: 'from-[#fffbeb] via-[#ffe685] to-[#b8780d]',
    borderStroke: '#ffe17d',
    rankColor: '#7a1000',
    payouts: {
      3: 0.5,
      4: 1.5,
      5: 2.5,
    },
    description: 'Golden Wild coin substitute for all symbols except Scatter.',
  },
  JK: {
    type: 'JK',
    name: 'Golden Joker',
    tier: 'special',
    color: '#ec4899',
    bgGradient: 'from-[#fdf2f8] via-[#fbcfe8] to-[#db2777]',
    borderStroke: '#f472b6',
    rankColor: '#831843',
    payouts: {
      3: 1.0,
      4: 3.0,
      5: 6.0,
    },
    description: 'Deluxe Golden Joker Wild. Expands to cover the entire column as a Sticky Wild!',
  },
  SC: {
    type: 'SC',
    name: 'Scatter',
    tier: 'special',
    color: '#ffd25e',
    bgGradient: 'from-[#b51c1c] via-[#750e0e] to-[#3d0505]',
    borderStroke: '#ffd25e',
    rankColor: '#ffd25e',
    payouts: {
      3: 2.0,
      4: 5.0,
      5: 10.0,
    },
    description: 'Crimson ৳ coin medallion. 3+ awards 10 Free Rounds with escalating multipliers!',
  },
};

// Standard Reel weights
export const REEL_WEIGHTS: Record<SymbolType, number> = {
  A: 18,
  K: 20,
  Q: 22,
  J: 24,
  S: 26,
  G: 3,
  JK: 0,
  SC: 4,
};

// Deluxe Reel weights with Golden Jokers
export const REEL_WEIGHTS_DELUXE: Record<SymbolType, number> = {
  A: 17,
  K: 19,
  Q: 21,
  J: 23,
  S: 24,
  G: 3,
  JK: 2.5,
  SC: 4.5,
};

// Base game multiplier ladders
export const MULTIPLIER_BASE = [1, 2, 3, 5];
export const MULTIPLIER_FREE = [2, 4, 6, 10];

// Deluxe Overdrive multiplier ladders (GR-2)
export const MULTIPLIER_BASE_DELUXE = [1, 2, 3, 5, 15];
export const MULTIPLIER_FREE_DELUXE = [2, 4, 6, 10, 25];

// Buy Bonus Costs
export const BUY_BONUS_COST_CLASSIC = 80;  // 80x bet
export const BUY_BONUS_COST_DELUXE = 120; // 120x bet with guaranteed Mega-Symbol and 4x start
