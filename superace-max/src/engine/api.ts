/**
 * API Client for SuperAce server endpoints.
 * Isolated from UI — no React, no stores.
 */

import type { GameMode } from '../types';

export type ServerGameState = {
  gameMode: string;
  betAmount: number;
  freeSpinsLeft: number;
  freeSpinsTotal: number;
  freeSpinsWin: number;
  vaultBalance: number;
  vaultHarvested: number;
  loyaltyPoints: number;
  vipTier: string;
  totalBets: number;
  totalWins: number;
  spinCount: number;
  lastSpinId: string | null;
  isMuted: boolean;
  isTurbo: boolean;
};

export interface SpinParams {
  bet: number;
  gameMode: GameMode;
  isBonusBuy: boolean;
  isDeluxeBonusBuy: boolean;
  freeSpinsActive: boolean;
  freeSpinsRemaining?: number;
  spinIndex: number;
}

export async function apiSpin(params: SpinParams): Promise<any> {
  const res = await fetch('/api/superace/spin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Spin failed');
  return data;
}

export async function fetchWalletBalance(): Promise<number | null> {
  try {
    const res = await fetch('/api/wallet', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.balance === 'number' ? data.balance : null;
  } catch {
    return null;
  }
}

export async function fetchGameState(): Promise<ServerGameState | null> {
  try {
    const res = await fetch('/api/superace/state', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.ok ? data : null;
  } catch {
    return null;
  }
}

export async function saveGameState(patch: Partial<ServerGameState>): Promise<void> {
  try {
    await fetch('/api/superace/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
  } catch {
    // Non-critical — ignore save failures
  }
}
