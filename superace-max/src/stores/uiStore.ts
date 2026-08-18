import { create } from 'zustand';
import type { UIState } from './types';
import { DEFAULT_UI } from './types';

type ModalKey = Exclude<keyof UIState, 'celebrationWinAmount' | 'screenShakeClass' | 'awardedSpinsCount'>;

interface UIStore extends UIState {
  setModal: (modal: ModalKey, open: boolean) => void;
  setCelebrationWinAmount: (amount: number) => void;
  setScreenShakeClass: (cls: string) => void;
  setAwardedSpinsCount: (count: number) => void;
  closeAllModals: () => void;
  isAnyModalOpen: () => boolean;
}

export const useUIStore = create<UIStore>((set, get) => ({
  ...DEFAULT_UI,

  setModal: (modal, open) => set({ [modal]: open } as any),
  setCelebrationWinAmount: (celebrationWinAmount) => set({ celebrationWinAmount }),
  setScreenShakeClass: (screenShakeClass) => set({ screenShakeClass }),
  setAwardedSpinsCount: (awardedSpinsCount) => set({ awardedSpinsCount }),
  closeAllModals: () => set({
    isMenuOpen: false,
    isBuyBonusOpen: false,
    isFreeSpinsIntroOpen: false,
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
  }),
  isAnyModalOpen: () => {
    const s = get();
    return (
      s.isMenuOpen ||
      s.isBuyBonusOpen ||
      s.isFreeSpinsIntroOpen ||
      s.isFreeSpinsSummaryOpen ||
      s.isPaytableOpen ||
      s.isHistoryOpen ||
      s.isSettingsOpen ||
      s.isBetSelectorOpen ||
      s.isAutoplayModalOpen ||
      s.isVaultOpen ||
      s.isTournamentOpen ||
      s.isVIPClubOpen ||
      s.isWithdrawalInterceptOpen ||
      s.isJackpotOpen
    );
  },
}));
