import { GameMode, ServerCascadeStep, ServerGridCell, ServerSpinResult, ServerWaysHit, SymbolType } from './types';
import { MULTIPLIER_BASE, MULTIPLIER_BASE_DELUXE, MULTIPLIER_FREE, MULTIPLIER_FREE_DELUXE, PAYOUTS, REEL_WEIGHTS, REEL_WEIGHTS_DELUXE } from './symbols';

let cellCounter = 0;
function makeId(): string {
  return `c${++cellCounter}`;
}

function drawRandomSymbol(gameMode: GameMode, isFreeSpin: boolean): SymbolType {
  const weights = gameMode === 'deluxe' ? REEL_WEIGHTS_DELUXE : REEL_WEIGHTS;
  let total = 0;
  for (const sym in weights) total += weights[sym as SymbolType];
  let r = Math.random() * total;
  for (const sym in weights) {
    const s = sym as SymbolType;
    if (r < weights[s]) return s;
    r -= weights[s];
  }
  return 'S';
}

function makeCell(symbol: SymbolType, col: number, row: number, isGolden: boolean, isJoker: boolean): ServerGridCell {
  return {
    symbol: isJoker ? 'JK' : symbol,
    isGoldenCard: isGolden,
    isWild: symbol === 'G' || isJoker,
    isGoldenJoker: isJoker,
    isExpandedWild: false,
  };
}

function generateGrid(gameMode: GameMode, isFreeSpin: boolean, forceMega: boolean): ServerGridCell[][] {
  const grid: ServerGridCell[][] = [];
  for (let col = 0; col < 5; col++) {
    const column: ServerGridCell[] = [];
    for (let row = 0; row < 4; row++) {
      const sym = drawRandomSymbol(gameMode, isFreeSpin);
      const isGolden = col >= 1 && col <= 3 && sym !== 'SC' && sym !== 'G' && sym !== 'JK' &&
        Math.random() < (gameMode === 'deluxe' ? 0.15 : 0.10);
      const isJoker = gameMode === 'deluxe' && (sym === 'JK' || (isGolden && Math.random() < 0.20));
      column.push(makeCell(sym, col, row, isGolden, isJoker));
    }
    grid.push(column);
  }

  // Mega symbols in deluxe free spins
  if (gameMode === 'deluxe' && (isFreeSpin || forceMega)) {
    const spawn = forceMega || Math.random() < 0.22;
    if (spawn) {
      const size = forceMega || Math.random() < 0.3 ? 3 : 2;
      const megaSym: SymbolType = Math.random() < 0.3 ? 'A' : Math.random() < 0.6 ? 'JK' : 'K';
      const originCol = size === 3 ? 1 : Math.random() < 0.5 ? 1 : 2;
      const originRow = size === 3 ? 0 : Math.floor(Math.random() * 3);
      for (let c = originCol; c < originCol + size && c < 5; c++) {
        for (let r = originRow; r < originRow + size && r < 4; r++) {
          grid[c][r] = {
            symbol: megaSym,
            isGoldenCard: false,
            isWild: megaSym === 'JK',
            isGoldenJoker: megaSym === 'JK',
            isExpandedWild: false,
          };
        }
      }
    }
  }

  return grid;
}

function cloneGrid(grid: ServerGridCell[][]): ServerGridCell[][] {
  return grid.map(col => col.map(cell => ({ ...cell })));
}

function evaluateWays(grid: ServerGridCell[][], bet: number): { waysHits: ServerWaysHit[]; winningCells: Set<string> } {
  const paying: SymbolType[] = ['A', 'K', 'Q', 'J', 'S'];
  const hits: ServerWaysHit[] = [];
  const winning = new Set<string>();

  for (const sym of paying) {
    let matchedCols = 0;
    const colCounts: number[] = [];
    const matchedInCols: { col: number; row: number }[][] = [];

    for (let col = 0; col < 5; col++) {
      const matching = grid[col]
        .map((cell, row) => ({ cell, row }))
        .filter(({ cell }) =>
          cell.symbol === sym || cell.isWild || cell.isExpandedWild || cell.symbol === 'G' || cell.symbol === 'JK'
        );
      if (matching.length > 0) {
        matchedCols++;
        colCounts.push(matching.length);
        matchedInCols.push(matching.map(m => ({ col, row: m.row })));
      } else {
        break;
      }
    }

    if (matchedCols >= 3) {
      const ways = colCounts.reduce((a, c) => a * c, 1);
      const tier = Math.min(matchedCols, 5) as 3 | 4 | 5;
      const baseMult = PAYOUTS[sym][tier] || 0;
      const payout = bet * baseMult * (ways / 10);
      const cellKeys: string[] = [];
      matchedInCols.forEach(colCells =>
        colCells.forEach(({ col, row }) => {
          cellKeys.push(`${col}:${row}`);
          winning.add(`${col}:${row}`);
        })
      );
      hits.push({ symbol: sym, matchedCols, ways, multiplier: baseMult, payout });
    }
  }
  return { waysHits: hits, winningCells: winning };
}

