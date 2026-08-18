"use client";

import { useEffect, useRef, useCallback, useState } from "react";

import { useWallet } from "@/lib/wallet-store";

/**
 * GameBridge — the bridge between the NexBet platform and the game iframe.
 *
 * This component:
 *   1. Generates a session token when the iframe loads
 *   2. Sends the token to the iframe via postMessage
 *   3. Listens for BALANCE_UPDATE from the game (authoritative balance from spin endpoint)
 *   4. Refreshes the platform wallet sidebar in real-time
 *
 * Settlement flow:
 *   The game iframe calls /api/superace/spin directly, which handles
 *   bet debit + win credit atomically. The bridge is only used for
 *   balance sync and session management — NOT for settlement.
 */

type BridgeMessage =
  | { type: "GAME_READY" }
  | { type: "BALANCE_UPDATE"; balance: number }
  | { type: "REQUEST_BALANCE" };

export function GameBridge({ gameId = "superace" }: { gameId?: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [token, setToken] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { refresh } = useWallet();

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

        case "BALANCE_UPDATE":
          // Game reports its authoritative balance (from spin endpoint)
          // Refresh the platform wallet sidebar
          await refresh();
          break;

        case "REQUEST_BALANCE":
          // Game requested current balance
          await refresh();
          break;
      }
    },
    [token, sendTokenToIframe, refresh]
  );

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
