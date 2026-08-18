type EventName = 'spin_start' | 'spin_complete' | 'bet_change' | 'bonus_buy' | 'free_spins_trigger' | 'big_win' | 'session_start' | 'error';

interface AnalyticsEvent {
  event: EventName;
  timestamp: number;
  data?: Record<string, unknown>;
}

const queue: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL_MS = 30_000;
const MAX_QUEUE = 200;

function flush(): void {
  if (queue.length === 0) return;
  const batch = queue.splice(0, queue.length);
  try {
    navigator.sendBeacon('/api/analytics', new Blob(
      [JSON.stringify(batch)],
      { type: 'application/json' },
    ));
  } catch {
    // silent — analytics should never block gameplay
  }
}

function scheduleFlush(): void {
  if (flushTimer !== null) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, FLUSH_INTERVAL_MS);
}

export function track(event: EventName, data?: Record<string, unknown>): void {
  queue.push({ event, timestamp: Date.now(), data });
  if (queue.length >= MAX_QUEUE) {
    if (flushTimer !== null) { clearTimeout(flushTimer); flushTimer = null; }
    flush();
  } else {
    scheduleFlush();
  }
}

export function flushNow(): void {
  if (flushTimer !== null) { clearTimeout(flushTimer); flushTimer = null; }
  flush();
}

export function getQueueSize(): number {
  return queue.length;
}

export function resetForTesting(): void {
  if (flushTimer !== null) { clearTimeout(flushTimer); flushTimer = null; }
  queue.splice(0, queue.length);
}
