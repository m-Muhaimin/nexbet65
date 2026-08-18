import { describe, it, expect, beforeEach } from 'vitest';
import { useWalletStore } from '../src/stores/walletStore';
import { DEFAULT_WALLET } from '../src/stores/types';

describe('walletStore', () => {
  beforeEach(() => {
    useWalletStore.setState({ ...DEFAULT_WALLET });
  });

  it('has correct initial state', () => {
    const state = useWalletStore.getState();
    expect(state.balance).toBe(0);
    expect(state.lastSpinWin).toBe(0);
    expect(state.lastAddedWin).toBe(0);
  });

  it('setBalance updates balance correctly', () => {
    useWalletStore.getState().setBalance(1000);
    expect(useWalletStore.getState().balance).toBe(1000);
  });

  it('setLastSpinWin updates correctly', () => {
    useWalletStore.getState().setLastSpinWin(50);
    expect(useWalletStore.getState().lastSpinWin).toBe(50);
  });

  it('setLastAddedWin updates correctly', () => {
    useWalletStore.getState().setLastAddedWin(100);
    expect(useWalletStore.getState().lastAddedWin).toBe(100);
  });

  it('optimisticDebit reduces balance correctly', () => {
    useWalletStore.getState().setBalance(1000);
    useWalletStore.getState().optimisticDebit(50);
    expect(useWalletStore.getState().balance).toBe(950);
  });
});
