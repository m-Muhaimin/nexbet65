import React from 'react';
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
  const currentBet = typeof bet === 'number' ? bet : typeof betAmount === 'number' ? betAmount : 1.0;
  const currentWinVal =
    typeof displayedWin === 'number'
      ? displayedWin
      : typeof win === 'number'
      ? win
      : typeof winAmount === 'number'
      ? winAmount
      : 0.0;

  const handleDecreaseBet = () => {
    if (isSpinning || isFreeSpinsActive || !onBetChange) return;
    const currentIdx = BET_STEPS.findIndex((b) => Math.abs(b - currentBet) < 0.01);
    if (currentIdx > 0) {
      onBetChange(BET_STEPS[currentIdx - 1]);
    } else if (currentBet > 10) {
      onBetChange(10);
    }
  };

  const handleIncreaseBet = () => {
    if (isSpinning || isFreeSpinsActive || !onBetChange) return;
    const currentIdx = BET_STEPS.findIndex((b) => Math.abs(b - currentBet) < 0.01);
    if (currentIdx >= 0 && currentIdx < BET_STEPS.length - 1) {
      onBetChange(BET_STEPS[currentIdx + 1]);
    } else {
      onBetChange(10000);
    }
  };

  const handleAutoClick = () => {
    if (autoSpinsRemaining > 0) {
      if (onStopAutoplay) {
        onStopAutoplay();
      } else if (onToggleAutoplay) {
        onToggleAutoplay();
      }
    } else {
      if (onOpenAutoplay) {
        onOpenAutoplay();
      } else if (onToggleAutoplay) {
        onToggleAutoplay();
      }
    }
  };

  return (
    <div className="relative w-full z-20 px-2 py-0.5 flex flex-col gap-1 select-none">
      {/* 1. Win Line: Centered WIN label + value */}
      <div className="win-line w-full flex items-center justify-center gap-2 py-0.5">
        <span className="font-['MStiffHei_PRC_UltraBold'] font-extrabold text-[15px] text-[#f2b83c] tracking-[2px] uppercase">
          WIN
        </span>
        <span className="font-['MStiffHei_PRC_UltraBold'] font-extrabold text-[17px] text-[#ffffff] tabular-nums tracking-wide">
          ৳{currentWinVal.toFixed(2)}
        </span>
      </div>

      {/* 2. Controls Row */}
      <div className="w-full flex items-center justify-between gap-1.5 pt-0.5 pb-1">
        {/* Settings button (.sq) */}
        <button
          onClick={onOpenSettings}
          aria-label="Settings"
          className="min-w-[40px] flex-1 h-[44px] btn-dark flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all cursor-pointer"
        >
          <Settings className="w-5 h-5 text-[#f6d478]" />
          <span className="text-[8px] font-bold text-[#aab] uppercase tracking-tighter">
            SETTINGS
          </span>
        </button>

        {/* Bet Box */}
        <div className="flex-1.5 min-w-0 h-[44px] btn-dark px-2 flex items-center justify-between">
          {/* Bet Minus */}
          <button
            onClick={handleDecreaseBet}
            disabled={isSpinning || isFreeSpinsActive || currentBet <= 10}
            className="w-5 h-5 rounded-full bg-[#1e2e48] border border-[#a07830] flex items-center justify-center text-[#f6d478] active:scale-90 disabled:opacity-30 cursor-pointer"
          >
            <Minus className="w-3 h-3" />
          </button>

          {/* Bet Display (Clickable for selector) */}
          <button
            onClick={onOpenBetSelector}
            disabled={isSpinning}
            className="flex flex-col items-center justify-center px-1 cursor-pointer hover:brightness-125"
          >
            <span className="text-[8px] font-bold text-[#f6d478] uppercase leading-none">
              BET
            </span>
            <span className="font-['MStiffHei_PRC_UltraBold'] font-black text-sm text-white tabular-nums leading-tight">
              ৳{currentBet.toFixed(2)}
            </span>
          </button>

          {/* Bet Plus */}
          <button
            onClick={handleIncreaseBet}
            disabled={isSpinning || isFreeSpinsActive || currentBet >= 100}
            className="w-5 h-5 rounded-full bg-[#1e2e48] border border-[#a07830] flex items-center justify-center text-[#f6d478] active:scale-90 disabled:opacity-30 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Spin Button Wrap */}
        <div className="flex flex-col items-center shrink-0">
          <button
            id="spinBtn"
            onClick={onSpin}
            disabled={isSpinning && autoSpinsRemaining === 0 && !isFreeSpinsActive}
            aria-label="Spin"
            className={`relative w-14 h-14 rounded-full flex items-center justify-center border-2 border-[rgba(255,231,168,0.75)] shadow-[0_2px_10px_rgba(246,176,26,0.3),0_0_15px_rgba(246,176,26,0.15)] active:scale-95 transition-all cursor-pointer ${
              isSpinning ? 'animate-spin-pulse' : 'animate-spin-glow hover:scale-105'
            }`}
            style={{
              background:
                'radial-gradient(circle at 45% 35%, #fff0c7 0%, #f6a41c 40%, #c05a00 80%, #732a00 100%)',
            }}
          >
            {/* Spinning Conic Halo when spinning */}
            {isSpinning && (
              <div className="absolute inset-0 rounded-full border border-yellow-200 animate-spin-aura pointer-events-none" />
            )}

            {/* Spin Refresh Arrow + B Letter */}
            <div className="relative flex items-center justify-center">
              {/* Arrow */}
              <svg
                viewBox="0 0 24 24"
                className={`w-[57px] h-[57px] text-white ${
                  isSpinning ? 'animate-rot-fast' : ''
                }`}
                style={{ transform: 'scaleX(-1)' }}
              >
                <path
                  d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"
                  fill="currentColor"
                />
              </svg>

              {/* Centered B Brand Letter in MStiffHei */}
              <span className="absolute font-['MStiffHei_PRC_UltraBold'] font-black text-lg text-[#7a1000] drop-shadow-sm select-none pointer-events-none">
                B
              </span>
            </div>
          </button>
          <span className="text-[8px] font-bold text-[#f6d478] tracking-tight uppercase mt-0.5 leading-none">
            SPIN
          </span>
        </div>

        {/* Auto button (.sq) */}
        <button
          onClick={handleAutoClick}
          aria-label="Autoplay"
          className={`min-w-[40px] flex-1 h-[44px] btn-dark flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all cursor-pointer ${
            autoSpinsRemaining > 0 ? 'active' : ''
          }`}
        >
          {autoSpinsRemaining > 0 ? (
            <Square className="w-4 h-4 text-red-400 fill-red-400" />
          ) : (
            <RefreshCw className="w-5 h-5 text-[#f6d478]" />
          )}
          <span className="text-[8px] font-bold text-[#aab] uppercase tracking-tighter">
            {autoSpinsRemaining > 0 ? `${autoSpinsRemaining}` : 'AUTO'}
          </span>
        </button>

        {/* Turbo button (.sq) */}
        <button
          onClick={onToggleTurbo}
          aria-label="Turbo"
          className={`min-w-[40px] flex-1 h-[44px] btn-dark flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all cursor-pointer ${
            isTurbo ? 'active' : ''
          }`}
        >
          <Zap
            className={`w-5 h-5 ${
              isTurbo ? 'fill-[#f6b01a] text-[#f6b01a]' : 'text-[#f6d478]'
            }`}
          />
          <span className="text-[8px] font-bold text-[#aab] uppercase tracking-tighter">
            TURBO
          </span>
        </button>
      </div>
    </div>
  );
});
