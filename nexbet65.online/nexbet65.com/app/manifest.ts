import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NexBet65 — Aviator, Mines, Plinko & Ludo",
    short_name: "NexBet65",
    description:
      "NexBet65 game dashboard. Play Aviator, Mines, Plinko and Ludo Arena.",
    start_url: "/lobby",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0c0e1a",
    theme_color: "#0c0e1a",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Play Aviator",
        url: "/games/aviator",
        description: "Jump straight into an Aviator round",
      },
    ],
  };
}
