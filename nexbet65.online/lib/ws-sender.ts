import { toast } from "sonner";

const QUEUE_TTL_MS = 5000;

export interface SafeSender {
  send: (msg: unknown, label?: string) => boolean;
  markOpen: () => void;
  markClosed: () => void;
  sync: () => void;
  dispose: () => void;
}

/**
 * Safe WebSocket send helper. Never fire-and-forget into a dead socket:
 * - sends immediately only when the socket is OPEN;
 * - otherwise keeps a one-slot queue, flushes it on `onopen`, drops it after
 *   5s, and surfaces a "Reconnecting…" state + toast so the UI can't lie.
 */
export function createSafeSender(opts: {
  getWs: () => WebSocket | null;
  onStatusChange: (connected: boolean) => void;
}): SafeSender {
  let connected = false;
  let queued: { msg: string; label: string; at: number } | null = null;
  let queueTimer: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;

  const setStatus = (c: boolean) => {
    if (connected !== c) {
      connected = c;
      opts.onStatusChange(c);
    }
  };

  const clearQueueTimer = () => {
    if (queueTimer) {
      clearTimeout(queueTimer);
      queueTimer = null;
    }
  };

  const dropQueue = () => {
    clearQueueTimer();
    queued = null;
  };

  const flush = () => {
    if (disposed || !queued) return false;
    const ws = opts.getWs();
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    const m = queued;
    queued = null;
    clearQueueTimer();
    try {
      ws.send(m.msg);
      setStatus(true);
      return true;
    } catch {
      queued = m;
      return false;
    }
  };

  const queue = (msg: string, label: string) => {
    dropQueue();
    queued = { msg, label, at: Date.now() };
    queueTimer = setTimeout(() => {
      if (queued) {
        toast.error(`Not connected — ${queued.label} could not be sent`);
        dropQueue();
      }
    }, QUEUE_TTL_MS);
  };

  return {
    send(msg, label = "action") {
      const ws = opts.getWs();
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(typeof msg === "string" ? msg : JSON.stringify(msg));
          setStatus(true);
          return true;
        } catch {
          // fall through to queueing
        }
      }
      queue(typeof msg === "string" ? msg : JSON.stringify(msg), label);
      setStatus(false);
      toast.error("Not connected — retrying…");
      return false;
    },
    markOpen() {
      flush();
      setStatus(true);
    },
    markClosed() {
      setStatus(false);
    },
    sync() {
      if (disposed) return;
      const ws = opts.getWs();
      const open = !!ws && ws.readyState === WebSocket.OPEN;
      if (open) {
        flush();
        setStatus(true);
      } else {
        setStatus(false);
      }
    },
    dispose() {
      disposed = true;
      clearQueueTimer();
      queued = null;
    },
  };
}
