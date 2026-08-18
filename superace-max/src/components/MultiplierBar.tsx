import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Zap, Flame } from 'lucide-react';
import {
  MULTIPLIER_BASE,
  MULTIPLIER_BASE_DELUXE,
  MULTIPLIER_FREE,
  MULTIPLIER_FREE_DELUXE,
} from '../utils/symbols';
import { GameMode } from '../types';

interface MultiplierBarProps {
  currentMultiplier: number;
  isFreeSpinsActive: boolean;
  freeSpinsRemaining: number;
  scattersCount: number;
  gameMode?: GameMode;
  isOverdriveActive?: boolean;
}

export const MultiplierBar: React.FC<MultiplierBarProps> = React.memo(({
  currentMultiplier,
  isFreeSpinsActive,
  freeSpinsRemaining,
  scattersCount,
  gameMode = 'classic',
  isOverdriveActive = false,
}) => {
  const ladder =
    gameMode === 'deluxe'
      ? isFreeSpinsActive
        ? MULTIPLIER_FREE_DELUXE
        : MULTIPLIER_BASE_DELUXE
      : isFreeSpinsActive
      ? MULTIPLIER_FREE
      : MULTIPLIER_BASE;

  const isOverdriveTier =
    (gameMode === 'deluxe' && currentMultiplier >= (isFreeSpinsActive ? 25 : 15)) ||
    isOverdriveActive;

  return (
    <div className="relative w-full z-20 px-3 py-0.5 flex flex-col items-center select-none">
      {/* 1. Multiplier Pill Track with Deluxe Obsidian/Neon Border */}
      <div
        className={`w-full max-w-[460px] h-10 bg-[#070e1a] rounded-full flex items-center justify-between overflow-hidden shadow-[0_3px_12px_rgba(0,0,0,0.85),inset_0_1.5px_3px_rgba(0,0,0,0.9)] transition-all ${
          isOverdriveTier
            ? 'border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-pulse'
            : gameMode === 'deluxe'
            ? 'border-2 border-[#ec4899] shadow-[0_0_8px_rgba(236,72,153,0.3)]'
            : 'border-2 border-[#a07830]'
        }`}
      >
        {ladder.map((mult, idx) => {
          const isSelected = currentMultiplier === mult;
          const isFirst = idx === 0;
          const isLast = idx === ladder.length - 1;
          const isTopTier = isLast && gameMode === 'deluxe';

          return (
            <div
              key={`mult_${mult}_${idx}`}
              className={`relative flex-1 h-full flex items-center justify-center font-['Georgia'] font-black text-lg transition-all ${
                idx > 0 ? 'border-l border-[#1e2e48]' : ''
              } ${
                isSelected
                  ? isTopTier
                    ? 'bg-gradient-to-b from-[#ff7a7a] via-[#ef4444] to-[#7f1d1d] text-white shadow-[0_0_12px_rgba(239,68,68,0.8)]'
                    : 'bg-gradient-to-b from-[#ffe9a8] via-[#f6b01a] to-[#d07810] text-[#7a1000] shadow-[0_0_10px_rgba(246,176,26,0.6)]'
                  : isTopTier
                  ? 'text-[#f43f5e] bg-[#2a0814]/80'
                  : 'text-[#7a6430] bg-[#0d1726]/60'
              } ${isFirst && isSelected ? 'rounded-l-full' : ''} ${
                isLast && isSelected ? 'rounded-r-full' : ''
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="activeMultiplierGlow"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 25,
                  }}
                  className="absolute inset-0 bg-white/25 animate-pulse pointer-events-none"
                />
              )}
              <span className="relative z-10 tracking-tight leading-none drop-shadow-sm flex items-center gap-0.5">
                {isTopTier && isSelected && (
                  <Flame className="w-3.5 h-3.5 text-yellow-200 animate-bounce" />
                )}
                ×{mult}
              </span>
            </div>
          );
        })}
      </div>

      {/* 2. Scatter Line / Free Pill Hint Row / Overdrive Status */}
      <div className="w-full flex items-center justify-center mt-1.5 min-h-[22px]">
        {isOverdriveTier ? (
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
            className="px-3.5 py-0.5 rounded-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 border border-yellow-200 shadow-[0_0_10px_rgba(239,68,68,0.7)] flex items-center gap-1.5"
          >
            <Zap className="w-3 h-3 text-yellow-200 animate-bounce" />
            <span className="font-['Arial'] font-black text-xs text-white uppercase tracking-wider">
              OVERDRIVE FRENZY ×{currentMultiplier}!
            </span>
          </motion.div>
        ) : isFreeSpinsActive ? (
          /* Gold Free Round Pill */
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
            id="freePill"
            className="px-3.5 py-0.5 rounded-full bg-gradient-to-r from-[#ffe9a8] via-[#f6b01a] to-[#d07810] border border-[#fffbe8] shadow-[0_0_8px_rgba(246,176,26,0.6)] flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3 text-[#7a1000] animate-spin" />
            <span className="font-['Arial'] font-black text-xs text-[#7a1000] uppercase tracking-wider">
              FREE ROUNDS: {freeSpinsRemaining} REMAINING
            </span>
          </motion.div>
        ) : scattersCount > 0 ? (
          /* Scatter collection feedback */
          <div className="flex items-center gap-1.5 text-xs text-[#f6d478] font-medium">
            <div className="w-4 h-4 rounded-full bg-red-800 border border-yellow-300 flex items-center justify-center text-[9px] font-bold text-yellow-100 shadow-[0_0_6px_#ef4444]">
              ৳
            </div>
            <span className="text-[#ffd25e] font-bold">
              {scattersCount}/3 Scatters Landed!
            </span>
          </div>
        ) : (
          /* Default SuperAce scatter hint */
          <div className="flex items-center gap-1.5 text-xs text-[#f6d478] font-medium tracking-tight">
            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-300 border border-yellow-100 flex items-center justify-center text-[8px] font-black text-stone-950 shadow-[0_0_6px_rgba(245,158,11,0.8)]">
              ৳
            </div>
            <span>
              {gameMode === 'deluxe'
                ? 'Deluxe VIP Mode: Golden Jokers & Overdrive Multipliers Active'
                : 'Collect 3 ৳ to receive 10 rounds'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});
