import React from 'react';
import { motion } from 'motion/react';
import { X, Coins } from 'lucide-react';

interface BetSelectorModalProps {
  isOpen: boolean;
  currentBet: number;
  balance?: number;
  onSelectBet: (bet: number) => void;
  onClose: () => void;
}

export const BetSelectorModal: React.FC<BetSelectorModalProps> = ({
  isOpen,
  currentBet,
  onSelectBet,
  onClose,
}) => {
  if (!isOpen) return null;

  const quickBets = [0.2, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 50.0, 100.0];

  return (
    <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-3 backdrop-blur-sm select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-xs bg-gradient-to-b from-[#132036] to-[#0a1424] border-2 border-[#b98a2e] rounded-2xl p-4 flex flex-col items-center shadow-[0_12px_36px_rgba(0,0,0,0.95)]"
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-2 border-b border-[#22304a]">
          <div className="flex items-center gap-1.5 text-[#f6b01a]">
            <Coins className="w-4 h-4" />
            <span className="font-['MStiffHei_PRC_UltraBold'] font-extrabold text-sm text-[#fff6d8] uppercase">
              Select Bet Size
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

        {/* Quick Bet Grid */}
        <div className="w-full grid grid-cols-3 gap-2.5 my-4">
          {quickBets.map((bet) => {
            const isSelected = Math.abs(bet - currentBet) < 0.01;
            return (
              <button
                key={bet}
                onClick={() => {
                  onSelectBet(bet);
                  onClose();
                }}
                className={`py-3 rounded-xl flex flex-col items-center justify-center gap-0.5 border cursor-pointer active:scale-95 transition-all ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#ffe9a8] via-[#f2b83c] to-[#d07810] border-[#fffbe8] text-[#7a1000] shadow-[0_0_12px_rgba(246,176,26,0.7)]'
                    : 'bg-[#0d1728] border-[#1e2e48] text-white hover:border-[#a07830]'
                }`}
              >
                <span className="text-[9px] font-bold opacity-80 leading-none">
                  BET
                </span>
                <span className="font-['MStiffHei_PRC_UltraBold'] font-black text-sm tabular-nums">
                  ৳{bet.toFixed(2)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full py-2 rounded-xl btn-dark text-xs font-bold text-[#aab] uppercase hover:text-white cursor-pointer active:scale-95"
        >
          Cancel
        </button>
      </motion.div>
    </div>
  );
};
