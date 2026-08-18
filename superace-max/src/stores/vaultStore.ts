import { create } from 'zustand';
import type { VaultState, VaultTransaction } from './types';
import { DEFAULT_VAULT } from './types';

interface VaultStore extends VaultState {
  setBalance: (balance: number) => void;
  setTotalDeposited: (total: number) => void;
  setTotalHarvested: (total: number) => void;
  setTransactions: (txs: VaultTransaction[]) => void;
  addTransaction: (tx: VaultTransaction) => void;
  setDepositAnimKey: (key: number) => void;
  updateFromGameState: (vaultBalance: number, vaultHarvested: number) => void;
}

export const useVaultStore = create<VaultStore>((set) => ({
  ...DEFAULT_VAULT,

  setBalance: (balance) => set({ balance }),
  setTotalDeposited: (totalDeposited) => set({ totalDeposited }),
  setTotalHarvested: (totalHarvested) => set({ totalHarvested }),
  setTransactions: (transactions) => set({ transactions }),
  addTransaction: (tx) => set((s) => ({
    transactions: [tx, ...s.transactions],
  })),
  setDepositAnimKey: (depositAnimKey) => set({ depositAnimKey }),
  updateFromGameState: (vaultBalance, vaultHarvested) => set((s) => ({
    balance: vaultBalance,
    totalDeposited: vaultBalance + vaultHarvested,
    totalHarvested: vaultHarvested,
  })),
}));
