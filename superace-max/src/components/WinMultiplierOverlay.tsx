import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { sound } from '../engine/audioService';

interface WinMultiplierOverlayProps {
  comboMultiplier: number;
  cascadeDepth: number;
  isFreeSpinsActive?: boolean;
}

export const WinMultiplierOverlay: React.FC<WinMultiplierOverlayProps> = ({
  comboMultiplier,
  cascadeDepth,
  isFreeSpinsActive = false,
}) => {
  const [displayedMultiplier, setDisplayedMultiplier] = useState<number>(comboMultiplier);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [burstKey, setBurstKey] = useState<number>(0);

  useEffect(() => {
    if (comboMultiplier > 1 && cascadeDepth > 0) {
      setDisplayedMultiplier(comboMultiplier);
      setBurstKey((prev) => prev + 1);
      setIsAnimating(true);
      sound.multiplierUpgrade(comboMultiplier);

      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 1400);
      return () => clearTimeout(timer);
    } else if (comboMultiplier === 1) {
      setIsAnimating(false);
    }
  }, [comboMultiplier, cascadeDepth]);

  if (!isAnimating && comboMultiplier <= 1) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-40 flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        {isAnimating && (
          <motion.div
            id="combo"
            key={`multiplier_combo_${burstKey}_${displayedMultiplier}`}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: [0.3, 1.25, 1], opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative flex flex-col items-center justify-center select-none"
          >
            {/* Glowing Backdrop Aura */}
            <div className="absolute w-36 h-36 rounded-full bg-[#f6b01a]/25 blur-xl pointer-events-none" />

            {/* Georgia 36px Combo Multiplier */}
            <div
              style={{
                textShadow: '0 2px 4px #000000, 0 0 16px rgba(246,176,26,0.9)',
                WebkitTextStroke: '1px #7a1000',
              }}
              className="font-['Georgia'] font-black text-4xl sm:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-[#fffbe8] via-[#f4cf6d] to-[#c05a00] tracking-wider uppercase leading-none drop-shadow-md"
            >
              ×{displayedMultiplier}
            </div>

            <div className="mt-1 px-2.5 py-0.5 rounded-full bg-[#0a1424]/90 border border-[#b98a2e] shadow-md">
              <span className="font-['MStiffHei_PRC_UltraBold'] font-extrabold text-[9px] text-[#f6d478] tracking-widest uppercase">
                {isFreeSpinsActive ? 'FREE MULTIPLIER' : 'COMBO MULTIPLIER'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
