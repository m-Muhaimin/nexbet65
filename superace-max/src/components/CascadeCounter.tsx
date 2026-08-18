import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Sparkles, Zap } from 'lucide-react';

interface CascadeCounterProps {
  cascadeDepth: number;
  comboMultiplier: number;
  isFreeSpinsActive?: boolean;
}

export const CascadeCounter: React.FC<CascadeCounterProps> = ({
  cascadeDepth,
  comboMultiplier,
  isFreeSpinsActive = false,
}) => {
  return (
    <AnimatePresence>
      {cascadeDepth > 0 && (
        <motion.div
          key={`cascade-badge-${cascadeDepth}`}
          initial={{ opacity: 0, scale: 0.5, y: -8 }}
          animate={{
            opacity: 1,
            scale: [0.9, 1.15, 1],
            y: 0,
          }}
          exit={{ opacity: 0, scale: 0.7, y: -10 }}
          transition={{
            duration: 0.35,
            ease: [0.175, 0.885, 0.32, 1.275],
          }}
          className="absolute -top-3 right-3 z-40 pointer-events-none select-none flex items-center gap-1.5"
        >
          {/* Main Aztec Stepped Glow Badge */}
          <div className="relative bg-gradient-to-r from-[#7c1d06] via-[#b45309] to-[#d97706] border-2 border-yellow-300 rounded-full px-2.5 py-0.5 shadow-[0_0_15px_rgba(245,158,11,0.9),0_4px_8px_rgba(0,0,0,0.8)] flex items-center gap-1.5">
            {/* Animated Solar Flame Icon */}
            <motion.div
              animate={{
                rotate: [0, -10, 10, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            >
              <Flame className="w-3.5 h-3.5 text-yellow-200 fill-yellow-400 drop-shadow-[0_0_4px_#f59e0b]" />
            </motion.div>

            {/* Cascade Step Text */}
            <div className="flex items-baseline gap-1">
              <span className="font-['Cinzel'] font-black text-[9px] text-amber-200 uppercase tracking-wider">
                CASCADE
              </span>
              <motion.span
                key={cascadeDepth}
                initial={{ scale: 1.5, color: '#fef08a' }}
                animate={{ scale: 1, color: '#ffffff' }}
                transition={{ duration: 0.25 }}
                className="font-['Poppins'] font-black text-sm text-white tabular-nums drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
              >
                #{cascadeDepth}
              </motion.span>
            </div>

            {/* Multiplier Tag if > 1 */}
            {comboMultiplier > 1 && (
              <div className="bg-black/60 border border-yellow-400/80 rounded-full px-1.5 py-0.2 flex items-center gap-0.5 shadow-inner">
                <Zap className="w-2.5 h-2.5 text-yellow-300 fill-yellow-300" />
                <span className="font-['Cinzel'] font-black text-[10px] text-yellow-300">
                  {comboMultiplier}X
                </span>
              </div>
            )}

            {/* Glowing Corner Aura Pulse */}
            <motion.div
              animate={{
                opacity: [0.4, 0.85, 0.4],
                scale: [1, 1.08, 1],
              }}
              transition={{ repeat: Infinity, duration: 1.0 }}
              className="absolute -inset-0.5 rounded-full border border-yellow-200/50 pointer-events-none"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
