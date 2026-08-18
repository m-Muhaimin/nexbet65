import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { GameMode, GridCell, WaysHit } from '../types';
import { SpinningReelColumn } from './SpinningReelColumn';
import { SymbolArtwork } from './SymbolArtwork';
import { WinningWaysLinePath } from './WinningWaysLinePath';
import { FireflyParticleCanvas } from './FireflyParticleCanvas';
import { WinMultiplierOverlay } from './WinMultiplierOverlay';
import { GridEnergyRipple } from './GridEnergyRipple';
import { WaysToWinOverlay } from './WaysToWinOverlay';
import { PreviousWinFloatOverlay } from './PreviousWinFloatOverlay';

interface ReelGridProps {
  grid: GridCell[][];
  spinningColumns: boolean[];
  waysHits?: WaysHit[];
  isSpinning?: boolean;
  spinCount?: number;
  cascadeDepth?: number;
  comboMultiplier?: number;
  isFreeSpinsActive?: boolean;
  activeRippleColumns?: number[];
  activeRippleCells?: { col: number; row: number }[];
  rippleTriggerKey?: number;
  lastSpinWin?: number;
  gameMode?: GameMode;
  onQuickStop?: () => void;
}

export const ReelGrid: React.FC<ReelGridProps> = ({
  grid,
  spinningColumns,
  waysHits = [],
  isSpinning = false,
  spinCount = 0,
  cascadeDepth = 0,
  comboMultiplier = 1,
  isFreeSpinsActive = false,
  activeRippleColumns = [],
  activeRippleCells = [],
  rippleTriggerKey = 0,
  lastSpinWin = 0,
  gameMode = 'classic',
  onQuickStop,
}) => {
  const isAnyColSpinning = spinningColumns.some(Boolean) || isSpinning;
  const gridContainerRef = useRef<HTMLDivElement | null>(null);

  const handleGridClick = () => {
    if (isAnyColSpinning && onQuickStop) {
      onQuickStop();
    }
  };

  return (
    <div
      id="grid"
      ref={gridContainerRef}
      onClick={handleGridClick}
      className={`relative w-full flex-1 min-h-[280px] max-h-[480px] sm:max-h-[540px] flex flex-col items-center justify-center px-1 py-0 select-none ${
        isAnyColSpinning ? 'cursor-pointer' : ''
      }`}
    >
      {/* Floating text overlay showing previous round win before next round */}
      <PreviousWinFloatOverlay lastWin={lastSpinWin} isSpinning={isSpinning} />

      {/* 5-Reel Gold Baroque Navy Frame */}
      <div className="relative w-full h-full max-w-[420px] min-h-[300px] max-h-[480px] sm:max-h-[520px] bg-[#071019]/70 rounded-lg p-1 sm:p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.95),inset_0_0_16px_rgba(0,0,0,0.9)] flex flex-col justify-between overflow-hidden">
        {/* Ambient Firefly/Gold Sparkles */}
        <FireflyParticleCanvas
          comboMultiplier={comboMultiplier}
          isFreeSpinsActive={isFreeSpinsActive}
        />

        {/* Vibrant Grid Background Energy Ripple on Cascade Symbol Drops */}
        <GridEnergyRipple
          activeColumns={activeRippleColumns}
          activeCells={activeRippleCells}
          triggerKey={rippleTriggerKey}
          cascadeDepth={cascadeDepth}
          isFreeSpinsActive={isFreeSpinsActive}
        />

        {/* Animated Multiplier Pop Overlay */}
        <WinMultiplierOverlay
          comboMultiplier={comboMultiplier}
          cascadeDepth={cascadeDepth}
          isFreeSpinsActive={isFreeSpinsActive}
        />

        {/* Dynamic Ways to Win Count Overlay during cascades */}
        <WaysToWinOverlay
          waysHits={waysHits}
          cascadeDepth={cascadeDepth}
          comboMultiplier={comboMultiplier}
          isFreeSpinsActive={isFreeSpinsActive}
        />

        {/* Visual Line Path connecting winning symbols */}
        {!isAnyColSpinning && waysHits && waysHits.length > 0 && (
          <WinningWaysLinePath
            grid={grid}
            waysHits={waysHits}
            cascadeDepth={cascadeDepth}
          />
        )}

        {/* 5-Column Reel Grid Layout */}
        <div className="relative w-full h-full grid grid-cols-5 gap-1 bg-[#060a12]/60 rounded p-1 z-10 overflow-visible">
          {grid.map((columnCells, colIdx) => (
            <div key={`col_container_${colIdx}`} className="relative h-full overflow-visible">
              <SpinningReelColumn
                colIdx={colIdx}
                cells={columnCells}
                isSpinning={spinningColumns[colIdx]}
                hasEnergyRipple={activeRippleColumns.includes(colIdx)}
                gameMode={gameMode}
              />
            </div>
          ))}

          {/* Mega Symbols Layer Overlay (using matching grid for perfect alignment) */}
          {!isAnyColSpinning && grid.some((col) => col.some((c) => c.isMegaOrigin)) && (
            <div className="absolute inset-0 z-50 pointer-events-none grid grid-cols-5 grid-rows-4 gap-1 p-1">
              {grid.map((col, cIdx) =>
                col.map((cell, rIdx) => {
                  if (!cell.isMegaOrigin) return null;

                  const width = cell.megaWidth || 1;
                  const height = cell.megaHeight || 1;

                  return (
                    <motion.div
                      key={`mega_${cell.id}`}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="relative overflow-visible"
                      style={{
                        gridColumn: `${cIdx + 1} / span ${width}`,
                        gridRow: `${rIdx + 1} / span ${height}`,
                      }}
                    >
                      <div
                        className={`w-full h-full rounded-lg border-4 border-yellow-400 bg-gradient-to-br from-[#1a081a] to-[#500724] shadow-[0_0_30px_rgba(250,204,21,0.8)] overflow-hidden ${
                          cell.isWinning ? 'animate-winning-pop' : ''
                        }`}
                      >
                        <SymbolArtwork
                          symbol={cell.symbol}
                          isGoldenJoker={cell.symbol === 'JK'}
                          isWinning={cell.isWinning}
                        />
                        {/* Mega Label */}
                        <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-yellow-400 text-stone-950 font-black text-[10px] rounded shadow-sm z-20">
                          MEGA {width}x{height}
                        </div>
                        {/* Inner Bevel */}
                        <div className="absolute inset-0 border-2 border-white/10 rounded-lg pointer-events-none" />
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
