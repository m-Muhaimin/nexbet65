import { create } from 'zustand';
import type { SessionState } from './types';
import { DEFAULT_SESSION } from './types';

interface SessionStore extends SessionState {
  setIsMuted: (muted: boolean) => void;
  setIsTurbo: (turbo: boolean) => void;
  setAutoSpinsRemaining: (count: number) => void;
  decrementAutoSpins: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  ...DEFAULT_SESSION,

  setIsMuted: (isMuted) => set({ isMuted }),
  setIsTurbo: (isTurbo) => set({ isTurbo }),
  setAutoSpinsRemaining: (autoSpinsRemaining) => set({ autoSpinsRemaining }),
  decrementAutoSpins: () => set((s) => ({
    autoSpinsRemaining: Math.max(0, s.autoSpinsRemaining - 1),
  })),
}));
