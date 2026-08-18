import { prisma, queryWithRetry } from "@/lib/db";

export type GameStateDTO = {
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

const DEFAULT_STATE: GameStateDTO = {
  gameMode: "deluxe",
  betAmount: 10,
  freeSpinsLeft: 0,
  freeSpinsTotal: 0,
  freeSpinsWin: 0,
  vaultBalance: 0,
  vaultHarvested: 0,
  loyaltyPoints: 0,
  vipTier: "Bronze",
  totalBets: 0,
  totalWins: 0,
  spinCount: 0,
  lastSpinId: null,
  isMuted: false,
  isTurbo: false,
};

function toDTO(row: {
  gameMode: string;
  betAmount: unknown;
  freeSpinsLeft: number;
  freeSpinsTotal: number;
  freeSpinsWin: unknown;
  vaultBalance: unknown;
  vaultHarvested: unknown;
  loyaltyPoints: number;
  vipTier: string;
  totalBets: unknown;
  totalWins: unknown;
  spinCount: number;
  lastSpinId: string | null;
  isMuted: boolean;
  isTurbo: boolean;
}): GameStateDTO {
  return {
    gameMode: row.gameMode,
    betAmount: Number(row.betAmount),
    freeSpinsLeft: row.freeSpinsLeft,
    freeSpinsTotal: row.freeSpinsTotal,
    freeSpinsWin: Number(row.freeSpinsWin),
    vaultBalance: Number(row.vaultBalance),
    vaultHarvested: Number(row.vaultHarvested),
    loyaltyPoints: row.loyaltyPoints,
    vipTier: row.vipTier,
    totalBets: Number(row.totalBets),
    totalWins: Number(row.totalWins),
    spinCount: row.spinCount,
    lastSpinId: row.lastSpinId,
    isMuted: row.isMuted,
    isTurbo: row.isTurbo,
  };
}

/**
 * Load game state for a user. Creates a default row if none exists.
 */
export async function loadGameState(
  username: string
): Promise<GameStateDTO> {
  return queryWithRetry(async () => {
    const user = await prisma.winUser.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!user) return DEFAULT_STATE;

    const existing = await prisma.winGameState.findUnique({
      where: { userId: user.id },
    });
    if (existing) return toDTO(existing);

    // First visit — create default state row
    const created = await prisma.winGameState.create({
      data: { userId: user.id },
    });
    return toDTO(created);
  });
}

/**
 * Upsert game state fields. Only provided fields are updated (partial save).
 */
export async function saveGameState(
  username: string,
  patch: Partial<Omit<GameStateDTO, "totalBets" | "totalWins" | "spinCount">>
): Promise<GameStateDTO> {
  return queryWithRetry(async () => {
    const user = await prisma.winUser.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!user) return DEFAULT_STATE;

    const data: Record<string, unknown> = {};
    if (patch.gameMode !== undefined) data.gameMode = patch.gameMode;
    if (patch.betAmount !== undefined) data.betAmount = patch.betAmount;
    if (patch.freeSpinsLeft !== undefined) data.freeSpinsLeft = patch.freeSpinsLeft;
    if (patch.freeSpinsTotal !== undefined) data.freeSpinsTotal = patch.freeSpinsTotal;
    if (patch.freeSpinsWin !== undefined) data.freeSpinsWin = patch.freeSpinsWin;
    if (patch.vaultBalance !== undefined) data.vaultBalance = patch.vaultBalance;
    if (patch.vaultHarvested !== undefined) data.vaultHarvested = patch.vaultHarvested;
    if (patch.loyaltyPoints !== undefined) data.loyaltyPoints = patch.loyaltyPoints;
    if (patch.vipTier !== undefined) data.vipTier = patch.vipTier;
    if (patch.lastSpinId !== undefined) data.lastSpinId = patch.lastSpinId;
    if (patch.isMuted !== undefined) data.isMuted = patch.isMuted;
    if (patch.isTurbo !== undefined) data.isTurbo = patch.isTurbo;

    const updated = await prisma.winGameState.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...data },
      update: data,
    });
    return toDTO(updated);
  });
}

/**
 * Atomically increment spin stats after a completed spin.
 */
export async function recordSpinStats(
  username: string,
  betAmount: number,
  winAmount: number,
  spinId: string,
  extra?: {
    freeSpinsLeft?: number;
    freeSpinsTotal?: number;
    freeSpinsWin?: number;
    vaultDeposit?: number;
    loyaltyPoints?: number;
    vipTier?: string;
  }
): Promise<GameStateDTO> {
  return queryWithRetry(async () => {
    const user = await prisma.winUser.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!user) return DEFAULT_STATE;

    const updateData: Record<string, unknown> = {
      totalBets: { increment: betAmount },
      totalWins: { increment: winAmount },
      spinCount: { increment: 1 },
      lastSpinId: spinId,
    };

    if (extra?.freeSpinsLeft !== undefined) updateData.freeSpinsLeft = extra.freeSpinsLeft;
    if (extra?.freeSpinsTotal !== undefined) updateData.freeSpinsTotal = extra.freeSpinsTotal;
    if (extra?.freeSpinsWin !== undefined) updateData.freeSpinsWin = extra.freeSpinsWin;
    if (extra?.vaultDeposit !== undefined) updateData.vaultBalance = { increment: extra.vaultDeposit };
    if (extra?.loyaltyPoints !== undefined) updateData.loyaltyPoints = { increment: extra.loyaltyPoints };
    if (extra?.vipTier !== undefined) updateData.vipTier = extra.vipTier;

    const updated = await prisma.winGameState.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        totalBets: betAmount,
        totalWins: winAmount,
        spinCount: 1,
        lastSpinId: spinId,
      },
      update: updateData,
    });
    return toDTO(updated);
  });
}
