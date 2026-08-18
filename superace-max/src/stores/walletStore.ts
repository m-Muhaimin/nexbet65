import { create } from 'zustand';
import type { WalletState } from './types';
import { DEFAULT_WALLET } from './types';

interface WalletStore extends WalletState {
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

export const useWalletStore = create<WalletStore>((set) => ({
  ...DEFAULT_WALLET,

  setBalance: (balance) => set({ balance }),
  setBalanceLoaded: (balanceLoaded) => set({ balanceLoaded }),
  setCurrentWin: (currentWin) => set({ currentWin }),
  setDisplayedWin: (displayedWin) => set({ displayedWin }),
  setIsBalancePulsing: (isBalancePulsing) => set({ isBalancePulsing }),
  setLastAddedWin: (lastAddedWin) => set({ lastAddedWin }),
  setLastSpinWin: (lastSpinWin) => set({ lastSpinWin }),
  setTotalBetsPlaced: (totalBetsPlaced) => set({ totalBetsPlaced }),
  optimisticDebit: (amount) => set((s) => ({
    balance: Number((s.balance - amount).toFixed(2)),
  })),
}));
