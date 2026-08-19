/**
 * Domain Interfaces for SuperAce-Max State Architecture
 *
 * Phase 1 Checkpoint 1.1 — Pure data types, no React/Zustand coupling.
 * Each domain becomes a Zustand store in Checkpoint 1.2.
 *
 * Design principles:
 * - Serializable (no functions, refs, or DOM nodes)
 * - Minimal cross-domain references
 * - Strict types for all values
 * - GridCell kept for backward compatibility with engine + renderer
 */

import type { GridCell, MegaSymbol, SymbolType, WaysHit, SpinHistoryItem, GameMode } from '../types';

// ─── Re-export shared types for convenience ──────────────────────────────────
export type { GridCell, MegaSymbol, SymbolType, WaysHit, SpinHistoryItem, GameMode };

// ─── Grid & Visual State ─────────────────────────────────────────────────────

export interface RippleState {
  columns: number[];
  cells: { col: number; row: number }[];
  triggerKey: number;
}

// ─── Game Core ───────────────────────────────────────────────────────────────

export interface GameCoreState {
  /** Current game mode */
  gameMode: GameMode;
  /** Current 5×4 grid of visible symbols */
  grid: GridCell[][];
  /** Which columns are currently spinning (index 0-4) */
  spinningColumns: boolean[];
  /** Whether a spin/cascade sequence is in progress */
  isSpinning: boolean;
  /** Current combo multiplier (1-based, increases per cascade) */
  comboMultiplier: number;
  /** Total spin count (monotonic, persists across sessions) */
  spinCount: number;
  /** Current cascade step index (0 = initial drop) */
  cascadeDepth: number;
  /** Winning ways from the current cascade step */
  currentWaysHits: WaysHit[];
  /** Number of scatter symbols landed */
  scattersCount: number;
  /** Visual ripple effect state for symbol drops */
  ripple: RippleState;
  /** Whether the Overdrive multiplier is active (Deluxe cascade ≥3) */
  isOverdriveActive: boolean;
}

// ─── Free Spins ──────────────────────────────────────────────────────────────

export interface FreeSpinsState {
  /** Whether free spins mode is active */
  isActive: boolean;
  /** Remaining free spins */
  remaining: number;
  /** Total free spins awarded this session */
  total: number;
  /** Accumulated win during free spins */
  accumulatedWin: number;
}

// ─── Wallet ──────────────────────────────────────────────────────────────────

export interface WalletState {
  /** Server-side balance (authoritative) */
  balance: number;
  /** Whether balance has been loaded from server */
  balanceLoaded: boolean;
  /** Current spin win amount (for display during cascades) */
  currentWin: number;
  /** Smoothly interpolated displayed win counter */
  displayedWin: number;
  /** Whether balance is pulsing (gold glow effect) */
  isBalancePulsing: boolean;
  /** Last win amount added to balance (for animation) */
  lastAddedWin: number;
  /** Last spin's total win (for overlay) */
  lastSpinWin: number;
  /** Total bets placed (persists across sessions) */
  totalBetsPlaced: number;
}

// ─── Vault ───────────────────────────────────────────────────────────────────

export interface VaultTransaction {
  id: string;
  timestamp: number;
  amount: number;
  type: 'DEPOSIT_BIG_WIN' | 'DIVIDEND_HARVEST' | 'DAILY_RELEASE';
}

export interface VaultState {
  /** Current vault balance (locked funds) */
  balance: number;
  /** Total deposited into vault */
  totalDeposited: number;
  /** Total harvested from vault */
  totalHarvested: number;
  /** When locked funds unlock */
  nextUnlockTimestamp: number;
  /** Locked profit rate (0.05 = 5%) */
  lockedProfitRate: number;
  /** Recent transactions */
  transactions: VaultTransaction[];
  /** Animation trigger key (set to Date.now() on deposit) */
  depositAnimKey: number;
}

// ─── Tournament ──────────────────────────────────────────────────────────────

export interface TournamentEntry {
  rank: number;
  name: string;
  score: number;
  prize: number;
  isPlayer?: boolean;
  avatar: string;
  trend?: 'up' | 'down' | 'same';
}

export interface TournamentState {
  /** Tournament ID */
  id: string;
  /** Tournament title */
  title: string;
  /** Total prize pool */
  prizePool: number;
  /** First place prize */
  firstPrize: number;
  /** Seconds until tournament ends */
  endsInSeconds: number;
  /** Player's current rank */
  playerRank: number;
  /** Player's current score */
  playerScore: number;
  /** Number of active participants */
  activeParticipants: number;
  /** Leaderboard entries */
  entries: TournamentEntry[];
}

