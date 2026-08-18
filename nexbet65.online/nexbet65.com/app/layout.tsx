import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Bengali, Plus_Jakarta_Sans, Unbounded } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegister } from "@/components/pwa-register";
import "./globals.css";
import "@/components/game/arena/arena.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const bengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  variable: "--font-bengali",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const unbounded = Unbounded({
  subsets: ["latin"],
  variable: "--font-unbounded",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NexBet65 — Play. Win. Withdraw.",
    template: "%s · NexBet65",
  },
  description:
    "Bangladesh's trusted online gaming platform. Play Aviator, Mines, Plinko & Ludo — provably fair, live rounds, instant withdrawals.",
  applicationName: "NexBet65",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "NexBet65",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
  keywords: ["aviator", "mines", "plinko", "ludo", "crash game", "nexbet65"],
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${bengali.variable} ${plusJakarta.variable} ${unbounded.variable}`}>
      <body className="min-h-screen bg-bg font-sans">
        {children}
        <Toaster position="top-center" richColors />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
