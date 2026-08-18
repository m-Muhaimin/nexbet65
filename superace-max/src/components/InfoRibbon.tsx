import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface InfoRibbonProps {
  waysCount: number;
  comboMultiplier: number;
  freeSpinMultiplier: number;
  isFreeSpinsActive: boolean;
  latestWin: number;
  scattersCount?: number;
  isSpinning?: boolean;
}

export const InfoRibbon: React.FC<InfoRibbonProps> = ({
  waysCount,
  comboMultiplier,
  freeSpinMultiplier,
  isFreeSpinsActive,
  latestWin,
  scattersCount = 0,
  isSpinning = false,
}) => {
  const [tipIndex, setTipIndex] = useState(0);

  const tips = [
    <>Collect Gold Frame Symbols <br /> to <span className="text-red-500 font-bold">get a prize</span></>,
    <>3+ Scatters trigger <br /><span className="text-yellow-400 font-bold">10 Free Spins</span></>,
    <>Cascades build up <br /><span className="text-amber-300 font-bold">Multiplier Boosts</span></>,
    <>Gold Frames turn into <br /><span className="text-yellow-300 font-bold">WILD symbols</span></>,
  ];

  useEffect(() => {
    if (latestWin > 0 || scattersCount > 0) return;
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [latestWin, scattersCount, tips.length]);

  return (
    <div className="relative w-full z-20 px-2 py-0.5 select-none">
      {/* 2-Segment Stone Carved Ribbon Frame */}
      <div className="w-full flex items-center gap-1.5">
        {/* Left: 14400 WAYS Box in Carved Beveled Stone */}
        <div className="min-w-[76px] sm:min-w-[85px] h-10 bg-gradient-to-b from-[#2a1b0d] via-[#1c0f04] to-[#100701] border-2 border-amber-600/80 rounded-sm shadow-[0_3px_8px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(251,191,36,0.4)] flex flex-col items-center justify-center px-1.5 py-0.5 shrink-0">
          <span className="font-['Poppins'] font-black text-sm sm:text-base text-yellow-300 tabular-nums leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            {waysCount.toLocaleString()}
          </span>
          <span className="font-['Cinzel'] font-black text-[8px] text-amber-400 tracking-wider leading-tight mt-0.5">
            WAYS
          </span>
        </div>

        {/* Center/Right: Stone Plaque Banner */}
        <div className="flex-1 h-10 bg-gradient-to-b from-[#2a1b0d] via-[#1c0f04] to-[#100701] border-2 border-amber-600/80 rounded-sm shadow-[0_3px_8px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(251,191,36,0.4)] flex items-center justify-between px-2.5 overflow-hidden">
          {/* Main Tip or Win ticker */}
          <div className="flex-1 text-center overflow-hidden flex items-center justify-center">
            {scattersCount > 0 && !isFreeSpinsActive ? (
              <div className="flex items-center justify-center gap-1.5 w-full animate-in fade-in zoom-in-95 duration-200">
                <span className="font-['Cinzel'] font-black text-[9px] text-yellow-300 tracking-wider flex items-center gap-1 shrink-0">
                  <Sparkles className="w-3 h-3 text-red-400 animate-spin" />
                  SCATTERS
                </span>

                {/* 3-Orb Tracker */}
                <div className="flex items-center gap-1 bg-black/70 border border-amber-500/60 rounded-full px-1.5 py-0.5">
                  {[1, 2, 3].map((slot) => {
                    const isFilled = scattersCount >= slot;
                    return (
                      <div
                        key={`scatter_orb_${slot}`}
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                          isFilled
                            ? 'bg-gradient-to-tr from-amber-400 to-yellow-200 border-yellow-200 shadow-[0_0_6px_#f59e0b]'
                            : 'bg-stone-900 border-stone-700'
                        }`}
                      >
                        {isFilled && <span className="text-[7px] text-stone-950 font-black">⚡</span>}
                      </div>
                    );
                  })}
                </div>

                <span className="font-['Poppins'] font-black text-[9px] text-yellow-300 shrink-0">
                  {scattersCount >= 3 ? 'FREE SPINS!' : `${3 - scattersCount} MORE`}
                </span>
              </div>
            ) : latestWin > 0 ? (
              <div className="font-['Cinzel'] font-black text-xs text-yellow-300 animate-pulse tracking-wide truncate">
                WIN: ${(latestWin ?? 0).toFixed(2)} (x{isFreeSpinsActive ? freeSpinMultiplier : comboMultiplier})
              </div>
            ) : (
              <div className="font-['Poppins'] font-semibold text-[10px] sm:text-[11px] text-amber-100/90 tracking-tight text-center leading-tight transition-opacity duration-300">
                {tips[tipIndex]}
              </div>
            )}
          </div>

          {/* Multiplier Badge on Right */}
          <div className="shrink-0 ml-1">
            {isFreeSpinsActive ? (
              <div className="bg-gradient-to-r from-red-700 to-amber-600 border border-yellow-300 rounded px-1.5 py-0.5 shadow-md">
                <span className="font-['Cinzel'] font-black text-[10px] text-yellow-100">
                  {freeSpinMultiplier}X
                </span>
              </div>
            ) : comboMultiplier > 1 ? (
              <div className="bg-gradient-to-r from-amber-600 to-yellow-500 border border-yellow-200 rounded px-1.5 py-0.5 shadow-md animate-bounce">
                <span className="font-['Cinzel'] font-black text-[10px] text-stone-950">
                  {comboMultiplier}X
                </span>
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-amber-800/70 border border-amber-500/60 flex items-center justify-center shadow-inner">
                <div className="w-2 h-2 rotate-45 bg-amber-400" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
