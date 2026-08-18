import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { track, getQueueSize, flushNow, resetForTesting } from '../src/engine/analytics';

describe('analytics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('navigator', { sendBeacon: vi.fn(() => true) });
    resetForTesting();
  });

  afterEach(() => {
    resetForTesting();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('adds events to queue', () => {
    track('session_start', { viewport: { w: 1024, h: 768 } });
    expect(getQueueSize()).toBe(1);
  });

  it('flushes queue after flush interval', () => {
    track('spin_start', { bonusBuy: false });
    track('spin_complete', { totalWin: 50 });

    vi.advanceTimersByTime(30_000);

    expect(getQueueSize()).toBe(0);
    expect(navigator.sendBeacon).toHaveBeenCalled();
  });

  it('flushNow flushes immediately', () => {
    track('spin_start');
    track('spin_complete');
    expect(getQueueSize()).toBe(2);

    flushNow();
    expect(getQueueSize()).toBe(0);
  });
});
