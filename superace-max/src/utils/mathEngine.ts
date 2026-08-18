import {
  CascadeStep,
  GameMode,
  GridCell,
  MegaSymbol,
  SpinResult,
  SymbolType,
  WaysHit,
} from '../types';
import {
  MULTIPLIER_BASE,
  MULTIPLIER_BASE_DELUXE,
  MULTIPLIER_FREE,
  MULTIPLIER_FREE_DELUXE,
  REEL_WEIGHTS,
  REEL_WEIGHTS_DELUXE,
  SYMBOLS,
} from './symbols';

// Generate unique ID
let cellCounter = 0;
export function makeCellId(): string {
  return `cell_${Date.now()}_${++cellCounter}_${Math.random().toString(36).substring(2, 7)}`;
}

// Select random symbol by weights
export function drawRandomSymbol(
  gameMode: GameMode = 'classic',
  isFreeSpin = false
): SymbolType {
  const weights = gameMode === 'deluxe' ? REEL_WEIGHTS_DELUXE : REEL_WEIGHTS;
  let totalWeight = 0;
  for (const sym in weights) {
    totalWeight += weights[sym as SymbolType];
  }

  let random = Math.random() * totalWeight;
  for (const sym in weights) {
    const s = sym as SymbolType;
    const w = weights[s];
    if (random < w) {
      return s;
    }
    random -= w;
  }
  return 'S';
}

