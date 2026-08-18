import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Trophy } from 'lucide-react';

interface FreeSpinsIntroModalProps {
  isOpen: boolean;
  spinsAwarded?: number;
  freeSpinsCount?: number;
  onStart?: () => void;
  onStartFreeSpins?: () => void;
}

export const FreeSpinsIntroModal: React.FC<FreeSpinsIntroModalProps> = ({
  isOpen,
  spinsAwarded,
  freeSpinsCount,
  onStart,
  onStartFreeSpins,
}) => {
  if (!isOpen) return null;

  const count = typeof spinsAwarded === 'number' ? spinsAwarded : typeof freeSpinsCount === 'number' ? freeSpinsCount : 10;
  const handleStart = onStart || onStartFreeSpins || (() => {});

  return (
    <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-3 backdrop-blur-sm select-none">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        className="w-full max-w-sm bg-gradient-to-b from-[#132036] to-[#0a1424] border-2 border-[#b98a2e] rounded-2xl p-6 flex flex-col items-center text-center shadow-[0_12px_36px_rgba(0,0,0,0.95)]"
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-b from-[#f6b01a] to-[#c05a00] border-2 border-[#fffbe8] flex items-center justify-center shadow-[0_0_24px_rgba(246,176,26,0.9)] mb-3">
          <Sparkles className="w-8 h-8 text-[#fffbe8] animate-spin" />
        </div>

        <h2 className="font-['Georgia'] font-black text-2xl text-[#f6d478] uppercase">
          FREE ROUNDS WON!
        </h2>

        <div className="my-3 flex items-baseline gap-1">
          <span className="font-['MStiffHei_PRC_UltraBold'] font-black text-5xl text-white">
            {count}
          </span>
          <span className="font-bold text-sm text-[#f6b01a] uppercase tracking-wider">
            ROUNDS
          </span>
        </div>

        <p className="text-xs text-[#cfd6e4] mb-5">
          Elimination multipliers are boosted to{' '}
          <strong className="text-yellow-300">×2, ×4, ×6, ×10</strong> (or up to <strong className="text-red-400">×25 Overdrive</strong>)!
        </p>

        <button
          onClick={handleStart}
          className="w-full py-3 rounded-xl bg-gradient-to-b from-[#ffe9a8] via-[#f2b83c] to-[#d07810] border border-[#fffbe8] text-[#7a1000] font-['MStiffHei_PRC_UltraBold'] font-black text-sm uppercase tracking-wider shadow-[0_4px_15px_rgba(246,176,26,0.7)] active:scale-95 cursor-pointer"
        >
          START FREE ROUNDS
        </button>
      </motion.div>
    </div>
  );
};

interface FreeSpinsSummaryModalProps {
  isOpen: boolean;
  totalWin?: number;
  spinsPlayed?: number;
  totalSpins?: number;
  bet?: number;
  maxMultiplier?: number;
  onClose: () => void;
}

export const FreeSpinsSummaryModal: React.FC<FreeSpinsSummaryModalProps> = ({
  isOpen,
  totalWin = 0,
  spinsPlayed,
  totalSpins,
  bet,
  maxMultiplier = 10,
  onClose,
}) => {
  if (!isOpen) return null;

  const rounds = typeof totalSpins === 'number' ? totalSpins : typeof spinsPlayed === 'number' ? spinsPlayed : 10;
  const safeWin = typeof totalWin === 'number' && !isNaN(totalWin) ? totalWin : 0;

  return (
    <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-3 backdrop-blur-sm select-none">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        className="w-full max-w-sm bg-gradient-to-b from-[#132036] to-[#0a1424] border-2 border-[#b98a2e] rounded-2xl p-6 flex flex-col items-center text-center shadow-[0_12px_36px_rgba(0,0,0,0.95)]"
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-b from-[#f6b01a] to-[#c05a00] border-2 border-[#fffbe8] flex items-center justify-center shadow-[0_0_24px_rgba(246,176,26,0.9)] mb-3">
          <Trophy className="w-8 h-8 text-[#fffbe8]" />
        </div>

        <h2 className="font-['Georgia'] font-black text-2xl text-[#f6d478] uppercase">
          FREE ROUNDS COMPLETE
        </h2>

        <div className="my-3 flex flex-col items-center">
          <span className="text-xs text-[#aab] uppercase tracking-wider">
            Total Win
          </span>
          <span className="font-['MStiffHei_PRC_UltraBold'] font-black text-4xl text-white mt-0.5">
            ৳{safeWin.toFixed(2)}
          </span>
        </div>

        <div className="w-full p-2.5 rounded-xl bg-[#0d1728] border border-[#1e2e48] flex justify-around text-xs mb-5">
          <div>
            <span className="text-[#aab]">Rounds: </span>
            <strong className="text-white">{rounds}</strong>
          </div>
          {typeof bet === 'number' ? (
            <div>
              <span className="text-[#aab]">Bet: </span>
              <strong className="text-[#f6b01a]">৳{bet.toFixed(2)}</strong>
            </div>
          ) : (
            <div>
              <span className="text-[#aab]">Top Mult: </span>
              <strong className="text-[#f6b01a]">×{maxMultiplier}</strong>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-gradient-to-b from-[#ffe9a8] via-[#f2b83c] to-[#d07810] border border-[#fffbe8] text-[#7a1000] font-['MStiffHei_PRC_UltraBold'] font-black text-sm uppercase tracking-wider shadow-[0_4px_15px_rgba(246,176,26,0.7)] active:scale-95 cursor-pointer"
        >
          COLLECT WIN
        </button>
      </motion.div>
    </div>
  );
};
