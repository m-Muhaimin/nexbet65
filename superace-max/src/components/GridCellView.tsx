import React from 'react';
import { motion } from 'motion/react';
import { GameMode, GridCell } from '../types';
import { SymbolArtwork } from './SymbolArtwork';

interface GridCellViewProps {
  cell: GridCell;
  isSpinning?: boolean;
  gameMode?: GameMode;
}

export const GridCellView: React.FC<GridCellViewProps> = React.memo(({ cell, isSpinning, gameMode = 'classic' }) => {
  const {
    symbol,
    isGoldenCard,
    isWild,
    isGoldenJoker,
    isExpandedWild,
    isWinning,
    isConverting,
    colIndex = 0,
    rowIndex = 0,
  } = cell;

  const isScatter = symbol === 'SC';
  const isJoker = symbol === 'JK' || isGoldenJoker || isExpandedWild;
  const isGoldenWild = symbol === 'G' || isWild;

  // Hiding logic: if this cell is part of a Mega Symbol, we let the parent ReelGrid's overlay handle it to ensure correct spanning and layering.
  const isCoveredByMega = !!cell.megaSymbolId;

  const shineDelay = ((colIndex * 0.7 + rowIndex * 0.4) % 4.2).toFixed(2);

  // Card backdrop style classes based on symbol and golden status
  let cardBgClass = 'card-glass';
  if (isScatter) {
    cardBgClass = 'card-scatter';
  } else if (isJoker) {
    cardBgClass = 'bg-gradient-to-b from-[#2a0818] via-[#500724] to-[#16020b] shadow-[0_0_8px_rgba(244,114,182,0.3),inset_0_0_6px_rgba(236,72,153,0.25)]';
  } else if (isGoldenWild || isGoldenCard) {
    cardBgClass = 'card-gold';
  }

  return (
    <motion.div
      id={cell.id}
      layout
      initial={cell.isNew ? { y: -65, scale: 0.8, opacity: 0 } : false}
      animate={{
        y: 0,
        scale: isWinning ? [1, 1.14, 0.96, 1.08, 1] : 1,
        opacity: isCoveredByMega ? 0 : 1,
      }}
      transition={{
        duration: isWinning ? 0.95 : cell.isNew ? 0.38 : 0.2,
        repeat: isWinning ? Infinity : 0,
        ease: isWinning ? 'easeInOut' : 'easeOut',
      }}
      className={`relative w-full h-full flex items-center justify-center p-[1px] select-none transition-all ${
        isWinning ? 'z-25 animate-winning-pop' : 'z-10'
      }`}
    >
      {/* Energy Landing Flare for newly dropped symbols */}
      {cell.isNew && (
        <motion.div
          initial={{ opacity: 0.9, scale: 0.6 }}
          animate={{ opacity: 0, scale: 1.4 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="absolute -inset-1 rounded-lg border-2 border-cyan-300 bg-amber-300/10 pointer-events-none z-30 shadow-[0_0_5px_#00f0ff]"
        />
      )}

      {/* Golden Card Pulsing Outer Border */}
      {isGoldenCard && !isJoker && (
        <div className="absolute inset-0 pointer-events-none z-30 rounded-md shadow-[0_0_5px_rgba(250,204,21,0.6),inset_0_0_3px_rgba(254,240,138,0.4)] animate-gold-pulse" />
      )}

      {/* Golden Joker Pulsing Neon Crimson / Gold Halo */}
      {isJoker && (
        <div className="absolute inset-0 pointer-events-none z-30 rounded-md shadow-[0_0_7px_rgba(236,72,153,0.6),inset_0_0_4px_rgba(253,224,71,0.5)] animate-pulse" />
      )}

      {/* Expanded Golden Joker Wild Electric Aura */}
      {isExpandedWild && (
        <div className="absolute -inset-0.5 pointer-events-none z-35 rounded-md bg-gradient-to-b from-pink-500/5 via-yellow-400/5 to-pink-500/5 shadow-[0_0_9px_#f43f5e] animate-pulse" />
      )}

      {/* Winning Highlight Gold Ring Glow & Pop Halo */}
      {isWinning && (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: [0.9, 1, 0.9],
              boxShadow: [
                '0 0 6px rgba(254, 240, 138, 0.7), inset 0 0 4px rgba(246, 176, 26, 0.6)',
                '0 0 12px rgba(254, 240, 138, 0.8), inset 0 0 8px rgba(246, 176, 26, 0.8)',
                '0 0 6px rgba(254, 240, 138, 0.7), inset 0 0 4px rgba(246, 176, 26, 0.6)',
              ],
            }}
            transition={{ repeat: Infinity, duration: 0.95, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-md pointer-events-none z-35"
          />
          {/* Subtle pop sparkle aura inside cell bounds */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400/25 via-yellow-200/35 to-amber-400/25 rounded-md pointer-events-none z-20 filter blur-[1px] animate-pulse" />
        </>
      )}

      {/* Converting Flash to Golden Wild or Golden Joker */}
      {isConverting && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.9, 1, 0] }}
          transition={{ duration: 0.45 }}
          className={`absolute inset-0 rounded-md pointer-events-none z-40 ${
            isJoker
              ? 'bg-pink-300 shadow-[0_0_15px_#ec4899]'
              : 'bg-yellow-200 shadow-[0_0_12px_#fde047]'
          }`}
        />
      )}

      {/* Periodic CSS Sheen effect across cards */}
      {!isSpinning && !isWinning && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-25 rounded-md">
          <div
            className="w-full h-full bg-gradient-to-r from-transparent via-white/35 to-transparent animate-symbol-shine"
            style={{ animationDelay: `${shineDelay}s` }}
          />
        </div>
      )}

      {/* Main Card Surface */}
      <div
        className={`w-full h-full rounded-md overflow-hidden relative ${cardBgClass} ${
          isSpinning ? 'blur-[0.5px] brightness-110' : ''
        }`}
      >
        <SymbolArtwork
          symbol={symbol}
          isGoldenCard={isGoldenCard}
          isWild={isWild}
          isGoldenJoker={isGoldenJoker}
          isExpandedWild={isExpandedWild}
          isWinning={isWinning}
          isConverting={isConverting}
        />
      </div>
    </motion.div>
  );
});
