import React, { useEffect, useRef } from 'react';

interface FireflyParticleCanvasProps {
  comboMultiplier: number;
  isFreeSpinsActive?: boolean;
}

interface Firefly {
  x: number;
  y: number;
  baseRadius: number;
  vx: number;
  vy: number;
  phase: number;
  phaseSpeed: number;
  alpha: number;
  baseAlpha: number;
  hue: number;
}

export const FireflyParticleCanvas: React.FC<FireflyParticleCanvasProps> = ({
  comboMultiplier,
  isFreeSpinsActive = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const firefliesRef = useRef<Firefly[]>([]);
  const multiplierRef = useRef<number>(comboMultiplier);
  const freeSpinsRef = useRef<boolean>(isFreeSpinsActive);

  useEffect(() => {
    multiplierRef.current = comboMultiplier;
    freeSpinsRef.current = isFreeSpinsActive;
  }, [comboMultiplier, isFreeSpinsActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let isRunning = true;

    // Handle high DPI and resizing
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };
    updateSize();

    // Initialize 36 fireflies
    const count = 36;
    const fireflies: Firefly[] = [];
    const width = canvas.width || 400;
    const height = canvas.height || 400;

    for (let i = 0; i < count; i++) {
      fireflies.push({
        x: Math.random() * width,
        y: Math.random() * height,
        baseRadius: Math.random() * 2.2 + 1.2,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(Math.random() * 0.5 + 0.2), // slow gentle upward drift
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: Math.random() * 0.03 + 0.015,
        alpha: Math.random() * 0.7 + 0.3,
        baseAlpha: Math.random() * 0.5 + 0.3,
        hue: Math.random() * 30 + 35, // default warm gold
      });
    }
    firefliesRef.current = fireflies;

    const render = () => {
      if (!isRunning) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const mult = multiplierRef.current;
      const isFS = freeSpinsRef.current;

      // Multiplier intensity factor (1.0 at x1 up to 2.8 at x5+)
      const intensityFactor = isFS
        ? 2.5
        : mult >= 5
        ? 2.8
        : mult >= 3
        ? 2.0
        : mult >= 2
        ? 1.5
        : 1.0;

      // Determine palette based on multiplier
      let coreColor = '#fef08a';
      let glowColor = '#f59e0b';
      let speedScale = 1.0;

      if (isFS || mult >= 5) {
        coreColor = '#fffbeb';
        glowColor = '#ef4444'; // fiery crimson-gold in epic state
        speedScale = 2.0;
      } else if (mult >= 3) {
        coreColor = '#fef08a';
        glowColor = '#ea580c'; // fiery amber
        speedScale = 1.6;
      } else if (mult >= 2) {
        coreColor = '#fef08a';
        glowColor = '#f59e0b'; // energetic gold
        speedScale = 1.3;
      } else {
        coreColor = '#fef9c3';
        glowColor = '#fbbf24'; // calm warm gold
        speedScale = 1.0;
      }

      for (let i = 0; i < fireflies.length; i++) {
        const f = fireflies[i];

        // Wave motion update
        f.phase += f.phaseSpeed * speedScale;
        f.x += f.vx * speedScale + Math.sin(f.phase) * 0.35 * speedScale;
        f.y += f.vy * speedScale;

        // Wrap around boundaries
        if (f.y < -10) f.y = h + 10;
        if (f.y > h + 10) f.y = -10;
        if (f.x < -10) f.x = w + 10;
        if (f.x > w + 10) f.x = -10;

        // Pulsing luminescence
        const currentAlpha = Math.max(
          0.1,
          Math.min(1.0, f.baseAlpha + Math.sin(f.phase) * 0.3 * intensityFactor)
        );
        const currentRadius = f.baseRadius * (1 + Math.sin(f.phase * 1.5) * 0.25 * (intensityFactor - 0.5));

        ctx.save();
        ctx.globalAlpha = currentAlpha;

        // Outer glow
        const glowRadius = currentRadius * (4 * intensityFactor);
        const grad = ctx.createRadialGradient(
          f.x,
          f.y,
          0,
          f.x,
          f.y,
          glowRadius
        );
        grad.addColorStop(0, coreColor);
        grad.addColorStop(0.35, glowColor);
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(f.x, f.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Inner bright core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(f.x, f.y, currentRadius * 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      animFrame = requestAnimationFrame(render);
    };

    animFrame = requestAnimationFrame(render);

    const handleResize = () => {
      updateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-80"
    />
  );
};
