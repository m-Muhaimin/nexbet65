import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Zap } from 'lucide-react';
import { WaysHit } from '../types';

interface WaysToWinOverlayProps {
  waysHits?: WaysHit[];
  cascadeDepth?: number;
  comboMultiplier?: number;
  isFreeSpinsActive?: boolean;
}

export const WaysToWinOverlay: React.FC<WaysToWinOverlayProps> = ({
  waysHits = [],
  cascadeDepth = 0,
  comboMultiplier = 1,
  isFreeSpinsActive = false,
}) => {
  const hasActiveHits = waysHits.length > 0;
  const totalActiveWays = waysHits.reduce((acc, hit) => acc + hit.ways, 0);

  return (
    <div className="absolute top-2 inset-x-0 flex justify-center items-center pointer-events-none z-35 px-2">
      <AnimatePresence mode="wait">
        {hasActiveHits ? (
          <motion.div
            key={`ways_active_${cascadeDepth}_${totalActiveWays}`}
            initial={{ y: -16, scale: 0.8, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -10, scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.75, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-1 max-w-[90%]"
          >
            {/* Main Active Ways Badge */}
            <div
              className={`px-3 py-1 rounded-full flex items-center gap-2 backdrop-blur-md border shadow-lg ${
                isFreeSpinsActive
                  ? 'bg-gradient-to-r from-red-950/90 via-amber-950/95 to-red-950/90 border-yellow-400/80 shadow-[0_0_18px_rgba(250,204,21,0.7)]'
                  : 'bg-gradient-to-r from-[#0a182c]/95 via-[#162744]/95 to-[#0a182c]/95 border-amber-400/80 shadow-[0_0_18px_rgba(246,176,26,0.6)]'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-yellow-300 animate-bounce" />
              
              <div className="flex items-baseline gap-1.5">
                <motion.span
                  initial={{ scale: 1.4 }}
                  animate={{ scale: 1 }}
                  className="font-['MStiffHei_PRC_UltraBold'] text-sm sm:text-base font-black tracking-wider bg-gradient-to-b from-[#fffbe8] via-[#fcd34d] to-[#d97706] bg-clip-text text-transparent filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
                >
                  {totalActiveWays.toLocaleString()}
                </motion.span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#fffbe8]">
                  WAYS TO WIN
                </span>
              </div>

              {comboMultiplier > 1 && (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/60 text-[9px] font-black text-yellow-300">
                  ×{comboMultiplier}
                </span>
              )}
            </div>

            {/* Individual Winning Cluster Pills */}
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="flex items-center justify-center gap-1.5 flex-wrap pointer-events-none"
            >
              {waysHits.slice(0, 3).map((hit, idx) => (
                <span
                  key={`hit_pill_${idx}_${hit.symbol}`}
                  className="px-2 py-0.5 rounded bg-black/60 border border-yellow-400/40 text-[9px] font-semibold text-yellow-200 shadow-sm flex items-center gap-1"
                >
                  <span className="font-bold text-white">{hit.symbol}</span>
                  <span className="text-yellow-400">×{hit.ways} ways</span>
                  <span className="text-emerald-400 font-bold">${(hit.payout ?? 0).toFixed(2)}</span>
                </span>
              ))}
              {waysHits.length > 3 && (
                <span className="px-1.5 py-0.5 rounded bg-black/60 border border-yellow-400/40 text-[9px] font-bold text-yellow-300">
                  +{waysHits.length - 3} more
                </span>
              )}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
