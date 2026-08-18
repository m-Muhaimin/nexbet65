"use client";

import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import gsap from "gsap";

import {
  BOARD_HEIGHT,
  BOARD_PADDING,
  BOARD_WIDTH,
  plinkoBucketColor,
  type BallSkin,
  type PlinkoGameState,
  type RiskLevel,
} from "@/lib/plinko-constants";
import { plinkoSound } from "@/lib/plinko-audio";

interface PlinkoBoardProps {
  rows: number;
  risk: RiskLevel;
  multipliers: number[];
  onBallLand?: (bucketIndex: number) => void;
  activePath?: ("L" | "R")[];
  lastBetId?: string;
  lastBetAmount?: number;
  ballSkin?: BallSkin;
  gameState?: PlinkoGameState;
  lastResult?: number | null;
}

export function PlinkoBoard({
  rows,
  risk,
  multipliers,
  onBallLand,
  activePath,
  lastBetId,
  lastBetAmount = 0,
  ballSkin = "ruby",
  gameState = "idle",
  lastResult = null,
}: PlinkoBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const ballsRef = useRef<Map<string, PIXI.Graphics>>(new Map());
  const sparkContainerRef = useRef<PIXI.Container | null>(null);
  const confettiContainerRef = useRef<PIXI.Container | null>(null);
  const sparkTextureRef = useRef<PIXI.Texture | null>(null);
  const pegsRef = useRef<Map<string, PIXI.Graphics>>(new Map());
  const bucketsRef = useRef<Map<number, PIXI.Container>>(new Map());

  useEffect(() => {
    if (!containerRef.current) return;

    let app: PIXI.Application | null = null;
    let cleanupFns: Array<() => void> = [];
    let cancelled = false;

    const initPixi = async () => {
      app = new PIXI.Application();
      await app.init({
        width: BOARD_WIDTH,
        height: BOARD_HEIGHT,
        backgroundColor: 0x0f1923,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      if (cancelled || !containerRef.current) {
        app.destroy(true, { children: true, texture: true });
        return;
      }

      appRef.current = app;
      containerRef.current.appendChild(app.canvas);

      const sparkTex = new PIXI.Graphics().circle(0, 0, 2).fill({ color: 0xffffff, alpha: 1 });
      sparkTextureRef.current = app.renderer.generateTexture(sparkTex);

      const sparkContainer = new PIXI.Container();
      const confettiContainer = new PIXI.Container();
      app.stage.addChild(confettiContainer);
      app.stage.addChild(sparkContainer);
      sparkContainerRef.current = sparkContainer;
      confettiContainerRef.current = confettiContainer;

      const drawBoard = () => {
        app!.stage.children.forEach((child) => {
          if (child !== sparkContainer && child !== confettiContainer) {
            child.destroy({ children: true });
          }
        });
        pegsRef.current.clear();
        bucketsRef.current.clear();

        const padding = BOARD_PADDING;
        const boardWidth = BOARD_WIDTH - padding * 2;
        const boardHeight = BOARD_HEIGHT - padding * 4.5;
        const centerX = BOARD_WIDTH / 2;
        const rowHeight = boardHeight / rows;
        const pegSpacing = boardWidth / rows;

        for (let r = 0; r < rows; r++) {
          const rowY = padding + (r + 1) * rowHeight;
          const pegsInRow = r + 2;
          const rowWidth = (pegsInRow - 1) * pegSpacing;
          const startX = centerX - rowWidth / 2;

          for (let p = 0; p < pegsInRow; p++) {
            const pegX = startX + p * pegSpacing;
            const peg = new PIXI.Graphics().circle(0, 0, 4).fill({ color: 0xffffff, alpha: 0.3 });
            peg.position.set(pegX, rowY);
            app!.stage.addChild(peg);
            pegsRef.current.set(`${r}_${p}`, peg);

            const glow = new PIXI.Graphics().circle(0, 0, 8).fill({ color: 0xffffff, alpha: 0 });
            glow.position.set(pegX, rowY);
            app!.stage.addChildAt(glow, app!.stage.getChildIndex(peg));
            (peg as unknown as { glow: PIXI.Graphics }).glow = glow;
          }
        }

        const lastRowY = padding + (rows + 1) * rowHeight;
        const bucketWidth = pegSpacing;
        const startX = centerX - ((rows + 1) * bucketWidth) / 2;

        multipliers.forEach((m, i) => {
          const bx = startX + i * bucketWidth + bucketWidth / 2;
          const color = plinkoBucketColor(m);

          const bucketContainer = new PIXI.Container();
          bucketContainer.position.set(bx, lastRowY + 10);
          app!.stage.addChild(bucketContainer);
          bucketsRef.current.set(i, bucketContainer);

          const bucketBase = new PIXI.Graphics()
            .roundRect(-bucketWidth / 2 + 2, 0, bucketWidth - 4, 45, 8)
            .fill({ color, alpha: 0.8 })
            .stroke({ color: 0xffffff, width: 2, alpha: 0.1 });

          const innerShadow = new PIXI.Graphics()
            .roundRect(-bucketWidth / 2 + 4, 2, bucketWidth - 8, 41, 6)
            .fill({ color: 0x000000, alpha: 0.2 });

          const highlight = new PIXI.Graphics()
            .roundRect(-bucketWidth / 2 + 2, 0, bucketWidth - 4, 15, 8)
            .fill({ color: 0xffffff, alpha: 0.1 });

          const rim = new PIXI.Graphics()
            .roundRect(-bucketWidth / 2 + 2, 0, bucketWidth - 4, 4, 2)
            .fill({ color: 0xffffff, alpha: 0.2 });

          bucketContainer.addChild(bucketBase);
          bucketContainer.addChild(innerShadow);
          bucketContainer.addChild(highlight);
          bucketContainer.addChild(rim);

          const text = new PIXI.Text({
            text: `${m}x`,
            style: {
              fontFamily: "Inter, Plus Jakarta Sans, sans-serif",
              fontSize: Math.max(10, Math.min(14, 200 / rows)),
              fontWeight: "900",
              fill: 0xffffff,
              align: "center",
              dropShadow: {
                alpha: 0.3,
                blur: 2,
                color: 0x000000,
                distance: 2,
              },
            },
          });
          text.anchor.set(0.5);
          text.position.set(0, 22);
          bucketContainer.addChild(text);
        });
      };

      drawBoard();

      const resize = () => {
        if (!app || !containerRef.current) return;
        const { clientWidth, clientHeight } = containerRef.current;
        app.renderer.resize(clientWidth, clientHeight);
        const scale = Math.min(clientWidth / BOARD_WIDTH, clientHeight / BOARD_HEIGHT);
        app.stage.scale.set(scale);
        app.stage.position.set(
          (clientWidth - BOARD_WIDTH * scale) / 2,
          (clientHeight - BOARD_HEIGHT * scale) / 2
        );
      };

      window.addEventListener("resize", resize);
      resize();
      cleanupFns.push(() => window.removeEventListener("resize", resize));
      cleanupFns.push(() => app?.destroy(true, { children: true, texture: true }));
    };

    void initPixi();

    return () => {
      cancelled = true;
      cleanupFns.forEach((fn) => fn());
    };
  }, [rows, risk, multipliers]);

  const spawnSparks = (x: number, y: number, color: string | number) => {
    if (!sparkContainerRef.current || !sparkTextureRef.current) return;

    const count = 12;
    for (let i = 0; i < count; i++) {
      const spark = new PIXI.Sprite(sparkTextureRef.current);
      spark.anchor.set(0.5);
      spark.x = x;
      spark.y = y;
      spark.tint = color;
      const s = 0.3 + Math.random() * 0.7;
      spark.scale.set(s);

      sparkContainerRef.current.addChild(spark);

      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      gsap.to(spark, {
        x: spark.x + vx * 15,
        y: spark.y + vy * 15,
        alpha: 0,
        duration: 0.4 + Math.random() * 0.4,
        ease: "power2.out",
        onComplete: () => {
          sparkContainerRef.current?.removeChild(spark);
          spark.destroy();
        },
      });
    }
  };

  const triggerPegGlow = (row: number, index: number) => {
    const peg = pegsRef.current.get(`${row}_${index}`);
    if (peg) {
      gsap.to(peg, {
        alpha: 1,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.out",
      });
      const glow = (peg as unknown as { glow: PIXI.Graphics }).glow;
      if (glow) {
        gsap.fromTo(glow, { alpha: 0.6, scale: 0.5 }, { alpha: 0, scale: 2, duration: 0.4, ease: "power2.out" });
      }
    }
  };

  const triggerBucketEffect = (index: number) => {
    const bucket = bucketsRef.current.get(index);
    if (bucket) {
      gsap.to(bucket.scale, {
        x: 1.15,
        y: 1.15,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.out",
      });

      const flash = new PIXI.Graphics()
        .roundRect(-bucket.width / 2, 0, bucket.width, 45, 8)
        .fill({ color: 0xffffff, alpha: 0.4 });
      bucket.addChild(flash);

      gsap.to(flash, {
        alpha: 0,
        duration: 0.4,
        ease: "power2.out",
        onComplete: () => {
          bucket.removeChild(flash);
          flash.destroy();
        },
      });
    }
  };

  const triggerConfetti = () => {
    if (!confettiContainerRef.current) return;

    const colors = [0x00e701, 0x00c701, 0xffffff, 0x54a0ff, 0xff4d4d];
    const count = 150;

    for (let i = 0; i < count; i++) {
      const confetti = new PIXI.Graphics()
        .rect(-3, -3, 6, 6)
        .fill({ color: colors[Math.floor(Math.random() * colors.length)] });

      confetti.x = Math.random() * BOARD_WIDTH;
      confetti.y = -20;
      confetti.rotation = Math.random() * Math.PI;

      confettiContainerRef.current.addChild(confetti);

      const duration = 2 + Math.random() * 3;
      const drift = (Math.random() - 0.5) * 400;

      gsap.to(confetti, {
        x: confetti.x + drift,
        y: BOARD_HEIGHT + 20,
        rotation: confetti.rotation + Math.random() * 10,
        duration,
        ease: "none",
        onComplete: () => {
          confettiContainerRef.current?.removeChild(confetti);
          confetti.destroy();
        },
      });
    }
  };

  useEffect(() => {
    if (gameState === "result" && lastResult && lastResult >= 1) {
      triggerConfetti();
    }
  }, [gameState, lastResult]);

  useEffect(() => {
    if (!activePath || !lastBetId || !appRef.current) return;
    const ballId = lastBetId;

    let ballColor: number;
    switch (ballSkin) {
      case "ruby":
        ballColor = 0xff0000;
        break;
      case "diamond":
        ballColor = 0xffffff;
        break;
      case "metallic":
      default:
        ballColor = 0x888888;
        break;
    }

    const ball = new PIXI.Graphics();

    if (ballSkin === "metallic") {
      ball
        .circle(0, 0, 12)
        .fill({ color: 0x444444 })
        .circle(-4, -4, 4)
        .fill({ color: 0xffffff, alpha: 0.5 });
    } else if (ballSkin === "ruby") {
      ball
        .circle(0, 0, 12)
        .fill({ color: 0xff0000, alpha: 0.6 })
        .circle(0, 0, 8)
        .fill({ color: 0x330000, alpha: 0.4 })
        .circle(-4, -4, 4)
        .fill({ color: 0xffffff, alpha: 0.8 });
    } else if (ballSkin === "diamond") {
      ball
        .circle(0, 0, 12)
        .fill({ color: 0xccffff, alpha: 0.5 })
        .circle(0, 0, 8)
        .fill({ color: 0xffffff, alpha: 0.3 })
        .circle(-4, -4, 4)
        .fill({ color: 0xffffff, alpha: 0.9 });
    }

    const padding = BOARD_PADDING;
    const boardWidth = BOARD_WIDTH - padding * 2;
    const boardHeight = BOARD_HEIGHT - padding * 4.5;
    const centerX = BOARD_WIDTH / 2;
    const rowHeight = boardHeight / rows;
    const pegSpacing = boardWidth / rows;

    ball.position.set(centerX, 60);
    appRef.current.stage.addChild(ball);
    ballsRef.current.set(ballId, ball);

    const timeline = gsap.timeline({
      onComplete: () => {
        gsap.to(ball, {
          alpha: 0,
          duration: 0.3,
          onComplete: () => {
            appRef.current?.stage.removeChild(ball);
            ballsRef.current.delete(ballId);
          },
        });
        const bucketIndex = activePath.filter((d) => d === "R").length;
        triggerBucketEffect(bucketIndex);
        if (onBallLand) onBallLand(bucketIndex);
      },
    });

    let currentX = centerX;
    let currentY = 60;
    let rightCount = 0;

    activePath.forEach((dir, i) => {
      const nextY = padding + (i + 1) * rowHeight;
      const direction = dir === "L" ? -1 : 1;
      if (dir === "R") rightCount++;
      const nextX = currentX + (direction * pegSpacing) / 2;
      const stepDuration = 0.3;

      const peakY = currentY - 8;
      const hitRow = i;
      const hitPegIndex = rightCount;

      timeline.to(ball.position, {
        x: currentX + (direction * pegSpacing) / 4,
        y: peakY,
        duration: stepDuration * 0.4,
        ease: "power1.out",
        onStart: () => {
          plinkoSound.playTick(0.8 + Math.random() * 0.4);
          spawnSparks(ball.x, ball.y, ballColor);
          triggerPegGlow(hitRow, hitPegIndex);
        },
      });

      timeline.to(ball.position, {
        x: nextX,
        y: nextY,
        duration: stepDuration * 0.6,
        ease: "power2.in",
      });

      currentX = nextX;
      currentY = nextY;
    });

    const finalY = padding + (rows + 1) * rowHeight + 20;
    timeline.to(ball.position, {
      y: finalY,
      duration: 0.4,
      ease: "bounce.out",
    });
  }, [activePath, lastBetId, rows, multipliers, onBallLand, ballSkin]);

  return <div ref={containerRef} className="flex h-full w-full items-center justify-center overflow-hidden" />;
}
