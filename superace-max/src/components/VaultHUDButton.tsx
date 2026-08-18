import React from 'react';
import { motion } from 'motion/react';

interface VaultHUDButtonProps {
  balance?: number;
  onClick: () => void;
  hasRecentDeposit?: boolean;
}

export const VaultHUDButton: React.FC<VaultHUDButtonProps> = ({
  balance = 0,
  onClick,
  hasRecentDeposit = false,
}) => {
  const safeBal = typeof balance === 'number' && !isNaN(balance) ? balance : 0;
  return (
    <motion.button
      id="vaultHUDButton"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={hasRecentDeposit ? { scale: [1, 1.25, 1], rotate: [0, -6, 6, 0] } : {}}
      transition={{ duration: 0.5 }}
      aria-label="Open Deluxe Vault"
      className="relative h-8 px-2.5 rounded-full bg-gradient-to-b from-[#2d2215] via-[#1a140d] to-[#0d0a06] border border-[#f6b01a] shadow-[0_2px_8px_rgba(0,0,0,0.8)] flex items-center gap-1.5 cursor-pointer text-white select-none hover:border-[#ffd25e] transition-all"
    >
      {/* 3D Vault Chest Icon */}
      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-300 border border-yellow-100 flex items-center justify-center text-[10px] shadow-[0_0_8px_rgba(245,158,11,0.8)]">
        👑
      </div>

      <div className="flex flex-col items-start leading-none pr-0.5">
        <span className="text-[8px] font-black uppercase text-[#f6d478] tracking-wider flex items-center gap-0.5">
          VAULT
        </span>
        <span className="text-[10px] font-black font-mono text-[#fffbe8]">
          ৳{safeBal.toFixed(2)}
        </span>
      </div>

      {/* Floating Sparkle Notification badge if balance > 0 */}
      {safeBal > 0 && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white animate-ping" />
      )}
    </motion.button>
  );
};
