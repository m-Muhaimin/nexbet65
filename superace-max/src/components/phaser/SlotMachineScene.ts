import Phaser from 'phaser';
import type { GridCell, SymbolType } from '../../types';

const COLS = 5;
const ROWS = 4;
const CELL_SIZE = 96;
const CELL_GAP = 4;
const GRID_W = COLS * (CELL_SIZE + CELL_GAP) - CELL_GAP; // 476
const GRID_H = ROWS * (CELL_SIZE + CELL_GAP) - CELL_GAP; // 380
const GRID_PAD = 6;
const CANVAS_W = GRID_W + GRID_PAD * 2; // 488
const CANVAS_H = GRID_H + GRID_PAD * 2; // 392

const SYMBOL_KEYS: SymbolType[] = ['A', 'K', 'Q', 'J', 'S', 'G', 'JK', 'SC'];

const SYMBOL_TO_KEY: Record<SymbolType, string> = {
  A: 'sym_A', K: 'sym_K', Q: 'sym_Q', J: 'sym_J',
  S: 'sym_S', G: 'sym_G', JK: 'sym_JK', SC: 'sym_SC',
};

const SYMBOL_TO_PNG: Record<SymbolType, string> = {
  A: '/assets/symbols/A.png', K: '/assets/symbols/K.png',
  Q: '/assets/symbols/Q.png', J: '/assets/symbols/J.png',
  S: '/assets/symbols/clubs.png', G: '/assets/symbols/G.png',
  JK: '/assets/symbols/JK.png', SC: '/assets/symbols/SC.png',
};

interface CellSprite {
  col: number;
  row: number;
  image: Phaser.GameObjects.Image;
  glowImage?: Phaser.GameObjects.Image;
}

export interface SpinOptions {
  grid: GridCell[][];
  cascades?: GridCell[][][];
  expandedJokerCols?: number[];
}

function cellX(col: number): number {
  return GRID_PAD + col * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
}

function cellY(row: number): number {
  return GRID_PAD + row * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
}

