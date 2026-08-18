"use client";

import { Bell } from "lucide-react";
import { toast } from "sonner";

export function NotificationBell() {
  return (
    <button
      type="button"
      aria-label="Notifications"
      onClick={() => toast.info("Notifications are coming soon.")}
      className="relative hidden h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-colors hover:border-brand/40 lg:flex"
    >
      <Bell className="h-4 w-4" />
      <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-black" />
    </button>
  );
}
