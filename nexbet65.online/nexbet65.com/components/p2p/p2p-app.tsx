"use client";

import { useEffect, useState } from "react";

import type { AgentDTO } from "@/lib/p2p-types";
import { P2PAuth } from "@/components/p2p/p2p-auth";
import { P2PDashboard } from "@/components/p2p/p2p-dashboard";

export function P2PApp() {
  const [state, setState] = useState<
    "loading" | "signedOut" | "signedIn"
  >("loading");
  const [agent, setAgent] = useState<AgentDTO | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/p2p/me", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled) {
          if (res.ok && json.agent) {
            setAgent(json.agent);
            setState("signedIn");
          } else {
            setState("signedOut");
          }
        }
      } catch {
        if (!cancelled) setState("signedOut");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="flex items-center gap-2 text-sm font-semibold text-white/50">
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
          Loading agent console…
        </div>
      </div>
    );
  }

  if (state === "signedOut") {
    return <P2PAuth onAuthed={setAgent} />;
  }

  return <P2PDashboard agent={agent!} onSignOut={() => setState("signedOut")} />;
}
