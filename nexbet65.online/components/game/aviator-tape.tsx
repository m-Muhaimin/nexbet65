"use client";

/**
 * Right-edge altimeter tape for the Aviator scene. A vertical ruler of
 * multiplier "altitude bands" that scrolls past a fixed horizon line; the
 * current value is read off the line at the tape's index tab.
 *
 * Pure render of server state: scroll position derives ONLY from `value`
 * via the same progress mapping used by the curve, never from timers or an
 * invented climb rate.
 */

const TAPE_SCALE = 170;

const TAPE_BANDS: { v: number; major: boolean }[] = (() => {
  const majors = [1, 2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 50];
  const minors = [1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.2, 2.4, 2.6, 2.8, 3.5, 4.5, 6.5, 12, 25, 40];
  return [
    ...majors.map((v) => ({ v, major: true })),
    ...minors.map((v) => ({ v, major: false })),
  ].sort((a, b) => a.v - b.v);
})();

const progressFor = (m: number) => Math.min(1, 1 - Math.pow(Math.max(1, m), -0.5));

interface AviatorTapeProps {
  value: number;
  tone: string;
}

export default function AviatorTape({ value, tone }: AviatorTapeProps) {
  const cur = Math.max(1, value);
  const p = progressFor(cur);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 right-0 z-[5] w-[92px] overflow-hidden border-l border-cyan-400/20"
      style={{
        background:
          "linear-gradient(180deg, rgba(10,20,32,0.94), rgba(10,20,32,0.5) 50%, rgba(10,20,32,0.94))",
      }}
    >
      <div className="absolute left-2.5 top-2.5 font-instrument text-[8px] tracking-[0.2em] text-white/40">
        ALT
      </div>

      {TAPE_BANDS.map((b) => {
        const y = (p - progressFor(b.v)) * TAPE_SCALE;
        if (y < -220 || y > 220) return null;
        return (
          <div
            key={b.v}
            className="absolute inset-x-0 top-1/2 flex items-center justify-end gap-1.5"
            style={{ transform: `translateY(calc(-50% + ${y}px))` }}
          >
            <span
              className={
                b.major
                  ? "font-instrument text-[10px] text-white/85"
                  : "font-instrument text-[8px] text-white/40"
              }
            >
              {b.major ? `${b.v}x` : b.v}
            </span>
            <span
              className="mr-1.5"
              style={{
                width: b.major ? 22 : 12,
                height: 1,
                background: b.major
                  ? "rgba(77,232,255,0.55)"
                  : "rgba(77,232,255,0.22)",
              }}
            />
          </div>
        );
      })}

      <div
        className="absolute inset-x-0 top-1/2 h-px"
        style={{
          background: "rgba(77,232,255,0.75)",
          boxShadow: "0 0 8px rgba(77,232,255,0.6)",
        }}
      />
      <div
        className="absolute right-2 top-1/2 rounded-[3px] border border-cyan-400/25 bg-[#0a1420]/90 px-1.5 py-0.5 font-instrument text-[13px] font-bold"
        style={{ transform: "translateY(-50%)", color: tone, textShadow: `0 0 10px ${tone}` }}
      >
        {cur.toFixed(2)}x
      </div>
    </div>
  );
}
