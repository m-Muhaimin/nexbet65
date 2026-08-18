import React, { useEffect, useRef, useState, useCallback } from 'react';

interface BlurFXProps {
  isActive: boolean;
  width?: number;
  height?: number;
  className?: string;
}

const BLUR_FRAMES = 8;
const BLUR_FRAME_PATH = '/assets/fx/blur_';
const BLUR_SHEET_URL = '/assets/fx/blur_strip.png';
const BLUR_FRAME_INTERVAL = 80;

export const BlurFX: React.FC<BlurFXProps> = ({
  isActive,
  width = 490,
  height = 400,
  className = '',
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const animRef = useRef<number | null>(null);
  const lastFrameTime = useRef(0);

  useEffect(() => {
    if (!isActive) {
      setCurrentFrame(0);
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
      return;
    }

    let frame = 0;
    const animate = (time: number) => {
      if (time - lastFrameTime.current >= BLUR_FRAME_INTERVAL) {
        frame = (frame + 1) % BLUR_FRAMES;
        setCurrentFrame(frame);
        lastFrameTime.current = time;
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    };
  }, [isActive]);

  const [stripLoaded, setStripLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    const testImg = new Image();
    testImg.onload = () => setStripLoaded(true);
    testImg.onerror = () => setUseFallback(true);
    testImg.src = BLUR_SHEET_URL;
  }, []);

  if (!isActive) return null;

  const scaleY = height / BLUR_FRAMES;

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-30 overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {useFallback || !stripLoaded ? (
        <div className="w-full h-full bg-gradient-to-b from-white/20 via-cyan-200/30 to-white/20 animate-pulse" />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundImage: `url(${BLUR_SHEET_URL})`,
            backgroundSize: `100% ${BLUR_FRAMES * 100}%`,
            backgroundPosition: `0 -${currentFrame * 100 / (BLUR_FRAMES - 1)}%`,
            backgroundRepeat: 'no-repeat',
            opacity: 0.7,
            mixBlendMode: 'screen',
          }}
        />
      )}
    </div>
  );
};
