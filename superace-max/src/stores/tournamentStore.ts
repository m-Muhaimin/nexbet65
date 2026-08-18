import { create } from 'zustand';
import type { TournamentState } from './types';
import { DEFAULT_TOURNAMENT } from './types';

interface TournamentStore extends TournamentState {
  setData: (data: Partial<TournamentState>) => void;
}

export const useTournamentStore = create<TournamentStore>((set) => ({
  ...DEFAULT_TOURNAMENT,

  setData: (data) => set((s) => ({ ...s, ...data })),
}));
