/**
 * Combined store hooks — convenience re-exports for consuming components.
 *
 * Usage:
 *   import { useGame, useWallet, useUI } from '../stores';
 *   const { grid, isSpinning } = useGame();
 *   const { balance } = useWallet();
 */

export { useGameStore as useGame } from './gameStore';
export { useWalletStore as useWallet } from './walletStore';
export { useVaultStore as useVault } from './vaultStore';
export { useJackpotStore as useJackpot } from './jackpotStore';
export { useBoostStore as useBoost } from './boostStore';
export { useSessionStore as useSession } from './sessionStore';
export { useUIStore as useUI } from './uiStore';
export { useHistoryStore as useHistory } from './historyStore';
export { useTournamentStore as useTournament } from './tournamentStore';
