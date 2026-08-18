import Phaser from 'phaser';
import type { GridCell, SymbolType } from '../../types';

const COLS = 5;
const ROWS = 4;
const SYMBOL_SIZE = 96;
const CELL_GAP = 4;
const REEL_HEIGHT = ROWS * (SYMBOL_SIZE + CELL_GAP);
const REEL_WIDTH = COLS * (SYMBOL_SIZE + CELL_GAP);

const SYMBOL_KEYS: SymbolType[] = ['A', 'K', 'Q', 'J', 'S', 'G', 'JK', 'SC'];

const SYMBOL_TO_KEY: Record<SymbolType, string> = {
  A: 'sym_A',
  K: 'sym_K',
  Q: 'sym_Q',
  J: 'sym_J',
  S: 'sym_S',
  G: 'sym_G',
  JK: 'sym_JK',
  SC: 'sym_SC',
};

const SYMBOL_TO_PNG: Record<SymbolType, string> = {
  A: '/assets/symbols/A.png',
  K: '/assets/symbols/K.png',
  Q: '/assets/symbols/Q.png',
  J: '/assets/symbols/J.png',
  S: '/assets/symbols/clubs.png',
  G: '/assets/symbols/G.png',
  JK: '/assets/symbols/JK.png',
  SC: '/assets/symbols/SC.png',
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

export class SlotMachineScene extends Phaser.Scene {
  private cellSprites: CellSprite[][] = [];
  private gridOriginX = 0;
  private gridOriginY = 0;
  private blurOverlay!: Phaser.GameObjects.TileSprite;
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
    for (let i = 0; i <= 8; i++) {
      this.load.image(`spin_btn_${i}`, `/assets/ui/spin-btn_${String(i).padStart(3, '0')}.png`);
    }
    for (let i = 0; i <= 7; i++) {
      this.load.image(`blur_${i}`, `/assets/fx/blur_${String(i).padStart(3, '0')}.png`);
    }
  }

  create() {
    this.gridOriginX = (this.scale.width - REEL_WIDTH) / 2 + SYMBOL_SIZE / 2 + CELL_GAP / 2;
    this.gridOriginY = (this.scale.height - REEL_HEIGHT) / 2 + SYMBOL_SIZE / 2 + CELL_GAP / 2;

    this.blurOverlay = this.add.tileSprite(
      this.scale.width / 2,
      this.scale.height / 2,
      REEL_WIDTH + 8,
      REEL_HEIGHT + 8,
      'blur_0'
    ).setOrigin(0.5).setAlpha(0).setDepth(10);

    for (let col = 0; col < COLS; col++) {
      this.cellSprites[col] = [];
      for (let row = 0; row < ROWS; row++) {
        const x = this.gridOriginX + col * (SYMBOL_SIZE + CELL_GAP);
        const y = this.gridOriginY + row * (SYMBOL_SIZE + CELL_GAP);

        const glow = this.add.image(x, y, 'sym_A')
          .setDisplaySize(SYMBOL_SIZE + 12, SYMBOL_SIZE + 12)
          .setAlpha(0)
          .setDepth(1);

        const img = this.add.image(x, y, 'sym_A')
          .setDisplaySize(SYMBOL_SIZE, SYMBOL_SIZE)
          .setDepth(2);

        this.cellSprites[col][row] = { col, row, image: img, glowImage: glow };
      }
    }

    this.blurOverlay.setDepth(50);
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
        sprite.image.setDisplaySize(SYMBOL_SIZE, SYMBOL_SIZE);
        sprite.image.setAlpha(1);
        sprite.image.setScale(1);

        if (sprite.glowImage) {
          if (cell.isGoldenCard || cell.isGoldenJoker) {
            sprite.glowImage.setTexture(key);
            sprite.glowImage.setDisplaySize(SYMBOL_SIZE + 12, SYMBOL_SIZE + 12);
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

    for (let col = 0; col < COLS; col++) {
      const staggerDelay = col * 120;

      this.time.delayedCall(staggerDelay, () => {
        for (let row = 0; row < ROWS; row++) {
          const sprite = this.cellSprites[col]?.[row];
          if (!sprite) continue;
          this.tweens.add({
            targets: sprite.image,
            y: sprite.image.y + 200,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
          });
          if (sprite.glowImage) {
            this.tweens.add({
              targets: sprite.glowImage,
              alpha: 0,
              duration: 200,
            });
          }
        }
      });
    }

    await this.delay(200 + COLS * 120);

    this.setGrid(options.grid);

    for (let col = 0; col < COLS; col++) {
      const stopDelay = (COLS - 1 - col) * 150 + 100;

      this.time.delayedCall(stopDelay, () => {
        for (let row = 0; row < ROWS; row++) {
          const sprite = this.cellSprites[col]?.[row];
          if (!sprite) continue;

          const finalY = this.gridOriginY + row * (SYMBOL_SIZE + CELL_GAP);
          sprite.image.y = finalY - 200;
          sprite.image.alpha = 0;
          sprite.image.setScale(1);

          this.tweens.add({
            targets: sprite.image,
            y: finalY,
            alpha: 1,
            duration: 300,
            ease: 'Bounce.easeOut',
          });

          if (sprite.glowImage) {
            sprite.glowImage.y = finalY;
            this.tweens.add({
              targets: sprite.glowImage,
              alpha: 0.5,
              duration: 300,
            });
          }
        }

        this.tweens.add({
          targets: this.blurOverlay,
          alpha: 0,
          duration: 100,
          onComplete: () => {
            this.stopBlur();
          },
        });
      });
    }

    await this.delay(300 + COLS * 150 + 300);

    this.isSpinning = false;
  }

  highlightWinningCells(cellIds: string[]) {
    for (const sprite of this.cellSprites.flat()) {
      if (sprite.glowImage) {
        this.tweens.add({
          targets: sprite.glowImage,
          alpha: 0,
          duration: 100,
        });
      }
    }

    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        const sprite = this.cellSprites[col]?.[row];
        if (!sprite) continue;
        const cellId = `cell-${col}-${row}`;
        if (cellIds.includes(cellId)) {
          if (sprite.glowImage) {
            sprite.glowImage.setTexture(sprite.image.texture.key);
            sprite.glowImage.setDisplaySize(SYMBOL_SIZE + 12, SYMBOL_SIZE + 12);
            sprite.glowImage.setAlpha(0.8);
          }
          this.tweens.add({
            targets: sprite.image,
            scaleX: 1.15,
            scaleY: 1.15,
            duration: 400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
        }
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
      await this.delay(350);
      this.setGrid(grid);
      await this.delay(200);
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
        sprite.image.setDisplaySize(SYMBOL_SIZE, SYMBOL_SIZE);

        this.tweens.add({
          targets: sprite.image,
          scaleY: 0.3,
          duration: 120,
          ease: 'Power2',
          onComplete: () => {
            sprite.image.setScale(1, 1);
            sprite.image.y = this.gridOriginY + row * (SYMBOL_SIZE + CELL_GAP);
            this.tweens.add({
              targets: sprite.image,
              y: sprite.image.y,
              duration: 300,
              ease: 'Bounce.easeOut',
            });
          },
        });

        if (sprite.glowImage) {
          if (newCell.isGoldenCard || newCell.isGoldenJoker) {
            sprite.glowImage.setTexture(key);
            sprite.glowImage.setDisplaySize(SYMBOL_SIZE + 12, SYMBOL_SIZE + 12);
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
    this.blurOverlay.setAlpha(0.85);
    this.blurTimer = this.time.addEvent({
      delay: 80,
      loop: true,
      callback: () => {
        this.blurFrame = (this.blurFrame + 1) % 8;
        this.blurOverlay.setTexture(`blur_${this.blurFrame}`);
      },
    });
  }

  private stopBlur() {
    if (this.blurTimer) {
      this.blurTimer.remove();
      this.blurTimer = undefined;
    }
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
