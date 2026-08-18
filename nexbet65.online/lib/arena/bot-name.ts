const BOT_NAMES = [
  "NovaStrike",
  "ShadowRex",
  "LuckyPanda",
  "CryptoTorn",
  "BlazeNinja",
  "QuantumFox",
  "DarkPhantom",
  "GoldenAce",
  "SilverHawk",
  "NeonWolf",
  "SwiftKnight",
  "IcePhoenix",
  "TurboByte",
  "MysticEcho",
  "IronViper",
  "CosmicRider",
  "PixelBoss",
  "StormCaller",
  "MidnightOwl",
  "DigitalWolf",
];

let cachedBotName: string | null = null;

export function botUsername(): string {
  if (!cachedBotName) {
    const base = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    cachedBotName = `${base}${Math.floor(Math.random() * 90 + 10)}`;
  }
  return cachedBotName;
}

import type { GameState } from "@/lib/arena/types";

export function playerUsername(
  state: GameState,
  color: string | null | undefined
): string | null {
  if (!color) return null;
  const p = state.players[color];
  const id = typeof p === "string" ? p : p?.id;
  if (id === "BOT_USER") return botUsername();
  return state.usernames?.[color] ?? null;
}

