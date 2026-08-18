/**
 * ModalManager — renders all modals from store state.
 *
 * Reads modal visibility from uiStore, reads data from other stores,
 * and performs simple mutations (close, toggle, etc.) directly.
 *
 * Callbacks that need refs (spin, quick-stop) are passed as props.
 */

import React from 'react';
import {
  LazyBuyBonusModal,
  LazyFreeSpinsIntroModal,
  LazyFreeSpinsSummaryModal,
  LazyBigWinCelebration,
  LazyPaytableModal,
  LazyHistoryModal,
  LazySettingsModal,
  LazyBetSelectorModal,
  LazyAutoplayModal,
  LazyVaultModal,
  LazyVIPClubModal,
  LazyWithdrawalInterceptModal,
  LazyJackpotModal,
} from './LazyModals';
import { useGameStore } from '../stores/gameStore';
import { useWalletStore } from '../stores/walletStore';
import { useVaultStore } from '../stores/vaultStore';
import { useJackpotStore } from '../stores/jackpotStore';
import { useBoostStore } from '../stores/boostStore';
import { useSessionStore } from '../stores/sessionStore';
import { useUIStore } from '../stores/uiStore';
import { useHistoryStore } from '../stores/historyStore';
import { saveGameState } from '../engine/api';

interface ModalManagerProps {
  onConfirmBuyBonus: (isDeluxe: boolean) => void;
  onStartFreeSpins: () => void;
  onHarvestVault: () => void;
  onAcceptWithdrawalBonus: (bonusCredits: number) => void;
}

export const ModalManager: React.FC<ModalManagerProps> = ({
  onConfirmBuyBonus,
  onStartFreeSpins,
  onHarvestVault,
  onAcceptWithdrawalBonus,
}) => {
  const ui = useUIStore();
  const wallet = useWalletStore();
  const freeSpins = useGameStore((s) => s.freeSpins);
  const history = useHistoryStore();
  const session = useSessionStore();
  const vault = useVaultStore();
  const boost = useBoostStore();
  const jackpot = useJackpotStore();
  const defaultBet = wallet.totalBetsPlaced > 0 ? wallet.totalBetsPlaced : 10;

  const close = (key: 'isBuyBonusOpen' | 'isFreeSpinsIntroOpen' | 'isFreeSpinsSummaryOpen' | 'isPaytableOpen' | 'isHistoryOpen' | 'isSettingsOpen' | 'isBetSelectorOpen' | 'isAutoplayModalOpen' | 'isVaultOpen' | 'isVIPClubOpen' | 'isJackpotOpen' | 'isWithdrawalInterceptOpen' | 'isTournamentOpen' | 'isMenuOpen') =>
    () => useUIStore.getState().setModal(key, false);

  const handleToggleTurbo = () => {
    useSessionStore.getState().setIsTurbo(!session.isTurbo);
    saveGameState({ isTurbo: !session.isTurbo });
  };

  const handleToggleMute = () => {
    useSessionStore.getState().setIsMuted(!session.isMuted);
    saveGameState({ isMuted: !session.isMuted });
  };

  return (
    <>
      <LazyBuyBonusModal
        isOpen={ui.isBuyBonusOpen}
        bet={defaultBet}
        balance={wallet.balance}
        onClose={close('isBuyBonusOpen')}
        onConfirmBuy={onConfirmBuyBonus}
      />

      <LazyFreeSpinsIntroModal
        isOpen={ui.isFreeSpinsIntroOpen}
        freeSpinsCount={ui.awardedSpinsCount}
        onStartFreeSpins={onStartFreeSpins}
      />

      <LazyFreeSpinsSummaryModal
        isOpen={ui.isFreeSpinsSummaryOpen}
        totalWin={freeSpins.accumulatedWin}
        bet={defaultBet}
        totalSpins={freeSpins.total}
        onClose={close('isFreeSpinsSummaryOpen')}
      />

      <LazyBigWinCelebration
        isOpen={ui.celebrationWinAmount > 0}
        winAmount={ui.celebrationWinAmount}
        bet={defaultBet}
        onClose={() => useUIStore.getState().setCelebrationWinAmount(0)}
        onComplete={() => useUIStore.getState().setCelebrationWinAmount(0)}
      />

      <LazyPaytableModal isOpen={ui.isPaytableOpen} onClose={close('isPaytableOpen')} />

      <LazyHistoryModal
        isOpen={ui.isHistoryOpen}
        history={history.items}
        onClose={close('isHistoryOpen')}
      />

      <LazySettingsModal
        isOpen={ui.isSettingsOpen}
        isTurbo={session.isTurbo}
        onToggleTurbo={handleToggleTurbo}
        isMuted={session.isMuted}
        onToggleMute={handleToggleMute}
        onClose={close('isSettingsOpen')}
      />

      <LazyBetSelectorModal
        isOpen={ui.isBetSelectorOpen}
        currentBet={defaultBet}
        balance={wallet.balance}
        onSelectBet={(b) => {
          useWalletStore.getState().setTotalBetsPlaced(b);
          saveGameState({ betAmount: b });
        }}
        onClose={close('isBetSelectorOpen')}
      />

      <LazyAutoplayModal
        isOpen={ui.isAutoplayModalOpen}
        onSelectAutoSpins={(count) => useSessionStore.getState().setAutoSpinsRemaining(count)}
        onClose={close('isAutoplayModalOpen')}
      />

      <LazyVaultModal
        isOpen={ui.isVaultOpen}
        onClose={close('isVaultOpen')}
        vaultData={vault}
        onHarvestDividend={onHarvestVault}
      />

      <LazyVIPClubModal
        isOpen={ui.isVIPClubOpen}
        onClose={close('isVIPClubOpen')}
        boostData={boost}
      />

      <LazyJackpotModal
        isOpen={ui.isJackpotOpen}
        onClose={close('isJackpotOpen')}
        jackpotValue={jackpot.value}
        totalBetsPlaced={wallet.totalBetsPlaced}
        betAmount={defaultBet}
      />

      <LazyWithdrawalInterceptModal
        isOpen={ui.isWithdrawalInterceptOpen}
        withdrawalAmount={500}
        onClose={close('isWithdrawalInterceptOpen')}
        onAcceptBonusMatch={onAcceptWithdrawalBonus}
        onConfirmWithdrawal={() => {
          useUIStore.getState().setModal('isWithdrawalInterceptOpen', false);
          alert('Withdrawal request of ৳500.00 processed to your linked payment method.');
        }}
      />
    </>
  );
};
