/**
 * process-assets.mjs — Asset pipeline for SuperAce-Max
 *
 * Processes raw PNG exports into game-ready transparent assets.
 * - Removes dark fringing / near-black backgrounds from symbols
 * - Resizes symbols to consistent game-cell dimensions
 * - Slices sprite sheets into individual frames
 * - Converts background to WebP for faster loading
 */

import sharp from 'sharp';
import { readdir, mkdir } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';

const RAW_DIR = join(import.meta.dirname, '..', 'assets', 'raw');
const SYMBOLS_RAW = join(RAW_DIR, 'symbols');
const FX_RAW = join(RAW_DIR, 'fx');
const UI_RAW = join(RAW_DIR, 'ui');
const OUT_DIR = join(import.meta.dirname, '..', 'public', 'assets');
const SYMBOLS_OUT = join(OUT_DIR, 'symbols');
const BG_OUT = join(OUT_DIR, 'bg');
const UI_OUT = join(OUT_DIR, 'ui');
const FX_OUT = join(OUT_DIR, 'fx');

// Target cell size for symbol cards (matching CSS --card-w / --card-h ratio)
const TARGET_W = 200;
const TARGET_H = 260;

// Raw filename → game SymbolType mapping
const SYMBOL_MAP = {
  'ace.png': 'A',
  'k.png': 'K',
  'q.png': 'Q',
  'j.png': 'J',
  'hearts.png': 'hearts',
  'clubs.png': 'clubs',
  'diamonds.png': 'diamonds',
  'jk.png': 'JK',
  'scatter.png': 'SC',
  '1x.png': 'G',
};

async function ensureDirs() {
  for (const dir of [SYMBOLS_OUT, BG_OUT, UI_OUT, FX_OUT]) {
    await mkdir(dir, { recursive: true });
  }
}

/**
 * Remove near-black background fringing from a PNG.
 * Uses alpha threshold: pixels with luminance < 15 and partial alpha
 * get their alpha reduced to create clean transparency.
 */
async function removeDarkFringe(inputPath, outputPath) {
  const image = sharp(inputPath);
  const { width, height, channels } = await image.metadata();

  // Get raw pixel data
  const raw = await image.raw().toBuffer();
  const hasAlpha = channels === 4;
  const outChannels = 4; // Always output RGBA

  const outBuf = Buffer.alloc(width * height * outChannels);

  for (let i = 0; i < width * height; i++) {
    const srcOff = i * channels;
    const dstOff = i * outChannels;

    const r = raw[srcOff];
    const g = raw[srcOff + 1];
    const b = raw[srcOff + 2];
    const a = hasAlpha ? raw[srcOff + 3] : 255;

    // Calculate luminance
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    // Near-black pixels with low alpha → make fully transparent
    if (lum < 15 && a < 80) {
      outBuf[dstOff] = r;
      outBuf[dstOff + 1] = g;
      outBuf[dstOff + 2] = b;
      outBuf[dstOff + 3] = 0; // fully transparent
    }
    // Near-black edge fringing → reduce alpha proportionally
    else if (lum < 25 && a > 0 && a < 180) {
      const fringeFactor = Math.max(0, 1 - (lum / 25));
      outBuf[dstOff] = r;
      outBuf[dstOff + 1] = g;
      outBuf[dstOff + 2] = b;
      outBuf[dstOff + 3] = Math.round(a * (1 - fringeFactor * 0.6));
    }
    // Normal pixel → pass through
    else {
      outBuf[dstOff] = r;
      outBuf[dstOff + 1] = g;
      outBuf[dstOff + 2] = b;
      outBuf[dstOff + 3] = a;
    }
  }

  await sharp(outBuf, { raw: { width, height, channels: outChannels } })
    .png()
    .toFile(outputPath);
}

/**
 * Process a single symbol: remove fringe → resize → trim → output.
 */
async function processSymbol(rawName, symbolType) {
  const inputPath = join(SYMBOLS_RAW, rawName);
  const outputPath = join(SYMBOLS_OUT, `${symbolType}.png`);

  console.log(`  Processing ${rawName} → ${symbolType}.png`);

  // Step 1: Remove dark fringing
  const tempPath = join(SYMBOLS_OUT, `_${symbolType}_temp.png`);
  await removeDarkFringe(inputPath, tempPath);

  // Step 2: Resize to fit within target dimensions, maintaining aspect ratio
  // Then pad to exact target size with transparent background
  await sharp(tempPath)
    .resize(TARGET_W, TARGET_H, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(outputPath);

  // Clean up temp
  const { unlink } = await import('node:fs/promises');
  await unlink(tempPath);

  return outputPath;
}

/**
 * Slice a sprite sheet into individual frames.
 * Assumes frames are arranged horizontally in a single row.
 */
async function sliceSheet(inputPath, outputDir, prefix, frameWidth, frameHeight) {
  const meta = await sharp(inputPath).metadata();
  const cols = Math.floor(meta.width / frameWidth);
  const rows = Math.floor(meta.height / frameHeight);
  const totalFrames = cols * rows;

  console.log(`  Slicing ${basename(inputPath)}: ${cols}x${rows} = ${totalFrames} frames`);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;
      const outPath = join(outputDir, `${prefix}_${String(idx).padStart(3, '0')}.png`);

      await sharp(inputPath)
        .extract({
          left: col * frameWidth,
          top: row * frameHeight,
          width: frameWidth,
          height: frameHeight,
        })
        .png()
        .toFile(outPath);
    }
  }

  return totalFrames;
}

