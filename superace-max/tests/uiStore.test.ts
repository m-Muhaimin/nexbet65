import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../src/stores/uiStore';
import { DEFAULT_UI } from '../src/stores/types';

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.setState({ ...DEFAULT_UI });
  });

  it('has correct initial state', () => {
    const state = useUIStore.getState();
    expect(state.isMenuOpen).toBe(false);
    expect(state.isSettingsOpen).toBe(false);
    expect(state.isPaytableOpen).toBe(false);
    expect(state.isFreeSpinsIntroOpen).toBe(false);
    expect(state.isFreeSpinsSummaryOpen).toBe(false);
    expect(state.isBuyBonusOpen).toBe(false);
    expect(state.isHistoryOpen).toBe(false);
    expect(state.isJackpotOpen).toBe(false);
    expect(state.isVaultOpen).toBe(false);
    expect(state.isTournamentOpen).toBe(false);
    expect(state.isVIPClubOpen).toBe(false);
    expect(state.isWithdrawalInterceptOpen).toBe(false);
    expect(state.celebrationWinAmount).toBe(0);
    expect(state.screenShakeClass).toBe('');
  });

  it('setModal opens and closes modals correctly', () => {
    useUIStore.getState().setModal('isMenuOpen', true);
    expect(useUIStore.getState().isMenuOpen).toBe(true);

    useUIStore.getState().setModal('isMenuOpen', false);
    expect(useUIStore.getState().isMenuOpen).toBe(false);
  });

  it('setScreenShakeClass updates correctly', () => {
    useUIStore.getState().setScreenShakeClass('animate-shake-big');
    expect(useUIStore.getState().screenShakeClass).toBe('animate-shake-big');
  });

  it('setCelebrationWinAmount updates correctly', () => {
    useUIStore.getState().setCelebrationWinAmount(500);
    expect(useUIStore.getState().celebrationWinAmount).toBe(500);
  });

  it('closeAllModals resets all modals', () => {
    useUIStore.getState().setModal('isMenuOpen', true);
    useUIStore.getState().setModal('isVaultOpen', true);
    useUIStore.getState().closeAllModals();
    expect(useUIStore.getState().isMenuOpen).toBe(false);
    expect(useUIStore.getState().isVaultOpen).toBe(false);
  });

  it('isAnyModalOpen detects open modals', () => {
    expect(useUIStore.getState().isAnyModalOpen()).toBe(false);
    useUIStore.getState().setModal('isMenuOpen', true);
    expect(useUIStore.getState().isAnyModalOpen()).toBe(true);
  });
});
