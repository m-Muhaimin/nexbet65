/**
 * LazyModals — React.lazy wrappers for all modal components.
 *
 * Each modal is code-split into its own chunk. They only load
 * when first rendered (when their isOpen flag becomes true).
 */

import React, { Suspense } from 'react';

function ModalFallback() {
  return null;
}

function lazyModal<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  const Lazy = React.lazy(factory);
  const Wrapper: React.FC<React.ComponentProps<T>> = (props) => (
    <Suspense fallback={<ModalFallback />}>
      <Lazy {...props} />
    </Suspense>
  );
  (Wrapper as any).displayName = `LazyModal(${(Lazy as any).displayName || 'Unknown'})`;
  return Wrapper as React.ComponentType<React.ComponentProps<T>>;
}

export const LazyBuyBonusModal = lazyModal(
  () => import('./modals/BuyBonusModal').then(m => ({ default: m.BuyBonusModal }))
);
export const LazyFreeSpinsIntroModal = lazyModal(
  () => import('./modals/FreeSpinsCelebrationModal').then(m => ({ default: m.FreeSpinsIntroModal }))
);
export const LazyFreeSpinsSummaryModal = lazyModal(
  () => import('./modals/FreeSpinsCelebrationModal').then(m => ({ default: m.FreeSpinsSummaryModal }))
);
export const LazyBigWinCelebration = lazyModal(
  () => import('./modals/BigWinCelebration').then(m => ({ default: m.BigWinCelebration }))
);
export const LazyPaytableModal = lazyModal(
  () => import('./modals/PaytableModal').then(m => ({ default: m.PaytableModal }))
);
export const LazyHistoryModal = lazyModal(
  () => import('./modals/HistoryModal').then(m => ({ default: m.HistoryModal }))
);
export const LazySettingsModal = lazyModal(
  () => import('./modals/SettingsModal').then(m => ({ default: m.SettingsModal }))
);
export const LazyBetSelectorModal = lazyModal(
  () => import('./modals/BetSelectorModal').then(m => ({ default: m.BetSelectorModal }))
);
export const LazyAutoplayModal = lazyModal(
  () => import('./modals/AutoplayModal').then(m => ({ default: m.AutoplayModal }))
);
export const LazyVaultModal = lazyModal(
  () => import('./modals/VaultModal').then(m => ({ default: m.VaultModal }))
);
export const LazyVIPClubModal = lazyModal(
  () => import('./modals/VIPClubModal').then(m => ({ default: m.VIPClubModal }))
);
export const LazyWithdrawalInterceptModal = lazyModal(
  () => import('./modals/WithdrawalInterceptModal').then(m => ({ default: m.WithdrawalInterceptModal }))
);
export const LazyJackpotModal = lazyModal(
  () => import('./modals/JackpotModal').then(m => ({ default: m.JackpotModal }))
);
export const LazyTournamentModal = lazyModal(
  () => import('./modals/TournamentModal').then(m => ({ default: m.TournamentModal }))
);
