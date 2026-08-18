import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface RippleTarget {
  id: string;
  col: number;
  row?: number;
  color?: string;
  timestamp: number;
}

interface GridEnergyRippleProps {
  activeColumns: number[];
  activeCells?: { col: number; row: number }[];
  triggerKey: number;
  cascadeDepth?: number;
  isFreeSpinsActive?: boolean;
}

interface SparkParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

export const GridEnergyRipple: React.FC<GridEnergyRippleProps> = ({
  activeColumns,
  activeCells = [],
  triggerKey,
  cascadeDepth = 1,
  isFreeSpinsActive = false,
}) => {
  const [ripples, setRipples] = useState<RippleTarget[]>([]);
  const [sparks, setSparks] = useState<SparkParticle[]>([]);

  useEffect(() => {
    if (triggerKey === 0 || activeColumns.length === 0) return;

    const newRipples: RippleTarget[] = [];
    const newSparks: SparkParticle[] = [];
    const timestamp = Date.now();

    // Primary energy color palette: Gold, Cyan, Amber, White
    const palette = isFreeSpinsActive
      ? ['#ffd700', '#ff6b35', '#ff2a6d', '#fffbe8']
      : ['#f6b01a', '#00f0ff', '#f4cf6d', '#ffffff'];

    activeColumns.forEach((col, idx) => {
      newRipples.push({
        id: `ripple_${triggerKey}_${col}_${idx}`,
        col,
        row: activeCells.find((c) => c.col === col)?.row ?? 0,
        color: palette[idx % palette.length],
        timestamp,
      });

      // Generate localized spark burst
      const colCenterX = ((col + 0.5) / 5) * 100;
      const sparkCount = 8;
      for (let s = 0; s < sparkCount; s++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1.5;
        newSparks.push({
          id: timestamp + col * 100 + s,
          x: colCenterX,
          y: Math.random() * 40 + 10,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 3 + 2,
          color: palette[s % palette.length],
          alpha: 1,
        });
      }
    });

    setRipples(newRipples);
    setSparks(newSparks);

    const timer = setTimeout(() => {
      setRipples([]);
      setSparks([]);
    }, 850);

    return () => clearTimeout(timer);
  }, [triggerKey, activeColumns, activeCells, cascadeDepth, isFreeSpinsActive]);

  if (ripples.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-15 overflow-hidden rounded-lg select-none">
      {/* 1. Global Ambient Energy Flash Wave across the Grid */}
      <motion.div
        key={`ambient_flash_${triggerKey}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.45, 0] }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="absolute inset-0 bg-radial from-amber-400/25 via-cyan-500/15 to-transparent mix-blend-screen"
      />

      {/* 2. Column-Specific Energy Beam Pillars and Floor Illuminations */}
      {ripples.map((rip) => {
        const leftPercent = (rip.col / 5) * 100;
        const widthPercent = (1 / 5) * 100;
        const centerPercent = ((rip.col + 0.5) / 5) * 100;

        return (
          <React.Fragment key={rip.id}>
            {/* Vertical Radiant Column Energy Surge */}
            <motion.div
              initial={{ opacity: 0, scaleY: 0, originY: 0 }}
              animate={{
                opacity: [0, 0.9, 0.6, 0],
                scaleY: [0, 1, 1],
              }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
              style={{
                left: `${leftPercent}%`,
                width: `${widthPercent}%`,
              }}
              className="absolute inset-y-0 flex items-center justify-center pointer-events-none"
            >
              {/* Pillar Glow */}
              <div
                className="w-full h-full opacity-70"
                style={{
                  background: isFreeSpinsActive
                    ? 'linear-gradient(180deg, rgba(255,215,0,0.85) 0%, rgba(255,107,53,0.45) 45%, rgba(255,42,109,0.1) 100%)'
                    : 'linear-gradient(180deg, rgba(0,240,255,0.8) 0%, rgba(246,176,26,0.5) 40%, rgba(244,207,109,0.05) 100%)',
                  filter: 'blur(4px)',
                }}
              />

              {/* Central Core Bright Laser Beam */}
              <motion.div
                initial={{ opacity: 0, height: '0%' }}
                animate={{ opacity: [0, 1, 0], height: ['0%', '100%', '100%'] }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-1.5 h-full bg-white shadow-[0_0_12px_#ffffff,0_0_24px_#00f0ff] rounded-full"
              />
            </motion.div>

            {/* Ripple Shockwave SVG Rings at the Column Drop Zone */}
            <svg
              viewBox="0 0 1000 1000"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full overflow-visible"
            >
              <defs>
                <filter id={`rippleGlow_${rip.id}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6" result="blur1" />
                  <feGaussianBlur stdDeviation="12" result="blur2" />
                  <feMerge>
                    <feMergeNode in="blur2" />
                    <feMergeNode in="blur1" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Concentric Expanding Shockwave Rings */}
              {[0, 1, 2].map((ringIdx) => {
                const cx = (rip.col + 0.5) * 200; // 0..1000 coordinate
                const cy = (rip.row !== undefined ? (rip.row + 0.5) * 250 : 250);
                const delay = ringIdx * 0.1;

                return (
                  <motion.ellipse
                    key={`shockwave_${rip.id}_${ringIdx}`}
                    cx={cx}
                    cy={cy}
                    rx={40}
                    ry={30}
                    fill="none"
                    stroke={ringIdx % 2 === 0 ? '#00f0ff' : '#ffd700'}
                    strokeWidth={5 - ringIdx}
                    filter={`url(#rippleGlow_${rip.id})`}
                    initial={{ rx: 20, ry: 15, opacity: 0 }}
                    animate={{
                      rx: [20, 240 + ringIdx * 40],
                      ry: [15, 180 + ringIdx * 30],
                      opacity: [0, 0.95, 0],
                    }}
                    transition={{
                      duration: 0.7,
                      delay,
                      ease: 'easeOut',
                    }}
                  />
                );
              })}

              {/* Radiant Diamond Flash at the Landing Center */}
              <motion.circle
                cx={(rip.col + 0.5) * 200}
                cy={(rip.row !== undefined ? (rip.row + 0.5) * 250 : 250)}
                r={25}
                fill="#ffffff"
                filter={`url(#rippleGlow_${rip.id})`}
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{ scale: [0.2, 1.8, 0], opacity: [0, 1, 0] }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              />
            </svg>
          </React.Fragment>
        );
      })}

      {/* 3. Dynamic Spark Particles Burst */}
      {sparks.map((spark) => (
        <motion.div
          key={`spark_${spark.id}`}
          initial={{
            left: `${spark.x}%`,
            top: `${spark.y}%`,
            scale: 0,
            opacity: 1,
          }}
          animate={{
            left: `${spark.x + spark.vx * 3}%`,
            top: `${spark.y + spark.vy * 3}%`,
            scale: [0, 1.2, 0],
            opacity: [1, 0.8, 0],
          }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          style={{
            width: spark.size,
            height: spark.size,
            backgroundColor: spark.color,
            boxShadow: `0 0 8px ${spark.color}, 0 0 14px #ffffff`,
          }}
          className="absolute rounded-full pointer-events-none"
        />
      ))}

      {/* 4. Bottom Horizontal Wave Surge along the Grid Floor */}
      <motion.div
        key={`floor_surge_${triggerKey}`}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: [0, 1.1, 1], opacity: [0, 0.85, 0] }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-cyan-400/40 via-amber-300/30 to-transparent pointer-events-none filter blur-xs"
      />
    </div>
  );
};
