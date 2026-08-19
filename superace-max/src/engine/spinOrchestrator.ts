/**
 * Spin Orchestrator — executes the full spin lifecycle.
 *
 * Reads current state from stores, calls the server API,
 * animates reel stops and cascades, updates all related stores.
 *
 * Uses AnimationOrchestrator for sequenced delays that can be
 * flushed (quick-stopped), speed-adjusted, and debugged.
 */

import type { MutableRefObject } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useWalletStore } from '../stores/walletStore';
import { useVaultStore } from '../stores/vaultStore';
import { useJackpotStore } from '../stores/jackpotStore';
import { useBoostStore } from '../stores/boostStore';
import { useSessionStore } from '../stores/sessionStore';
import { useUIStore } from '../stores/uiStore';
import { useHistoryStore } from '../stores/historyStore';
import { apiSpin } from './api';
import { buildVisualGrid, buildCascadeVisuals } from './gridBuilder';
import { sound } from './audioService';
import { track } from './analytics';
import { BUY_BONUS_COST_CLASSIC, BUY_BONUS_COST_DELUXE } from '../utils/symbols';
import { bridge } from './PlatformBridge';
import type { GameMode } from '../types';

const MULTIPLIER_STEP_DELAY_NORMAL = 1000;
const MULTIPLIER_STEP_DELAY_TURBO = 450;

export interface SpinContext {
  quickStopRef: MutableRefObject<boolean>;
  activeDelaysRef: MutableRefObject<(() => void)[]>;
  isSpinningRef: MutableRefObject<boolean>;
}

/** A cancellable delay that returns immediately if cancelled. */
function waitDelay(
  ms: number,
  quickStopRef: MutableRefObject<boolean>,
  activeDelaysRef: MutableRefObject<(() => void)[]>
): Promise<void> {
  return new Promise<void>((resolve) => {
    if (quickStopRef.current) { resolve(); return; }
    let resolved = false;
    const timer = setTimeout(() => { if (!resolved) { resolved = true; resolve(); } }, ms);
    const canceler = () => {
      if (!resolved) { resolved = true; clearTimeout(timer); resolve(); }
    };
    activeDelaysRef.current.push(canceler);
  });
}

/** Check if a delay should be skipped due to quick-stop. */
function isCancelled(quickStopRef: MutableRefObject<boolean>): boolean {
  return quickStopRef.current;
}

/** Settle a deferred screen-shake clear. */
function deferShakeClear(
  className: string,
  ms: number,
  activeDelaysRef: MutableRefObject<(() => void)[]>
): void {
  let cancelled = false;
  const timer = setTimeout(() => {
    if (!cancelled) useUIStore.getState().setScreenShakeClass('');
  }, ms);
  activeDelaysRef.current.push(() => {
    cancelled = true;
    clearTimeout(timer);
  });
}

