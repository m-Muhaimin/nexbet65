import React, { useState, useEffect, useRef, useCallback } from 'react';

interface SpinButtonProps {
  isSpinning: boolean;
  isAutoSpinning?: boolean;
  spinCost: number;
  canSpin: boolean;
  onClick: () => void;
  size?: number;
}

const TOTAL_FRAMES = 9;
const FRAME_PATH = '/assets/ui/spin-btn_';
const SPRITE_FRAME_HEIGHT = 86;

export const SpinButton: React.FC<SpinButtonProps> = ({
  isSpinning,
  isAutoSpinning = false,
  spinCost,
  canSpin,
  onClick,
  size = 72,
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const animRef = useRef<number | null>(null);
  const lastFrameTime = useRef(0);

  useEffect(() => {
    if (!isSpinning) {
      setCurrentFrame(isHovered ? 1 : 0);
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
      return;
    }

    let frame = 0;
    const animate = (time: number) => {
      if (time - lastFrameTime.current >= 80) {
        frame = (frame + 1) % TOTAL_FRAMES;
        setCurrentFrame(frame);
        lastFrameTime.current = time;
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [isSpinning, isHovered]);

  const handleClick = () => {
    if (canSpin && !isSpinning) {
      setIsPressed(true);
      setTimeout(() => setIsPressed(false), 150);
      onClick();
    }
  };

  const [framesLoaded, setFramesLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    const testImg = new Image();
    testImg.onload = () => setFramesLoaded(true);
    testImg.onerror = () => setUseFallback(true);
    testImg.src = `${FRAME_PATH}${String(0).padStart(3, '0')}.png`;
  }, []);

  const buttonSize = size;

  if (useFallback || !framesLoaded) {
    return (
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={!canSpin || isSpinning}
        className={`
          relative rounded-full flex items-center justify-center
          transition-all duration-200 select-none
          ${isPressed ? 'scale-90' : 'scale-100'}
          ${canSpin && !isSpinning
            ? 'bg-gradient-to-b from-yellow-300 via-amber-400 to-orange-500 shadow-[0_0_24px_rgba(251,191,36,0.5)] cursor-pointer'
            : 'bg-gray-600/60 shadow-none cursor-not-allowed opacity-50'
          }
        `}
        style={{ width: buttonSize, height: buttonSize }}
      >
        <div className="text-white font-black text-lg drop-shadow-lg">
          {isSpinning ? '...' : 'SPIN'}
        </div>
        {!isSpinning && (
          <div className="absolute -bottom-1 text-[10px] font-bold text-amber-200">
            ৳{spinCost}
          </div>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={!canSpin || isSpinning}
      className={`
        relative overflow-hidden select-none
        transition-transform duration-100
        ${isPressed ? 'scale-90' : 'scale-100'}
        ${canSpin && !isSpinning ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
      `}
      style={{
        width: buttonSize,
        height: buttonSize,
        backgroundImage: `url(${FRAME_PATH}${String(currentFrame).padStart(3, '0')}.png)`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        borderRadius: '50%',
      }}
      aria-label={isSpinning ? 'Spinning' : `Spin for ৳${spinCost}`}
    >
      {!isSpinning && (
        <div className="absolute bottom-0.5 left-0 right-0 text-center text-[11px] font-black text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] pointer-events-none">
          ৳{spinCost}
        </div>
      )}
    </button>
  );
};
