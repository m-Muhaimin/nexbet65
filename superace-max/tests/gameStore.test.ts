import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../src/stores/gameStore';
import { DEFAULT_GAME_CORE, DEFAULT_FREE_SPINS } from '../src/stores/types';

describe('gameStore', () => {
  beforeEach(() => {
    useGameStore.setState({ game: { ...DEFAULT_GAME_CORE }, freeSpins: { ...DEFAULT_FREE_SPINS } });
  });

  it('has correct initial state', () => {
    const state = useGameStore.getState();
    expect(state.game.isSpinning).toBe(false);
    expect(state.freeSpins.remaining).toBe(0);
    expect(state.freeSpins.total).toBe(0);
    expect(state.game.comboMultiplier).toBe(1);
    expect(state.game.grid).toEqual([]);
  });

  it('setIsSpinning toggles correctly', () => {
    useGameStore.getState().setIsSpinning(true);
    expect(useGameStore.getState().game.isSpinning).toBe(true);

    useGameStore.getState().setIsSpinning(false);
    expect(useGameStore.getState().game.isSpinning).toBe(false);
  });

  it('setFreeSpinsRemaining updates correctly', () => {
    useGameStore.getState().setFreeSpinsTotal(10);
    useGameStore.getState().setFreeSpinsRemaining(10);
    expect(useGameStore.getState().freeSpins.remaining).toBe(10);
    expect(useGameStore.getState().freeSpins.total).toBe(10);
  });

  it('setComboMultiplier updates correctly', () => {
    useGameStore.getState().setComboMultiplier(5);
    expect(useGameStore.getState().game.comboMultiplier).toBe(5);
  });

  it('setGrid updates the grid', () => {
    const mockGrid: any[] = [
      ['A', 'K', 'Q', 'J', 'S'],
      ['K', 'A', 'J', 'Q', 'S'],
      ['Q', 'J', 'A', 'K', 'S'],
      ['J', 'S', 'K', 'A', 'Q'],
    ];
    useGameStore.getState().setGrid(mockGrid);
    expect(useGameStore.getState().game.grid).toEqual(mockGrid);
  });

  it('setGameMode updates correctly', () => {
    useGameStore.getState().setGameMode('classic');
    expect(useGameStore.getState().game.gameMode).toBe('classic');
  });
});
