export type SymbolType = 'A' | 'K' | 'Q' | 'J' | 'S' | 'G' | 'JK' | 'SC';
export type GameMode = 'classic' | 'deluxe';

export interface ServerGridCell {
  symbol: SymbolType;
  isGoldenCard: boolean;
  isWild: boolean;
  isGoldenJoker: boolean;
  isExpandedWild: boolean;
}

export interface ServerWaysHit {
  symbol: SymbolType;
  matchedCols: number;
  ways: number;
  multiplier: number;
  payout: number;
}

export interface ServerCascadeStep {
  stepIndex: number;
  grid: ServerGridCell[][];
  waysHits: ServerWaysHit[];
  winAmount: number;
  comboMultiplier: number;
  conversions: { col: number; row: number; symbol: SymbolType }[];
  expandedJokerCols: number[];
  isOverdrive: boolean;
  droppedColumns: number[];
  droppedCells: { col: number; row: number }[];
  nextGrid: ServerGridCell[][] | null;
}

export interface ServerSpinResult {
  spinId: string;
  initialGrid: ServerGridCell[][];
  finalGrid: ServerGridCell[][];
  cascades: ServerCascadeStep[];
  totalWin: number;
  scattersCount: number;
  freeSpinsAwarded: number;
  expandedJokerCols: number[];
  jackpotTeaserTriggered: boolean;
  jackpotTeaserAmount: number;
}
