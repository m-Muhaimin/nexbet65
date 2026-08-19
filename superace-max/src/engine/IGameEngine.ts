/**
 * IGameEngine — formal interface for the game engine contract.
 *
 * All game operations go through this interface. The client adapter
 * implements it by calling the server API + triggering animations.
 * This makes the engine swappable — a different backend, a mock engine
 * for tests, or a WebSocket-based engine could all implement this.
 */

import type { GameMode } from '../types';

/** Parameters for a single spin request. */
export interface SpinParams {
  bet: number;
  gameMode: GameMode;
  isBonusBuy: boolean;
  isDeluxeBonusBuy: boolean;
  freeSpinsActive: boolean;
  freeSpinsRemaining: number;
  spinIndex: number;
}

/** Raw spin result from the server (before visual grid building). */
export interface SpinServerResult {
  spinId: string;
  grid: any[][];
  finalGrid?: any[][];
  cascades: any[];
  totalWin: number;
  balance: number;
  scattersCount: number;
  freeSpinsAwarded: number;
  megaSymbols?: any[];
  jackpotTeaserTriggered?: boolean;
  jackpotTeaserAmount?: number;
  gameState?: {
    vaultBalance: number;
    vaultHarvested: number;
    loyaltyPoints: number;
    vipTier: string;
    totalBets: number;
    spinCount: number;
    freeSpinsLeft?: number;
    freeSpinsTotal?: number;
  };
}

/** Game state snapshot persisted between sessions. */
export interface GameStateSnapshot {
  gameMode: string;
  isMuted: boolean;
  isTurbo: boolean;
  betAmount: number;
  freeSpinsLeft: number;
  freeSpinsTotal: number;
  freeSpinsWin: number;
  totalBets: number;
  spinCount: number;
  vaultBalance: number;
  vaultHarvested: number;
  loyaltyPoints: number;
  vipTier: string;
}

/** Partial state updates accepted by saveGameState. */
export interface GameStatePatch {
  gameMode?: GameMode;
  isMuted?: boolean;
  isTurbo?: boolean;
  betAmount?: number;
  freeSpinsLeft?: number;
  freeSpinsTotal?: number;
}

/**
 * The engine interface. Implementations handle:
 *   - Sending spin requests to the server
 *   - Fetching wallet balance
 *   - Loading/saving persistent game state
 */
export interface IGameEngine {
  /** Execute a spin on the server. Returns the raw result. */
  spin(params: SpinParams): Promise<SpinServerResult>;

  /** Fetch the current wallet balance from the server. */
  getBalance(): Promise<number>;

  /** Load the persisted game state snapshot. */
  loadState(): Promise<GameStateSnapshot | null>;

  /** Persist a partial game state update. */
  saveState(patch: GameStatePatch): Promise<void>;
}
