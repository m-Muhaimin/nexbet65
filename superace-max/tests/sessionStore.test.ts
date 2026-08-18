import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from '../src/stores/sessionStore';
import { DEFAULT_SESSION } from '../src/stores/types';

describe('sessionStore', () => {
  beforeEach(() => {
    useSessionStore.setState({ ...DEFAULT_SESSION });
  });

  it('has correct initial state', () => {
    const state = useSessionStore.getState();
    expect(state.isTurbo).toBe(false);
    expect(state.autoSpinsRemaining).toBe(0);
  });

  it('setIsTurbo toggles correctly', () => {
    useSessionStore.getState().setIsTurbo(true);
    expect(useSessionStore.getState().isTurbo).toBe(true);

    useSessionStore.getState().setIsTurbo(false);
    expect(useSessionStore.getState().isTurbo).toBe(false);
  });

  it('setAutoSpinsRemaining updates correctly', () => {
    useSessionStore.getState().setAutoSpinsRemaining(50);
    expect(useSessionStore.getState().autoSpinsRemaining).toBe(50);
  });

  it('decrementAutoSpins decrements correctly', () => {
    useSessionStore.getState().setAutoSpinsRemaining(5);
    useSessionStore.getState().decrementAutoSpins();
    expect(useSessionStore.getState().autoSpinsRemaining).toBe(4);
  });

  it('decrementAutoSpins stops at 0', () => {
    useSessionStore.getState().setAutoSpinsRemaining(0);
    useSessionStore.getState().decrementAutoSpins();
    expect(useSessionStore.getState().autoSpinsRemaining).toBe(0);
  });
});
