/**
 * Grid Builder — converts server response grids to client GridCell format.
 * Pure function, no side effects.
 */

import type { GridCell, SymbolType } from '../types';

/**
 * Convert server grid (array of columns) to client GridCell[][] format.
 * Each cell gets a unique visual ID and fills in display properties.
 */
export function buildVisualGrid(serverGrid: any[][]): GridCell[][] {
  return serverGrid.map((col: any[], c: number) =>
    col.map((cell: any, r: number) => ({
      id: `${c}-${r}-${Date.now()}-${Math.random()}`,
      symbol: cell.symbol as SymbolType,
      multiplier: cell.multiplier ?? 1,
      colIndex: c,
      rowIndex: r,
      isGoldenCard: cell.isGoldenCard ?? false,
      isScatter: cell.isScatter ?? false,
      isWild: cell.isWild ?? false,
      isGoldenJoker: cell.isGoldenJoker ?? false,
      isExpandedWild: cell.isExpandedWild ?? false,
    }))
  );
}

/**
 * Build visual grids for all cascade steps.
 */
export function buildCascadeVisuals(cascades: any[]): {
  grid: GridCell[][];
  nextGrid?: GridCell[][];
  waysHits: any[];
  winAmount: number;
  comboMultiplier: number;
  conversions: any[];
  expandedJokerCols?: number[];
  isOverdrive?: boolean;
  droppedColumns?: number[];
  droppedCells?: { col: number; row: number }[];
}[] {
  return (cascades || []).map((cascade: any) => ({
    ...cascade,
    grid: buildVisualGrid(cascade.grid),
    nextGrid: cascade.nextGrid ? buildVisualGrid(cascade.nextGrid) : undefined,
  }));
}