// 5x4 Grid Initialization (5 columns, 4 rows each = 1024 ways)
export function generateInitialGrid(
  gameMode: GameMode = 'classic',
  isFreeSpin = false,
  forceMega = false
): { grid: GridCell[][]; megaSymbols: MegaSymbol[] } {
  const grid: GridCell[][] = [];
  const megaSymbols: MegaSymbol[] = [];

  for (let col = 0; col < 5; col++) {
    const columnCells: GridCell[] = [];
    for (let row = 0; row < 4; row++) {
      const sym = drawRandomSymbol(gameMode, isFreeSpin);
      // Golden cards appear on reels 2, 3, 4 (cols 1, 2, 3) for paying card symbols
      const isGolden =
        col >= 1 &&
        col <= 3 &&
        sym !== 'SC' &&
        sym !== 'G' &&
        sym !== 'JK' &&
        Math.random() < (gameMode === 'deluxe' ? 0.26 : 0.22);

      const isJoker = gameMode === 'deluxe' && (sym === 'JK' || (isGolden && Math.random() < 0.35));

      columnCells.push({
        id: makeCellId(),
        symbol: isJoker ? 'JK' : sym,
        isGoldenCard: isGolden,
        isWild: sym === 'G' || isJoker,
        isGoldenJoker: isJoker,
        isExpandedWild: false,
        colIndex: col,
        rowIndex: row,
        isNew: true,
      });
    }
    grid.push(columnCells);
  }

  // GR-3: Mega-Symbols in Deluxe Free Spins (or when forced via Deluxe Buy-Bonus)
  if (gameMode === 'deluxe' && (isFreeSpin || forceMega)) {
    const shouldSpawnMega = forceMega || Math.random() < 0.45;
    if (shouldSpawnMega) {
      const megaSize = forceMega || Math.random() < 0.3 ? 3 : 2; // 2x2 or 3x3
      const megaSymbolType: SymbolType =
        Math.random() < 0.4 ? 'A' : Math.random() < 0.7 ? 'JK' : 'K';
      const originCol = megaSize === 3 ? 1 : Math.random() < 0.5 ? 1 : 2; // cols 1..3
      const originRow = megaSize === 3 ? 0 : Math.floor(Math.random() * 3); // rows 0..2

      const megaId = `mega_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const mega: MegaSymbol = {
        id: megaId,
        symbol: megaSymbolType,
        originCol,
        originRow,
        width: megaSize,
        height: megaSize,
      };
      megaSymbols.push(mega);

      for (let c = originCol; c < originCol + megaSize && c < 5; c++) {
        for (let r = originRow; r < originRow + megaSize && r < 4; r++) {
          if (grid[c] && grid[c][r]) {
            grid[c][r].symbol = megaSymbolType;
            grid[c][r].isWild = megaSymbolType === 'JK';
            grid[c][r].isGoldenJoker = megaSymbolType === 'JK';
            grid[c][r].isGoldenCard = false;
            grid[c][r].megaSymbolId = megaId;
            grid[c][r].isMegaOrigin = c === originCol && r === originRow;
            grid[c][r].megaWidth = megaSize;
            grid[c][r].megaHeight = megaSize;
          }
        }
      }
    }
  }

  return { grid, megaSymbols };
}

// Clone grid helper
export function cloneGrid(grid: GridCell[][]): GridCell[][] {
  return grid.map((col, cIdx) =>
    col.map((cell, rIdx) => ({
      ...cell,
      colIndex: cIdx,
      rowIndex: rIdx,
    }))
  );
}

// Evaluate 1024-ways matching on 5x4 grid
export function evaluateGridWays(
  grid: GridCell[][],
  bet: number
): { waysHits: WaysHit[]; winningCellIds: Set<string> } {
  const payingSymbols: SymbolType[] = ['A', 'K', 'Q', 'J', 'S'];
  const waysHits: WaysHit[] = [];
  const winningCellIds = new Set<string>();

  for (const sym of payingSymbols) {
    let matchedCols = 0;
    const colCounts: number[] = [];
    const matchedCellsInCols: GridCell[][] = [];

    for (let col = 0; col < 5; col++) {
      const matchingCells = grid[col].filter(
        (cell) =>
          cell.symbol === sym ||
          cell.isWild ||
          cell.isExpandedWild ||
          cell.symbol === 'G' ||
          cell.symbol === 'JK'
      );

      if (matchingCells.length > 0) {
        matchedCols++;
        colCounts.push(matchingCells.length);
        matchedCellsInCols.push(matchingCells);
      } else {
        break; // Ways must connect left-to-right from reel 1 (col 0)
      }
    }

    if (matchedCols >= 3) {
      const ways = colCounts.reduce((acc, count) => acc * count, 1);
      const payoutTier = Math.min(matchedCols, 5) as 3 | 4 | 5;
      const baseMultiplier = SYMBOLS[sym].payouts[payoutTier] || 0;
      const payout = bet * baseMultiplier * (ways / 10); // Standard SuperAce ways multiplier

      const cellIds: string[] = [];
      matchedCellsInCols.forEach((colCells) => {
        colCells.forEach((c) => {
          cellIds.push(c.id);
          winningCellIds.add(c.id);
        });
      });

      waysHits.push({
        symbol: sym,
        matchedCols,
        ways,
        multiplier: baseMultiplier,
        payout,
        cellIds,
      });
    }
  }

  return { waysHits, winningCellIds };
}

// Execute full spin simulation including all cascade drops
export function executeSpin(
  bet: number,
  isFreeSpin = false,
  forcedScatters = 0,
  gameMode: GameMode = 'classic',
  forceMegaBonus = false,
  spinIndex = 1
): SpinResult {
  const { grid: initialGeneratedGrid, megaSymbols: initialMegaSymbols } =
    generateInitialGrid(gameMode, isFreeSpin, forceMegaBonus);
  let currentGrid = initialGeneratedGrid;
  const activeMegaSymbols = [...initialMegaSymbols];

  // If forced scatters (e.g. from buy bonus)
  if (forcedScatters >= 3) {
    let placed = 0;
    const colsToPick = [0, 1, 2, 3, 4].sort(() => Math.random() - 0.5);
    for (const c of colsToPick) {
      if (placed < forcedScatters && currentGrid[c].length > 0) {
        const r = Math.floor(Math.random() * currentGrid[c].length);
        currentGrid[c][r].symbol = 'SC';
        currentGrid[c][r].isGoldenCard = false;
        currentGrid[c][r].isWild = false;
        currentGrid[c][r].isGoldenJoker = false;
        currentGrid[c][r].isExpandedWild = false;
        placed++;
      }
    }
  }

  // Count initial scatters
  let scattersCount = 0;
  for (const col of currentGrid) {
    for (const cell of col) {
      if (cell.symbol === 'SC') {
        scattersCount++;
      }
    }
  }

  let freeSpinsAwarded = 0;
  let scatterPayout = 0;
  if (scattersCount >= 3) {
    freeSpinsAwarded = 10;
    scatterPayout = bet * (scattersCount === 3 ? 2.0 : scattersCount === 4 ? 5.0 : 10.0);
  }

  // Multiplier Ladder selection (GR-2 Overdrive support)
  const multLadder =
    gameMode === 'deluxe'
      ? isFreeSpin
        ? MULTIPLIER_FREE_DELUXE
        : MULTIPLIER_BASE_DELUXE
      : isFreeSpin
      ? MULTIPLIER_FREE
      : MULTIPLIER_BASE;

  const cascades: CascadeStep[] = [];
  let totalWin = scatterPayout;
  let cascadeStepIndex = 0;
  const expandedColsSet = new Set<number>();

  // Cascade evaluation loop
  while (cascadeStepIndex < 22) {
    const { waysHits, winningCellIds } = evaluateGridWays(currentGrid, bet);

    if (waysHits.length === 0) {
      break;
    }

    const currentMultiplier =
      multLadder[Math.min(cascadeStepIndex, multLadder.length - 1)];
    const isOverdrive =
      gameMode === 'deluxe' &&
      ((!isFreeSpin && currentMultiplier >= 15) || (isFreeSpin && currentMultiplier >= 25));

    let stepWin = 0;
    waysHits.forEach((hit) => {
      stepWin += hit.payout * currentMultiplier;
    });
    totalWin += stepWin;

    // Track conversions for Golden Card -> Golden Wild (G) or Golden Joker (JK)
    const conversions: { col: number; row: number; symbol: SymbolType }[] = [];
    const stepGridSnapshot = cloneGrid(currentGrid);
    const stepExpandedCols: number[] = [];

    // GR-1: Golden Joker Expansion in Deluxe mode
    for (let c = 0; c < stepGridSnapshot.length; c++) {
      for (let r = 0; r < stepGridSnapshot[c].length; r++) {
        const cell = stepGridSnapshot[c][r];
        if (winningCellIds.has(cell.id)) {
          cell.isWinning = true;
          if (cell.isGoldenCard || cell.symbol === 'JK' || cell.isGoldenJoker) {
            const isJokerConv =
              gameMode === 'deluxe' && (cell.symbol === 'JK' || Math.random() < 0.4);
            const targetSymbol: SymbolType = isJokerConv ? 'JK' : 'G';
            conversions.push({ col: c, row: r, symbol: targetSymbol });
            cell.isConverting = true;

            if (isJokerConv && gameMode === 'deluxe' && c >= 1 && c <= 3) {
              expandedColsSet.add(c);
              stepExpandedCols.push(c);
            }
          }
        }
      }
    }

    cascades.push({
      stepIndex: cascadeStepIndex,
      grid: stepGridSnapshot,
      waysHits,
      winAmount: stepWin,
      comboMultiplier: currentMultiplier,
      conversions,
      expandedJokerCols: Array.from(expandedColsSet),
      megaSymbols: activeMegaSymbols,
      isOverdrive,
    });

    // Cascade / Drop:
    // 1. Golden cards in winning combo transform to Golden Wild ('G') or Golden Joker ('JK').
    // 2. In Deluxe mode, if a column triggered Golden Joker expansion, the entire reel becomes an expanded Sticky Wild!
    // 3. Regular winning cards are destroyed and removed.
    // 4. Surviving cards drop to the bottom.
    // 5. New random cards drop in from the top.
    const nextGrid: GridCell[][] = [];

    for (let c = 0; c < 5; c++) {
      const col = currentGrid[c];
      const isExpandedReel = gameMode === 'deluxe' && expandedColsSet.has(c);

      if (isExpandedReel) {
        // Entire reel is filled with Sticky Expanded Golden Jokers
        const expandedCol: GridCell[] = [];
        for (let r = 0; r < 4; r++) {
          expandedCol.push({
            id: makeCellId(),
            symbol: 'JK',
            isWild: true,
            isGoldenJoker: true,
            isExpandedWild: true,
            isGoldenCard: false,
            isWinning: false,
            isConverting: false,
            colIndex: c,
            rowIndex: r,
            isNew: false,
          });
        }
        nextGrid.push(expandedCol);
      } else {
        const survivors: GridCell[] = [];

        for (let r = 0; r < col.length; r++) {
          const cell = col[r];
          if (winningCellIds.has(cell.id)) {
            if (cell.isGoldenCard) {
              const isJokerConv =
                gameMode === 'deluxe' && (cell.symbol === 'JK' || Math.random() < 0.4);
              survivors.push({
                ...cell,
                symbol: isJokerConv ? 'JK' : 'G',
                isWild: true,
                isGoldenJoker: isJokerConv,
                isGoldenCard: false,
                isWinning: false,
                isConverting: false,
              });
            }
          } else {
            // Not winning, survives
            survivors.push({
              ...cell,
              isWinning: false,
              isConverting: false,
              isNew: false,
            });
          }
        }

        // Fill empty top positions with new random cards
        const needed = 4 - survivors.length;
        const newCells: GridCell[] = [];
        for (let n = 0; n < needed; n++) {
          const sym = drawRandomSymbol(gameMode, isFreeSpin);
          const isGolden =
            c >= 1 &&
            c <= 3 &&
            sym !== 'SC' &&
            sym !== 'G' &&
            sym !== 'JK' &&
            Math.random() < (gameMode === 'deluxe' ? 0.28 : 0.22);
          const isJoker =
            gameMode === 'deluxe' && (sym === 'JK' || (isGolden && Math.random() < 0.35));

          newCells.push({
            id: makeCellId(),
            symbol: isJoker ? 'JK' : sym,
            isGoldenCard: isGolden,
            isWild: sym === 'G' || isJoker,
            isGoldenJoker: isJoker,
            isExpandedWild: false,
            colIndex: c,
            rowIndex: n,
            isNew: true,
          });
        }

        const fullCol = [...newCells, ...survivors];
        fullCol.forEach((cell, rIdx) => {
          cell.rowIndex = rIdx;
          cell.colIndex = c;
        });

        nextGrid.push(fullCol);
      }
    }

    currentGrid = nextGrid;
    cascadeStepIndex++;
  }

  // GR-5: Progressive Jackpot Teaser / Micro-Cash Drop (every 100 spins or 1.5% chance)
  const jackpotTeaserTriggered =
    gameMode === 'deluxe' && (spinIndex % 100 === 0 || (spinIndex > 5 && Math.random() < 0.018));
  const jackpotTeaserAmount = jackpotTeaserTriggered ? Number((bet * 5).toFixed(2)) : 0;
  if (jackpotTeaserTriggered) {
    totalWin += jackpotTeaserAmount;
  }

  return {
    spinId: `spin_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    bet,
    gameMode,
    initialGrid: initialGeneratedGrid,
    finalGrid: currentGrid,
    cascades,
    totalWin: Number(totalWin.toFixed(2)),
    scattersCount,
    freeSpinsAwarded,
    isFreeSpin,
    expandedJokerCols: Array.from(expandedColsSet),
    megaSymbols: activeMegaSymbols,
    jackpotTeaserTriggered,
    jackpotTeaserAmount,
  };
}
