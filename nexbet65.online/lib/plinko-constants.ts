/**
 * Shared Plinko constants and pre-calculated multiplier tables (99% RTP, 1%
 * house edge). Imported from the Plinko-V1 reference implementation
 * (Apache-2.0) and kept side-effect free so it can be bundled on the client
 * as well as the server.
 */

export type RiskLevel = "low" | "medium" | "high";
export type BallSkin = "metallic" | "ruby" | "diamond";
export type PlinkoGameState = "idle" | "dropping" | "result";

export const MIN_ROWS = 8;
export const MAX_ROWS = 16;
export const HOUSE_EDGE = 0.01; // 1% edge, 99% RTP

export const BOARD_WIDTH = 800;
export const BOARD_HEIGHT = 600;
export const BOARD_PADDING = 40;

// Format: MULTIPLIERS[risk][rows] = number[] (length rows + 1)
export const PLINKO_MULTIPLIERS: Record<RiskLevel, Record<number, number[]>> = {
  low: {
    8: [5.6, 2.1, 1.3, 1.2, 1.1, 1.2, 1.3, 2.1, 5.6],
    9: [5.6, 2.0, 1.6, 1.3, 1.2, 1.2, 1.3, 1.6, 2.0, 5.6],
    10: [8.9, 3.0, 2.0, 1.5, 1.2, 1.1, 1.2, 1.5, 2.0, 3.0, 8.9],
    11: [8.4, 3.0, 1.9, 1.4, 1.3, 1.2, 1.2, 1.3, 1.4, 1.9, 3.0, 8.4],
    12: [10, 5, 3, 2, 1.4, 1.2, 1.1, 1.2, 1.4, 2, 3, 5, 10],
    13: [8.1, 4.0, 3.0, 2.0, 1.5, 1.3, 1.2, 1.2, 1.3, 1.5, 2.0, 3.0, 4.0, 8.1],
    14: [7.1, 4.0, 3.0, 2.0, 1.5, 1.3, 1.2, 1.1, 1.2, 1.3, 1.5, 2.0, 3.0, 4.0, 7.1],
    15: [15, 8, 5, 3, 2, 1.5, 1.3, 1.2, 1.2, 1.3, 1.5, 2, 3, 5, 8, 15],
    16: [16, 9, 6, 4, 2.5, 2, 1.5, 1.2, 1.1, 1.2, 1.5, 2, 2.5, 4, 6, 9, 16],
  },
  medium: {
    8: [13, 4, 2.2, 1.5, 1.0, 0.7, 0.4, 0.7, 1.0, 1.5, 2.2, 4, 13].slice(2, 11),
    9: [18, 7, 4, 2, 1, 0.7, 0.6, 0.7, 1, 2, 4, 7, 18].slice(2, 12),
    10: [22, 10, 5, 3, 1.4, 1, 0.5, 1, 1.4, 3, 5, 10, 22].slice(1, 12),
    // Trimmed trailing 24: 11 rows → 12 buckets (reference had a dead 13th element).
    11: [24, 14, 6, 3, 1.8, 1, 0.5, 1, 1.8, 3, 6, 14],
    12: [33, 11, 4, 2, 1.4, 1.1, 0.4, 1.1, 1.4, 2, 4, 11, 33],
    13: [43, 18, 6, 3, 1.9, 1.2, 0.7, 0.4, 0.7, 1.2, 1.9, 3, 6, 18, 43].slice(0, 14),
    14: [58, 15, 7, 4, 1.9, 1, 0.5, 0.2, 0.5, 1, 1.9, 4, 7, 15, 58],
    15: [88, 26, 9, 4, 2, 1.1, 0.6, 0.3, 0.3, 0.6, 1.1, 2, 4, 9, 26, 88],
    16: [110, 41, 15, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 15, 41, 110],
  },
  high: {
    8: [29, 10, 2.5, 1.0, 0.5, 0.3, 0.2, 0.3, 0.5, 1.0, 2.5, 10, 29].slice(2, 11),
    9: [43, 18, 5, 2, 0.5, 0.2, 0.2, 0.5, 2, 5, 18, 43].slice(1, 11),
    10: [76, 24, 8, 3, 0.9, 0.5, 0.2, 0.5, 0.9, 3, 8, 24, 76].slice(1, 12),
    11: [120, 33, 10, 4, 1, 0.5, 0.2, 0.2, 0.5, 1, 4, 10, 33, 120].slice(0, 12),
    12: [170, 48, 18, 7, 2, 1, 0.2, 0.2, 1, 2, 7, 18, 48, 170].slice(0, 13),
    13: [260, 81, 25, 9, 3, 1, 0.2, 0.2, 1, 3, 9, 25, 81, 260],
    // Appended edge 420/620: 14/15 rows need 15/16 buckets — the reference
    // tables were one short, so the all-R bucket would have paid undefined.
    14: [420, 110, 38, 11, 4, 1, 0.2, 0.2, 1, 4, 11, 38, 110, 420, 420],
    15: [620, 190, 58, 16, 5, 1, 0.2, 0.2, 0.2, 1, 5, 16, 58, 190, 620, 620],
    16: [1000, 260, 72, 21, 8, 3, 1, 0.2, 0.1, 0.2, 1, 3, 8, 21, 72, 260, 1000],
  },
};

/** Bucket multiplier for a given risk + rows + path (count of "R" bounces). */
export function plinkoMultiplier(risk: RiskLevel, rows: number, bucket: number): number {
  return PLINKO_MULTIPLIERS[risk][rows][bucket];
}

export function isRiskLevel(value: unknown): value is RiskLevel {
  return value === "low" || value === "medium" || value === "high";
}

/** Edge color for a bucket, mirrors the Plinko-V1 board palette. */
export function plinkoBucketColor(multiplier: number): string {
  if (multiplier >= 10) return "#ff4d4d";
  if (multiplier >= 2) return "#ff9f43";
  if (multiplier >= 1) return "#feca57";
  return "#54a0ff";
}
