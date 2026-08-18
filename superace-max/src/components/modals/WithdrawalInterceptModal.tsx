import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Gift, Sparkles, ArrowRight, ShieldCheck, DollarSign } from 'lucide-react';

interface WithdrawalInterceptModalProps {
  isOpen: boolean;
  onClose: () => void;
  withdrawalAmount: number;
  onAcceptBonusMatch: (bonusCredits: number) => void;
  onConfirmWithdrawal: () => void;
}

export const WithdrawalInterceptModal: React.FC<WithdrawalInterceptModalProps> = ({
  isOpen,
  onClose,
  withdrawalAmount = 500,
  onAcceptBonusMatch,
  onConfirmWithdrawal,
}) => {
  if (!isOpen) return null;

  const matchPercentage = 50;
  const matchAmount = Number((withdrawalAmount * (matchPercentage / 100)).toFixed(2));
  const totalPlayBalance = Number((withdrawalAmount + matchAmount).toFixed(2));

  return (
    <div
      id="withdrawalModalOverlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-md bg-gradient-to-b from-[#18181b] via-[#09090b] to-[#040406] border-2 border-emerald-400 rounded-2xl p-5 shadow-[0_0_40px_rgba(16,185,129,0.4)] text-white flex flex-col gap-4 overflow-hidden"
      >
        {/* Top Gold & Emerald Accents */}
        <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
        <div className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-700 flex items-center justify-center text-stone-950 font-black shadow-[0_0_12px_rgba(16,185,129,0.8)]">
              <CheckCircle2 className="w-5 h-5 text-stone-950" />
            </div>
            <div>
              <h2 className="text-base font-black text-emerald-400 uppercase tracking-wider font-['Georgia']">
                Withdrawal Approved
              </h2>
              <p className="text-[11px] text-zinc-400">
                VIP Retention Offer (RH-3 Protocol)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Hero Bonus Match Offer Box */}
        <div className="relative bg-gradient-to-br from-emerald-950/70 via-zinc-900 to-zinc-950 border border-emerald-500/50 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-inner">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-1.5">
            <Gift className="w-3 h-3 text-emerald-300" />
            Exclusive 50% Instant VIP Play Match
          </div>

          <div className="text-xs text-zinc-300 mb-1">
            Keep playing <span className="font-bold text-amber-300">Super Ace Deluxe</span> and receive:
          </div>

          <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-300 font-mono tracking-tight my-1">
            +৳{matchAmount.toFixed(2)} FREE BONUS
          </div>

          <div className="text-xs text-zinc-400">
            Total Playable Balance: <span className="font-bold text-white">৳{totalPlayBalance.toFixed(2)}</span>
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-2 w-full text-left text-[11px]">
            <div className="bg-black/40 border border-emerald-500/20 rounded p-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>2x Tournament Pts</span>
            </div>
            <div className="bg-black/40 border border-emerald-500/20 rounded p-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>0x Wagering Locks</span>
            </div>
          </div>
        </div>

        {/* Decision Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onAcceptBonusMatch(matchAmount)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:brightness-110 text-stone-950 font-black uppercase text-sm tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.6)] cursor-pointer transition-all active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4 text-stone-950" />
            <span>Claim +৳{matchAmount.toFixed(2)} & Continue Playing</span>
          </button>

          <button
            onClick={onConfirmWithdrawal}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 font-semibold text-xs tracking-wider border border-white/10 cursor-pointer transition-all"
          >
            Proceed with Standard Withdrawal (৳{withdrawalAmount.toFixed(2)})
          </button>
        </div>
      </motion.div>
    </div>
  );
};
