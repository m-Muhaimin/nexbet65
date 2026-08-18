import { SymbolType } from './types';

export const PAYOUTS: Record<SymbolType, Record<3 | 4 | 5, number>> = {
  A:  { 3: 0.5, 4: 1.5, 5: 2.5 },
  K:  { 3: 0.4, 4: 1.0, 5: 2.0 },
  Q:  { 3: 0.3, 4: 0.8, 5: 1.5 },
  J:  { 3: 0.2, 4: 0.5, 5: 1.0 },
  S:  { 3: 0.1, 4: 0.3, 5: 0.6 },
  G:  { 3: 0.5, 4: 1.5, 5: 2.5 },
  JK: { 3: 1.0, 4: 3.0, 5: 6.0 },
  SC: { 3: 2.0, 4: 5.0, 5: 10.0 },
};

export const REEL_WEIGHTS: Record<SymbolType, number> = {
  A: 18, K: 20, Q: 22, J: 24, S: 26, G: 3, JK: 0, SC: 4,
};

export const REEL_WEIGHTS_DELUXE: Record<SymbolType, number> = {
  A: 17, K: 19, Q: 21, J: 23, S: 24, G: 3, JK: 2.5, SC: 4.5,
};

export const MULTIPLIER_BASE = [1, 2, 3, 5];
export const MULTIPLIER_FREE = [2, 4, 6, 10];
export const MULTIPLIER_BASE_DELUXE = [1, 2, 3, 5, 8];
export const MULTIPLIER_FREE_DELUXE = [2, 4, 6, 10, 15];

export const BUY_BONUS_COST_CLASSIC = 80;
export const BUY_BONUS_COST_DELUXE = 120;
