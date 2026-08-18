import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy } from 'lucide-react';

interface PreviousWinFloatOverlayProps {
  lastWin: number;
  isSpinning: boolean;
}

export const PreviousWinFloatOverlay: React.FC<PreviousWinFloatOverlayProps> = ({
  lastWin,
  isSpinning,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Trigger visibility when lastWin changes and is positive
  useEffect(() => {
    if (lastWin > 0 && !isSpinning) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 4000); // 4 seconds duration
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [lastWin, isSpinning]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key={`prev-win-${lastWin}`}
          initial={{ opacity: 0, y: 14, scale: 0.85 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: 'spring', stiffness: 380, damping: 22 },
          }}
          exit={{
            opacity: 0,
            y: -12,
            scale: 0.9,
            transition: { duration: 0.2, ease: 'easeIn' },
          }}
          className="absolute -top-3 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
        >
          <div className="relative flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-[#1c1206]/95 via-[#3b2308]/95 to-[#1c1206]/95 border border-yellow-400/80 shadow-[0_0_16px_rgba(246,176,26,0.6),0_4px_12px_rgba(0,0,0,0.8)] backdrop-blur-sm">
            {/* Sparkle Glow FX */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
              className="text-yellow-300"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </motion.div>

            <div className="flex items-center gap-1 text-[11px] font-['MStiffHei_PRC_UltraBold'] tracking-wider uppercase">
              <span className="text-amber-200/90 font-medium">Last Win:</span>
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white via-yellow-200 to-amber-400 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] tabular-nums text-[13px]">
                +৳{(lastWin ?? 0).toFixed(2)}
              </span>
            </div>

            <Trophy className="w-3.5 h-3.5 text-yellow-400 ml-0.5" />

            {/* Glowing top line */}
            <div className="absolute inset-x-3 top-0 h-[1px] bg-gradient-to-r from-transparent via-yellow-200/80 to-transparent" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