/**
 * Convert a PNG to WebP.
 */
async function convertToWebP(inputPath, outputPath, quality = 80) {
  console.log(`  Converting ${basename(inputPath)} → ${basename(outputPath)} (quality ${quality})`);
  await sharp(inputPath)
    .webp({ quality })
    .toFile(outputPath);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== SuperAce Asset Pipeline ===\n');

  await ensureDirs();

  // 1. Process symbol PNGs
  console.log('--- Symbols ---');
  const symbolFiles = await readdir(SYMBOLS_RAW);
  let symbolCount = 0;

  for (const file of symbolFiles) {
    if (file.endsWith('.tmp') || file.startsWith('.')) continue;
    const symbolType = SYMBOL_MAP[file];
    if (!symbolType) {
      console.log(`  Skipping unmapped: ${file}`);
      continue;
    }
    await processSymbol(file, symbolType);
    symbolCount++;
  }
  console.log(`  ✓ ${symbolCount} symbols processed\n`);

  // 2. Process FX sprite sheets
  console.log('--- FX ---');
  const fxFiles = await readdir(FX_RAW);
  for (const file of fxFiles) {
    if (!file.endsWith('.png')) continue;
    const inputPath = join(FX_RAW, file);
    const meta = await sharp(inputPath).metadata();

    // blurs.png is 1536x1024 → likely 4 columns x 2 rows of 384x512 frames
    if (file === 'blurs.png') {
      const frameW = Math.floor(meta.width / 4);
      const frameH = Math.floor(meta.height / 2);
      await sliceSheet(inputPath, FX_OUT, 'blur', frameW, frameH);
    } else {
      // Single FX image — just copy with dark fringe removal
      const outPath = join(FX_OUT, file);
      await removeDarkFringe(inputPath, outPath);
    }
  }
  console.log('  ✓ FX processed\n');

  // 3. Process UI sprite sheets
  console.log('--- UI ---');
  const uiFiles = await readdir(UI_RAW);
  for (const file of uiFiles) {
    if (!file.endsWith('.png')) continue;
    const inputPath = join(UI_RAW, file);
    const meta = await sharp(inputPath).metadata();

    // spin-buttons.png is 1266x1242 → likely a grid of button states
    // Try 3 columns x 3 rows (each ~422x414)
    if (file === 'spin-buttons.png') {
      const cols = 3;
      const rows = 3;
      const frameW = Math.floor(meta.width / cols);
      const frameH = Math.floor(meta.height / rows);
      const count = await sliceSheet(inputPath, UI_OUT, 'spin-btn', frameW, frameH);
      console.log(`  ✓ Sliced spin-buttons into ${count} frames`);
    } else {
      const outPath = join(UI_OUT, file);
      await removeDarkFringe(inputPath, outPath);
    }
  }
  console.log('  ✓ UI processed\n');

  // 4. Generate background WebP from a solid dark temple-style gradient
  console.log('--- Background ---');
  // Create a procedural dark gradient background (since no bg.png was provided)
  const bgW = 1920;
  const bgH = 1080;
  const bgSvg = `
    <svg width="${bgW}" height="${bgH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="g1" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#1a1040"/>
          <stop offset="50%" stop-color="#0d0820"/>
          <stop offset="100%" stop-color="#040408"/>
        </radialGradient>
        <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1a0830" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="${bgW}" height="${bgH}" fill="url(#g1)"/>
      <rect width="${bgW}" height="${bgH}" fill="url(#g2)"/>
      <ellipse cx="${bgW/2}" cy="${bgH*0.35}" rx="400" ry="250" fill="#2a1860" opacity="0.15"/>
    </svg>
  `;

  await sharp(Buffer.from(bgSvg))
    .resize(bgW, bgH)
    .webp({ quality: 80 })
    .toFile(join(BG_OUT, 'temple.webp'));

  // Also create a smaller thumbnail version
  await sharp(Buffer.from(bgSvg))
    .resize(960, 540)
    .webp({ quality: 70 })
    .toFile(join(BG_OUT, 'temple-thumb.webp'));

  console.log('  ✓ Background WebP generated\n');

  // 5. Summary
  console.log('=== Pipeline Complete ===');
  console.log(`  Symbols: ${symbolCount} → ${SYMBOLS_OUT}`);
  console.log(`  FX: ${FX_OUT}`);
  console.log(`  UI: ${UI_OUT}`);
  console.log(`  BG: ${BG_OUT}/temple.webp`);
}

main().catch(err => {
  console.error('Pipeline failed:', err);
  process.exit(1);
});
