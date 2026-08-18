"use client";

import { useEffect, useRef, useState } from "react";

/**
 * <win-multiplier> equivalent from the mockup, but driven by REAL crash points
 * fetched from the shared game DB instead of Math.random().
 */
export function MultiplierTicker({
  initial,
  crashes,
}: {
  initial: number | null;
  crashes: number[];
}) {
  const [value, setValue] = useState(initial ?? crashes[0] ?? 1.0);
  const valueRef = useRef(initial ?? crashes[0] ?? 1.0);
  const crashesRef = useRef(crashes);
  const cycleRef = useRef(0);

  useEffect(() => {
    crashesRef.current = crashes;
  }, [crashes]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const list = crashesRef.current;
      if (list.length > 0) {
        const target = list[cycleRef.current % list.length];
        cycleRef.current += 1;
        const from = valueRef.current;
        const t0 = performance.now();
        const dur = 900;
        const step = (t: number) => {
          const k = Math.min(1, (t - t0) / dur);
          const ease = 1 - Math.pow(1 - k, 3);
          const next = from + (target - from) * ease;
          valueRef.current = next;
          setValue(next);
          if (k < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      } else {
        raf = window.setTimeout(() => setValue((v) => v), 3000) as unknown as number;
      }
      raf = window.setTimeout(() => tick(), 4200) as unknown as number;
    };
    raf = window.setTimeout(() => tick(), 300) as unknown as number;
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(raf);
    };
  }, []);

  return (
    <span className="multiplier-big text-glow font-instrument relative font-black tabular-nums text-brand">
      {Math.round(value).toLocaleString("en-IN")}x
    </span>
  );
}
