/**
 * CanvasParticleLayer — single canvas rendering multiple named particle layers.
 *
 * Replaces 5 separate <canvas> elements with one shared canvas
 * and one shared requestAnimationFrame loop.
 *
 * Layers:
 *   - fireflies: continuous ambient gold sparkles
 *   - vaultCoins: flying coins on vault deposit
 *   - aztecBurst: explosion on cascade trigger
 *   - bigWinCoins: celebration burst
 *   - confetti: confetti rain
 */

import React, { useEffect, useRef, useCallback } from 'react';

interface Firefly {
  x: number; y: number; vx: number; vy: number;
  baseRadius: number; phase: number; phaseSpeed: number;
  baseAlpha: number; hue: number;
}

interface VaultCoin {
  x: number; y: number; progress: number; speed: number;
  radius: number; angle: number; rotSpeed: number;
  ctrlX: number; ctrlY: number; alpha: number;
  originX: number; originY: number; targetX: number; targetY: number;
}

interface AztecParticle {
  x: number; y: number; vx: number; vy: number;
  size: number; color: string; alpha: number; decay: number;
  rotation: number; vRot: number;
  shape: 'rune' | 'spark' | 'ring' | 'star' | 'orb';
  glow: number;
}

interface CoinParticle {
  x: number; y: number; vx: number; vy: number;
  size: number; rotation: number; rotSpeed: number;
  flipAngle: number; flipSpeed: number;
  type: 'coin' | 'glitter' | 'star';
  color: string; opacity: number; life: number; maxLife: number;
}

interface ConfettiPiece {
  x: number; y: number; vx: number; vy: number;
  size: number; color: string; isCoin: boolean;
  angle: number; spinSpeed: number; life: number;
}

interface CanvasLayerProps {
  /** Current multiplier for firefly intensity. */
  comboMultiplier?: number;
  /** Whether free spins are active (changes firefly palette). */
  isFreeSpinsActive?: boolean;
  /** Vault deposit trigger — increments to spawn flying coins. */
  vaultTriggerKey?: number;
  /** Aztec burst trigger — increments to spawn explosion. */
  aztecTriggerKey?: number;
  /** Big win celebration active state. */
  bigWinActive?: boolean;
  /** Big win tier. */
  bigWinTier?: 'big' | 'mega' | 'super';
  /** Confetti active. */
  confettiActive?: boolean;
  /** Confetti power multiplier. */
  confettiPower?: number;
}

const FIRE_COUNT = 36;
const GOLD_COLORS = ['#fef08a', '#f59e0b', '#fbbf24', '#d97706', '#fde047'];
const AZTEC_COLORS = ['#fef08a', '#f59e0b', '#fbbf24', '#d97706', '#ffedd5', '#10b981', '#ef4444'];

function initFireflies(w: number, h: number): Firefly[] {
  const arr: Firefly[] = [];
  for (let i = 0; i < FIRE_COUNT; i++) {
    arr.push({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4, vy: -(Math.random() * 0.5 + 0.2),
      baseRadius: Math.random() * 2.2 + 1.2,
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: Math.random() * 0.03 + 0.015,
      baseAlpha: Math.random() * 0.5 + 0.3,
      hue: Math.random() * 30 + 35,
    });
  }
  return arr;
}

