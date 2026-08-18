import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Clock, Sparkles, Trophy, ArrowRight, History } from 'lucide-react';
import { VaultData } from '../../types';

interface VaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultData: VaultData;
  onHarvestDividend: () => void;
}

export const VaultModal: React.FC<VaultModalProps> = ({
  isOpen,
  onClose,
  vaultData,
  onHarvestDividend,
}) => {
  if (!isOpen) return null;

  const canHarvest = vaultData.balance > 0;

  return (
    <div
      id="vaultModalOverlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-md bg-gradient-to-b from-[#111827] via-[#0b0f19] to-[#04060a] border-2 border-[#ffd25e] rounded-[2px] p-5 shadow-[0_0_35px_rgba(246,176,26,0.35)] text-white flex flex-col gap-4 overflow-hidden"
      >
        {/* Top Gold Filigree Corner Accents */}
        <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-[#ffd25e] rounded-none" />
        <div className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-[#ffd25e]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-black font-black shadow-[0_0_12px_rgba(245,158,11,0.8)]">
              👑
            </div>
            <div>
              <h2 className="text-lg font-black text-[#ffd25e] uppercase tracking-wider font-['Georgia']">
                Deluxe VIP Vault
              </h2>
              <p className="text-[11px] text-zinc-400">
                Time-Gated Profit Locker (RH-1 Retention Protocol)
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

        {/* Vault Balance Display Card */}
        <div className="relative bg-gradient-to-br from-[#1c1917] via-[#292524] to-[#0c0a09] border border-[#a07830] rounded-xl p-4 flex flex-col items-center justify-center shadow-inner">
          <div className="text-xs uppercase tracking-widest text-[#f6d478] font-semibold mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Total Locked VIP Dividend
          </div>
          <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ffe9a8] via-[#f6b01a] to-[#d07810] tracking-tight font-['Georgia'] drop-shadow-md">
            ৳{(vaultData?.balance ?? 0).toFixed(2)}
          </div>
          <div className="text-[11px] text-amber-200/80 mt-1 flex items-center gap-1">
            <span>5% of every Big Win (≥20x) automatically accumulates here</span>
          </div>
        </div>

        {/* Profit Release Countdown */}
        <div className="bg-[#0f172a]/70 border border-[#334155] rounded-lg p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <Clock className="w-4 h-4 text-sky-400 animate-pulse" />
            <div>
              <div className="font-bold text-white">Next Automatic Unlock</div>
              <div className="text-[10px] text-zinc-400">Daily midnight server release</div>
            </div>
          </div>
          <div className="px-2.5 py-1 rounded bg-sky-950/80 border border-sky-600 text-sky-300 font-mono font-bold text-xs">
            14h 28m 42s
          </div>
        </div>

        {/* Action Button: Harvest / Break Vault */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onHarvestDividend}
            disabled={!canHarvest}
            className={`w-full py-3 rounded-[8px] font-black uppercase text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
              canHarvest
                ? 'bg-gradient-to-r from-[#ffe9a8] via-[#f6b01a] to-[#d07810] text-[#7a1000] hover:brightness-110 active:scale-[0.98] shadow-[0_0_20px_rgba(246,176,26,0.5)]'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-[12px]">Break Vault & Harvest ৳{(vaultData?.balance ?? 0).toFixed(2)}</span>
          </button>
          <p className="text-[10px] text-center text-zinc-400">
            Instant deposit to your playable bankroll with 0% wagering requirement.
          </p>
        </div>

        {/* Recent Vault Deposits Activity */}
        <div className="bg-[#080d18] border border-[#1e2e48] rounded-xl p-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold border-b border-white/5 pb-1">
            <span className="flex items-center gap-1">
              <History className="w-3 h-3 text-amber-400" />
              Vault Activity Log
            </span>
            <span className="text-[10px] text-zinc-500">
              Total Harvested: ৳{(vaultData?.totalHarvested ?? 0).toFixed(2)}
            </span>
          </div>
          <div className="max-h-24 overflow-y-auto flex flex-col gap-1 text-[11px] pr-1">
            {vaultData.transactions.length === 0 ? (
              <div className="text-zinc-500 text-center py-2 text-[10px]">
                Hit a Big Win (≥20x bet) in Deluxe mode to deposit gold coins into the vault!
              </div>
            ) : (
              vaultData.transactions.slice(0, 4).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between text-zinc-300">
                  <span className="text-zinc-400">
                    {tx.type === 'DEPOSIT_BIG_WIN' ? '💰 Big Win 5% Vault Lock' : '🎁 Dividend Harvest'}
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      tx.type === 'DEPOSIT_BIG_WIN' ? 'text-emerald-400' : 'text-amber-300'
                    }`}
                  >
                    {tx.type === 'DEPOSIT_BIG_WIN' ? '+' : '-'}৳{(tx.amount ?? 0).toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
