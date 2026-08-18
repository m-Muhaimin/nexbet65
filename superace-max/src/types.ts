export type SymbolType =
  | 'A'
  | 'K'
  | 'Q'
  | 'J'
  | 'S'
  | 'G'
  | 'JK' // Golden Joker Wild (Deluxe expanding wild)
  | 'SC';

export type GameMode = 'classic' | 'deluxe';

export interface SymbolInfo {
  type: SymbolType;
  name: string;
  tier: 'special' | 'high' | 'mid' | 'low';
  color: string;
  bgGradient: string;
  borderStroke: string;
  rankColor: string;
  payouts: {
    3: number;
    4: number;
    5: number;
  };
  description: string;
}

export interface MegaSymbol {
  id: string;
  symbol: SymbolType;
  originCol: number;
  originRow: number;
  width: number;  // 2 or 3
  height: number; // 2 or 3
}

export interface GridCell {
  id: string;
  symbol: SymbolType;
  isGoldenCard: boolean;  // Golden card turns into Golden Wild (G) or Golden Joker (JK) in Deluxe
  isWild: boolean;        // True for 'G' (Golden Wild) and 'JK' (Golden Joker)
  isGoldenJoker?: boolean;// True for 'JK'
  isExpandedWild?: boolean;// When Joker expands to cover the whole column
  isWinning?: boolean;
  isConverting?: boolean;
  isNew?: boolean;
  colIndex: number;
  rowIndex: number;
  megaSymbolId?: string;
  isMegaOrigin?: boolean;
  megaWidth?: number;
  megaHeight?: number;
}

export interface WaysHit {
  symbol: SymbolType;
  matchedCols: number; // 3, 4, or 5
  ways: number;        // product of symbol count across matching adjacent reels
  multiplier: number;  // combo multiplier
  payout: number;
  cellIds: string[];
}

export interface CascadeStep {
  stepIndex: number;
  grid: GridCell[][];
  waysHits: WaysHit[];
  winAmount: number;
  comboMultiplier: number;
  conversions: { col: number; row: number; symbol: SymbolType }[];
  expandedJokerCols?: number[]; // Columns where Golden Joker expanded to full reel
  megaSymbols?: MegaSymbol[];
  isOverdrive?: boolean;
  droppedColumns?: number[];
  droppedCells?: { col: number; row: number }[];
  nextGrid?: GridCell[][];
}

export interface SpinResult {
  spinId: string;
  bet: number;
  gameMode: GameMode;
  initialGrid: GridCell[][];
  finalGrid: GridCell[][];
  cascades: CascadeStep[];
  totalWin: number;
  scattersCount: number;
  freeSpinsAwarded: number;
  isFreeSpin: boolean;
  expandedJokerCols?: number[];
  megaSymbols?: MegaSymbol[];
  jackpotTeaserTriggered?: boolean;
  jackpotTeaserAmount?: number;
}

export interface SpinHistoryItem {
  id: string;
  timestamp: number;
  gameMode: GameMode;
  bet: number;
  win: number;
  ways: number;
  cascadesCount: number;
  maxMultiplier: number;
  isFreeSpin: boolean;
  freeSpinsAwarded: number;
  isBonusBuy: boolean;
  hasExpandedJoker?: boolean;
  hasMegaSymbol?: boolean;
}

export type WinCelebrationTier = 'BIG_WIN' | 'MEGA_WIN' | 'SUPER_WIN' | null;

// Retention & Ecosystem Types
export interface VaultTransaction {
  id: string;
  timestamp: number;
  amount: number;
  type: 'DEPOSIT_BIG_WIN' | 'DIVIDEND_HARVEST' | 'DAILY_RELEASE';
}

export interface VaultData {
  balance: number;
  totalDeposited: number;
  totalHarvested: number;
  nextUnlockTimestamp: number;
  lockedProfitRate: number; // 0.05 = 5%
  transactions: VaultTransaction[];
}

export interface TournamentEntry {
  rank: number;
  name: string;
  score: number;
  prize: number;
  isPlayer?: boolean;
  avatar: string;
  trend?: 'up' | 'down' | 'same';
}

export interface TournamentData {
  id: string;
  title: string;
  prizePool: number;
  firstPrize: number;
  endsInSeconds: number;
  playerRank: number;
  playerScore: number;
  activeParticipants: number;
  entries: TournamentEntry[];
}

export interface BeginnerBoostData {
  isActive: boolean;
  daysRemaining: number;
  hoursRemaining: number;
  pointsMultiplier: number;
  loyaltyPoints: number;
  nextTierPoints: number;
  vipTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
}
