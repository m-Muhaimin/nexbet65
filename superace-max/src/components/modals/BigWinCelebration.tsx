import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy } from 'lucide-react';
import { sound } from '../../engine/audioService';
import { CanvasParticleLayer } from '../CanvasParticleLayer';

interface BigWinCelebrationProps {
  isOpen?: boolean;
  amount?: number;
  winAmount?: number;
  bet?: number;
  onComplete?: () => void;
  onClose?: () => void;
}

export const BigWinCelebration: React.FC<BigWinCelebrationProps> = ({
  isOpen,
  amount,
  winAmount,
  bet = 1.0,
  onComplete,
  onClose,
}) => {
  const actualAmount = typeof winAmount === 'number' ? winAmount : typeof amount === 'number' ? amount : 0;
  const isVisible = isOpen !== undefined ? isOpen : actualAmount > 0;

  const handleClose = () => {
    if (onClose) onClose();
    if (onComplete) onComplete();
  };

  const [displayedAmount, setDisplayedAmount] = useState(0);

  const ratio = actualAmount / Math.max(0.1, bet);
  let title = 'BIG WIN';
  let tier: 'big' | 'mega' | 'super' = 'big';
  if (ratio >= 50) {
    title = 'SUPER WIN';
    tier = 'super';
  } else if (ratio >= 20) {
    title = 'MEGA WIN';
    tier = 'mega';
  }

  useEffect(() => {
    if (!isVisible || actualAmount <= 0) return;

    sound.orchestralBigWinFanfare(tier);

    // Roll up counter animation
    const startTime = Date.now();
    const duration = 2800; // ms
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayedAmount(actualAmount * easeProgress);

      if (progress >= 1) {
        clearInterval(interval);
      }
    }, 30);

    const autoCloseTimer = setTimeout(() => {
      handleClose();
    }, 4600);

    return () => {
      clearInterval(interval);
      clearTimeout(autoCloseTimer);
    };
  }, [isVisible, actualAmount, tier]);

  if (!isVisible || actualAmount <= 0) return null;

  return (
    <div
      id="bigWin"
      onClick={handleClose}
      className="fixed inset-0 bg-[#04070d]/85 z-[60] flex flex-col items-center justify-center p-4 select-none cursor-pointer backdrop-blur-[3px]"
    >
      {/* Full-screen Gold Coin & Glitter Particle Emitter */}
      <CanvasParticleLayer bigWinActive={true} bigWinTier={tier} />

      {/* Rotating Sunbeam Rays */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-35 animate-rays-rot pointer-events-none"
        style={{
          background:
            'repeating-conic-gradient(from 0deg, #f6b01a 0deg 15deg, transparent 15deg 30deg)',
          maskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
        }}
      />

      {/* Main Celebration Content */}
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center justify-center text-center"
      >
        {/* Trophy Icon */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-300 border-2 border-[#fffbe8] flex items-center justify-center shadow-[0_0_30px_rgba(246,176,26,0.9)] mb-2">
          <Trophy className="w-9 h-9 text-[#7a1000]" />
        </div>

        {/* Georgia Gold-Clipped Big Win Title */}
        <h1 className="font-['Georgia'] font-black text-4xl sm:text-5xl tracking-wide uppercase bg-gradient-to-b from-[#fffbe8] via-[#f4cf6d] to-[#c05a00] bg-clip-text text-transparent filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
          {title}
        </h1>

        {/* Win Amount Rollup */}
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="font-['MStiffHei_PRC_UltraBold'] font-black text-4xl sm:text-5xl text-white tabular-nums tracking-wider mt-2 filter drop-shadow-[0_2px_15px_rgba(246,176,26,0.8)]"
        >
          ৳{displayedAmount.toFixed(2)}
        </motion.div>

        <span className="text-xs font-bold text-[#f6d478] tracking-widest uppercase mt-4 animate-pulse">
          TAP ANYWHERE TO COLLECT
        </span>
      </motion.div>
    </div>
  );
};
