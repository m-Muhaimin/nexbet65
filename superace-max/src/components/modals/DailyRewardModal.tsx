import React from 'react';
import { motion } from 'motion/react';
import { Gift, Sparkles, Coins, TrendingUp } from 'lucide-react';

interface DailyRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewardAmount: number;
  streakDays: number;
  onCollect: () => void;
}

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({
  isOpen,
  onClose,
  rewardAmount,
  streakDays,
  onCollect,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        className="relative w-full max-w-sm bg-gradient-to-b from-[#1c1408] via-[#0d0a05] to-[#050402] border-2 border-[#f6b01a] rounded-2xl p-6 shadow-[0_0_50px_rgba(246,176,26,0.4)] text-white overflow-hidden"
      >
        {/* Particle / Shine Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-yellow-500/20 blur-[60px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-300 border-2 border-yellow-100 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.8)] mb-4">
            <Gift className="w-10 h-10 text-stone-950 animate-bounce" />
          </div>

          <h2 className="text-2xl font-black text-[#f6b01a] uppercase tracking-tighter font-['Georgia'] italic">
            Daily Reward
          </h2>
          <p className="text-zinc-400 text-xs mt-1 mb-6">
            Welcome back, SuperAce! Your loyalty bonus is ready.
          </p>

          <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider">Today's Bonus</span>
              <span className="text-xl font-black text-yellow-300 font-mono">৳{rewardAmount.toFixed(2)}</span>
            </div>
            <div className="h-px bg-white/10 w-full" />
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider">Streak Multiplier</span>
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Day {streakDays} (x{Math.min(5, 1 + (streakDays - 1) * 0.1).toFixed(1)})</span>
              </div>
            </div>
          </div>

          <button
            onClick={onCollect}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#ffe9a8] via-[#f6b01a] to-[#d07810] text-[#7a1000] font-black text-sm uppercase tracking-widest shadow-[0_4px_20px_rgba(246,176,26,0.6)] cursor-pointer active:scale-95 transition-all hover:brightness-110 flex items-center justify-center gap-2"
          >
            <Coins className="w-5 h-5" />
            Claim Reward
          </button>

          <p className="text-[9px] text-zinc-500 mt-4 uppercase tracking-[0.2em]">
            Next reward available in 24 hours
          </p>
        </div>

        {/* Decorative sparkles */}
        <Sparkles className="absolute top-4 left-4 w-4 h-4 text-yellow-500/30 animate-pulse" />
        <Sparkles className="absolute bottom-4 right-4 w-4 h-4 text-yellow-500/30 animate-pulse" />
      </motion.div>
    </div>
  );
};
