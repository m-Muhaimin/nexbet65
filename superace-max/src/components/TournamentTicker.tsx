import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Flame, ChevronRight, Crown, Sparkles, Coins } from 'lucide-react';
import { TournamentData } from '../types';

interface TournamentTickerProps {
  tournament: TournamentData;
  jackpotValue: number;
  onOpenTournament: () => void;
  onOpenJackpot?: () => void;
  recentOvertakeMessage?: string | null;
  hasJackpotIncrement?: boolean;
}

export const TournamentTicker: React.FC<TournamentTickerProps> = ({
  tournament,
  jackpotValue,
  onOpenTournament,
  onOpenJackpot,
  recentOvertakeMessage,
  hasJackpotIncrement = false,
}) => {
  return (
    <div className="relative w-full max-w-[460px] px-2 py-0.5 z-20 select-none flex flex-col gap-1">
      {/* Overtake Toast alert if player just climbed rank */}
      {recentOvertakeMessage && (
        <motion.div
          initial={{ y: -10, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -10, opacity: 0 }}
          className="absolute -top-6 left-2 right-2 py-1 px-3 bg-gradient-to-r from-emerald-600 to-teal-700 border border-emerald-300 rounded-full text-white text-[11px] font-black flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.8)] z-30 pointer-events-none"
        >
          <Flame className="w-3 h-3 text-yellow-300 animate-bounce" />
          <span>{recentOvertakeMessage}</span>
        </motion.div>
      )}

      {/* Progressive Jackpot Ticker Strip */}
      <button
        type="button"
        onClick={onOpenJackpot || onOpenTournament}
        className={`w-full h-7 px-2.5 rounded-md bg-gradient-to-r from-[#181105]/95 via-[#2b1e06]/95 to-[#181105]/95 hover:from-[#2e2008] hover:to-[#2e2008] border border-[#f59e0b]/60 hover:border-yellow-400 flex items-center justify-between text-xs cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.25)] transition-all text-white group ${
          hasJackpotIncrement ? 'ring-1 ring-yellow-400' : ''
        }`}
      >
        <div className="flex items-center gap-1.5 overflow-hidden">
          <div className="w-4 h-4 rounded bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-200 flex items-center justify-center text-stone-950 font-black shadow-sm">
            <Crown className="w-2.5 h-2.5 text-amber-950" />
          </div>
          <span className="font-extrabold text-[10.5px] text-yellow-400 tracking-wider flex items-center gap-1">
            GRAND JACKPOT
            <Sparkles className="w-2.5 h-2.5 text-yellow-300 animate-pulse hidden xs:inline" />
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <motion.span
            key={jackpotValue.toFixed(0)}
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            className="font-mono text-[12px] font-black text-yellow-300 tracking-tight drop-shadow-[0_1px_4px_rgba(234,179,8,0.7)]"
          >
            ৳{jackpotValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </motion.span>
          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold hidden xs:inline">
            +2.5% Bets
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-yellow-500/70 group-hover:text-yellow-300 transition-colors" />
        </div>
      </button>

      {/* Tournament Leaderboard Ticker Strip */}
      <button
        type="button"
        onClick={onOpenTournament}
        className="w-full h-6 px-2.5 rounded-md bg-[#0a1220]/90 hover:bg-[#111c30] border border-[#1e2e48] hover:border-[#38bdf8] flex items-center justify-between text-xs cursor-pointer shadow-sm transition-all text-white group"
      >
        <div className="flex items-center gap-1.5 overflow-hidden">
          <div className="w-3.5 h-3.5 rounded bg-gradient-to-tr from-sky-500 to-cyan-300 flex items-center justify-center text-stone-950 font-black shadow-sm">
            <Trophy className="w-2 h-2 text-sky-950" />
          </div>
          <span className="font-bold text-[10px] text-sky-400 truncate max-w-[130px] sm:max-w-[160px]">
            {tournament.title}
          </span>
          <span className="text-[9px] px-1.2 py-0.2 rounded bg-amber-950/80 border border-amber-500/50 text-amber-300 font-mono font-bold">
            Rank #{tournament.playerRank}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[9.5px] text-zinc-400 font-semibold hidden xs:inline">
            {tournament.playerScore.toLocaleString()} pts
          </span>
          <span className="text-[9.5px] text-emerald-400 font-mono font-bold">
            ৳{tournament.firstPrize.toLocaleString()} Top
          </span>
          <ChevronRight className="w-3 h-3 text-zinc-400 group-hover:text-white transition-colors" />
        </div>
      </button>
    </div>
  );
};
