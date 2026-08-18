"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const IS_STANDALONE =
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true);

const IS_IOS =
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent) &&
  (navigator as Navigator & { standalone?: boolean }).standalone !== undefined;

export function InstallAppButton({ variant = "icon" }: { variant?: "icon" | "full" }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(IS_STANDALONE);

  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const showButton = deferred !== null || IS_IOS;
  if (!showButton) return null;

  const handleInstall = async () => {
    if (!deferred) {
      toast.info(
        IS_IOS
          ? "Tap the Share icon, then 'Add to Home Screen' to install NexBet65."
          : "Open your browser menu and choose 'Install app' / 'Add to Home Screen'."
      );
      return;
    }
    try {
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") {
        toast.success("NexBet65 installed — launch it from your home screen.");
      }
    } catch {
      // prompt dismissed / unavailable
    } finally {
      setDeferred(null);
    }
    void deferred.prompt();
  };

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={handleInstall}
        className="gold-glow mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2 text-xs font-bold text-black transition-colors hover:bg-brand-dim"
      >
        <Download className="h-4 w-4" />
        Install App
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label="Install app"
      onClick={handleInstall}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-colors hover:border-brand/40"
    >
      <Download className="h-4 w-4" />
    </button>
  );
}