export function executeServerSpin(
  bet: number,
  isFreeSpin: boolean,
  forcedScatters: number,
  gameMode: GameMode,
  forceMegaBonus: boolean,
  spinIndex: number
): ServerSpinResult {
  let grid = generateGrid(gameMode, isFreeSpin, forceMegaBonus);

  // Force scatters for buy bonus
  if (forcedScatters >= 3) {
    let placed = 0;
    const cols = [0, 1, 2, 3, 4].sort(() => Math.random() - 0.5);
    for (const c of cols) {
      if (placed < forcedScatters && grid[c].length > 0) {
        const r = Math.floor(Math.random() * grid[c].length);
        grid[c][r] = { symbol: 'SC', isGoldenCard: false, isWild: false, isGoldenJoker: false, isExpandedWild: false };
        placed++;
      }
    }
  }

  // Count scatters
  let scattersCount = 0;
  for (const col of grid) for (const cell of col) if (cell.symbol === 'SC') scattersCount++;

  let freeSpinsAwarded = 0;
  let scatterPayout = 0;
  if (scattersCount >= 3) {
    freeSpinsAwarded = 10;
    scatterPayout = bet * (scattersCount === 3 ? 2.0 : scattersCount === 4 ? 5.0 : 10.0);
  }

  const multLadder = gameMode === 'deluxe'
    ? isFreeSpin ? MULTIPLIER_FREE_DELUXE : MULTIPLIER_BASE_DELUXE
    : isFreeSpin ? MULTIPLIER_FREE : MULTIPLIER_BASE;

  const initialGrid = cloneGrid(grid);
  const cascades: ServerCascadeStep[] = [];
  let totalWin = scatterPayout;
  let stepIdx = 0;
  const expandedColsSet = new Set<number>();

  while (stepIdx < 22) {
    const { waysHits, winningCells } = evaluateWays(grid, bet);
    if (waysHits.length === 0) break;

    const mult = multLadder[Math.min(stepIdx, multLadder.length - 1)];
    const isOverdrive = gameMode === 'deluxe' && ((!isFreeSpin && mult >= 15) || (isFreeSpin && mult >= 25));

    let stepWin = 0;
    waysHits.forEach(h => { stepWin += h.payout * mult; });
    totalWin += stepWin;

    const stepGrid = cloneGrid(grid);
    const conversions: { col: number; row: number; symbol: SymbolType }[] = [];
    const stepExpandedCols: number[] = [];

    // Golden card conversions
    for (let c = 0; c < 5; c++) {
      for (let r = 0; r < 4; r++) {
        if (winningCells.has(`${c}:${r}`)) {
          const cell = stepGrid[c][r];
          if (cell.isGoldenCard || cell.symbol === 'JK' || cell.isGoldenJoker) {
            const toJoker = gameMode === 'deluxe' && (cell.symbol === 'JK' || Math.random() < 0.20);
            const target: SymbolType = toJoker ? 'JK' : 'G';
            conversions.push({ col: c, row: r, symbol: target });
            if (toJoker && gameMode === 'deluxe' && c >= 1 && c <= 3) {
              expandedColsSet.add(c);
              stepExpandedCols.push(c);
            }
          }
        }
      }
    }

    // Drop / cascade
    const nextGrid: ServerGridCell[][] = [];
    const droppedColumns: number[] = [];
    const droppedCells: { col: number; row: number }[] = [];

    for (let c = 0; c < 5; c++) {
      const isExpanded = gameMode === 'deluxe' && expandedColsSet.has(c);
      if (isExpanded) {
        const col: ServerGridCell[] = [];
        for (let r = 0; r < 4; r++) {
          col.push({ symbol: 'JK', isWild: true, isGoldenJoker: true, isExpandedWild: true, isGoldenCard: false });
        }
        nextGrid.push(col);
        droppedColumns.push(c);
      } else {
        const survivors: ServerGridCell[] = [];
        for (let r = 0; r < 4; r++) {
          const cell = grid[c][r];
          if (winningCells.has(`${c}:${r}`)) {
            if (cell.isGoldenCard) {
              const toJoker = gameMode === 'deluxe' && (cell.symbol === 'JK' || Math.random() < 0.20);
              survivors.push({
                symbol: toJoker ? 'JK' : 'G',
                isWild: true,
                isGoldenJoker: toJoker,
                isExpandedWild: false,
                isGoldenCard: false,
              });
            }
          } else {
            survivors.push({ ...cell, isGoldenCard: false });
          }
        }
        const needed = 4 - survivors.length;
        const newCells: ServerGridCell[] = [];
        for (let n = 0; n < needed; n++) {
          const sym = drawRandomSymbol(gameMode, isFreeSpin);
          const isGolden = c >= 1 && c <= 3 && sym !== 'SC' && sym !== 'G' && sym !== 'JK' &&
            Math.random() < (gameMode === 'deluxe' ? 0.16 : 0.10);
          const isJoker = gameMode === 'deluxe' && (sym === 'JK' || (isGolden && Math.random() < 0.20));
          newCells.push(makeCell(sym, c, n, isGolden, isJoker));
          droppedCells.push({ col: c, row: n });
        }
        if (needed > 0) droppedColumns.push(c);
        nextGrid.push([...newCells, ...survivors]);
      }
    }

    cascades.push({
      stepIndex: stepIdx,
      grid: stepGrid,
      waysHits,
      winAmount: stepWin,
      comboMultiplier: mult,
      conversions,
      expandedJokerCols: Array.from(expandedColsSet),
      isOverdrive,
      droppedColumns,
      droppedCells,
      nextGrid,
    });

    grid = nextGrid;
    stepIdx++;
  }

  const jackpotTeaserTriggered = gameMode === 'deluxe' && (spinIndex % 200 === 0 || (spinIndex > 10 && Math.random() < 0.008));
  const jackpotTeaserAmount = jackpotTeaserTriggered ? Number((bet * 3).toFixed(2)) : 0;
  if (jackpotTeaserTriggered) totalWin += jackpotTeaserAmount;

  return {
    spinId: `spin_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    initialGrid,
    finalGrid: grid,
    cascades,
    totalWin: Number(totalWin.toFixed(2)),
    scattersCount,
    freeSpinsAwarded,
    expandedJokerCols: Array.from(expandedColsSet),
    jackpotTeaserTriggered,
    jackpotTeaserAmount,
  };
}
