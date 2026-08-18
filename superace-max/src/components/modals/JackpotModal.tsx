import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Sparkles, X, Trophy, Flame, Coins, ShieldCheck, Zap } from 'lucide-react';

interface JackpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  jackpotValue: number;
  totalBetsPlaced: number;
  betAmount: number;
}

export const JackpotModal: React.FC<JackpotModalProps> = ({
  isOpen,
  onClose,
  jackpotValue,
  totalBetsPlaced,
  betAmount,
}) => {
  if (!isOpen) return null;

  const grandJackpot = jackpotValue;
  const majorJackpot = jackpotValue * 0.12;
  const minorJackpot = jackpotValue * 0.025;
  const miniJackpot = jackpotValue * 0.005;

  const playerContribution = totalBetsPlaced * 0.025;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 10 }}
          className="relative w-full max-w-md bg-gradient-to-b from-[#13233c] to-[#0a1220] border-2 border-[#f4cf6d] rounded-2xl p-5 shadow-[0_0_40px_rgba(246,176,26,0.35)] overflow-hidden text-white"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 flex items-center justify-center text-stone-950 shadow-md">
              <Crown className="w-6 h-6 text-amber-950" />
            </div>
            <div>
              <h2 className="font-brand text-lg text-yellow-300 tracking-wider flex items-center gap-1.5">
                SUPERACE JACKPOT
                <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
              </h2>
              <p className="text-xs text-zinc-400">Progressive Network Cash Pool</p>
            </div>
          </div>

          {/* Main Grand Jackpot Banner */}
          <div className="relative rounded-xl p-4 bg-gradient-to-r from-amber-950/80 via-yellow-950/60 to-amber-950/80 border border-amber-500/60 text-center mb-4 shadow-[inset_0_0_20px_rgba(245,158,11,0.2)]">
            <div className="text-[11px] font-black text-amber-300 tracking-widest uppercase mb-1 flex items-center justify-center gap-1">
              <Crown className="w-3.5 h-3.5 text-yellow-400" />
              GRAND PROGRESSIVE JACKPOT
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-yellow-300 tracking-tight text-shadow drop-shadow-[0_2px_10px_rgba(234,179,8,0.7)]">
              ৳{grandJackpot.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-1 text-[10px] text-amber-200/80 font-medium">
              2.5% of all game bets automatically seed this progressive jackpot
            </div>
          </div>

          {/* Tier Grid */}
          <div className="grid grid-cols-3 gap-2 mb-4 text-center">
            <div className="bg-[#0e1828] border border-sky-500/40 rounded-lg p-2">
              <span className="text-[9px] font-bold text-sky-400 tracking-wider block uppercase">MAJOR</span>
              <span className="font-mono text-xs font-black text-sky-200">
                ৳{majorJackpot.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="bg-[#0e1828] border border-emerald-500/40 rounded-lg p-2">
              <span className="text-[9px] font-bold text-emerald-400 tracking-wider block uppercase">MINOR</span>
              <span className="font-mono text-xs font-black text-emerald-200">
                ৳{minorJackpot.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="bg-[#0e1828] border border-purple-500/40 rounded-lg p-2">
              <span className="text-[9px] font-bold text-purple-400 tracking-wider block uppercase">MINI</span>
              <span className="font-mono text-xs font-black text-purple-200">
                ৳{miniJackpot.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Session Stats */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-3 mb-4 space-y-2 text-xs">
            <div className="flex justify-between items-center text-zinc-300">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <Coins className="w-3.5 h-3.5 text-amber-400" /> Total Bets Placed:
              </span>
              <span className="font-mono font-bold text-white">৳{totalBetsPlaced.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-300">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <Zap className="w-3.5 h-3.5 text-yellow-400" /> Your Jackpot Pool Contribution (2.5%):
              </span>
              <span className="font-mono font-bold text-yellow-400">৳{playerContribution.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-300">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Current Bet Stake:
              </span>
              <span className="font-mono font-bold text-white">৳{betAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer Info */}
          <p className="text-[11px] text-zinc-400 text-center leading-relaxed">
            Every spin across SuperAce feeds the live Progressive Jackpot. Grand Jackpot can drop randomly on any winning cascade!
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
