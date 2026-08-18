/**
 * ClientEngine — IGameEngine implementation that calls the server API.
 *
 * This is the production adapter. For tests, swap in a MockEngine
 * that returns deterministic results without network calls.
 */

import { apiSpin, fetchWalletBalance, fetchGameState, saveGameState } from './api';
import type {
  IGameEngine,
  SpinParams,
  SpinServerResult,
  GameStateSnapshot,
  GameStatePatch,
} from './IGameEngine';

export class ClientEngine implements IGameEngine {
  async spin(params: SpinParams): Promise<SpinServerResult> {
    return apiSpin(params);
  }

  async getBalance(): Promise<number> {
    return (await fetchWalletBalance()) ?? 1000;
  }

  async loadState(): Promise<GameStateSnapshot | null> {
    return fetchGameState();
  }

  async saveState(patch: GameStatePatch): Promise<void> {
    await saveGameState(patch);
  }
}

/** Singleton engine instance. Swap this for a MockEngine in tests. */
export const engine: IGameEngine = new ClientEngine();
