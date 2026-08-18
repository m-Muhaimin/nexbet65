/**
 * PlatformBridge — postMessage API for iframe ↔ parent communication.
 *
 * The game runs in an iframe and communicates with the parent (NexBet platform)
 * via postMessage. The parent controls the wallet and settlement.
 *
 * Protocol:
 *   Parent → Game:
 *     { type: "SESSION_TOKEN", token: string, sessionId: string }
 *     { type: "BALANCE_UPDATE", balance: number }
 *
 *   Game → Parent:
 *     { type: "GAME_READY" }
 *     { type: "BET_PLACED", amount: number, ref: string }
 *     { type: "WIN_RECEIVED", amount: number, ref: string }
 *     { type: "REQUEST_BALANCE" }
 */

export type BridgeMessage =
  | { type: "SESSION_TOKEN"; token: string; sessionId: string }
  | { type: "BALANCE_UPDATE"; balance: number }
  | { type: "GAME_READY" }
  | { type: "BET_PLACED"; amount: number; ref: string }
  | { type: "WIN_RECEIVED"; amount: number; ref: string }
  | { type: "REQUEST_BALANCE" };

type BridgeCallback = (message: BridgeMessage) => void;

class PlatformBridge {
  private listeners: BridgeCallback[] = [];
  private sessionToken: string | null = null;
  private sessionId: string | null = null;
  private balance: number = 0;
  private isReady: boolean = false;
  private pendingBalanceResolvers: ((balance: number) => void)[] = [];

  constructor() {
    this.init();
  }

  private init() {
    window.addEventListener("message", (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data.type !== "string") return;

      // Only accept messages from same origin
      if (event.origin !== window.location.origin) return;

      const message = data as BridgeMessage;

      switch (message.type) {
        case "SESSION_TOKEN":
          this.sessionToken = message.token;
          this.sessionId = message.sessionId;
          this.notifyListeners(message);
          break;

        case "BALANCE_UPDATE":
          this.balance = message.balance;
          // Resolve any pending balance requests
          this.pendingBalanceResolvers.forEach((resolve) => resolve(message.balance));
          this.pendingBalanceResolvers = [];
          this.notifyListeners(message);
          break;
      }
    });
  }

  private notifyListeners(message: BridgeMessage) {
    this.listeners.forEach((cb) => cb(message));
  }

  /**
   * Subscribe to bridge messages.
   * Returns an unsubscribe function.
   */
  onMessage(callback: BridgeCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Notify the parent that the game is ready.
   */
  gameReady() {
    this.isReady = true;
    window.parent.postMessage({ type: "GAME_READY" }, window.location.origin);
  }

  /**
   * Notify the parent that a bet was placed.
   * The parent will call /api/game/settle and update the wallet.
   */
  betPlaced(amount: number, ref: string) {
    window.parent.postMessage(
      { type: "BET_PLACED", amount, ref },
      window.location.origin
    );
  }

  /**
   * Notify the parent that a win was received.
   * The parent will call /api/game/settle and update the wallet.
   */
  winReceived(amount: number, ref: string) {
    window.parent.postMessage(
      { type: "WIN_RECEIVED", amount, ref },
      window.location.origin
    );
  }

  /**
   * Sync authoritative balance to parent platform for UI display.
   * The spin endpoint already handled settlement — this is just for UI sync.
   */
  syncBalance(balance: number) {
    this.balance = balance;
    window.parent.postMessage(
      { type: "BALANCE_UPDATE", balance },
      window.location.origin
    );
  }

  /**
   * Request current balance from the parent.
   * Returns a promise that resolves when the parent responds.
   */
  requestBalance(): Promise<number> {
    return new Promise((resolve) => {
      this.pendingBalanceResolvers.push(resolve);
      window.parent.postMessage(
        { type: "REQUEST_BALANCE" },
        window.location.origin
      );
      // Timeout after 3 seconds
      setTimeout(() => resolve(this.balance), 3000);
    });
  }

  /**
   * Get the current session token.
   */
  getSessionToken(): string | null {
    return this.sessionToken;
  }

  /**
   * Get the current session ID.
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Get the cached balance.
   */
  getBalance(): number {
    return this.balance;
  }

  /**
   * Check if the bridge has a valid session token.
   */
  hasSession(): boolean {
    return this.sessionToken !== null;
  }
}

// Singleton instance
export const bridge = new PlatformBridge();
