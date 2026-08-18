import React from 'react';
import { motion } from 'motion/react';
import { Crown, Sparkles, Zap, Shield, Gift, Check, Flame } from 'lucide-react';
import { BeginnerBoostData } from '../../types';

interface VIPClubModalProps {
  isOpen: boolean;
  onClose: () => void;
  boostData: BeginnerBoostData;
}

export const VIPClubModal: React.FC<VIPClubModalProps> = ({
  isOpen,
  onClose,
  boostData,
}) => {
  if (!isOpen) return null;

  const tiers = [
    { name: 'Bronze', req: '0 Pts', cashback: '0.5%', perk: 'Standard SuperAce access' },
    { name: 'Silver', req: '1,000 Pts', cashback: '1.0%', perk: '5% Vault Profit Rate' },
    { name: 'Gold', req: '5,000 Pts', cashback: '1.5%', perk: 'Deluxe Golden Jokers & Overdrive' },
    { name: 'Platinum', req: '20,000 Pts', cashback: '2.5%', perk: 'Exclusive Mega-Symbol Free Spins' },
    { name: 'Diamond', req: '50,000 Pts', cashback: '4.0%', perk: 'VIP Account Concierge & Unlimited Vault' },
  ];

  const progressPercent = Math.min(
    100,
    Math.round((boostData.loyaltyPoints / boostData.nextTierPoints) * 100)
  );

  return (
    <div
      id="vipModalOverlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-md bg-gradient-to-b from-[#181206] via-[#0d0a04] to-[#040301] border-2 border-[#ffd25e] rounded-2xl p-5 shadow-[0_0_35px_rgba(246,176,26,0.35)] text-white flex flex-col gap-4 overflow-hidden max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-stone-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.8)]">
              <Crown className="w-6 h-6 text-stone-950" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#ffd25e] uppercase tracking-wider font-['Georgia']">
                SuperAce VIP Club
              </h2>
              <p className="text-[11px] text-zinc-400">
                Tier Progression & Beginner Boost (RH-4 Protocol)
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

        {/* Beginner Boost 2x Points Active Banner */}
        {boostData.isActive && (
          <div className="bg-gradient-to-r from-amber-600/30 via-yellow-500/20 to-amber-600/30 border border-yellow-400/50 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400 animate-bounce" />
              <div>
                <div className="text-xs font-black text-yellow-300 uppercase tracking-wider">
                  Beginner Boost 2x Active!
                </div>
                <div className="text-[10px] text-zinc-300">
                  Earn double VIP points on all spins and cascades
                </div>
              </div>
            </div>
            <div className="px-2 py-1 rounded bg-amber-950/80 border border-amber-500/60 text-amber-200 text-xs font-mono font-bold">
              {boostData.daysRemaining}d {boostData.hoursRemaining}h left
            </div>
          </div>
        )}

        {/* Current Tier & Progress */}
        <div className="bg-[#111c30]/70 border border-[#1e2e48] rounded-xl p-3.5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Current Status:</span>
            <span className="font-black text-amber-300 uppercase tracking-wider font-mono">
              ★ {boostData.vipTier} VIP
            </span>
          </div>

          <div className="w-full bg-black/60 rounded-full h-2.5 overflow-hidden border border-white/10">
            <div
              className="bg-gradient-to-r from-amber-500 to-yellow-300 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span>{boostData.loyaltyPoints.toLocaleString()} VIP Pts</span>
            <span>{progressPercent}% to next tier ({boostData.nextTierPoints.toLocaleString()} pts)</span>
          </div>
        </div>

        {/* VIP Tiers Matrix */}
        <div className="flex flex-col gap-1.5 overflow-y-auto max-h-48 pr-1">
          {tiers.map((tier) => {
            const isCurrent = tier.name.toLowerCase() === boostData.vipTier.toLowerCase();
            return (
              <div
                key={tier.name}
                className={`p-2.5 rounded-lg border flex items-center justify-between text-xs transition-all ${
                  isCurrent
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                    : 'bg-white/[0.02] border-white/5 text-zinc-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white min-w-[60px]">{tier.name}</span>
                  <span className="text-[10px] text-zinc-400">{tier.perk}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-emerald-400 font-semibold">{tier.cashback}</span>
                  {isCurrent && <Check className="w-4 h-4 text-amber-400" />}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
