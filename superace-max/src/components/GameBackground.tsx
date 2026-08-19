/**
 * GameBackground — animated gradient + texture background.
 */

import React from 'react';
import { motion } from 'motion/react';

interface GameBackgroundProps {
  gameMode: 'classic' | 'deluxe';
  isActive: boolean;
}

export const GameBackground: React.FC<GameBackgroundProps> = ({ gameMode, isActive }) => {
  const gradient = isActive
    ? gameMode === 'deluxe'
      ? 'radial-gradient(ellipse at 50% 30%, #4a0720 0%, #150209 100%)'
      : 'radial-gradient(ellipse at 50% 30%, #3b0710 0%, #150205 100%)'
    : gameMode === 'deluxe'
    ? 'radial-gradient(ellipse at 50% 30%, #1a081a 0%, #060209 100%)'
    : 'radial-gradient(ellipse at 50% 30%, #12233c 0%, #071019 100%)';

  return (
    <motion.div
      animate={
        isActive
          ? { scale: [1.08, 1.13, 1.08], y: [-4, 3, -4], filter: 'saturate(1.35) brightness(1.1)' }
          : { scale: 1, y: 0, filter: 'saturate(1) brightness(1)' }
      }
      transition={{
        scale: { repeat: Infinity, duration: 6.5, ease: 'easeInOut' },
        y: { repeat: Infinity, duration: 5, ease: 'easeInOut' },
        filter: { duration: 1.2, ease: 'easeInOut' },
        default: { duration: 1.2, ease: 'easeInOut' },
      }}
      className="absolute inset-0 pointer-events-none -z-10 overflow-hidden select-none"
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-overlay filter blur-[1px] scale-105 animate-[bgZoomPan_25s_ease-in-out_infinite]"
        style={{ backgroundImage: `url('./assets/bg/temple.webp')` }}
      />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            gameMode === 'deluxe'
              ? `radial-gradient(circle at 25px 25px, rgba(244,114,182,0.5) 2.5px, transparent 0)`
              : `radial-gradient(circle at 25px 25px, rgba(246,212,120,0.4) 2px, transparent 0)`,
          backgroundSize: '48px 48px',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050b18]/85 via-[#04070d]/65 to-[#04070d]/95 shadow-[inset_0_0_150px_rgba(0,0,0,0.95)]" />
    </motion.div>
  );
};
