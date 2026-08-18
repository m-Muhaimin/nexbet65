import { create } from 'zustand';
import type { HistoryState, SpinHistoryItem } from './types';
import { DEFAULT_HISTORY } from './types';

interface HistoryStore extends HistoryState {
  addItem: (item: SpinHistoryItem) => void;
  clear: () => void;
  setItems: (items: SpinHistoryItem[]) => void;
}

const MAX_HISTORY = 50;

export const useHistoryStore = create<HistoryStore>((set) => ({
  ...DEFAULT_HISTORY,

  addItem: (item) => set((s) => ({
    items: [item, ...s.items].slice(0, MAX_HISTORY),
  })),
  clear: () => set({ items: [] }),
  setItems: (items) => set({ items }),
}));
