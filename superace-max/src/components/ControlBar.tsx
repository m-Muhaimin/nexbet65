import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, RefreshCw, Zap, Minus, Plus, Square } from 'lucide-react';

const BET_STEPS = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];

interface ControlBarProps {
  winAmount?: number;
  win?: number;
  displayedWin?: number;
  betAmount?: number;
  bet?: number;
  balance?: number;
  isBalancePulsing?: boolean;
  isTurbo?: boolean;
  autoSpinsRemaining?: number;
  isSpinning?: boolean;
  isFreeSpinsActive?: boolean;
  freeSpinsRemaining?: number;
  freeSpinsTotal?: number;
  onBetChange?: (newBet: number) => void;
  onOpenBetSelector?: () => void;
  onToggleTurbo?: () => void;
  onToggleAutoplay?: () => void;
  onOpenAutoplay?: () => void;
  onStopAutoplay?: () => void;
  onOpenSettings?: () => void;
  onSpin?: () => void;
}

const SPIN_FRAMES = 9;
const SPIN_FRAME_PATH = '/assets/ui/spin-btn_';
const SPIN_INTERVAL_MS = 80;

const SpinButtonSprite: React.FC<{ isSpinning: boolean; canSpin: boolean; spinCost: number; onClick: () => void }> = ({
  isSpinning, canSpin, spinCost, onClick,
}) => {
  const [frame, setFrame] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastTime = useRef(0);
  const [loaded, setLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setLoaded(true);
    img.onerror = () => setUseFallback(true);
    img.src = `${SPIN_FRAME_PATH}000.png`;
  }, []);

  useEffect(() => {
    if (!isSpinning) {
      setFrame(hovered ? 1 : 0);
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      return;
    }
    let f = 0;
    const animate = (t: number) => {
      if (t - lastTime.current >= SPIN_INTERVAL_MS) {
        f = (f + 1) % SPIN_FRAMES;
        setFrame(f);
        lastTime.current = t;
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isSpinning, hovered]);

  const handleClick = () => {
    if (!canSpin || isSpinning) return;
    setPressed(true);
    setTimeout(() => setPressed(false), 120);
    onClick();
  };

  const SIZE = 56;

  if (useFallback || !loaded) {
    return (
      <button
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        disabled={!canSpin || isSpinning}
        className={`
          relative w-14 h-14 rounded-full flex items-center justify-center
          transition-all duration-200 select-none
          ${pressed ? 'scale-90' : 'scale-100'}
          ${canSpin && !isSpinning
            ? 'bg-gradient-to-b from-yellow-300 via-amber-400 to-orange-500 shadow-[0_0_24px_rgba(251,191,36,0.5)] cursor-pointer'
            : 'bg-gray-600/60 shadow-none cursor-not-allowed opacity-50'
          }
        `}
        aria-label={isSpinning ? 'Spinning' : `Spin for ৳${spinCost}`}
      >
        <div className="text-white font-black text-sm drop-shadow-lg">
          {isSpinning ? '...' : 'SPIN'}
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={!canSpin || isSpinning}
      className={`
        relative overflow-hidden select-none rounded-full
        transition-transform duration-100
        ${pressed ? 'scale-90' : 'scale-100'}
        ${canSpin && !isSpinning ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-50'}
      `}
      style={{
        width: SIZE,
        height: SIZE,
        backgroundImage: `url(${SPIN_FRAME_PATH}${String(frame).padStart(3, '0')}.png)`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        borderRadius: '50%',
      }}
      aria-label={isSpinning ? 'Spinning' : `Spin for ৳${spinCost}`}
    >
      {!isSpinning && (
        <div className="absolute bottom-0.5 left-0 right-0 text-center text-[9px] font-black text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] pointer-events-none">
          ৳{spinCost}
        </div>
      )}
    </button>
  );
};

export const ControlBar: React.FC<ControlBarProps> = React.memo(({
  winAmount,
  win,
  displayedWin,
  betAmount,
  bet,
  isTurbo = false,
  autoSpinsRemaining = 0,
  isSpinning = false,
  isFreeSpinsActive = false,
  onBetChange,
  onOpenBetSelector,
  onToggleTurbo,
  onToggleAutoplay,
  onOpenAutoplay,
  onStopAutoplay,
  onOpenSettings,
  onSpin,
}) => {
  const currentBet = typeof bet === 'number' ? bet : typeof betAmount === 'number' ? betAmount : 10;
  const currentWinVal =
    typeof displayedWin === 'number' ? displayedWin
      : typeof win === 'number' ? win
        : typeof winAmount === 'number' ? winAmount : 0;

  const handleDecreaseBet = () => {
    if (isSpinning || isFreeSpinsActive || !onBetChange) return;
    const idx = BET_STEPS.findIndex((b) => Math.abs(b - currentBet) < 0.01);
    if (idx > 0) onBetChange(BET_STEPS[idx - 1]);
    else if (currentBet > 10) onBetChange(10);
  };

  const handleIncreaseBet = () => {
    if (isSpinning || isFreeSpinsActive || !onBetChange) return;
    const idx = BET_STEPS.findIndex((b) => Math.abs(b - currentBet) < 0.01);
    if (idx >= 0 && idx < BET_STEPS.length - 1) onBetChange(BET_STEPS[idx + 1]);
    else onBetChange(10000);
  };

  const handleAutoClick = () => {
    if (autoSpinsRemaining > 0) {
      onStopAutoplay?.();
    } else {
      onOpenAutoplay?.();
    }
  };

  return (
    <div className="relative w-full z-20 px-2 py-0.5 flex flex-col gap-1 select-none">
      {/* Win line */}
      <div className="win-line w-full flex items-center justify-center gap-2 py-0.5">
        <span className="font-['MStiffHei_PRC_UltraBold'] font-extrabold text-[15px] text-[#f2b83c] tracking-[2px] uppercase">
          WIN
        </span>
        <span className="font-['MStiffHei_PRC_UltraBold'] font-extrabold text-[17px] text-[#ffffff] tabular-nums tracking-wide">
          ৳{currentWinVal.toFixed(2)}
        </span>
      </div>

      {/* Controls row */}
      <div className="w-full flex items-center justify-between gap-1.5 pt-0.5 pb-1">
        {/* Settings */}
        <button
          onClick={onOpenSettings}
          aria-label="Settings"
          className="min-w-[36px] flex-1 h-[42px] btn-dark flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all cursor-pointer"
        >
          <Settings className="w-5 h-5 text-[#f6d478]" />
          <span className="text-[7px] font-bold text-[#aab] uppercase tracking-tighter">SETTINGS</span>
        </button>

        {/* Bet box */}
        <div className="flex-1.5 min-w-0 h-[42px] btn-dark px-2 flex items-center justify-between">
          <button
            onClick={handleDecreaseBet}
            disabled={isSpinning || isFreeSpinsActive || currentBet <= 10}
            className="w-5 h-5 rounded-full bg-[#1e2e48] border border-[#a07830] flex items-center justify-center text-[#f6d478] active:scale-90 disabled:opacity-30 cursor-pointer"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            onClick={onOpenBetSelector}
            disabled={isSpinning}
            className="flex flex-col items-center justify-center px-1 cursor-pointer hover:brightness-125"
          >
            <span className="text-[8px] font-bold text-[#f6d478] uppercase leading-none">BET</span>
            <span className="font-['MStiffHei_PRC_UltraBold'] font-black text-sm text-white tabular-nums leading-tight">
              ৳{currentBet.toFixed(2)}
            </span>
          </button>
          <button
            onClick={handleIncreaseBet}
            disabled={isSpinning || isFreeSpinsActive || currentBet >= 10000}
            className="w-5 h-5 rounded-full bg-[#1e2e48] border border-[#a07830] flex items-center justify-center text-[#f6d478] active:scale-90 disabled:opacity-30 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Sprite spin button */}
        <div className="flex flex-col items-center shrink-0">
          <SpinButtonSprite
            isSpinning={isSpinning}
            canSpin={!isSpinning || autoSpinsRemaining > 0 || isFreeSpinsActive}
            spinCost={currentBet}
            onClick={onSpin || (() => {})}
          />
          <span className="text-[7px] font-bold text-[#f6d478] tracking-tight uppercase mt-0.5 leading-none">SPIN</span>
        </div>

        {/* Auto */}
        <button
          onClick={handleAutoClick}
          aria-label="Autoplay"
          className={`min-w-[36px] flex-1 h-[42px] btn-dark flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all cursor-pointer ${autoSpinsRemaining > 0 ? 'active' : ''}`}
        >
          {autoSpinsRemaining > 0 ? (
            <Square className="w-4 h-4 text-red-400 fill-red-400" />
          ) : (
            <RefreshCw className="w-5 h-5 text-[#f6d478]" />
          )}
          <span className="text-[7px] font-bold text-[#aab] uppercase tracking-tighter">
            {autoSpinsRemaining > 0 ? `${autoSpinsRemaining}` : 'AUTO'}
          </span>
        </button>

        {/* Turbo */}
        <button
          onClick={onToggleTurbo}
          aria-label="Turbo"
          className={`min-w-[36px] flex-1 h-[42px] btn-dark flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all cursor-pointer ${isTurbo ? 'active' : ''}`}
        >
          <Zap className={`w-5 h-5 ${isTurbo ? 'fill-[#f6b01a] text-[#f6b01a]' : 'text-[#f6d478]'}`} />
          <span className="text-[7px] font-bold text-[#aab] uppercase tracking-tighter">TURBO</span>
        </button>
      </div>
    </div>
  );
});
