import React from 'react';
import { motion } from 'motion/react';
import { X, RefreshCw } from 'lucide-react';

interface AutoplayModalProps {
  isOpen: boolean;
  onSelectSpins?: (count: number) => void;
  onSelectAutoSpins?: (count: number) => void;
  onClose: () => void;
}

export const AutoplayModal: React.FC<AutoplayModalProps> = ({
  isOpen,
  onSelectSpins,
  onSelectAutoSpins,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleSelect = (count: number) => {
    if (onSelectSpins) onSelectSpins(count);
    if (onSelectAutoSpins) onSelectAutoSpins(count);
    onClose();
  };

  const spinOptions = [10, 20, 50, 100];

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
            <RefreshCw className="w-4 h-4" />
            <span className="font-['MStiffHei_PRC_UltraBold'] font-extrabold text-sm text-[#fff6d8] uppercase">
              Auto Spins
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

        {/* Spin Count Options */}
        <div className="w-full grid grid-cols-2 gap-3 my-4">
          {spinOptions.map((count) => (
            <button
              key={count}
              onClick={() => handleSelect(count)}
              className="py-3 rounded-xl bg-[#0d1728] border border-[#1e2e48] hover:border-[#a07830] flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95 transition-all text-white group"
            >
              <span className="font-['MStiffHei_PRC_UltraBold'] font-black text-lg group-hover:text-[#f6b01a] transition-colors">
                {count}
              </span>
              <span className="text-[9px] font-bold text-[#aab] uppercase tracking-wider">
                SPINS
              </span>
            </button>
          ))}
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
