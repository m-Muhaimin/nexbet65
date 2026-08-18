import { create } from 'zustand';
import type { JackpotState } from './types';
import { DEFAULT_JACKPOT } from './types';

interface JackpotStore extends JackpotState {
  setValue: (value: number) => void;
  setHasIncrement: (has: boolean) => void;
  incrementBy: (amount: number) => void;
}

export const useJackpotStore = create<JackpotStore>((set) => ({
  ...DEFAULT_JACKPOT,

  setValue: (value) => set({ value }),
  setHasIncrement: (hasIncrement) => set({ hasIncrement }),
  incrementBy: (amount) => set((s) => ({
    value: Number((s.value + amount).toFixed(2)),
  })),
}));
