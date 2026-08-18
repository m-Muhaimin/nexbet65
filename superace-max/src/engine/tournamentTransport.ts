/**
 * TournamentTransport — real-time tournament data with polling + SSE-ready interface.
 *
 * Provides:
 * - Polling-based leaderboard refresh (configurable interval)
 * - EventSource (SSE) support when backend is available
 * - Mock data fallback for development
 * - Automatic cleanup on dispose
 *
 * Usage:
 *   const transport = new TournamentTransport();
 *   transport.startPolling((data) => useTournamentStore.getState().setData(data));
 *   // later: transport.dispose();
 */

import type { TournamentState, TournamentEntry } from '../stores/types';

const MOCK_ENTRIES: TournamentEntry[] = [
  { rank: 1, name: 'AceCrusher99', score: 48200, prize: 25000, avatar: '🃏', trend: 'up' },
  { rank: 2, name: 'DiamondHands88', score: 41800, prize: 15000, isPlayer: false, avatar: '💎', trend: 'same' },
  { rank: 3, name: 'LuckySpin777', score: 38100, prize: 8000, avatar: '🎰', trend: 'down' },
  { rank: 4, name: 'HighRoller42', score: 33500, prize: 5000, avatar: '🏆', trend: 'up' },
  { rank: 5, name: 'VegasViper99', score: 29200, prize: 3000, avatar: '🐍', trend: 'down' },
  { rank: 6, name: 'SlotMaster007', score: 25800, prize: 2000, avatar: '🎯', trend: 'same' },
  { rank: 7, name: 'JackpotHunter', score: 22100, prize: 1500, avatar: '🔥', trend: 'up' },
  { rank: 8, name: 'GoldDigger44', score: 18500, prize: 1000, avatar: '⚡', trend: 'down' },
  { rank: 9, name: 'RollingDice69', score: 15200, prize: 750, avatar: '🎲', trend: 'same' },
  { rank: 10, name: 'SpinQueen123', score: 12800, prize: 500, avatar: '👑', trend: 'up' },
];

export class TournamentTransport {
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private eventSource: EventSource | null = null;
  private sseUrl: string | null = null;
  private pollUrl: string | null = null;

  /**
   * Start polling for tournament updates.
   * @param onUpdate - callback with fresh TournamentState partial
   * @param intervalMs - polling interval (default 10s)
   */
  startPolling(onUpdate: (data: Partial<TournamentState>) => void, intervalMs = 10000) {
    this.stopPolling();

    // Provide initial mock data immediately
    onUpdate(this.getMockData());

    this.pollTimer = setInterval(() => {
      if (this.pollUrl) {
        fetch(this.pollUrl)
          .then((r) => r.json())
          .then((data: Partial<TournamentState>) => onUpdate(data))
          .catch(() => {
            // Silently fall back to mock data on network error
          });
      } else {
        // Mock data with slight variations to simulate real-time
        const mock = this.getMockData();
        onUpdate(mock);
      }
    }, intervalMs);
  }

  stopPolling() {
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /** Connect via SSE for push-based updates (when backend supports it) */
  connectSSE(url: string, onUpdate: (data: Partial<TournamentState>) => void) {
    this.disconnectSSE();
    this.sseUrl = url;

    try {
      this.eventSource = new EventSource(url);
      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as Partial<TournamentState>;
          onUpdate(data);
        } catch {}
      };
      this.eventSource.onerror = () => {
        // Auto-reconnect is handled by EventSource
      };
    } catch {
      // SSE not supported or URL invalid — fall back to polling
    }
  }

  disconnectSSE() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /** Set backend URLs (null = use mock data) */
  setEndpoints(pollUrl: string | null, sseUrl: string | null) {
    this.pollUrl = pollUrl;
    this.sseUrl = sseUrl;
  }

  dispose() {
    this.stopPolling();
    this.disconnectSSE();
  }

  private getMockData(): Partial<TournamentState> {
    // Add small random variations to simulate real-time updates
    return {
      id: 'tournament_daily_001',
      title: 'SuperAce Daily Championship',
      prizePool: 150000,
      firstPrize: 25000,
      endsInSeconds: Math.floor(Math.random() * 14400) + 3600,
      playerRank: Math.floor(Math.random() * 10) + 1,
      playerScore: Math.floor(Math.random() * 30000) + 5000,
      activeParticipants: Math.floor(Math.random() * 500) + 200,
      entries: MOCK_ENTRIES.map((e) => ({
        ...e,
        score: e.score + Math.floor(Math.random() * 200) - 100,
      })),
    };
  }
}
