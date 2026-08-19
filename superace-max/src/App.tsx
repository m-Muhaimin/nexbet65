import React, { useEffect, useRef, useCallback } from 'react';
import { HeaderBar } from './components/HeaderBar';
import { MultiplierBar } from './components/MultiplierBar';
import { ReelGridPhaser } from './components/ReelGridPhaser';
import { ControlBar } from './components/ControlBar';
import { FooterBar } from './components/FooterBar';
import { NavigationDrawer } from './components/NavigationDrawer';
import { CanvasParticleLayer } from './components/CanvasParticleLayer';
import { CardDefs } from './components/CardDefs';
import { GameBackground } from './components/GameBackground';
import { ModalManager } from './components/ModalManager';

import { useGameStore } from './stores/gameStore';
import { useWalletStore } from './stores/walletStore';
import { useVaultStore } from './stores/vaultStore';
import { useJackpotStore } from './stores/jackpotStore';
import { useBoostStore } from './stores/boostStore';
import { useSessionStore } from './stores/sessionStore';
import { useUIStore } from './stores/uiStore';

import { executeSpin, type SpinContext } from './engine/spinOrchestrator';
import { engine } from './engine/clientEngine';
import { saveGameState } from './engine/api';
import { track } from './engine/analytics';
import { generateInitialGrid } from './utils/mathEngine';
import { sound } from './engine/audioService';
import type { GameMode } from './types';