// ─── Jackpot ─────────────────────────────────────────────────────────────────

export interface JackpotState {
  /** Current jackpot value */
  value: number;
  /** Whether the jackpot ticker has incremented (for animation) */
  hasIncrement: boolean;
}

// ─── Retention (Boost + VIP) ─────────────────────────────────────────────────

export interface BoostState {
  /** Whether beginner boost is active */
  isActive: boolean;
  /** Days remaining in boost period */
  daysRemaining: number;
  /** Hours remaining in boost period */
  hoursRemaining: number;
  /** Current loyalty points multiplier */
  pointsMultiplier: number;
  /** Current loyalty points */
  loyaltyPoints: number;
  /** Points needed for next tier */
  nextTierPoints: number;
  /** Current VIP tier */
  vipTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
}

// ─── Session (User Preferences) ──────────────────────────────────────────────

export interface SessionState {
  /** Whether sound is muted */
  isMuted: boolean;
  /** Whether turbo mode is enabled (faster animations) */
  isTurbo: boolean;
  /** Number of auto-spins remaining (0 = manual mode) */
  autoSpinsRemaining: number;
  /** Current bet amount selected by user (not cumulative) */
  currentBet: number;
}

// ─── UI (Modals + Visual Effects) ────────────────────────────────────────────

export interface UIState {
  /** Navigation drawer */
  isMenuOpen: boolean;
  /** Buy Bonus modal */
  isBuyBonusOpen: boolean;
  /** Free Spins intro modal (shown when FS awarded) */
  isFreeSpinsIntroOpen: boolean;
  /** Number of spins shown in intro modal */
  awardedSpinsCount: number;
  /** Free Spins summary modal (shown when FS end) */
  isFreeSpinsSummaryOpen: boolean;
  /** Paytable modal */
  isPaytableOpen: boolean;
  /** History modal */
  isHistoryOpen: boolean;
  /** Settings modal */
  isSettingsOpen: boolean;
  /** Bet selector modal */
  isBetSelectorOpen: boolean;
  /** Autoplay modal */
  isAutoplayModalOpen: boolean;
  /** Vault modal */
  isVaultOpen: boolean;
  /** Tournament modal */
  isTournamentOpen: boolean;
  /** VIP Club modal */
  isVIPClubOpen: boolean;
  /** Withdrawal Intercept modal */
  isWithdrawalInterceptOpen: boolean;
  /** Jackpot modal */
  isJackpotOpen: boolean;
  /** Big Win celebration amount (0 = no celebration) */
  celebrationWinAmount: number;
  /** Screen shake CSS class (cleared after animation) */
  screenShakeClass: string;
}

// ─── History ─────────────────────────────────────────────────────────────────

export interface HistoryState {
  /** Recent spin history (newest first, max 50) */
  items: SpinHistoryItem[];
}

// ─── Aggregate State Shape ───────────────────────────────────────────────────

export interface GameStore {
  game: GameCoreState;
  freeSpins: FreeSpinsState;
  wallet: WalletState;
  vault: VaultState;
  tournament: TournamentState;
  jackpot: JackpotState;
  boost: BoostState;
  session: SessionState;
  ui: UIState;
  history: HistoryState;
}

// ─── Action Types ────────────────────────────────────────────────────────────

export interface GameActions {
  setGameMode: (mode: GameMode) => void;
  setGrid: (grid: GridCell[][]) => void;
  setSpinningColumns: (columns: boolean[]) => void;
  setIsSpinning: (spinning: boolean) => void;
  setComboMultiplier: (multiplier: number) => void;
  setSpinCount: (count: number) => void;
  setCascadeDepth: (depth: number) => void;
  setCurrentWaysHits: (hits: WaysHit[]) => void;
  setScattersCount: (count: number) => void;
  setRipple: (ripple: Partial<RippleState>) => void;
  setIsOverdriveActive: (active: boolean) => void;
}

export interface FreeSpinsActions {
  setIsActive: (active: boolean) => void;
  setRemaining: (remaining: number) => void;
  setTotal: (total: number) => void;
  setAccumulatedWin: (win: number) => void;
}

