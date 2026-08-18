"use client";

import { useEffect, useRef, useCallback, useState } from "react";

import { useWallet } from "@/lib/wallet-store";

/**
 * GameBridge — the bridge between the NexBet platform and the game iframe.
 *
 * This component:
 *   1. Generates a session token when the iframe loads
 *   2. Sends the token to the iframe via postMessage
 *   3. Listens for BET_PLACED and WIN_RECEIVED from the game
 *   4. Calls /api/game/settle to update the ledger
 *   5. Sends BALANCE_UPDATE back to the iframe
 *   6. Refreshes the platform wallet sidebar in real-time
 */

type BridgeMessage =
  | { type: "GAME_READY" }
  | { type: "BET_PLACED"; amount: number; ref: string }
  | { type: "WIN_RECEIVED"; amount: number; ref: string }
  | { type: "REQUEST_BALANCE" };

export function GameBridge({ gameId = "superace" }: { gameId?: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [token, setToken] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { balance, refresh } = useWallet();

  // Generate session token on mount
  useEffect(() => {
    let cancelled = false;

    async function createSession() {
      try {
        const res = await fetch("/api/game/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId }),
        });
        const data = await res.json();
        if (!cancelled && data.ok) {
          setToken(data.token);
          setSessionId(data.sessionId);
        }
      } catch (err) {
        console.error("Failed to create game session:", err);
      }
    }

    createSession();
    return () => { cancelled = true; };
  }, [gameId]);

  // Send token to iframe once it's ready
  const sendTokenToIframe = useCallback(() => {
    if (!token || !sessionId || !iframeRef.current?.contentWindow) return;

    iframeRef.current.contentWindow.postMessage(
      {
        type: "SESSION_TOKEN",
        token,
        sessionId,
      },
      window.location.origin
    );
  }, [token, sessionId]);

  // Handle messages from the game iframe
  const handleMessage = useCallback(
    async (event: MessageEvent) => {
      const data = event.data as BridgeMessage;
      if (!data || typeof data.type !== "string") return;
      if (event.origin !== window.location.origin) return;

      switch (data.type) {
        case "GAME_READY":
          // Game is loaded — send the session token
          sendTokenToIframe();
          break;

        case "BET_PLACED": {
          // Game placed a bet — settle it server-side
          try {
            const res = await fetch("/api/game/settle", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                token,
                type: "BET",
                amount: data.amount,
                ref: data.ref,
              }),
            });
            const result = await res.json();

            if (result.success) {
              // Send updated balance to the game
              sendBalanceToIframe(result.newBalance);
              // Also refresh the platform wallet sidebar
              await refresh();
            } else {
              console.error("Bet settle failed:", result.error);
              // Send error back to game
              sendErrorToIframe(result.error);
            }
          } catch (err) {
            console.error("Settle API error:", err);
            sendErrorToIframe("Network error");
          }
          break;
        }

        case "WIN_RECEIVED": {
          // Game won — credit it server-side
          try {
            const res = await fetch("/api/game/settle", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                token,
                type: "WIN",
                amount: data.amount,
                ref: data.ref,
              }),
            });
            const result = await res.json();

            if (result.success) {
              sendBalanceToIframe(result.newBalance);
              await refresh();
            } else {
              console.error("Win settle failed:", result.error);
            }
          } catch (err) {
            console.error("Settle API error:", err);
          }
          break;
        }

        case "REQUEST_BALANCE":
          // Game requested current balance
          try {
            const res = await fetch("/api/wallet", { cache: "no-store" });
            const data = await res.json();
            if (typeof data.balance === "number") {
              sendBalanceToIframe(data.balance);
            }
          } catch {
            // Ignore
          }
          break;
      }
    },
    [token, sendTokenToIframe, refresh]
  );

  const sendBalanceToIframe = useCallback((newBalance: number) => {
    if (!iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      { type: "BALANCE_UPDATE", balance: newBalance },
      window.location.origin
    );
  }, []);

  const sendErrorToIframe = useCallback((error: string) => {
    if (!iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      { type: "SETTLE_ERROR", error },
      window.location.origin
    );
  }, []);

  // Listen for postMessage events
  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  return (
    <iframe
      ref={iframeRef}
      title="SuperAce Game"
      src="/games/super-ace/index.html"
      className="h-full w-full border-none"
      allow="autoplay"
    />
  );
}
