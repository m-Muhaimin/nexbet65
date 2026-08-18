import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  HelpCircle,
  History,
  Settings,
  Volume2,
  VolumeX,
  Sparkles,
  Crown,
  Trophy,
  Lock,
  ArrowUpRight,
} from 'lucide-react';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPaytable: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenBuyBonus: () => void;
  onOpenVault: () => void;
  onOpenTournament: () => void;
  onOpenVIP: () => void;
  onOpenWithdrawal: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onTopUpBalance?: () => void;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = React.memo(({
  isOpen,
  onClose,
  onOpenPaytable,
  onOpenHistory,
  onOpenSettings,
  onOpenBuyBonus,
  onOpenVault,
  onOpenTournament,
  onOpenVIP,
  onOpenWithdrawal,
  isMuted,
  onToggleMute,
  onTopUpBalance,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Dim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 z-[80] backdrop-blur-[2px]"
          />

          {/* Slide-in 260px Left Drawer */}
          <motion.aside
            id="drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.28, ease: 'easeOut' }}
            className="fixed top-0 bottom-0 left-0 w-[260px] bg-[#0d1424] border-r-2 border-[#b98a2e] z-[85] p-4 flex flex-col justify-between shadow-[8px_0_30px_rgba(0,0,0,0.9)] select-none overflow-y-auto"
          >
            {/* Header / Brand */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#22304a]">
                <div>
                  <div className="text-[14px] font-bold text-[#f6a41c] tracking-widest uppercase" style={{ fontFamily: 'Noto Sans Symbols' }}>
                    NexBet65
                  </div>
                  <div className="title-superace text-xl">
                    SuperAce <span className="text-pink-400 text-xs">DELUXE</span>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  aria-label="Close Drawer"
                  className="w-8 h-8 rounded-full btn-dark flex items-center justify-center text-[#cfd6e4] hover:text-white cursor-pointer active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Link Rows */}
              <div className="flex flex-col gap-1.5 mt-3">
                <button
                  onClick={() => {
                    onClose();
                    onOpenPaytable();
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-[#132036]/60 border border-[#22304a] hover:border-[#b98a2e] flex items-center gap-3 text-xs font-semibold text-[#e8d9b0] hover:text-[#fff6d8] transition-colors cursor-pointer text-left"
                >
                  <HelpCircle className="w-4 h-4 text-[#f6d478]" />
                  <span>Paytable & Rules</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenVault();
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-gradient-to-r from-[#2a1b0e]/60 to-[#132036]/60 border border-amber-500/40 hover:border-amber-400 flex items-center gap-3 text-xs font-semibold text-amber-200 hover:text-white transition-colors cursor-pointer text-left"
                >
                  <Crown className="w-4 h-4 text-yellow-400" />
                  <span>Deluxe Vault (Profit Locker)</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenTournament();
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-[#132036]/60 border border-[#22304a] hover:border-sky-400 flex items-center gap-3 text-xs font-semibold text-sky-200 hover:text-white transition-colors cursor-pointer text-left"
                >
                  <Trophy className="w-4 h-4 text-sky-400" />
                  <span>Live Tournament Standings</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenVIP();
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-[#132036]/60 border border-[#22304a] hover:border-[#b98a2e] flex items-center gap-3 text-xs font-semibold text-[#e8d9b0] hover:text-[#fff6d8] transition-colors cursor-pointer text-left"
                >
                  <Crown className="w-4 h-4 text-pink-400" />
                  <span>VIP Club & Beginner Boost</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenBuyBonus();
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-[#132036]/60 border border-[#22304a] hover:border-[#b98a2e] flex items-center gap-3 text-xs font-semibold text-[#e8d9b0] hover:text-[#fff6d8] transition-colors cursor-pointer text-left"
                >
                  <Sparkles className="w-4 h-4 text-[#ff7a45]" />
                  <span>Buy Bonus Rounds</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenHistory();
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-[#132036]/60 border border-[#22304a] hover:border-[#b98a2e] flex items-center gap-3 text-xs font-semibold text-[#e8d9b0] hover:text-[#fff6d8] transition-colors cursor-pointer text-left"
                >
                  <History className="w-4 h-4 text-[#f6d478]" />
                  <span>Spin History</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenWithdrawal();
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 hover:border-emerald-400 flex items-center gap-3 text-xs font-semibold text-emerald-200 hover:text-white transition-colors cursor-pointer text-left"
                >
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  <span>Withdraw / Cashier Offers</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenSettings();
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-[#132036]/60 border border-[#22304a] hover:border-[#b98a2e] flex items-center gap-3 text-xs font-semibold text-[#e8d9b0] hover:text-[#fff6d8] transition-colors cursor-pointer text-left"
                >
                  <Settings className="w-4 h-4 text-[#f6d478]" />
                  <span>Game Settings</span>
                </button>

                <button
                  onClick={onToggleMute}
                  className="w-full px-3 py-2 rounded-lg bg-[#132036]/60 border border-[#22304a] hover:border-[#b98a2e] flex items-center justify-between text-xs font-semibold text-[#e8d9b0] hover:text-[#fff6d8] transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-red-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-[#2ecc71]" />
                    )}
                    <span>Sound Effects</span>
                  </div>
                  <span className="text-[10px] text-[#aab]">
                    {isMuted ? 'OFF' : 'ON'}
                  </span>
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
});
