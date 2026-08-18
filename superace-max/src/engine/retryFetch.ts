/**
 * retryFetch — wrapper around fetch with exponential backoff retry.
 *
 * Usage:
 *   const data = await retryFetch('/api/superace/spin', { method: 'POST', body: '...' });
 */

interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

export async function retryFetch<T = unknown>(
  url: string | URL | Request,
  init?: RequestInit,
  options: RetryOptions = {},
): Promise<T> {
  const { retries = 2, baseDelayMs = 300, maxDelayMs = 3000 } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, init);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return (await res.json()) as T;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries) {
        const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError;
}
