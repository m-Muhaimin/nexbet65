import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Sparkles, ShoppingCart, Crown, Zap, Flame } from 'lucide-react';
import { BUY_BONUS_COST_CLASSIC, BUY_BONUS_COST_DELUXE } from '../../utils/symbols';

interface BuyBonusModalProps {
  isOpen: boolean;
  bet: number;
  balance: number;
  onClose: () => void;
  onConfirmBuy: (isDeluxe: boolean) => void;
}

export const BuyBonusModal: React.FC<BuyBonusModalProps> = ({
  isOpen,
  bet,
  balance,
  onClose,
  onConfirmBuy,
}) => {
  const [selectedType, setSelectedType] = useState<'classic' | 'deluxe'>('deluxe');

  if (!isOpen) return null;

  const costClassic = bet * BUY_BONUS_COST_CLASSIC;
  const costDeluxe = bet * BUY_BONUS_COST_DELUXE;
  const activeCost = selectedType === 'deluxe' ? costDeluxe : costClassic;
  const canAfford = balance >= activeCost;

  return (
    <div className="fixed inset-0 bg-black/85 z-[70] flex items-center justify-center p-3 backdrop-blur-md select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-gradient-to-b from-[#132036] via-[#0a1424] to-[#040810] border-2 border-[#b98a2e] rounded-2xl p-4 flex flex-col items-center text-center shadow-[0_12px_40px_rgba(0,0,0,0.95)]"
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-2 border-b border-[#22304a]">
          <div className="flex items-center gap-1.5 text-[#ff7a45]">
            <ShoppingCart className="w-4 h-4" />
            <span className="font-['Georgia'] font-black text-sm text-[#fff6d8] uppercase tracking-wide">
              BUY BONUS ROUNDS
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 rounded-full btn-dark flex items-center justify-center text-[#cfd6e4] hover:text-white cursor-pointer active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Option Selectors: Classic vs Deluxe VIP */}
        <div className="grid grid-cols-2 gap-2 w-full my-3">
          {/* Classic 80x Option */}
          <button
            type="button"
            onClick={() => setSelectedType('classic')}
            className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
              selectedType === 'classic'
                ? 'bg-gradient-to-b from-[#1e3050] to-[#111c30] border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                : 'bg-[#080f1c] border-white/10 opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white">Classic Bonus</span>
              <span className="text-[10px] font-bold text-amber-300 font-mono">80×</span>
            </div>
            <div className="text-[10px] text-zinc-300">10 Free Spins with ×2..×10 multiplier ladder</div>
          </button>

          {/* Deluxe VIP 120x Option */}
          <button
            type="button"
            onClick={() => setSelectedType('deluxe')}
            className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
              selectedType === 'deluxe'
                ? 'bg-gradient-to-b from-[#381024] to-[#1c0812] border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.7)]'
                : 'bg-[#080f1c] border-white/10 opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-pink-200 flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" /> Deluxe VIP
              </span>
              <span className="text-[10px] font-bold text-pink-300 font-mono">120×</span>
            </div>
            <div className="text-[10px] text-zinc-300">Guaranteed Mega-Symbol + ×25 Overdrive!</div>
          </button>
        </div>

        {/* Feature Icon & Info */}
        <div className="my-2 flex flex-col items-center">
          <div
            className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-lg mb-1.5 ${
              selectedType === 'deluxe'
                ? 'bg-gradient-to-b from-pink-500 to-rose-700 border-yellow-300 shadow-[0_0_20px_rgba(236,72,153,0.8)]'
                : 'bg-gradient-to-b from-[#ff7a45] to-[#c01e0e] border-[#ffd25e] shadow-[0_0_15px_rgba(239,68,68,0.7)]'
            }`}
          >
            {selectedType === 'deluxe' ? (
              <Crown className="w-6 h-6 text-white" />
            ) : (
              <Sparkles className="w-6 h-6 text-[#fff6d8]" />
            )}
          </div>

          <h3 className="font-['Georgia'] font-black text-lg text-[#f6d478] uppercase">
            {selectedType === 'deluxe' ? 'Deluxe VIP Free Rounds' : 'Standard 10 Free Rounds'}
          </h3>
          <p className="text-xs text-[#cfd6e4] mt-0.5 max-w-[280px]">
            {selectedType === 'deluxe'
              ? 'Guaranteed 3+ Scatters, Mega-Symbol landing, Golden Jokers enabled, and Overdrive up to ×25!'
              : 'Guaranteed 3+ Scatters with classic ×2, ×4, ×6, ×10 multipliers.'}
          </p>
        </div>

        {/* Cost Details */}
        <div className="w-full p-3 rounded-xl bg-[#0d1728] border border-[#1e2e48] flex flex-col gap-1 mb-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#aab]">Current Bet:</span>
            <span className="font-bold text-white">৳{bet.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#aab]">Cost Multiplier:</span>
            <span className="font-bold text-[#f6b01a]">
              {selectedType === 'deluxe' ? `${BUY_BONUS_COST_DELUXE}×` : `${BUY_BONUS_COST_CLASSIC}×`}
            </span>
          </div>
          <div className="pt-2 mt-1 border-t border-[#1e2e48] flex justify-between items-center text-sm font-bold">
            <span className="text-[#e8d9b0]">Feature Cost:</span>
            <span className="text-base text-yellow-300 font-mono">৳{activeCost.toFixed(2)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl btn-dark text-xs font-bold text-[#aab] uppercase hover:text-white cursor-pointer active:scale-95"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              if (canAfford) {
                onConfirmBuy(selectedType === 'deluxe');
                onClose();
              }
            }}
            disabled={!canAfford}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-white active:scale-95 disabled:opacity-40 cursor-pointer shadow-lg transition-all ${
              selectedType === 'deluxe'
                ? 'bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 border border-yellow-200 shadow-[0_0_15px_rgba(236,72,153,0.7)]'
                : 'bg-gradient-to-b from-[#ff7a45] to-[#c01e0e] border border-[#ffd25e] shadow-[0_2px_10px_rgba(192,30,14,0.7)]'
            }`}
          >
            {canAfford ? 'Confirm Buy' : 'Low Balance'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
