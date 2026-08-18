import React from 'react';
import { motion } from 'motion/react';
import { X, History, Sparkles } from 'lucide-react';
import { SpinHistoryItem } from '../../types';

interface HistoryModalProps {
  isOpen: boolean;
  history: SpinHistoryItem[];
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  history,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-3 backdrop-blur-sm select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md max-h-[80vh] bg-gradient-to-b from-[#132036] to-[#0a1424] border-2 border-[#b98a2e] rounded-2xl flex flex-col shadow-[0_12px_36px_rgba(0,0,0,0.95)] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-[#22304a] flex items-center justify-between bg-[#0a1526]">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#f6b01a]" />
            <h2 className="font-['MStiffHei_PRC_UltraBold'] font-extrabold text-base text-[#fff6d8] uppercase tracking-wide">
              Spin History Log
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full btn-dark flex items-center justify-center text-[#cfd6e4] hover:text-white cursor-pointer active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {history.length === 0 ? (
            <div className="py-12 text-center text-[#aab] text-xs">
              No spin history yet. Tap spin to begin playing!
            </div>
          ) : (
            history.map((item) => {
              const isWin = item.win > 0;
              const dateStr = new Date(item.timestamp).toLocaleTimeString();

              return (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                    item.isBonusBuy
                      ? 'bg-[#2a1215] border-red-500/40'
                      : isWin
                      ? 'bg-[#0f1d32] border-[#f6b01a]/40'
                      : 'bg-[#0a1424] border-[#1e2e48]'
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-[#aab]">{dateStr}</span>
                      {item.isBonusBuy && (
                        <span className="px-1.5 py-0.2 rounded bg-red-900/60 border border-red-400 text-[8px] font-bold text-red-200 uppercase">
                          Bonus Buy
                        </span>
                      )}
                      {item.isFreeSpin && (
                        <span className="px-1.5 py-0.2 rounded bg-yellow-900/60 border border-yellow-400 text-[8px] font-bold text-yellow-200 uppercase">
                          Free Spin
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#cfd6e4] mt-0.5">
                      Bet: <strong>৳{(item.bet ?? 0).toFixed(2)}</strong> | Mult: <strong>×{item.maxMultiplier ?? 1}</strong>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-['MStiffHei_PRC_UltraBold'] font-black text-sm tabular-nums ${
                        isWin ? 'text-[#f6d478]' : 'text-[#aab]'
                      }`}
                    >
                      {isWin ? `+৳${(item.win ?? 0).toFixed(2)}` : '৳0.00'}
                    </div>
                    {item.freeSpinsAwarded > 0 && (
                      <div className="text-[10px] text-yellow-300 font-bold flex items-center justify-end gap-1">
                        <Sparkles className="w-3 h-3 text-yellow-400" />
                        <span>+{item.freeSpinsAwarded} FS</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#22304a] bg-[#0a1526] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-gradient-to-b from-[#ffe9a8] via-[#f2b83c] to-[#d07810] text-[#7a1000] font-black text-xs uppercase tracking-wider cursor-pointer active:scale-95"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