export const CanvasParticleLayer: React.FC<CanvasLayerProps> = ({
  comboMultiplier = 1,
  isFreeSpinsActive = false,
  vaultTriggerKey = 0,
  aztecTriggerKey = 0,
  bigWinActive = false,
  bigWinTier = 'big',
  confettiActive = false,
  confettiPower = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const firefliesRef = useRef<Firefly[]>([]);
  const vaultCoinsRef = useRef<VaultCoin[]>([]);
  const aztecRef = useRef<AztecParticle[]>([]);
  const bigWinRef = useRef<CoinParticle[]>([]);
  const confettiRef = useRef<ConfettiPiece[]>([]);
  const multRef = useRef(comboMultiplier);
  const fsRef = useRef(isFreeSpinsActive);
  const shockRRef = useRef(0);
  const shockARef = useRef(0);

  useEffect(() => { multRef.current = comboMultiplier; fsRef.current = isFreeSpinsActive; }, [comboMultiplier, isFreeSpinsActive]);

  // Initialize fireflies
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const w = c.clientWidth || 400;
    const h = c.clientHeight || 400;
    firefliesRef.current = initFireflies(w, h);
  }, []);

  // Vault coin spawn
  useEffect(() => {
    if (!vaultTriggerKey) return;
    const c = canvasRef.current;
    if (!c) return;
    const w = c.clientWidth || 400;
    const h = c.clientHeight || 400;
    const ox = w / 2, oy = h / 2;
    const tx = w > 500 ? w / 2 + 120 : w - 60;
    const ty = 30;
    const coins: VaultCoin[] = [];
    for (let i = 0; i < 12; i++) {
      const cx = (ox + tx) / 2 + (Math.random() - 0.5) * 200;
      const cy = Math.min(oy, ty) - 80 - Math.random() * 100;
      coins.push({
        x: ox + (Math.random() - 0.5) * 160,
        y: oy + (Math.random() - 0.5) * 80,
        originX: ox, originY: oy, targetX: tx, targetY: ty,
        progress: -i * 0.05, speed: 0.02 + Math.random() * 0.015,
        radius: 8 + Math.random() * 4, angle: Math.random() * Math.PI * 2,
        rotSpeed: 0.15 + Math.random() * 0.2,
        ctrlX: cx, ctrlY: cy, alpha: 1,
      });
    }
    vaultCoinsRef.current = coins;
  }, [vaultTriggerKey]);

  // Aztec burst spawn
  useEffect(() => {
    if (!aztecTriggerKey) return;
    const c = canvasRef.current;
    if (!c) return;
    const w = c.clientWidth || 400;
    const h = c.clientHeight || 400;
    const cx = w / 2, cy = h / 2;
    const ps: AztecParticle[] = [];
    const shapes: AztecParticle['shape'][] = ['rune', 'spark', 'ring', 'star', 'orb'];
    for (let i = 0; i < 45; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = Math.random() * 6.5 + 2;
      ps.push({
        x: cx + (Math.random() - 0.5) * 40, y: cy + (Math.random() - 0.5) * 30,
        vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
        size: Math.random() * 7 + 3,
        color: AZTEC_COLORS[Math.floor(Math.random() * AZTEC_COLORS.length)],
        alpha: 1, decay: Math.random() * 0.022 + 0.015,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.15,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        glow: Math.random() * 12 + 6,
      });
    }
    for (let i = 0; i < 25; i++) {
      ps.push({
        x: Math.random() * w, y: h - Math.random() * 20,
        vx: (Math.random() - 0.5) * 2.2, vy: -(Math.random() * 5 + 3),
        size: Math.random() * 5 + 2,
        color: Math.random() > 0.3 ? '#f59e0b' : '#fbbf24',
        alpha: 0.95, decay: Math.random() * 0.02 + 0.012,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.1,
        shape: 'orb', glow: 8,
      });
    }
    aztecRef.current = ps;
    shockRRef.current = 10;
    shockARef.current = 0.9;
  }, [aztecTriggerKey]);

  // Big win coin spawn
  useEffect(() => {
    if (!bigWinActive) { bigWinRef.current = []; return; }
    const c = canvasRef.current;
    if (!c) return;
    const w = c.clientWidth || 400;
    const h = c.clientHeight || 400;
    const mult = bigWinTier === 'super' ? 2.2 : bigWinTier === 'mega' ? 1.7 : 1.2;
    const count = Math.floor(130 * mult);
    const ps: CoinParticle[] = [];
    for (let i = 0; i < count; i++) {
      const isCoin = Math.random() < 0.45;
      const isStar = !isCoin && Math.random() < 0.4;
      const a = Math.random() * Math.PI * 2;
      const spd = isCoin ? Math.random() * 14 + 6 : Math.random() * 18 + 4;
      ps.push({
        x: w / 2 + (Math.random() - 0.5) * 120,
        y: h * 0.42 + (Math.random() - 0.5) * 80,
        vx: Math.cos(a) * spd * (0.8 + Math.random() * 0.6),
        vy: Math.sin(a) * spd - (Math.random() * 10 + 4),
        size: isCoin ? Math.random() * 10 + 12 : isStar ? Math.random() * 8 + 6 : Math.random() * 4 + 2,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.15,
        flipAngle: Math.random() * Math.PI,
        flipSpeed: Math.random() * 0.18 + 0.08,
        type: isCoin ? 'coin' : isStar ? 'star' : 'glitter',
        color: GOLD_COLORS[Math.floor(Math.random() * GOLD_COLORS.length)],
        opacity: 1, life: 0, maxLife: Math.random() * 90 + 90,
      });
    }
    bigWinRef.current = ps;
  }, [bigWinActive, bigWinTier]);

  // Confetti spawn
  useEffect(() => {
    if (!confettiActive) { confettiRef.current = []; return; }
    const c = canvasRef.current;
    if (!c) return;
    const w = c.clientWidth || 460;
    const h = c.clientHeight || 700;
    const colors = ['#f6d478', '#f2b83c', '#fff6d8', '#e0503a', '#5b7cf0', '#2ea05a'];
    const n = Math.floor(55 * confettiPower);
    const ps: ConfettiPiece[] = [];
    for (let i = 0; i < n; i++) {
      const isCoin = Math.random() < 0.28;
      ps.push({
        x: w / 2 + (Math.random() - 0.5) * 80,
        y: h * 0.45 + (Math.random() - 0.5) * 60,
        vx: (Math.random() - 0.5) * 14 * confettiPower,
        vy: (Math.random() * -12 - 4) * confettiPower,
        size: isCoin ? Math.random() * 8 + 8 : Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        isCoin, angle: Math.random() * Math.PI * 2,
        spinSpeed: (Math.random() - 0.5) * 0.2,
        life: 1,
      });
    }
    confettiRef.current = ps;
  }, [confettiActive, confettiPower]);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      if (r.width && r.height) { canvas.width = r.width; canvas.height = r.height; }
    };
    resize();
    window.addEventListener('resize', resize);

    let running = true;
    const render = () => {
      if (!running) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const mult = multRef.current;
      const isFS = fsRef.current;
      const intFactor = isFS ? 2.5 : mult >= 5 ? 2.8 : mult >= 3 ? 2.0 : mult >= 2 ? 1.5 : 1.0;
      const spdScale = isFS ? 2.0 : mult >= 3 ? 1.6 : mult >= 2 ? 1.3 : 1.0;

      // ── Fireflies ────────────────────────────────────────────
      const coreCol = isFS || mult >= 5 ? '#fffbeb' : '#fef08a';
      const glowCol = isFS || mult >= 5 ? '#ef4444' : mult >= 3 ? '#ea580c' : '#f59e0b';
      for (const f of firefliesRef.current) {
        f.phase += f.phaseSpeed * spdScale;
        f.x += f.vx * spdScale + Math.sin(f.phase) * 0.35 * spdScale;
        f.y += f.vy * spdScale;
        if (f.y < -10) f.y = h + 10; if (f.y > h + 10) f.y = -10;
        if (f.x < -10) f.x = w + 10; if (f.x > w + 10) f.x = -10;
        const alpha = Math.max(0.1, Math.min(1, f.baseAlpha + Math.sin(f.phase) * 0.3 * intFactor));
        const r = f.baseRadius * (1 + Math.sin(f.phase * 1.5) * 0.25 * (intFactor - 0.5));
        ctx.save();
        ctx.globalAlpha = alpha;
        const gr = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r * 4 * intFactor);
        gr.addColorStop(0, coreCol); gr.addColorStop(0.35, glowCol); gr.addColorStop(1, 'transparent');
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.arc(f.x, f.y, r * 4 * intFactor, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(f.x, f.y, r * 0.6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // ── Vault coins ──────────────────────────────────────────
      for (const c of vaultCoinsRef.current) {
        c.progress += c.speed;
        if (c.progress < 0) continue;
        if (c.progress > 1) { c.alpha -= 0.08; if (c.alpha <= 0) continue; }
        const t = Math.min(1, Math.max(0, c.progress));
        const inv = 1 - t;
        c.x = inv * inv * c.originX + 2 * inv * t * c.ctrlX + t * t * c.targetX;
        c.y = inv * inv * c.originY + 2 * inv * t * c.ctrlY + t * t * c.targetY;
        c.angle += c.rotSpeed;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.scale(Math.cos(c.angle), 1);
        ctx.globalAlpha = Math.max(0, c.alpha);
        const gr = ctx.createRadialGradient(0, 0, 1, 0, 0, c.radius);
        gr.addColorStop(0, '#fff'); gr.addColorStop(0.3, '#fde047');
        gr.addColorStop(0.7, '#eab308'); gr.addColorStop(1, '#854d0e');
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.arc(0, 0, c.radius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#713f12'; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.fillStyle = '#713f12';
        ctx.font = `bold ${Math.round(c.radius * 1.1)}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('৳', 0, 1);
        ctx.restore();
      }

      // ── Aztec particles + shockwave ──────────────────────────
      if (shockARef.current > 0.01) {
        ctx.save();
        const cx = w / 2, cy = h / 2;
        ctx.beginPath(); ctx.arc(cx, cy, shockRRef.current, 0, Math.PI * 2);
        ctx.lineWidth = Math.max(1, (1 - shockRRef.current / (w * 0.8)) * 6);
        ctx.strokeStyle = `rgba(251,191,36,${shockARef.current})`;
        ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, Math.max(0, shockRRef.current - 15), 0, Math.PI * 2);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = `rgba(254,240,138,${shockARef.current * 0.7})`;
        ctx.stroke(); ctx.restore();
        shockRRef.current += 9; shockARef.current *= 0.93;
      }
      for (let i = aztecRef.current.length - 1; i >= 0; i--) {
        const p = aztecRef.current[i];
        p.x += p.vx; p.y += p.vy; p.rotation += p.vRot;
        p.alpha -= p.decay; p.vx *= 0.96; p.vy *= 0.96;
        if (p.alpha <= 0.02) { aztecRef.current.splice(i, 1); continue; }
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
        ctx.translate(p.x, p.y); ctx.rotate(p.rotation);
        ctx.shadowColor = p.color; ctx.shadowBlur = p.glow;
        if (p.shape === 'orb') {
          const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
          g.addColorStop(0, '#fff'); g.addColorStop(0.4, p.color); g.addColorStop(1, 'transparent');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI * 2); ctx.fill();
        } else if (p.shape === 'star') {
          ctx.fillStyle = p.color; ctx.beginPath();
          ctx.moveTo(0, -p.size * 1.5); ctx.lineTo(p.size * 0.3, -p.size * 0.3);
          ctx.lineTo(p.size * 1.5, 0); ctx.lineTo(p.size * 0.3, p.size * 0.3);
          ctx.lineTo(0, p.size * 1.5); ctx.lineTo(-p.size * 0.3, p.size * 0.3);
          ctx.lineTo(-p.size * 1.5, 0); ctx.lineTo(-p.size * 0.3, -p.size * 0.3);
          ctx.closePath(); ctx.fill();
        } else if (p.shape === 'rune') {
          ctx.strokeStyle = p.color; ctx.lineWidth = 1.8; ctx.beginPath();
          ctx.moveTo(0, -p.size); ctx.lineTo(p.size, 0); ctx.lineTo(0, p.size); ctx.lineTo(-p.size, 0);
          ctx.closePath(); ctx.stroke();
          ctx.fillStyle = '#fff'; ctx.fillRect(-1, -1, 2, 2);
        } else if (p.shape === 'ring') {
          ctx.strokeStyle = p.color; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI * 2); ctx.stroke();
        } else {
          ctx.fillStyle = p.color; ctx.beginPath();
          ctx.moveTo(0, -p.size * 1.2); ctx.lineTo(p.size * 0.4, 0);
          ctx.lineTo(0, p.size * 1.2); ctx.lineTo(-p.size * 0.4, 0);
          ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }

      // ── Big win coins ────────────────────────────────────────
      for (const p of bigWinRef.current) {
        p.life++;
        if (p.life > p.maxLife) {
          if (p.life < p.maxLife + 60) {
            p.x = Math.random() * w; p.y = -20;
            p.vx = (Math.random() - 0.5) * 4; p.vy = Math.random() * 6 + 3; p.life = 10;
          } else continue;
        }
        p.vx *= 0.985; p.vy = p.vy * 0.985 + 0.42;
        p.x += p.vx; p.y += p.vy; p.rotation += p.rotSpeed; p.flipAngle += p.flipSpeed;
        const lr = p.life / p.maxLife;
        p.opacity = lr > 0.8 ? (1 - lr) * 5 : 1;
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.opacity));
        ctx.translate(p.x, p.y); ctx.rotate(p.rotation);
        if (p.type === 'coin') {
          const sy = Math.cos(p.flipAngle);
          ctx.scale(1, Math.abs(sy));
          const g = ctx.createLinearGradient(-p.size, -p.size, p.size, p.size);
          g.addColorStop(0, '#fffbeb'); g.addColorStop(0.3, '#fde047');
          g.addColorStop(0.7, '#d97706'); g.addColorStop(1, '#78350f');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI * 2); ctx.fill();
          ctx.lineWidth = 1.5; ctx.strokeStyle = '#fef08a'; ctx.stroke();
          if (Math.abs(sy) > 0.3) {
            ctx.fillStyle = '#78350f'; ctx.font = `bold ${Math.floor(p.size * 0.9)}px Georgia`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('৳', 0, 1);
          }
        } else if (p.type === 'star') {
          ctx.fillStyle = p.color; ctx.shadowColor = '#fde047'; ctx.shadowBlur = 8;
          ctx.beginPath(); ctx.moveTo(0, -p.size); ctx.quadraticCurveTo(0, 0, p.size, 0);
          ctx.quadraticCurveTo(0, 0, 0, p.size); ctx.quadraticCurveTo(0, 0, -p.size, 0);
          ctx.quadraticCurveTo(0, 0, 0, -p.size); ctx.closePath(); ctx.fill();
        } else {
          ctx.fillStyle = p.color; ctx.shadowColor = '#fef08a'; ctx.shadowBlur = 6;
          ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }

      // ── Confetti ─────────────────────────────────────────────
      for (const p of confettiRef.current) {
        if (p.life <= 0) continue;
        p.x += p.vx; p.y += p.vy; p.vy += 0.35;
        p.angle += p.spinSpeed; p.life -= 0.015;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y); ctx.rotate(p.angle);
        if (p.isCoin) {
          ctx.fillStyle = '#f4cf6d'; ctx.strokeStyle = '#8a5a12'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#7a4d12'; ctx.font = 'bold 8px Georgia';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('৳', 0, 0);
        } else {
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.7);
        }
        ctx.restore();
      }

      requestAnimationFrame(render);
    };

    const frame = requestAnimationFrame(render);
    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[50]"
    />
  );
};
