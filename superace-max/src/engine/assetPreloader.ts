/**
 * assetPreloader.ts — Preloads processed PNG symbol textures and
 * WebP background into browser cache so they're ready when needed.
 *
 * Call `preloadAssets()` early (e.g. during splash screen) to
 * eliminate pop-in when symbols first render as PNG textures.
 */

const SYMBOL_PATHS = [
  './assets/symbols/A.png',
  './assets/symbols/K.png',
  './assets/symbols/Q.png',
  './assets/symbols/J.png',
  './assets/symbols/clubs.png',
  './assets/symbols/G.png',
  './assets/symbols/JK.png',
  './assets/symbols/SC.png',
];

const BG_PATHS = [
  './assets/bg/temple.webp',
  './assets/bg/temple-thumb.webp',
];

const FX_PATHS = [
  './assets/fx/blur_000.png',
  './assets/fx/blur_001.png',
  './assets/fx/blur_002.png',
  './assets/fx/blur_003.png',
];

const UI_PATHS = [
  './assets/ui/spin-btn_000.png',
  './assets/ui/spin-btn_004.png',
];

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve(); // don't block on failures
    img.src = src;
  });
}

export interface PreloadProgress {
  loaded: number;
  total: number;
  phase: 'symbols' | 'bg' | 'fx' | 'ui' | 'done';
}

/**
 * Preload all game assets. Returns a promise that resolves when done.
 * Calls `onProgress` periodically so callers can show a loading bar.
 */
export async function preloadAssets(
  onProgress?: (p: PreloadProgress) => void,
): Promise<void> {
  const allGroups = [
    { phase: 'symbols' as const, paths: SYMBOL_PATHS },
    { phase: 'bg' as const, paths: BG_PATHS },
    { phase: 'fx' as const, paths: FX_PATHS },
    { phase: 'ui' as const, paths: UI_PATHS },
  ];

  const total = allGroups.reduce((sum, g) => sum + g.paths.length, 0);
  let loaded = 0;

  for (const group of allGroups) {
    const promises = group.paths.map(async (src) => {
      await preloadImage(src);
      loaded++;
      onProgress?.({ loaded, total, phase: group.phase });
    });
    await Promise.all(promises);
  }

  onProgress?.({ loaded, total, phase: 'done' });
}

/**
 * Preload only the essential symbol textures (faster initial load).
 */
export async function preloadSymbolsOnly(): Promise<void> {
  await Promise.all(SYMBOL_PATHS.map(preloadImage));
}