export class SlotMachineScene extends Phaser.Scene {
  private cellSprites: CellSprite[][] = [];
  private blurOverlay!: Phaser.GameObjects.Image;
  private isSpinning = false;
  private blurFrame = 0;
  private blurTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'SlotMachine' });
  }

  preload() {
    for (const sym of SYMBOL_KEYS) {
      this.load.image(SYMBOL_TO_KEY[sym], SYMBOL_TO_PNG[sym]);
    }
    for (let i = 0; i <= 7; i++) {
      this.load.image(`blur_${i}`, `/assets/fx/blur_${String(i).padStart(3, '0')}.png`);
    }
  }

  create() {
    for (let col = 0; col < COLS; col++) {
      this.cellSprites[col] = [];
      for (let row = 0; row < ROWS; row++) {
        const x = cellX(col);
        const y = cellY(row);

        const glow = this.add.image(x, y, 'sym_A')
          .setDisplaySize(CELL_SIZE + 12, CELL_SIZE + 12)
          .setAlpha(0)
          .setDepth(1);

        const img = this.add.image(x, y, 'sym_A')
          .setDisplaySize(CELL_SIZE, CELL_SIZE)
          .setDepth(2);

        this.cellSprites[col][row] = { col, row, image: img, glowImage: glow };
      }
    }

    this.blurOverlay = this.add.image(CANVAS_W / 2, CANVAS_H / 2, 'blur_0')
      .setDisplaySize(CANVAS_W, CANVAS_H)
      .setAlpha(0)
      .setDepth(50);
  }

  setGrid(grid: GridCell[][]) {
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        const cell = grid[col]?.[row];
        if (!cell) continue;
        const sprite = this.cellSprites[col]?.[row];
        if (!sprite) continue;

        const key = SYMBOL_TO_KEY[cell.symbol] || 'sym_A';
        sprite.image.setTexture(key);
        sprite.image.setDisplaySize(CELL_SIZE, CELL_SIZE);
        sprite.image.setPosition(cellX(col), cellY(row));
        sprite.image.setAlpha(1).setScale(1);

        if (sprite.glowImage) {
          sprite.glowImage.setPosition(cellX(col), cellY(row));
          if (cell.isGoldenCard || cell.isGoldenJoker) {
            sprite.glowImage.setTexture(key);
            sprite.glowImage.setDisplaySize(CELL_SIZE + 12, CELL_SIZE + 12);
            sprite.glowImage.setAlpha(0.5);
          } else {
            sprite.glowImage.setAlpha(0);
          }
        }
      }
    }
  }

  async playSpin(options: SpinOptions): Promise<void> {
    if (this.isSpinning) return;
    this.isSpinning = true;

    this.startBlur();

    // Phase 1: Symbols slide down and fade
    for (let col = 0; col < COLS; col++) {
      const staggerDelay = col * 100;
      this.time.delayedCall(staggerDelay, () => {
        for (let row = 0; row < ROWS; row++) {
          const sprite = this.cellSprites[col]?.[row];
          if (!sprite) continue;
          const targetY = cellY(row) + 160;
          this.tweens.add({
            targets: sprite.image,
            y: targetY,
            alpha: 0,
            duration: 180,
            ease: 'Power2',
          });
          if (sprite.glowImage) {
            this.tweens.add({ targets: sprite.glowImage, alpha: 0, duration: 180 });
          }
        }
      });
    }

    await this.delay(180 + COLS * 100);

    // Phase 2: Set new grid
    this.setGrid(options.grid);

    // Phase 3: Symbols drop in from above with stagger + bounce
    for (let col = 0; col < COLS; col++) {
      const stopDelay = col * 120;
      this.time.delayedCall(stopDelay, () => {
        for (let row = 0; row < ROWS; row++) {
          const sprite = this.cellSprites[col]?.[row];
          if (!sprite) continue;
          const finalY = cellY(row);
          sprite.image.y = finalY - 160;
          sprite.image.alpha = 0;

          this.tweens.add({
            targets: sprite.image,
            y: finalY,
            alpha: 1,
            duration: 280,
            ease: 'Bounce.easeOut',
          });

          if (sprite.glowImage) {
            sprite.glowImage.y = finalY;
            if (sprite.image.texture.key !== 'sym_A' &&
                (options.grid[col]?.[row]?.isGoldenCard || options.grid[col]?.[row]?.isGoldenJoker)) {
              this.tweens.add({
                targets: sprite.glowImage,
                alpha: 0.5,
                duration: 280,
              });
            }
          }
        }

        // Fade blur on last column stop
        if (col === COLS - 1) {
          this.tweens.add({
            targets: this.blurOverlay,
            alpha: 0,
            duration: 120,
            onComplete: () => this.stopBlur(),
          });
        }
      });
    }

    await this.delay(280 + COLS * 120 + 100);
    this.isSpinning = false;
  }

  highlightWinningCells(cellIds: string[]) {
    for (const sprite of this.cellSprites.flat()) {
      if (sprite.glowImage) {
        this.tweens.add({ targets: sprite.glowImage, alpha: 0, duration: 100 });
      }
    }

    for (const sprite of this.cellSprites.flat()) {
      const cellId = `${sprite.col}:${sprite.row}`;
      if (cellIds.includes(cellId)) {
        if (sprite.glowImage) {
          sprite.glowImage.setTexture(sprite.image.texture.key);
          sprite.glowImage.setDisplaySize(CELL_SIZE + 12, CELL_SIZE + 12);
          sprite.glowImage.setAlpha(0.8);
        }
        this.tweens.add({
          targets: sprite.image,
          scaleX: 1.12, scaleY: 1.12,
          duration: 350, yoyo: true, repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    }
  }

  clearHighlights() {
    for (const sprite of this.cellSprites.flat()) {
      this.tweens.killTweensOf(sprite.image);
      sprite.image.setScale(1);
      if (sprite.glowImage) {
        this.tweens.killTweensOf(sprite.glowImage);
        sprite.glowImage.setAlpha(0);
      }
    }
  }

  async playCascade(grids: GridCell[][][]): Promise<void> {
    for (const grid of grids) {
      await this.delay(300);
      this.setGrid(grid);
      await this.delay(180);
    }
  }

  animateGridTransition(oldGrid: GridCell[][], newGrid: GridCell[][]) {
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        const sprite = this.cellSprites[col]?.[row];
        if (!sprite) continue;
        const oldCell = oldGrid[col]?.[row];
        const newCell = newGrid[col]?.[row];
        if (!oldCell || !newCell) continue;
        if (oldCell.symbol === newCell.symbol) continue;

        const key = SYMBOL_TO_KEY[newCell.symbol] || 'sym_A';
        sprite.image.setTexture(key);
        sprite.image.setDisplaySize(CELL_SIZE, CELL_SIZE);

        this.tweens.add({
          targets: sprite.image,
          scaleY: 0.2, duration: 100, ease: 'Power2',
          onComplete: () => {
            sprite.image.setScale(1);
            sprite.image.y = cellY(row);
            this.tweens.add({
              targets: sprite.image,
              y: cellY(row),
              duration: 260, ease: 'Bounce.easeOut',
            });
          },
        });

        if (sprite.glowImage) {
          if (newCell.isGoldenCard || newCell.isGoldenJoker) {
            sprite.glowImage.setTexture(key);
            sprite.glowImage.setDisplaySize(CELL_SIZE + 12, CELL_SIZE + 12);
            sprite.glowImage.setAlpha(0.5);
          } else {
            sprite.glowImage.setAlpha(0);
          }
        }
      }
    }
  }

  private startBlur() {
    this.blurFrame = 0;
    this.blurOverlay.setAlpha(0.8);
    this.blurTimer = this.time.addEvent({
      delay: 70, loop: true,
      callback: () => {
        this.blurFrame = (this.blurFrame + 1) % 8;
        this.blurOverlay.setTexture(`blur_${this.blurFrame}`);
      },
    });
  }

  private stopBlur() {
    if (this.blurTimer) { this.blurTimer.remove(); this.blurTimer = undefined; }
    this.blurOverlay.setAlpha(0);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }

  shutdown() {
    this.stopBlur();
    this.tweens.killAll();
  }
}

export { GRID_W, GRID_H, CANVAS_W, CANVAS_H, CELL_SIZE, CELL_GAP, GRID_PAD, cellX, cellY };
