import { describe, it, expect } from 'vitest';
import { SYMBOLS, REEL_WEIGHTS, REEL_WEIGHTS_DELUXE, MULTIPLIER_BASE_DELUXE, MULTIPLIER_FREE_DELUXE } from '../src/utils/symbols';

describe('symbols', () => {
  it('has all symbol types defined', () => {
    const requiredSymbols = ['A', 'K', 'Q', 'J', 'S', 'G', 'JK', 'SC'];
    for (const sym of requiredSymbols) {
      expect(SYMBOLS).toHaveProperty(sym);
    }
  });

  it('each symbol has correct shape', () => {
    for (const [key, sym] of Object.entries(SYMBOLS)) {
      expect(sym.type).toBe(key);
      expect(typeof sym.name).toBe('string');
      expect(typeof sym.payouts).toBe('object');
      expect(typeof sym.payouts[3]).toBe('number');
      expect(typeof sym.payouts[4]).toBe('number');
      expect(typeof sym.payouts[5]).toBe('number');
    }
  });

  it('payouts increase with match count', () => {
    for (const sym of Object.values(SYMBOLS)) {
      expect(sym.payouts[5]).toBeGreaterThan(sym.payouts[4]);
      expect(sym.payouts[4]).toBeGreaterThan(sym.payouts[3]);
    }
  });

  it('reel weights sum to > 0', () => {
    const sum = Object.values(REEL_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeGreaterThan(0);
  });

  it('deluxe reel weights sum to > 0', () => {
    const sum = Object.values(REEL_WEIGHTS_DELUXE).reduce((a, b) => a + b, 0);
    expect(sum).toBeGreaterThan(0);
  });

  it('deluxe multipliers have 5 steps', () => {
    expect(MULTIPLIER_BASE_DELUXE).toHaveLength(5);
    expect(MULTIPLIER_FREE_DELUXE).toHaveLength(5);
  });

  it('deluxe multipliers are strictly increasing', () => {
    for (let i = 1; i < MULTIPLIER_BASE_DELUXE.length; i++) {
      expect(MULTIPLIER_BASE_DELUXE[i]).toBeGreaterThan(MULTIPLIER_BASE_DELUXE[i - 1]);
    }
    for (let i = 1; i < MULTIPLIER_FREE_DELUXE.length; i++) {
      expect(MULTIPLIER_FREE_DELUXE[i]).toBeGreaterThan(MULTIPLIER_FREE_DELUXE[i - 1]);
    }
  });
});
