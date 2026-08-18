/**
 * AnimationOrchestrator — typed event queue for sequenced animations.
 *
 * Replaces raw setTimeout chains with a inspectable, flushable,
 * speed-adjustable event queue. Each event carries its own delay
 * and payload; the orchestrator processes them sequentially.
 *
 * Features:
 *   - Flush (quick-stop) all pending events
 *   - Global speed multiplier (for turbo mode)
 *   - Event log for debugging
 *   - Typed payloads prevent runtime errors
 */

type EventPayload =
  | { type: 'delay'; ms: number }
  | { type: 'reelStop'; column: number }
  | { type: 'gridUpdate'; grid: any[] }
  | { type: 'gridUpdateRow'; col: number; cells: any[] }
  | { type: 'spinningColumns'; columns: boolean[] }
  | { type: 'sound'; fn: string; args: any[] }
  | { type: 'storeAction'; store: string; action: string; args: any[] }
  | { type: 'screenShake'; className: string }
  | { type: 'screenShakeClear'; className: string }
  | { type: 'accumulatorUpdate'; winAmount: number }
  | { type: 'multiplierUpdate'; multiplier: number }
  | { type: 'waysHitsUpdate'; hits: any[] }
  | { type: 'rippleUpdate'; columns: number[]; cells: any[]; triggerKey: number }
  | { type: 'flagSet'; key: string; value: boolean | number }
  | { type: 'custom'; fn: () => void };

interface QueueEntry {
  payload: EventPayload;
  delayMs: number;
}

export class AnimationOrchestrator {
  private queue: QueueEntry[] = [];
  private flushing = false;
  private speedMultiplier = 1;
  private eventLog: EventPayload[] = [];
  private onEvent?: (payload: EventPayload) => void;

  constructor(options?: { onEvent?: (payload: EventPayload) => void }) {
    this.onEvent = options?.onEvent;
  }

  public setSpeed(multiplier: number) {
    this.speedMultiplier = Math.max(0.1, multiplier);
  }

  public enqueue(payload: EventPayload, delayMs: number = 0) {
    this.queue.push({ payload, delayMs });
  }

  public enqueueAll(entries: QueueEntry[]) {
    this.queue.push(...entries);
  }

  public clear() {
    this.queue = [];
  }

  /**
   * Flush all pending events instantly (quick-stop).
   * Each event is dispatched without its delay.
   */
  public async flush(): Promise<void> {
    this.flushing = true;
    while (this.queue.length > 0) {
      const entry = this.queue.shift()!;
      this.dispatchEvent(entry.payload);
    }
    this.flushing = false;
  }

  /**
   * Process the entire queue sequentially, respecting delays.
   * Respects the flushing flag — set flushing=true to abort.
   */
  public async process(): Promise<void> {
    while (this.queue.length > 0 && !this.flushing) {
      const entry = this.queue.shift()!;
      const actualDelay = entry.delayMs * this.speedMultiplier;

      if (actualDelay > 0 && entry.payload.type === 'delay') {
        await this.delay(actualDelay);
      } else if (actualDelay > 0 && !this.flushing) {
        await this.delay(actualDelay);
      }

      if (!this.flushing) {
        this.dispatchEvent(entry.payload);
      }
    }
  }

  /**
   * Wait for a duration, but return immediately if flushing is set.
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      if (this.flushing || this.speedMultiplier === 0) {
        resolve();
        return;
      }
      const timer = setTimeout(resolve, ms);
      const check = setInterval(() => {
        if (this.flushing) {
          clearTimeout(timer);
          clearInterval(check);
          resolve();
        }
      }, 10);
      // Auto-cleanup
      const cleanup = () => { clearInterval(check); };
      setTimeout(cleanup, ms + 100);
    });
  }

  private dispatchEvent(payload: EventPayload) {
    this.eventLog.push(payload);
    this.onEvent?.(payload);
  }

  public getLog(): EventPayload[] {
    return [...this.eventLog];
  }

  public clearLog() {
    this.eventLog = [];
  }

  public get queueLength(): number {
    return this.queue.length;
  }
}

/**
 * Convenience builder for common animation sequences.
 */
export function buildReelStopSequence(
  grid: any[],
  spinningColumns: boolean[],
  stopDelayMs: number,
  onGridUpdate: (grid: any[]) => void,
  onColsUpdate: (cols: boolean[]) => void,
  onSound: (fn: string, ...args: any[]) => void,
): QueueEntry[] {
  const entries: QueueEntry[] = [];
  const cols = [...spinningColumns];

  for (let c = 0; c < 5; c++) {
    if (cols[c]) {
      const col = c;
      entries.push({
        payload: { type: 'delay', ms: stopDelayMs },
        delayMs: stopDelayMs,
      });
      entries.push({
        payload: { type: 'gridUpdateRow', col, cells: grid[col] },
        delayMs: 0,
      });
      entries.push({
        payload: { type: 'reelStop', column: col },
        delayMs: 0,
      });
    }
  }

  return entries;
}
