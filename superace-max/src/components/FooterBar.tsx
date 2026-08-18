import React from 'react';
import { Wifi, Sparkles, Volume2, VolumeX, Trophy, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TournamentData } from '../types';

interface FooterBarProps {
  balance?: number;
  level?: number;
  isBalancePulsing?: boolean;
  lastAddedWin?: number;
  isMuted?: boolean;
  onToggleMute?: () => void;
  jackpotValue?: number;
  tournament?: TournamentData;
  onOpenTournament?: () => void;
}

export const FooterBar: React.FC<FooterBarProps> = React.memo(({
  balance = 1000,
  level = 1,
  isBalancePulsing = false,
  lastAddedWin = 0,
  isMuted = false,
  onToggleMute,
  jackpotValue = 0,
  tournament,
  onOpenTournament,
}) => {
  const safeBalance = typeof balance === 'number' && !isNaN(balance) ? balance : 1000;
  const safeWin = typeof lastAddedWin === 'number' && !isNaN(lastAddedWin) ? lastAddedWin : 0;

  return (
    <footer className="relative w-full z-20 px-3 py-1 flex items-center justify-between select-none border-t border-[#1e2e48]/60 bg-[#071019]/80 overflow-visible">
      {/* 1. Left: LV Chip & Sound Toggle */}
      <div className="flex items-center gap-2">
        <div
          id="lvChip"
          className="px-2 py-0.5 rounded bg-[#1c2534] border border-[#2a3b54] text-[9px] font-bold text-[#cfd6e4] uppercase tracking-wider"
        >
          LV{level}
        </div>
        {onToggleMute && (
          <button
            onClick={onToggleMute}
            aria-label="Toggle Sound"
            className="p-1 rounded text-[#aab] hover:text-white transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
        )}
      </div>

      {/* 2. Center: Balance info & Tickers */}
      <div className="flex items-center gap-1.5">
        <div
          className="relative flex items-center"
        >
          <div
            className={`relative px-2 py-0.5 rounded-md border flex items-baseline gap-1 transition-all duration-300 ${
              isBalancePulsing
                ? 'animate-balance-pulse bg-gradient-to-r from-amber-950/80 via-yellow-900/90 to-amber-950/80 border-yellow-400'
                : 'border-transparent bg-transparent'
            }`}
          >
            <span className="text-[11px] font-medium text-[#cfd6e4] flex items-center gap-1" title="Balance">
              {isBalancePulsing ? (
                <Sparkles className="w-3 h-3 text-yellow-300 animate-spin" />
              ) : (
                <Wallet className="w-3 h-3 text-[#cfd6e4]" />
              )}
            </span>
            <span
              id="balVal"
              className={`font-['MStiffHei_PRC_UltraBold'] font-extrabold text-base sm:text-lg tabular-nums tracking-wide transition-all ${
                isBalancePulsing
                  ? 'text-[#fffbe8] filter drop-shadow-[0_0_12px_#fde047]'
                  : 'text-white group-hover:text-[#f6b01a]'
              }`}
            >
              ৳{safeBalance.toFixed(2)}
            </span>
          </div>

          {/* Floating Win Counter Popup */}
          <AnimatePresence>
            {isBalancePulsing && safeWin > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 0, scale: 0.8 }}
                animate={{ opacity: 1, y: -24, scale: 1.1 }}
                exit={{ opacity: 0, y: -36, scale: 0.9 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none z-50 whitespace-nowrap px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 text-black text-[11px] font-black shadow-[0_0_14px_rgba(245,158,11,0.9)] border border-yellow-200"
              >
                +৳{safeWin.toFixed(2)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Jackpot Ticker */}
        <button
          onClick={onOpenTournament}
          className="h-6 px-1.5 rounded-sm bg-gradient-to-r from-amber-950 to-stone-900 border border-amber-500/30 flex items-center gap-1 shrink-0 active:scale-95 transition-all shadow-sm"
        >
          <Sparkles className="w-2.5 h-2.5 text-yellow-400 animate-pulse" />
          <div className="flex flex-col items-start leading-none">
            <span className="text-[6px] text-amber-500 font-bold uppercase tracking-tighter">Jackpot</span>
            <span className="font-mono text-[9px] font-black text-yellow-300">
              ৳{jackpotValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </button>

        {/* Tournament Ticker */}
        {tournament && (
          <button
            onClick={onOpenTournament}
            className="h-6 px-1.5 rounded-sm bg-[#0a1220] border border-sky-500/30 flex items-center gap-1 shrink-0 active:scale-95 transition-all shadow-sm"
          >
            <Trophy className="w-2.5 h-2.5 text-sky-400" />
            <div className="flex flex-col items-start leading-none">
              <span className="text-[6px] text-sky-500 font-bold uppercase tracking-tighter">Rank</span>
              <span className="font-mono text-[9px] font-black text-sky-300">
                #{tournament.playerRank}
              </span>
            </div>
          </button>
        )}
      </div>

      {/* 3. Right: Online Wifi Indicator */}
      <div className="flex items-center gap-1 text-[#2ecc71]">
        <Wifi className="w-4 h-4 text-[#2ecc71]" />
      </div>
    </footer>
  );
});

