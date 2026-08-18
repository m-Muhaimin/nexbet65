import React, { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { SlotMachineScene } from './phaser/SlotMachineScene';
import { SymbolArtwork } from './SymbolArtwork';
import { WinningWaysLinePath } from './WinningWaysLinePath';
import type { GridCell, WaysHit, MegaSymbol, GameMode } from '../types';

const COLS = 5;
const ROWS = 4;
const CELL_SIZE = 96;
const CELL_GAP = 4;

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
      width: COLS * (CELL_SIZE + CELL_GAP) + 8,
      height: ROWS * (CELL_SIZE + CELL_GAP) + 8,
      transparent: true,
      scene: SlotMachineScene,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
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

  const gridWidth = COLS * (CELL_SIZE + CELL_GAP);
  const gridHeight = ROWS * (CELL_SIZE + CELL_GAP);

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
      <div
        ref={canvasRef}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          width: gridWidth + 8,
          height: gridHeight + 8,
        }}
      />

      {winningCells.length > 0 && (
        <div
          className="pointer-events-none absolute"
          style={{ width: gridWidth, height: gridHeight }}
        >
          {winningCells.map(({ col, row }) => {
            const cell = grid[col][row];
            return (
              <div
                key={`win-${cell.id}`}
                className="absolute animate-winning-pop z-30"
                style={{
                  left: col * (CELL_SIZE + CELL_GAP),
                  top: row * (CELL_SIZE + CELL_GAP),
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

      {activeRippleColumns.length > 0 && (
        <div className="absolute inset-0 pointer-events-none z-20">
          {activeRippleColumns.map((col) => (
            <div
              key={`ripple-${rippleTriggerKey}-${col}`}
              className="absolute bottom-0 w-[96px] bg-gradient-to-t from-cyan-400/30 via-transparent to-transparent animate-energy-ripple"
              style={{
                left: col * (CELL_SIZE + CELL_GAP),
                height: gridHeight,
              }}
            />
          ))}
        </div>
      )}

      {waysHits.length > 0 && (
        <div className="absolute inset-0 pointer-events-none z-25">
          <WinningWaysLinePath
            waysHits={waysHits}
            grid={grid}
          />
        </div>
      )}

      {grid.some((col) => col.some((cell) => cell.megaSymbolId)) && (
        <div className="absolute inset-0 pointer-events-none z-30">
          {grid.map((col, colIdx) =>
            col.map((cell, rowIdx) => {
              if (!cell.isMegaOrigin) return null;
              return (
                <div
                  key={`mega-${cell.megaSymbolId}`}
                  className="absolute border-2 border-yellow-400/60 rounded-md"
                  style={{
                    left: colIdx * (CELL_SIZE + CELL_GAP) - 2,
                    top: rowIdx * (CELL_SIZE + CELL_GAP) - 2,
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
