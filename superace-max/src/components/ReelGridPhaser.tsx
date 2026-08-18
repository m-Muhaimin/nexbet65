import React, { useEffect, useRef, useCallback } from 'react';
import Phaser from 'phaser';
import {
  SlotMachineScene,
  CANVAS_W, CANVAS_H, GRID_W, GRID_H,
  CELL_SIZE, CELL_GAP, GRID_PAD, cellX, cellY,
} from './phaser/SlotMachineScene';
import { SymbolArtwork } from './SymbolArtwork';
import { WinningWaysLinePath } from './WinningWaysLinePath';
import type { GridCell, WaysHit, GameMode } from '../types';

const COLS = 5;
const ROWS = 4;

interface ReelGridPhaserProps {
  grid: GridCell[][];
  spinningColumns: boolean[];
  waysHits: WaysHit[];
  isSpinning: boolean;
  spinCount: number;
  cascadeDepth: number;
  comboMultiplier: number;
  isFreeSpinsActive: boolean;
  activeRippleColumns: number[];
  activeRippleCells: { col: number; row: number }[];
  rippleTriggerKey: number;
  lastSpinWin: number;
  gameMode: GameMode;
  onQuickStop: () => void;
}

export const ReelGridPhaser: React.FC<ReelGridPhaserProps> = ({
  grid,
  spinningColumns,
  waysHits,
  isSpinning,
  spinCount,
  cascadeDepth,
  comboMultiplier,
  isFreeSpinsActive,
  activeRippleColumns,
  activeRippleCells,
  rippleTriggerKey,
  lastSpinWin,
  gameMode,
  onQuickStop,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<SlotMachineScene | null>(null);
  const prevGridRef = useRef<GridCell[][] | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: canvasRef.current,
      width: CANVAS_W,
      height: CANVAS_H,
      transparent: true,
      scene: SlotMachineScene,
      scale: {
        mode: Phaser.Scale.NONE,
      },
      input: { touch: { capture: true } },
      audio: { noAudio: true },
      banner: false,
    });

    gameRef.current = game;

    game.events.once('ready', () => {
      const scene = game.scene.getScene('SlotMachine') as SlotMachineScene;
      sceneRef.current = scene;
      if (grid && grid.length > 0) {
        scene.setGrid(grid);
      }
    });

    return () => {
      game.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !grid || grid.length === 0) return;

    if (prevGridRef.current && !isSpinning) {
      scene.animateGridTransition(prevGridRef.current, grid);
    } else {
      scene.setGrid(grid);
    }
    prevGridRef.current = grid;
  }, [grid, isSpinning]);

  // ─── Winning cell detection ─────────────────────────────────────────────
  const winningCellIds = new Set<string>();
  for (const hit of waysHits) {
    for (const id of hit.cellIds) {
      winningCellIds.add(id);
    }
  }

  const winningCells: { col: number; row: number }[] = [];
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      const cell = grid[c]?.[r];
      if (cell && winningCellIds.has(cell.id)) {
        winningCells.push({ col: c, row: r });
      }
    }
  }

  return (
    <div
      className="relative w-full h-full flex items-center justify-center"
      onClick={onQuickStop}
    >
      {/* Phaser canvas — same pixel dimensions as overlays */}
      <div
        ref={canvasRef}
        className="pointer-events-none"
        style={{ width: CANVAS_W, height: CANVAS_H }}
      />

      {/* Winning cell overlay — matches Phaser coordinates exactly */}
      {winningCells.length > 0 && (
        <div
          className="pointer-events-none absolute"
          style={{ width: CANVAS_W, height: CANVAS_H, left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
        >
          {winningCells.map(({ col, row }) => {
            const cell = grid[col][row];
            return (
              <div
                key={`win-${cell.id}`}
                className="absolute animate-winning-pop z-30"
                style={{
                  left: GRID_PAD + col * (CELL_SIZE + CELL_GAP),
                  top: GRID_PAD + row * (CELL_SIZE + CELL_GAP),
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                }}
              >
                <SymbolArtwork
                  symbol={cell.symbol}
                  isGoldenCard={cell.isGoldenCard}
                  isGoldenJoker={cell.isGoldenJoker}
                  isExpandedWild={cell.isExpandedWild}
                  isWinning={true}
                  usePng={true}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Energy ripple columns */}
      {activeRippleColumns.length > 0 && (
        <div
          className="absolute pointer-events-none z-20"
          style={{ width: CANVAS_W, height: CANVAS_H, left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
        >
          {activeRippleColumns.map((col) => (
            <div
              key={`ripple-${rippleTriggerKey}-${col}`}
              className="absolute bottom-0 bg-gradient-to-t from-cyan-400/30 via-transparent to-transparent animate-energy-ripple"
              style={{
                left: GRID_PAD + col * (CELL_SIZE + CELL_GAP),
                width: CELL_SIZE,
                height: GRID_H,
              }}
            />
          ))}
        </div>
      )}

      {/* Winning ways paths */}
      {waysHits.length > 0 && (
        <div
          className="absolute pointer-events-none z-25"
          style={{ width: CANVAS_W, height: CANVAS_H, left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
        >
          <WinningWaysLinePath
            waysHits={waysHits}
            grid={grid}
          />
        </div>
      )}

      {/* Mega symbol borders */}
      {grid.some((col) => col.some((cell) => cell.megaSymbolId)) && (
        <div
          className="absolute pointer-events-none z-30"
          style={{ width: CANVAS_W, height: CANVAS_H, left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
        >
          {grid.map((col, colIdx) =>
            col.map((cell, rowIdx) => {
              if (!cell.isMegaOrigin) return null;
              return (
                <div
                  key={`mega-${cell.megaSymbolId}`}
                  className="absolute border-2 border-yellow-400/60 rounded-md"
                  style={{
                    left: GRID_PAD + colIdx * (CELL_SIZE + CELL_GAP) - 2,
                    top: GRID_PAD + rowIdx * (CELL_SIZE + CELL_GAP) - 2,
                    width: (cell.megaWidth || 1) * (CELL_SIZE + CELL_GAP) - CELL_GAP + 4,
                    height: (cell.megaHeight || 1) * (CELL_SIZE + CELL_GAP) - CELL_GAP + 4,
                    boxShadow: '0 0 16px rgba(250,204,21,0.4), inset 0 0 8px rgba(250,204,21,0.2)',
                  }}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
