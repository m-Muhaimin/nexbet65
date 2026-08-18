import React from 'react';
import { Menu, ShoppingCart, Crown, Sparkles, Trophy } from 'lucide-react';
import { GameMode, TournamentData } from '../types';
import { VaultHUDButton } from './VaultHUDButton';

interface HeaderBarProps {
  onOpenMenu: () => void;
  onOpenBuyBonus: () => void;
  onOpenVault: () => void;
  onOpenVIP: () => void;
  gameMode: GameMode;
  onToggleGameMode: (mode: GameMode) => void;
  vaultBalance: number;
  vipTier: string;
  isFreeSpinsActive?: boolean;
  hasVaultDepositAnim?: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = React.memo(({
  onOpenMenu,
  onOpenBuyBonus,
  onOpenVault,
  onOpenVIP,
  gameMode,
  onToggleGameMode,
  vaultBalance,
  vipTier,
  isFreeSpinsActive = false,
  hasVaultDepositAnim = false,
}) => {
  return (
    <header className="relative w-full z-20 pt-1 pb-0.5 px-2.5 flex items-center justify-between select-none gap-2">
      {/* 1. Left: Menu Button & VIP Tier pill */}
      <div className="flex items-center gap-1.5">
        <button
          id="menuBtn"
          onClick={onOpenMenu}
          aria-label="Open Menu"
          className="w-8 h-8 rounded-full bg-[#0d1726]/90 border border-[#1e2e48] flex items-center justify-center text-[#f6d478] hover:border-[#f6b01a] active:scale-95 transition-all cursor-pointer shadow-sm"
        >
          <Menu className="w-4 h-4 text-[#f6d478]" />
        </button>

        {/* VIP Tier Badge / Club Trigger */}
        <button
          onClick={onOpenVIP}
          className="h-8 px-2 rounded-full bg-gradient-to-r from-amber-950/80 to-stone-900 border border-amber-500/50 flex items-center gap-1 text-[10px] text-amber-300 font-bold hover:border-amber-400 active:scale-95 transition-all cursor-pointer shadow-sm hidden xs:flex"
        >
          <Crown className="w-3 h-3 text-yellow-300" />
          <span>{vipTier}</span>
        </button>
      </div>

      {/* 2. Center: Logo, Switcher, and Tickers in a Unified Layout */}
      <div className="flex flex-col items-center justify-center min-w-0 flex-1">
        {/* Mode Toggle Switcher - More compact */}
        <div className="flex items-center p-0.5 bg-[#060a12] border border-[#22304a] rounded-full shadow-inner mb-1 scale-75 sm:scale-90">
          <button
            type="button"
            onClick={() => onToggleGameMode('classic')}
            className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              gameMode === 'classic'
                ? 'bg-gradient-to-r from-[#ffe9a8] to-[#d07810] text-[#7a1000] shadow-[0_0_8px_rgba(246,176,26,0.6)]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Classic
          </button>
          <button
            type="button"
            onClick={() => onToggleGameMode('deluxe')}
            className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-0.5 ${
              gameMode === 'deluxe'
                ? 'bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.8)]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Crown className="w-2 h-2 text-yellow-300" />
            Deluxe
          </button>
        </div>

        {/* Unified Single Row: Logo */}
        <div className="flex items-center gap-1.5 w-full justify-center">
          {/* Logo */}
          <div className="title-superace uppercase text-xs sm:text-sm leading-none shrink-0 tracking-tighter">
            SuperAce {gameMode === 'deluxe' && <span className="text-pink-400 text-[10px]">DX</span>}
          </div>
        </div>
      </div>

      {/* 3. Right: Vault HUD Button & Buy Bonus */}
      <div className="flex items-center gap-1.5">
        <VaultHUDButton
          balance={vaultBalance}
          onClick={onOpenVault}
          hasRecentDeposit={hasVaultDepositAnim}
        />

        <button
          id="buyBtn"
          onClick={onOpenBuyBonus}
          disabled={isFreeSpinsActive}
          aria-label="Buy Bonus"
          className="h-8 px-2.5 rounded-full bg-gradient-to-b from-[#ff7a45] to-[#c01e0e] border border-[#ffd25e] shadow-[0_2px_8px_rgba(192,30,14,0.7)] flex items-center gap-1 text-white active:scale-95 hover:brightness-110 disabled:opacity-50 cursor-pointer transition-all shrink-0"
        >
          <ShoppingCart className="w-3.5 h-3.5 text-[#fff6d8]" />
          <span className="font-['Georgia'] font-black text-[9px] text-white tracking-wider uppercase hidden xxs:inline">
            BUY BONUS
          </span>
        </button>
      </div>
    </header>
  );
});
