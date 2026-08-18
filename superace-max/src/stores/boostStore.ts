import { create } from 'zustand';
import type { BoostState } from './types';
import { DEFAULT_BOOST } from './types';

interface BoostStore extends BoostState {
  setData: (data: Partial<BoostState>) => void;
  decrementHour: () => void;
}

export const useBoostStore = create<BoostStore>((set) => ({
  ...DEFAULT_BOOST,

  setData: (data) => set((s) => ({ ...s, ...data })),
  decrementHour: () => set((s) => {
    if (!s.isActive) return s;
    let h = s.hoursRemaining - 1;
    let d = s.daysRemaining;
    if (h < 0) {
      h = 23;
      d = Math.max(0, d - 1);
    }
    return {
      ...s,
      daysRemaining: d,
      hoursRemaining: h,
      isActive: d > 0 || h > 0,
    };
  }),
}));
