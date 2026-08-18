import { create } from 'zustand';
import type { GameCoreState, FreeSpinsState, RippleState, GameMode, GridCell, WaysHit } from './types';
import { DEFAULT_GAME_CORE, DEFAULT_FREE_SPINS } from './types';

interface GameState {
  game: GameCoreState;
  freeSpins: FreeSpinsState;
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
  resetSpinState: () => void;
  setFreeSpinsActive: (active: boolean) => void;
  setFreeSpinsRemaining: (remaining: number) => void;
  setFreeSpinsTotal: (total: number) => void;
  setFreeSpinsAccumulatedWin: (win: number) => void;
  resetFreeSpins: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  game: DEFAULT_GAME_CORE,
  freeSpins: DEFAULT_FREE_SPINS,

  setGameMode: (mode) => set((s) => ({ game: { ...s.game, gameMode: mode } })),
  setGrid: (grid) => set((s) => ({ game: { ...s.game, grid } })),
  setSpinningColumns: (spinningColumns) => set((s) => ({ game: { ...s.game, spinningColumns } })),
  setIsSpinning: (isSpinning) => set((s) => ({ game: { ...s.game, isSpinning } })),
  setComboMultiplier: (comboMultiplier) => set((s) => ({ game: { ...s.game, comboMultiplier } })),
  setSpinCount: (spinCount) => set((s) => ({ game: { ...s.game, spinCount } })),
  setCascadeDepth: (cascadeDepth) => set((s) => ({ game: { ...s.game, cascadeDepth } })),
  setCurrentWaysHits: (currentWaysHits) => set((s) => ({ game: { ...s.game, currentWaysHits } })),
  setScattersCount: (scattersCount) => set((s) => ({ game: { ...s.game, scattersCount } })),
  setRipple: (ripple) => set((s) => ({ game: { ...s.game, ripple: { ...s.game.ripple, ...ripple } } })),
  setIsOverdriveActive: (isOverdriveActive) => set((s) => ({ game: { ...s.game, isOverdriveActive } })),
  resetSpinState: () => set((s) => ({
    game: {
      ...s.game,
      spinningColumns: [false, false, false, false, false],
      isSpinning: false,
      comboMultiplier: s.freeSpins.isActive ? 2 : 1,
      cascadeDepth: 0,
      currentWaysHits: [],
      scattersCount: 0,
      ripple: { columns: [], cells: [], triggerKey: 0 },
      isOverdriveActive: false,
    },
  })),

  setFreeSpinsActive: (isActive) => set((s) => ({ freeSpins: { ...s.freeSpins, isActive } })),
  setFreeSpinsRemaining: (remaining) => set((s) => ({ freeSpins: { ...s.freeSpins, remaining } })),
  setFreeSpinsTotal: (total) => set((s) => ({ freeSpins: { ...s.freeSpins, total } })),
  setFreeSpinsAccumulatedWin: (accumulatedWin) => set((s) => ({ freeSpins: { ...s.freeSpins, accumulatedWin } })),
  resetFreeSpins: () => set((s) => ({
    freeSpins: {
      isActive: false,
      remaining: 0,
      total: 0,
      accumulatedWin: 0,
    },
  })),
}));
