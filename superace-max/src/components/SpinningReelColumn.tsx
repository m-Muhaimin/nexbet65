import React, { useEffect, useState, useMemo } from 'react';
import { GameMode, GridCell, SymbolType } from '../types';
import { GridCellView } from './GridCellView';
import { SymbolArtwork } from './SymbolArtwork';

interface SpinningReelColumnProps {
  colIdx: number;
  cells: GridCell[];
  isSpinning: boolean;
  gameMode?: GameMode;
  hasEnergyRipple?: boolean;
}

// SuperAce Strip order
const REEL_STRIP_SYMBOLS: SymbolType[] = [
  'A',
  'K',
  'SC',
  'Q',
  'J',
  'G',
  'S',
  'A',
  'K',
  'Q',
  'J',
  'S',
  'SC',
  'A',
  'G',
  'K',
];

export const SpinningReelColumn: React.FC<SpinningReelColumnProps> = ({
  colIdx,
  cells,
  isSpinning,
  gameMode = 'classic',
  hasEnergyRipple = false,
}) => {
  const [justLanded, setJustLanded] = useState(false);

  // Trigger realistic bounce recoil effect on reel stop
  useEffect(() => {
    if (!isSpinning) {
      setJustLanded(true);
      const timer = setTimeout(() => setJustLanded(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isSpinning]);

  // Infinite repeating strip tailored per column for realistic varied speed illusions
  const offsetStrip = useMemo(() => [
    ...REEL_STRIP_SYMBOLS.slice(colIdx * 3),
    ...REEL_STRIP_SYMBOLS.slice(0, colIdx * 3),
    ...REEL_STRIP_SYMBOLS,
    ...REEL_STRIP_SYMBOLS,
  ], [colIdx]);

  return (
    <div
      id={`reel-col-${colIdx}`}
      className={`relative grid grid-rows-4 gap-1 h-full rounded ${
        isSpinning ? 'overflow-hidden' : 'overflow-visible'
      } transition-all ${justLanded ? 'animate-reel-land' : ''}`}
    >
      {/* Dark navy reel background track */}
      <div
        className={`absolute inset-0 rounded transition-all duration-300 pointer-events-none -z-0 ${
          hasEnergyRipple
            ? 'bg-radial from-amber-400/20 via-cyan-950/40 to-[#060a12]/80 shadow-[0_0_16px_rgba(246,176,26,0.6),inset_0_0_12px_rgba(0,240,255,0.4)]'
            : 'bg-[#060a12]/60'
        }`}
      />

      {isSpinning ? (
        <div className="relative row-span-4 w-full h-full overflow-hidden flex flex-col items-center">
          {/* Top & Bottom realistic motion blur gradient masks */}
          <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#060a12] via-[#060a12]/70 to-transparent z-20 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#060a12] via-[#060a12]/70 to-transparent z-20 pointer-events-none" />

          {/* Speed line accents */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.04)_50%,transparent_100%)] bg-[length:100%_40px] animate-pulse z-15 pointer-events-none" />

          {/* Rapidly scrolling continuous symbol strip */}
          <div className="w-full flex flex-col gap-1 animate-reel-spin filter blur-[0.4px]">
            {offsetStrip.map((sym, idx) => (
              <div
                key={`strip_${colIdx}_${idx}`}
                className="w-full aspect-[100/130] shrink-0 p-[2px] opacity-90 scale-[0.98]"
              >
                <div
                  className={`w-full h-full rounded-md overflow-hidden ${
                    sym === 'SC' ? 'card-scatter' : sym === 'G' ? 'card-gold' : 'card-glass'
                  }`}
                >
                  <SymbolArtwork
                    symbol={sym}
                    isGoldenCard={idx % 4 === 1}
                    isWild={sym === 'G'}
                    isWinning={false}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Settled column cells with overflow-visible to prevent glow cutoffs */
        cells.map((cell) => (
          <div
            key={cell.id}
            className="relative w-full h-full min-h-0 flex items-center justify-center overflow-visible"
          >
            <GridCellView cell={cell} isSpinning={false} gameMode={gameMode} />
          </div>
        ))
      )}
    </div>
  );
};