export async function executeSpin(
  isBonusBuy: boolean,
  isDeluxeBonusBuy: boolean,
  ctx: SpinContext
): Promise<void> {
  const { quickStopRef, activeDelaysRef, isSpinningRef } = ctx;

  if (isSpinningRef.current) return;

  const g = useGameStore.getState().game;
  const fs = useGameStore.getState().freeSpins;
  const w = useWalletStore.getState();
  const s = useSessionStore.getState();
  const vault = useVaultStore.getState();

  const defaultBet = s.currentBet > 0 ? s.currentBet : 10;
  const bonusBuyCost = isDeluxeBonusBuy
    ? g.gameMode === 'deluxe' ? defaultBet * BUY_BONUS_COST_DELUXE : defaultBet * BUY_BONUS_COST_CLASSIC
    : defaultBet * BUY_BONUS_COST_CLASSIC;
  const spinCost = isBonusBuy ? bonusBuyCost : fs.isActive ? 0 : defaultBet;

  if (!fs.isActive && w.balance < spinCost) {
    useSessionStore.getState().setAutoSpinsRemaining(0);
    useUIStore.getState().setModal('isSettingsOpen', true);
    return;
  }

  // Reset all spin-phase state
  quickStopRef.current = false;
  activeDelaysRef.current = [];
  isSpinningRef.current = true;

  const currentSpinIdx = g.spinCount + 1;
  useGameStore.getState().setSpinCount(currentSpinIdx);
  useGameStore.getState().setCascadeDepth(0);
  useGameStore.getState().setCurrentWaysHits([]);
  useGameStore.getState().setIsSpinning(true);
  useWalletStore.getState().setCurrentWin(0);
  useGameStore.getState().setIsOverdriveActive(false);
  useGameStore.getState().setComboMultiplier(fs.isActive ? 2 : 1);
  sound.spinStart();
  useGameStore.getState().setSpinningColumns([true, true, true, true, true]);

  // Optimistic debit + jackpot contribution (visual only — server handles actual wallet)
  if (!fs.isActive && spinCost > 0) {
    useWalletStore.getState().optimisticDebit(spinCost);
    useWalletStore.getState().setTotalBetsPlaced(Number((w.totalBetsPlaced + spinCost).toFixed(2)));
    const jackpotContrib = spinCost * 0.025;
    useJackpotStore.getState().incrementBy(jackpotContrib);
    useJackpotStore.getState().setHasIncrement(true);
    deferShakeClear('', 700, activeDelaysRef);
  }

  // ─── API call ────────────────────────────────────────────────────────────
  const effectiveMode: GameMode = isDeluxeBonusBuy ? 'deluxe' : g.gameMode;
  let spinResult: any;
  try {
    spinResult = await apiSpin({
      bet: defaultBet,
      gameMode: effectiveMode,
      isBonusBuy,
      isDeluxeBonusBuy,
      freeSpinsActive: fs.isActive,
      freeSpinsRemaining: fs.remaining,
      spinIndex: currentSpinIdx,
    });
  } catch (err: any) {
    console.error('Spin API error:', err);
    if (!fs.isActive && spinCost > 0) {
      useWalletStore.getState().setBalance(Number((w.balance + spinCost).toFixed(2)));
    }
    useGameStore.getState().setIsSpinning(false);
    useGameStore.getState().setSpinningColumns([false, false, false, false, false]);
    isSpinningRef.current = false;
    return;
  }

  // ─── Build visual data ───────────────────────────────────────────────────
  const initialGrid = buildVisualGrid(spinResult.initialGrid);
  const finalGrid = spinResult.finalGrid ? buildVisualGrid(spinResult.finalGrid) : initialGrid;
  const cascadeVisuals = buildCascadeVisuals(spinResult.cascades);

  const delayPerCol = s.isTurbo ? 80 : 180;
  const initialSpinDuration = s.isTurbo ? 220 : 500;

  // ─── Reel stop sequence ──────────────────────────────────────────────────
  await waitDelay(initialSpinDuration, quickStopRef, activeDelaysRef);

  if (!quickStopRef.current) {
    for (let c = 0; c < 5; c++) {
      if (quickStopRef.current) {
        useGameStore.getState().setGrid(initialGrid);
        useGameStore.getState().setSpinningColumns([false, false, false, false, false]);
        break;
      }
      await waitDelay(delayPerCol, quickStopRef, activeDelaysRef);
      const nextGrid = [...useGameStore.getState().game.grid];
      nextGrid[c] = initialGrid[c];
      useGameStore.getState().setGrid(nextGrid);
      const nextCols = [...useGameStore.getState().game.spinningColumns];
      nextCols[c] = false;
      useGameStore.getState().setSpinningColumns(nextCols);
      sound.reelStop(c);
    }
  } else {
    useGameStore.getState().setGrid(initialGrid);
    useGameStore.getState().setSpinningColumns([false, false, false, false, false]);
  }

  useGameStore.getState().setGrid(initialGrid);
  useGameStore.getState().setScattersCount(spinResult.scattersCount);

  if (spinResult.scattersCount > 0) {
    sound.scatterLand(spinResult.scattersCount);
  }

  // ─── Cascade sequence ────────────────────────────────────────────────────
  let accumulatedWinThisSpin = 0;
  let maxMultiplierReached = fs.isActive ? 2 : 1;
  let hadExpandedJoker = false;

  for (let stepIdx = 0; stepIdx < cascadeVisuals.length; stepIdx++) {
    if (quickStopRef.current) break;

    const step = cascadeVisuals[stepIdx];

    useGameStore.getState().setCascadeDepth(stepIdx + 1);
    useGameStore.getState().setGrid(step.grid);
    useGameStore.getState().setCurrentWaysHits(step.waysHits || []);

    const stepDelay = s.isTurbo ? MULTIPLIER_STEP_DELAY_TURBO : MULTIPLIER_STEP_DELAY_NORMAL;
    await waitDelay(stepDelay, quickStopRef, activeDelaysRef);

    useGameStore.getState().setComboMultiplier(step.comboMultiplier);
    maxMultiplierReached = Math.max(maxMultiplierReached, step.comboMultiplier);

    if (step.isOverdrive) {
      useGameStore.getState().setIsOverdriveActive(true);
      sound.overdriveSurge(step.comboMultiplier);
    }

    accumulatedWinThisSpin += step.winAmount;
    useWalletStore.getState().setCurrentWin(Number(accumulatedWinThisSpin.toFixed(2)));

    if (step.expandedJokerCols?.length && effectiveMode === 'deluxe') {
      hadExpandedJoker = true;
      sound.goldenJokerExpand();
      useUIStore.getState().setScreenShakeClass('animate-shake-big');
      deferShakeClear('', 400, activeDelaysRef);
    } else if (step.conversions.length > 0) {
      sound.goldWildMagicChime();
    }

    sound.winChime(step.winAmount >= defaultBet * 2);

    const stepPause = quickStopRef.current ? 80 : s.isTurbo ? 220 : 650;
    await waitDelay(stepPause, quickStopRef, activeDelaysRef);

    sound.cascadeExplode();
    useGameStore.getState().setCurrentWaysHits([]);

    const postExplodeDelay = quickStopRef.current ? 70 : s.isTurbo ? 160 : 350;
    await waitDelay(postExplodeDelay, quickStopRef, activeDelaysRef);

    if (step.nextGrid && step.droppedColumns?.length) {
      useGameStore.getState().setGrid(step.nextGrid);
      useGameStore.getState().setRipple({
        columns: step.droppedColumns,
        cells: step.droppedCells || [],
        triggerKey: Date.now() + stepIdx,
      });
      sound.energyRipple(stepIdx + 1);

      const dropPause = quickStopRef.current ? 140 : s.isTurbo ? 280 : 680;
      await waitDelay(dropPause, quickStopRef, activeDelaysRef);
    }
  }

  // ─── Finalize grid ───────────────────────────────────────────────────────
  useGameStore.getState().setGrid(finalGrid);
  useGameStore.getState().setCurrentWaysHits([]);
  useGameStore.getState().setRipple({ columns: [], cells: [], triggerKey: 0 });

  if (spinResult.jackpotTeaserTriggered) {
    sound.jackpotTeaserDrop();
    useUIStore.getState().setScreenShakeClass('animate-shake-mega');
    deferShakeClear('', 800, activeDelaysRef);
  }

  useWalletStore.getState().setLastSpinWin(spinResult.totalWin);

  // ─── Wallet + retention state updates ────────────────────────────────────
  if (spinResult.totalWin > 0) {
    useWalletStore.getState().setBalance(spinResult.balance);
    useWalletStore.getState().setLastAddedWin(spinResult.totalWin);
    useWalletStore.getState().setIsBalancePulsing(true);
    deferShakeClear('', 1500, activeDelaysRef);

    if (fs.isActive) {
      useGameStore.getState().setFreeSpinsAccumulatedWin(
        Number((fs.accumulatedWin + spinResult.totalWin).toFixed(2))
      );
    }

    if (spinResult.gameState) {
      const gs = spinResult.gameState;
      useVaultStore.getState().updateFromGameState(gs.vaultBalance, gs.vaultHarvested);
      if (gs.vaultBalance > vault.balance) {
        useVaultStore.getState().setDepositAnimKey(Date.now());
        sound.vaultDepositCoin();
      }
      useBoostStore.getState().setData({ loyaltyPoints: gs.loyaltyPoints, vipTier: gs.vipTier as any });
      useWalletStore.getState().setTotalBetsPlaced(gs.totalBets);
      useGameStore.getState().setSpinCount(gs.spinCount);
      if (gs.freeSpinsLeft !== undefined) useGameStore.getState().setFreeSpinsRemaining(gs.freeSpinsLeft);
      if (gs.freeSpinsTotal !== undefined) useGameStore.getState().setFreeSpinsTotal(gs.freeSpinsTotal);
    }
  } else {
    useWalletStore.getState().setBalance(spinResult.balance);
    if (spinResult.gameState) {
      useWalletStore.getState().setTotalBetsPlaced(spinResult.gameState.totalBets);
      useGameStore.getState().setSpinCount(spinResult.gameState.spinCount);
    }
  }

  // ─── History ─────────────────────────────────────────────────────────────
  useHistoryStore.getState().addItem({
    id: spinResult.spinId,
    timestamp: Date.now(),
    gameMode: effectiveMode,
    bet: spinCost,
    win: spinResult.totalWin,
    ways: 1024,
    cascadesCount: spinResult.cascades?.length ?? 0,
    maxMultiplier: maxMultiplierReached,
    isFreeSpin: fs.isActive,
    freeSpinsAwarded: spinResult.freeSpinsAwarded,
    isBonusBuy,
    hasExpandedJoker: hadExpandedJoker,
    hasMegaSymbol: spinResult.megaSymbols && spinResult.megaSymbols.length > 0,
  });

  // ─── Win celebration ─────────────────────────────────────────────────────
  const winMultiple = spinResult.totalWin / defaultBet;
  if (winMultiple >= 15) {
    useUIStore.getState().setCelebrationWinAmount(spinResult.totalWin);
    useUIStore.getState().setScreenShakeClass('animate-shake-mega');
    deferShakeClear('', 800, activeDelaysRef);
    track('big_win', { multiplier: winMultiple, amount: spinResult.totalWin, tier: 'mega' });
  } else if (winMultiple >= 5) {
    useUIStore.getState().setScreenShakeClass('animate-shake-big');
    deferShakeClear('', 600, activeDelaysRef);
    track('big_win', { multiplier: winMultiple, amount: spinResult.totalWin, tier: 'big' });
  }

  // ─── Free spins award ────────────────────────────────────────────────────
  if (spinResult.freeSpinsAwarded > 0) {
    if (!fs.isActive) {
      useUIStore.getState().setAwardedSpinsCount(spinResult.freeSpinsAwarded);
      useUIStore.getState().setModal('isFreeSpinsIntroOpen', true);
      useSessionStore.getState().setAutoSpinsRemaining(0);
    } else {
      useGameStore.getState().setFreeSpinsRemaining(fs.remaining + spinResult.freeSpinsAwarded);
      useGameStore.getState().setFreeSpinsTotal(fs.total + spinResult.freeSpinsAwarded);
    }
  }

  // ─── Free spins decrement / autoplay ─────────────────────────────────────
  if (fs.isActive) {
    const nextFsRemaining = fs.remaining - 1;
    useGameStore.getState().setFreeSpinsRemaining(nextFsRemaining);

    if (nextFsRemaining <= 0) {
      useGameStore.getState().setFreeSpinsActive(false);
      setTimeout(() => {
        useUIStore.getState().setModal('isFreeSpinsSummaryOpen', true);
      }, 500);
    }
  } else if (s.autoSpinsRemaining > 0) {
    useSessionStore.getState().decrementAutoSpins();
  }

  // ─── Done ────────────────────────────────────────────────────────────────
  useGameStore.getState().setIsSpinning(false);
  isSpinningRef.current = false;

  // Sync authoritative balance to parent platform (no settlement — spin endpoint already handled wallet)
  if (bridge.hasSession()) {
    const authoritativeBalance = useWalletStore.getState().balance;
    bridge.syncBalance(authoritativeBalance);
  }

  track('spin_complete', {
    totalWin: spinResult.totalWin,
    cascades: cascadeVisuals.length,
    freeSpins: fs.isActive,
    balanceAfter: useWalletStore.getState().balance,
  });
}
