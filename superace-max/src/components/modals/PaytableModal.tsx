import React from 'react';
import { motion } from 'motion/react';
import { X, Sparkles, Zap, DollarSign, Crown, Flame, Trophy, Lock } from 'lucide-react';
import { SYMBOLS } from '../../utils/symbols';
import { SymbolArtwork } from '../SymbolArtwork';
import { SymbolType } from '../../types';

interface PaytableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaytableModal: React.FC<PaytableModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const symbolList: SymbolType[] = ['A', 'K', 'Q', 'J', 'S', 'G', 'JK', 'SC'];

  return (
    <div className="fixed inset-0 bg-black/85 z-[70] flex items-center justify-center p-3 backdrop-blur-md select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md max-h-[88vh] bg-gradient-to-b from-[#132036] via-[#0a1424] to-[#040810] border-2 border-[#b98a2e] rounded-2xl flex flex-col shadow-[0_12px_40px_rgba(0,0,0,0.95)] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-[#22304a] flex items-center justify-between bg-[#0a1526]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#f6b01a]" />
            <h2 className="font-['Georgia'] font-black text-lg text-[#fff6d8] uppercase tracking-wide">
              SuperAce Deluxe Paytable & Rules
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-xs">
          {/* 1024 Ways Rule Banner */}
          <div className="p-3 rounded-xl bg-[#0d1728] border border-[#a07830]/60 flex flex-col gap-1 shadow-inner">
            <span className="font-['Georgia'] font-black text-sm text-[#f6d478] uppercase">
              1,024 Ways to Win & Cascades
            </span>
            <p className="text-[#cfd6e4] leading-relaxed">
              Match 3 or more symbols on adjacent reels starting from the leftmost reel. Winning symbols are eliminated and new cards cascade down for consecutive wins!
            </p>
          </div>

          {/* GR-1: Golden Joker Expanding Wilds */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-[#31081a] via-[#1a050f] to-[#0d1728] border border-pink-500/60 flex flex-col gap-1.5 shadow-inner">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-pink-400" />
              <span className="font-['Georgia'] font-black text-sm text-pink-300 uppercase">
                GR-1: Golden Joker Expanding Wilds
              </span>
            </div>
            <p className="text-[#cfd6e4] leading-relaxed">
              In <strong>Super Ace Deluxe</strong> mode, Golden Jokers appear on reels 2, 3, and 4. When a Golden Joker is involved in a winning combination, it <strong className="text-pink-300">expands across the entire 4-row column</strong> and becomes a Sticky Wild for all following cascades in that spin!
            </p>
          </div>

          {/* GR-2: Overdrive Multiplier Elimination Ladder */}
          <div className="p-3 rounded-xl bg-[#0d1728] border border-[#a07830]/60 flex flex-col gap-2 shadow-inner">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span className="font-['Georgia'] font-black text-sm text-[#f6d478] uppercase">
                GR-2: Overdrive Multiplier Ladders
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 rounded bg-[#132036] border border-[#1e2e48]">
                <div className="text-[10px] text-zinc-400 font-bold">CLASSIC BASE</div>
                <div className="font-['Georgia'] font-black text-xs text-[#f6d478] mt-1">
                  ×1 → ×2 → ×3 → ×5
                </div>
              </div>
              <div className="p-2 rounded bg-[#132036] border border-[#1e2e48]">
                <div className="text-[10px] text-zinc-400 font-bold">CLASSIC FREE SPINS</div>
                <div className="font-['Georgia'] font-black text-xs text-yellow-300 mt-1">
                  ×2 → ×4 → ×6 → ×10
                </div>
              </div>
              <div className="p-2 rounded bg-[#132036] border border-pink-500/30">
                <div className="text-[10px] text-pink-300 font-bold">DELUXE BASE</div>
                <div className="font-['Georgia'] font-black text-xs text-[#f6d478] mt-1">
                  ×1 → ×2 → ×3 → ×5 → <span className="text-red-400 font-black">×15</span>
                </div>
              </div>
              <div className="p-2 rounded bg-[#132036] border border-pink-500/30">
                <div className="text-[10px] text-pink-300 font-bold">DELUXE FREE SPINS</div>
                <div className="font-['Georgia'] font-black text-xs text-yellow-300 mt-1">
                  ×2 → ×4 → ×6 → ×10 → <span className="text-red-400 font-black">×25</span>
                </div>
              </div>
            </div>
          </div>

          {/* GR-3: Mega-Symbols */}
          <div className="p-3 rounded-xl bg-[#0d1728] border border-[#a07830]/60 flex flex-col gap-1.5 shadow-inner">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="font-['Georgia'] font-black text-sm text-[#f6d478] uppercase">
                GR-3: 2×2 & 3×3 Mega-Symbols
              </span>
            </div>
            <p className="text-[#cfd6e4] leading-relaxed">
              Deluxe Free Spins feature massive 2×2 and 3×3 Mega-Symbols dropping on the central reels, creating explosive multi-way line hits!
            </p>
          </div>

          {/* RH-1 & RH-2: Vault & Tournaments */}
          <div className="p-3 rounded-xl bg-[#08111e] border border-sky-500/40 flex flex-col gap-1.5 shadow-inner">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-sky-400" />
              <span className="font-['Georgia'] font-black text-sm text-sky-300 uppercase">
                Retention Ecosystem (Vault & Tournaments)
              </span>
            </div>
            <p className="text-[#cfd6e4] leading-relaxed">
              <strong>Deluxe Vault:</strong> 5% of every Big Win (≥20x) is stored in your personal profit locker to harvest at will.
              <br />
              <strong>Live Tournament:</strong> Climb real-time standings on the live leaderboard for top cash prizes!
            </p>
          </div>

          {/* Symbol Payouts List */}
          <div className="flex flex-col gap-2">
            <span className="font-['Georgia'] font-black text-sm text-[#f6d478] uppercase">
              Symbol Payouts (× Bet)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {symbolList.map((symKey) => {
                const info = SYMBOLS[symKey];
                return (
                  <div
                    key={symKey}
                    className="p-2 rounded-xl bg-[#0d1728] border border-[#1e2e48] flex items-center gap-2.5"
                  >
                    <div className="w-11 h-14 shrink-0 rounded overflow-hidden border border-white/10 bg-black/40">
                      <SymbolArtwork symbol={symKey} />
                    </div>
                    <div className="flex flex-col flex-1 leading-tight">
                      <span className="font-bold text-white text-xs">{info.name}</span>
                      <span className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">
                        {info.description}
                      </span>
                      <div className="flex gap-2 text-[10px] font-mono text-[#f6b01a] mt-1">
                        <span>5: {info.payouts[5]}×</span>
                        <span>4: {info.payouts[4]}×</span>
                        <span>3: {info.payouts[3]}×</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