export default function App() {
  const game = useGameStore((s) => s.game);
  const freeSpins = useGameStore((s) => s.freeSpins);
  const wallet = useWalletStore();
  const vault = useVaultStore();
  const jackpot = useJackpotStore();
  const boost = useBoostStore();
  const session = useSessionStore();
  const ui = useUIStore();

  const quickStopRef = useRef<boolean>(false);
  const activeDelaysRef = useRef<(() => void)[]>([]);
  const isSpinningRef = useRef<boolean>(false);
  const spinCtx: SpinContext = { quickStopRef, activeDelaysRef, isSpinningRef };
  const level = 1;

  // ─── Effects ─────────────────────────────────────────────────────────────
  useEffect(() => { sound.setMuted(session.isMuted); }, [session.isMuted]);

  useEffect(() => {
    Promise.all([engine.getBalance(), engine.loadState()]).then(([bal, gs]) => {
      useWalletStore.getState().setBalance(bal);
      if (gs) {
        useGameStore.getState().setGameMode(gs.gameMode as GameMode);
        useSessionStore.getState().setIsMuted(gs.isMuted);
        useSessionStore.getState().setIsTurbo(gs.isTurbo);
        useSessionStore.getState().setCurrentBet(gs.betAmount > 0 ? gs.betAmount : 10);
        useGameStore.getState().setFreeSpinsRemaining(gs.freeSpinsLeft);
        useGameStore.getState().setFreeSpinsTotal(gs.freeSpinsTotal);
        useGameStore.getState().setFreeSpinsAccumulatedWin(gs.freeSpinsWin);
        useWalletStore.getState().setTotalBetsPlaced(gs.totalBets);
        useVaultStore.getState().updateFromGameState(gs.vaultBalance, gs.vaultHarvested);
        useBoostStore.getState().setData({ loyaltyPoints: gs.loyaltyPoints, vipTier: gs.vipTier as any });
        useGameStore.getState().setSpinCount(gs.spinCount);
        const { grid: initialGrid } = generateInitialGrid(gs.gameMode as GameMode);
        useGameStore.getState().setGrid(initialGrid);
      }
      useWalletStore.getState().setBalanceLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (wallet.displayedWin === wallet.currentWin) return;
    const diff = wallet.currentWin - wallet.displayedWin;
    const step = Math.max(0.01, Math.abs(diff) / 10);
    const timeout = setTimeout(() => {
      if (Math.abs(diff) < 0.02) {
        useWalletStore.getState().setDisplayedWin(wallet.currentWin);
      } else {
        useWalletStore.getState().setDisplayedWin(Number((wallet.displayedWin + (diff > 0 ? step : -step)).toFixed(2)));
      }
    }, 35);
    return () => clearTimeout(timeout);
  }, [wallet.currentWin, wallet.displayedWin]);

  useEffect(() => {
    const timer = setInterval(() => useBoostStore.getState().decrementHour(), 3600000);
    return () => clearInterval(timer);
  }, []);

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleQuickStop = useCallback(() => {
    if (!isSpinningRef.current || quickStopRef.current) return;
    quickStopRef.current = true;
    sound.reelStop(4);
    activeDelaysRef.current.forEach((fn) => fn());
    activeDelaysRef.current = [];
    useGameStore.getState().setSpinningColumns([false, false, false, false, false]);
  }, []);

  const handleSpin = useCallback(async (isBonusBuy = false, isDeluxeBonusBuy = false) => {
    track('spin_start', { bonusBuy: isBonusBuy, deluxe: isDeluxeBonusBuy });
    await executeSpin(isBonusBuy, isDeluxeBonusBuy, spinCtx);
  }, []);

  useEffect(() => {
    if (ui.isAnyModalOpen()) return;
    if (freeSpins.isActive && freeSpins.remaining > 0) {
      const t = setTimeout(() => handleSpin(), session.isTurbo ? 600 : 1500);
      return () => clearTimeout(t);
    }
    if (session.autoSpinsRemaining > 0) {
      const t = setTimeout(() => handleSpin(), session.isTurbo ? 600 : 1500);
      return () => clearTimeout(t);
    }
  }, [session.autoSpinsRemaining, freeSpins.remaining, handleSpin, ui.isAnyModalOpen, freeSpins.isActive, game.isSpinning, session.isTurbo]);

  const handleStartFreeSpins = () => {
    useUIStore.getState().setModal('isFreeSpinsIntroOpen', false);
    useGameStore.getState().setFreeSpinsActive(true);
    useGameStore.getState().setFreeSpinsRemaining(ui.awardedSpinsCount);
    useGameStore.getState().setFreeSpinsTotal(ui.awardedSpinsCount);
    useGameStore.getState().setFreeSpinsAccumulatedWin(0);
    sound.buttonClick();
  };

  const handleConfirmBuyBonus = (isDeluxe: boolean) => {
    useUIStore.getState().setModal('isBuyBonusOpen', false);
    sound.buttonClick();
    handleSpin(true, isDeluxe);
  };

  const handleHarvestVault = () => {
    if (vault.balance <= 0) return;
    const harvestAmount = vault.balance;
    useWalletStore.getState().setBalance(Number((wallet.balance + harvestAmount).toFixed(2)));
    useVaultStore.getState().setBalance(0);
    useVaultStore.getState().setTotalHarvested(Number((vault.totalHarvested + harvestAmount).toFixed(2)));
    useVaultStore.getState().addTransaction({
      id: `tx_${Date.now()}`, timestamp: Date.now(), amount: harvestAmount, type: 'DIVIDEND_HARVEST',
    });
    sound.orchestralBigWinFanfare('big');
    useUIStore.getState().setModal('isVaultOpen', false);
  };

  const handleAcceptWithdrawalBonus = (bonusCredits: number) => {
    useWalletStore.getState().setBalance(Number((wallet.balance + bonusCredits).toFixed(2)));
    useUIStore.getState().setModal('isWithdrawalInterceptOpen', false);
    sound.orchestralBigWinFanfare('mega');
  };

  const defaultBet = session.currentBet > 0 ? session.currentBet : 10;

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div
      className={`relative w-full h-[100dvh] max-w-[440px] mx-auto flex flex-col justify-between overflow-hidden text-[#fff6d8] font-['Georgia'] select-none ${ui.screenShakeClass}`}
      style={{ background: 'transparent', transition: 'background 1.2s ease-in-out' }}
    >
      <CardDefs />
      <CanvasParticleLayer vaultTriggerKey={vault.depositAnimKey} />
      <GameBackground gameMode={game.gameMode} isActive={freeSpins.isActive} />

      <HeaderBar
        onOpenMenu={() => useUIStore.getState().setModal('isMenuOpen', true)}
        onOpenBuyBonus={() => useUIStore.getState().setModal('isBuyBonusOpen', true)}
        onOpenVault={() => useUIStore.getState().setModal('isVaultOpen', true)}
        onOpenVIP={() => useUIStore.getState().setModal('isVIPClubOpen', true)}
        gameMode={game.gameMode}
        onToggleGameMode={(mode) => {
          if (game.isSpinning || freeSpins.isActive) return;
          useGameStore.getState().setGameMode(mode);
          saveGameState({ gameMode: mode });
          sound.buttonClick();
          useGameStore.getState().setGrid(generateInitialGrid(mode).grid);
        }}
        vaultBalance={vault.balance}
        vipTier={boost.vipTier}
        isFreeSpinsActive={freeSpins.isActive}
        hasVaultDepositAnim={vault.depositAnimKey > 0}
      />

      <MultiplierBar
        currentMultiplier={game.comboMultiplier}
        isFreeSpinsActive={freeSpins.isActive}
        freeSpinsRemaining={freeSpins.remaining}
        scattersCount={game.scattersCount}
        gameMode={game.gameMode}
        isOverdriveActive={game.isOverdriveActive}
      />

      <div className="relative flex-1 min-h-0">
        <ReelGridPhaser
          grid={game.grid}
          spinningColumns={game.spinningColumns}
          waysHits={game.currentWaysHits}
          isSpinning={game.isSpinning}
          spinCount={game.spinCount}
          cascadeDepth={game.cascadeDepth}
          comboMultiplier={game.comboMultiplier}
          isFreeSpinsActive={freeSpins.isActive}
          activeRippleColumns={game.ripple.columns}
          activeRippleCells={game.ripple.cells}
          rippleTriggerKey={game.ripple.triggerKey}
          lastSpinWin={wallet.lastSpinWin}
          gameMode={game.gameMode}
          onQuickStop={handleQuickStop}
        />
      </div>

      <ControlBar
        balance={wallet.balance}
        bet={defaultBet}
        win={wallet.currentWin}
        displayedWin={wallet.displayedWin}
        isBalancePulsing={wallet.isBalancePulsing}
        isSpinning={game.isSpinning}
        isTurbo={session.isTurbo}
        autoSpinsRemaining={session.autoSpinsRemaining}
        isFreeSpinsActive={freeSpins.isActive}
        freeSpinsRemaining={freeSpins.remaining}
        freeSpinsTotal={freeSpins.total}
        onSpin={() => handleSpin(false)}
        onBetChange={(b) => {
          useSessionStore.getState().setCurrentBet(b);
          saveGameState({ betAmount: b });
          sound.buttonClick();
        }}
        onToggleTurbo={() => {
          useSessionStore.getState().setIsTurbo(!session.isTurbo);
          saveGameState({ isTurbo: !session.isTurbo });
          sound.buttonClick();
        }}
        onOpenBetSelector={() => {
          if (!game.isSpinning && !freeSpins.isActive) {
            useUIStore.getState().setModal('isBetSelectorOpen', true);
            sound.buttonClick();
          }
        }}
        onOpenAutoplay={() => {
          if (!game.isSpinning && !freeSpins.isActive) {
            useUIStore.getState().setModal('isAutoplayModalOpen', true);
            sound.buttonClick();
          }
        }}
        onStopAutoplay={() => {
          useSessionStore.getState().setAutoSpinsRemaining(0);
          sound.buttonClick();
        }}
      />

      <FooterBar
        balance={wallet.balance}
        level={level}
        isBalancePulsing={wallet.isBalancePulsing}
        lastAddedWin={wallet.lastAddedWin}
        isMuted={session.isMuted}
        onToggleMute={() => {
          useSessionStore.getState().setIsMuted(!session.isMuted);
          saveGameState({ isMuted: !session.isMuted });
        }}
        jackpotValue={jackpot.value}
        onOpenTournament={() => useUIStore.getState().setModal('isTournamentOpen', true)}
      />

      <NavigationDrawer
        isOpen={ui.isMenuOpen}
        onClose={() => useUIStore.getState().setModal('isMenuOpen', false)}
        onOpenPaytable={() => useUIStore.getState().setModal('isPaytableOpen', true)}
        onOpenHistory={() => useUIStore.getState().setModal('isHistoryOpen', true)}
        onOpenSettings={() => useUIStore.getState().setModal('isSettingsOpen', true)}
        onOpenBuyBonus={() => useUIStore.getState().setModal('isBuyBonusOpen', true)}
        onOpenVault={() => useUIStore.getState().setModal('isVaultOpen', true)}
        onOpenTournament={() => useUIStore.getState().setModal('isTournamentOpen', true)}
        onOpenVIP={() => useUIStore.getState().setModal('isVIPClubOpen', true)}
        onOpenWithdrawal={() => useUIStore.getState().setModal('isWithdrawalInterceptOpen', true)}
        isMuted={session.isMuted}
        onToggleMute={() => {
          useSessionStore.getState().setIsMuted(!session.isMuted);
          saveGameState({ isMuted: !session.isMuted });
        }}
      />

      <ModalManager
        onConfirmBuyBonus={handleConfirmBuyBonus}
        onStartFreeSpins={handleStartFreeSpins}
        onHarvestVault={handleHarvestVault}
        onAcceptWithdrawalBonus={handleAcceptWithdrawalBonus}
      />
    </div>
  );
}