export interface WalletActions {
  setBalance: (balance: number) => void;
  setBalanceLoaded: (loaded: boolean) => void;
  setCurrentWin: (win: number) => void;
  setDisplayedWin: (win: number) => void;
  setIsBalancePulsing: (pulsing: boolean) => void;
  setLastAddedWin: (win: number) => void;
  setLastSpinWin: (win: number) => void;
  setTotalBetsPlaced: (total: number) => void;
  optimisticDebit: (amount: number) => void;
}

export interface VaultActions {
  setBalance: (balance: number) => void;
  setTotalDeposited: (total: number) => void;
  setTotalHarvested: (total: number) => void;
  setTransactions: (txs: VaultTransaction[]) => void;
  addTransaction: (tx: VaultTransaction) => void;
  setDepositAnimKey: (key: number) => void;
}

export interface TournamentActions {
  setData: (data: Partial<TournamentState>) => void;
}

export interface JackpotActions {
  setValue: (value: number) => void;
  setHasIncrement: (has: boolean) => void;
}

export interface BoostActions {
  setData: (data: Partial<BoostState>) => void;
}

export interface SessionActions {
  setIsMuted: (muted: boolean) => void;
  setIsTurbo: (turbo: boolean) => void;
  setAutoSpinsRemaining: (count: number) => void;
  setCurrentBet: (bet: number) => void;
}

export interface UIActions {
  setModal: (modal: keyof UIState, open: boolean) => void;
  setCelebrationWinAmount: (amount: number) => void;
  setScreenShakeClass: (cls: string) => void;
  setAwardedSpinsCount: (count: number) => void;
}

export interface HistoryActions {
  addItem: (item: SpinHistoryItem) => void;
  clear: () => void;
}

// ─── Default State Values ────────────────────────────────────────────────────

export const DEFAULT_GAME_CORE: GameCoreState = {
  gameMode: 'deluxe',
  grid: [],
  spinningColumns: [false, false, false, false, false],
  isSpinning: false,
  comboMultiplier: 1,
  spinCount: 0,
  cascadeDepth: 0,
  currentWaysHits: [],
  scattersCount: 0,
  ripple: { columns: [], cells: [], triggerKey: 0 },
  isOverdriveActive: false,
};

export const DEFAULT_FREE_SPINS: FreeSpinsState = {
  isActive: false,
  remaining: 0,
  total: 0,
  accumulatedWin: 0,
};

export const DEFAULT_WALLET: WalletState = {
  balance: 0,
  balanceLoaded: false,
  currentWin: 0,
  displayedWin: 0,
  isBalancePulsing: false,
  lastAddedWin: 0,
  lastSpinWin: 0,
  totalBetsPlaced: 0,
};

export const DEFAULT_VAULT: VaultState = {
  balance: 0,
  totalDeposited: 0,
  totalHarvested: 0,
  nextUnlockTimestamp: 0,
  lockedProfitRate: 0.05,
  transactions: [],
  depositAnimKey: 0,
};

export const DEFAULT_TOURNAMENT: TournamentState = {
  id: '',
  title: '',
  prizePool: 0,
  firstPrize: 0,
  endsInSeconds: 0,
  playerRank: 0,
  playerScore: 0,
  activeParticipants: 0,
  entries: [],
};

export const DEFAULT_JACKPOT: JackpotState = {
  value: 128450.0,
  hasIncrement: false,
};

export const DEFAULT_BOOST: BoostState = {
  isActive: false,
  daysRemaining: 0,
  hoursRemaining: 0,
  pointsMultiplier: 1.0,
  loyaltyPoints: 0,
  nextTierPoints: 5000,
  vipTier: 'Bronze',
};

export const DEFAULT_SESSION: SessionState = {
  isMuted: false,
  isTurbo: false,
  autoSpinsRemaining: 0,
  currentBet: 10,
};

export const DEFAULT_UI: UIState = {
  isMenuOpen: false,
  isBuyBonusOpen: false,
  isFreeSpinsIntroOpen: false,
  awardedSpinsCount: 10,
  isFreeSpinsSummaryOpen: false,
  isPaytableOpen: false,
  isHistoryOpen: false,
  isSettingsOpen: false,
  isBetSelectorOpen: false,
  isAutoplayModalOpen: false,
  isVaultOpen: false,
  isTournamentOpen: false,
  isVIPClubOpen: false,
  isWithdrawalInterceptOpen: false,
  isJackpotOpen: false,
  celebrationWinAmount: 0,
  screenShakeClass: '',
};

export const DEFAULT_HISTORY: HistoryState = {
  items: [],
};
