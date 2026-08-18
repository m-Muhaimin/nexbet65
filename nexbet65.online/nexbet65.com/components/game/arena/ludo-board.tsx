"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Dice3D from "./dice3d";
import { TRACK_SET, HOME_OF, START_OF, SAFE, cellOfRoute, inYard } from "@/lib/arena/ludo-engine";
import type { GameState, LudoColor, LudoToken } from "@/lib/arena/types";

const N = 15;
const step = 100 / N;
const ARROWS: Record<string, [string, string]> = {
  "7,0": ["right", "#4a4a5c"],
  "0,7": ["down", "#1fe0ff"],
  "7,14": ["left", "#4a4a5c"],
  "14,7": ["up", "#ff2e88"],
};
const COLORS: Record<string, string> = { pink: "#ff2e88", cyan: "#1fe0ff" };

/* ---- shared SVG shapes (ported from Grandmaster-Arena) ---- */

const PALETTES: Record<string, Record<string, string>> = {
  pink: { hi: "#ffd3e6", light: "#ff6fae", mid: "#ff2e88", dark: "#8f0f4a", knurl: "#52082a", occ: "#6b0b38" },
  cyan: { hi: "#dbfbff", light: "#7cf1ff", mid: "#1fe0ff", dark: "#086d80", knurl: "#043d49", occ: "#06505f" },
  slate: { hi: "#f2f0ee", light: "#8d8b98", mid: "#4a4955", dark: "#1a1922", knurl: "#111", occ: "#111" },
};
const STAR_PATH =
  "M0,-19.5 L4.7,-6.5 L18.6,-6 L7.7,2.5 L11.5,15.8 L0,8 L-11.5,15.8 L-7.7,2.5 L-18.6,-6 L-4.7,-6.5 Z";

export type CoinStyle = "classic" | "neon" | "metallic";

function CoinSVG({ color, id = "c", style = "classic" }: { color: string; id?: string; style?: CoinStyle }) {
  const p = color === "#ff2e88" ? PALETTES.pink : color === "#1fe0ff" ? PALETTES.cyan : PALETTES.slate;
  const uid = id.replace(/[^a-z0-9]/gi, "") + (color === "#ff2e88" ? "p" : "c") + style;

  if (style === "neon") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" className="block h-full w-full">
        <defs>
          <filter id={`neon${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <circle cx="80" cy="80" r="60" fill="none" stroke={p.mid} strokeWidth="6" strokeOpacity="0.4" filter={`url(#neon${uid})`} />
        <circle cx="80" cy="80" r="60" fill="none" stroke="#fff" strokeWidth="2" />
        <circle cx="80" cy="80" r="50" fill="none" stroke={p.light} strokeWidth="4" opacity="0.6" filter={`url(#neon${uid})`} />
        <path transform="translate(80 80) scale(0.8)" d={STAR_PATH} fill="none" stroke={p.light} strokeWidth="2" filter={`url(#neon${uid})`} />
      </svg>
    );
  }

  if (style === "metallic") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" className="block h-full w-full drop-shadow-2xl">
        <defs>
          <linearGradient id={`metal${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={p.hi} />
            <stop offset="25%" stopColor={p.light} />
            <stop offset="50%" stopColor={p.hi} />
            <stop offset="75%" stopColor={p.dark} />
            <stop offset="100%" stopColor={p.hi} />
          </linearGradient>
        </defs>
        <circle cx="80" cy="84" r="60" fill="#000" opacity="0.4" />
        <circle cx="80" cy="80" r="60" fill={`url(#metal${uid})`} stroke={p.knurl} strokeWidth="2" />
        <circle cx="80" cy="80" r="50" fill="none" stroke={p.hi} strokeWidth="1" strokeOpacity="0.5" />
        <path transform="translate(80 80)" d={STAR_PATH} fill={p.dark} fillOpacity="0.3" stroke={p.knurl} strokeWidth="1" />
      </svg>
    );
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" className="block h-full w-full drop-shadow-xl">
      <defs>
        <radialGradient id={`t${uid}`} cx="0.35" cy="0.3" r="0.95">
          <stop offset="0" stopColor={p.hi} />
          <stop offset=".25" stopColor={p.light} />
          <stop offset=".6" stopColor={p.mid} />
          <stop offset="1" stopColor={p.dark} />
        </radialGradient>
        <radialGradient id={`s${uid}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff" stopOpacity=".7" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <filter id={`f${uid}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>
      <circle cx="80" cy="86" r="59" fill="#000" opacity=".38" filter={`url(#f${uid})`} />
      <circle cx="80" cy="80" r="60" fill={`url(#t${uid})`} stroke={p.dark} strokeWidth="1.5" />
      <circle cx="80" cy="80" r="58" fill="none" stroke={p.knurl} strokeWidth="3.5" strokeDasharray="2.5 4.5" opacity=".45" />
      <circle cx="80" cy="80" r="55" fill="none" stroke={p.occ} strokeWidth="4" strokeDasharray="90 999" opacity=".35" />
      <circle cx="80" cy="80" r="59" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="70 999" opacity=".22" />
      <circle cx="80" cy="80" r="47" fill="none" stroke={p.dark} strokeWidth="2.6" opacity=".55" />
      <circle cx="80" cy="81" r="47" fill="none" stroke={p.light} strokeWidth="1.1" opacity=".5" />
      <circle cx="80" cy="80" r="34" fill="none" stroke={p.dark} strokeWidth="2.2" opacity=".5" />
      <circle cx="80" cy="81" r="34" fill="none" stroke={p.light} strokeWidth="1" opacity=".45" />
      <path transform="translate(80 81.6)" d={STAR_PATH} fill={p.light} opacity=".55" />
      <path transform="translate(80 80)" d={STAR_PATH} fill={p.dark} opacity=".8" />
      <ellipse cx="62" cy="58" rx="25" ry="17" fill={`url(#s${uid})`} transform="rotate(-18 62 58)" />
      <ellipse cx="57" cy="51" rx="9" ry="6" fill="#fff" opacity=".5" transform="rotate(-18 57 51)" />
    </svg>
  );
}

function StarSVG() {
  return (
    <svg viewBox="0 0 24 24" className="star-icon h-4 w-4 opacity-30" fill="white">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

const TURN_TIME = 30;

function TimeRing({
  timeLeft,
  total,
  color,
}: {
  timeLeft: number;
  total: number;
  color: string;
}) {
  const R = 21;
  const C = 2 * Math.PI * R;
  const frac = total > 0 ? Math.max(0, Math.min(1, timeLeft / total)) : 0;
  const danger = timeLeft <= 10;
  const stroke = danger ? "#ef4444" : "#f6b01a";
  return (
    <svg
      className="pointer-events-none absolute -inset-[3px] -rotate-90"
      viewBox="0 0 48 48"
      fill="none"
    >
      <circle cx="24" cy="24" r={R} stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
      <circle
        cx="24"
        cy="24"
        r={R}
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={C * (1 - frac)}
        style={{ transition: "stroke-dashoffset 1s linear, stroke 0.4s ease" }}
      />
    </svg>
  );
}

function PulseBadge({
  name,
  color,
  active,
  diceValue,
  shaking,
  onRoll,
  timeLeft,
  total,
}: {
  name: string;
  color: string;
  active?: boolean;
  diceValue: number | null;
  shaking: boolean;
  onRoll?: () => void;
  timeLeft: number;
  total: number;
}) {
  const initials = name.charAt(0).toUpperCase();
  return (
    <div
      className={`pulse-badge flex items-center gap-3 rounded-full border border-white/10 bg-[#09090d]/80 p-2 pr-4 shadow-2xl backdrop-blur-md ${
        active ? "active" : ""
      }`}
    >
      <div
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-xs font-black"
        style={{
          backgroundColor: `${color}33`,
          borderColor: color,
          color,
          boxShadow: active ? `0 0 15px ${color}66` : "none",
        }}
      >
        {active && <TimeRing timeLeft={timeLeft} total={total} color={color} />}
        {initials}
      </div>
      <div className="flex min-w-[60px] flex-col">
        <span className="max-w-[110px] truncate text-[10px] font-bold uppercase leading-none tracking-widest text-white/80">
          {name}
        </span>
        <span className="mt-1 text-[8px] uppercase tracking-tighter text-slate-500">
          {active ? "Tactical Phase" : "Standby"}
        </span>
      </div>
      <div className="badge-dice ml-1">
        <Dice3D value={diceValue} shaking={shaking} onClick={onRoll} />
      </div>
    </div>
  );
}

function ArrowSVG({ dir, color }: { dir: string; color: string }) {
  const rot = ({ right: 0, down: 90, left: 180, up: 270 } as Record<string, number>)[dir];
  return (
    <span className="arrow block h-full w-full">
      <svg viewBox="0 0 24 24" style={{ transform: `rotate(${rot}deg)` }} className="block h-full w-full">
        <path d="M3 12h14M12 5l7 7-7 7" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function HomeHub() {
  return (
    <svg viewBox="0 0 100 100">
      <rect x="0" y="0" width="100" height="100" fill="#09090d" />
      <polygon points="50,50 0,0 100,0" fill="#1fe0ff" opacity=".8" />
      <polygon points="50,50 100,0 100,100" fill="#221a3a" opacity=".8" />
      <polygon points="50,50 100,100 0,100" fill="#ff2e88" opacity=".8" />
      <polygon points="50,50 0,100 0,0" fill="#221a3a" opacity=".8" />
      <line x1="0" y1="0" x2="100" y2="100" stroke="#09090d" strokeWidth="2" />
      <line x1="100" y1="0" x2="0" y2="100" stroke="#09090d" strokeWidth="2" />
    </svg>
  );
}

/* ---- board grid ---- */

function buildCells() {
  const cells: { k: string; r: number; c: number; cls: string; arrow?: [string, string] }[] = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const k = r + "," + c;
      const cls = ["cell"];
      const y = inYard(r, c);
      if (y) cls.push("yard-" + y);
      else if (HOME_OF[k]) cls.push("home-" + HOME_OF[k]);
      else if (START_OF[k]) cls.push("path", "start-" + START_OF[k]);
      else if (TRACK_SET.has(k)) cls.push("path");
      if (SAFE.has(k)) cls.push("safe");
      cells.push({ k, r, c, cls: cls.join(" "), arrow: ARROWS[k] });
    }
  }
  return cells;
}

/* ---- board component ---- */

type MovePreview = { i: number; id: string; dest: number; color: string };

export function LudoBoard({
  mirror,
  myColor,
  myName = "You",
  opponentName = "Challenger",
  onPickMove,
  onRoll,
  isMyTurn,
  diceRolled,
  lastRoll,
  isShaking,
  previewMoves = [],
  coinStyle = "classic",
}: {
  mirror: GameState;
  myColor: string | null;
  myName?: string;
  opponentName?: string;
  onPickMove: (move: MovePreview) => void;
  onRoll: () => void;
  isMyTurn: boolean;
  diceRolled: boolean | undefined;
  lastRoll: number | null | undefined;
  isShaking: boolean;
  previewMoves: MovePreview[];
  coinStyle?: CoinStyle;
}) {
  const cells = useMemo(buildCells, []);

  const isPinkHuman = myColor === "pink";
  const isCyanHuman = myColor === "cyan";
  const pinkName = isPinkHuman ? myName : opponentName;
  const cyanName = isCyanHuman ? myName : opponentName;

  // Group tokens by coordinate to handle stacking
  const groupedOnTrack: Record<string, any[]> = {};
  for (const color of ["pink", "cyan"] as LudoColor[]) {
    const P = mirror.players[color];
    if (!P || typeof P !== "object" || !P.tokens) continue;
    P.tokens.forEach((t: LudoToken, i: number) => {
      if (typeof t.loc === "number") {
        const [r, c] = cellOfRoute(color, t.loc);
        const k = `${r},${c}`;
        if (!groupedOnTrack[k]) groupedOnTrack[k] = [];
        const home = t.loc === 56;
        const move = previewMoves.find((m) => m.i === i && m.color === color);
        groupedOnTrack[k].push({ id: t.id, color, i, r, c, home, movable: !!move, move });
      }
    });
  }

  // Flatten with offsets
  const onTrackWithOffsets: any[] = [];
  Object.entries(groupedOnTrack).forEach(([, tokens]) => {
    tokens.forEach((t, index) => {
      let offsetX = 0;
      let offsetY = 0;
      if (tokens.length > 1) {
        const angle = (index / tokens.length) * Math.PI * 2;
        const radius = 0.22;
        offsetX = Math.cos(angle) * radius;
        offsetY = Math.sin(angle) * radius;
      }
      onTrackWithOffsets.push({ ...t, offsetX, offsetY });
    });
  });

  // Smooth path-following movement: tokens travel cell-by-cell along their
  // route coordinates instead of snapping (or drawing a straight diagonal).
  const [displayLocs, setDisplayLocs] = useState<Record<string, number>>({});
  const displayLocsRef = useRef<Record<string, number>>({});
  const animsRef = useRef<Record<string, { from: number; to: number; t0: number; dur: number }>>({});
  const rafRef = useRef<number | null>(null);

  const tickAnimations = useCallback(() => {
    const now = performance.now();
    let active = false;
    const next = { ...displayLocsRef.current };
    for (const id in animsRef.current) {
      const a = animsRef.current[id];
      const p = Math.min(1, (now - a.t0) / a.dur);
      const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      next[id] = a.from + (a.to - a.from) * ease;
      if (p < 1) active = true;
      else {
        next[id] = a.to;
        delete animsRef.current[id];
      }
    }
    displayLocsRef.current = next;
    setDisplayLocs(next);
    if (active) rafRef.current = requestAnimationFrame(tickAnimations);
    else rafRef.current = null;
  }, []);

  useEffect(() => {
    const now = performance.now();
    let seeded = false;
    for (const color of ["pink", "cyan"] as LudoColor[]) {
      const P = mirror.players[color];
      if (!P || typeof P !== "object" || !P.tokens) continue;
      P.tokens.forEach((t: LudoToken) => {
        if (typeof t.loc === "number") {
          const shown = displayLocsRef.current[t.id];
          if (shown === undefined) {
            displayLocsRef.current[t.id] = t.loc;
            seeded = true;
          } else if (shown !== t.loc && animsRef.current[t.id]?.to !== t.loc) {
            animsRef.current[t.id] = {
              from: shown,
              to: t.loc,
              t0: now,
              dur: 450 + 90 * Math.abs(t.loc - shown),
            };
            if (!rafRef.current) rafRef.current = requestAnimationFrame(tickAnimations);
          }
        } else if (displayLocsRef.current[t.id] !== undefined) {
          delete displayLocsRef.current[t.id];
          delete animsRef.current[t.id];
          seeded = true;
        }
      });
    }
    if (seeded) setDisplayLocs({ ...displayLocsRef.current });
  }, [mirror, tickAnimations]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const previewCells = previewMoves.map((m) => {
    const [r, c] = cellOfRoute(myColor ?? "pink", m.dest);
    return { ...m, r, c };
  });

  const yardOrder: Record<string, number[]> = { tl: [0, 1, 2, 3], tr: [0, 1, 2, 3], bl: [0, 1, 2, 3], br: [0, 1, 2, 3] };

  const yardFill = (y: string) => {
    if (y === "bl") return "pink";
    if (y === "tr") return "cyan";
    return "slate";
  };

  return (
    <div className="board-mat w-full">
      <div className="mb-2 flex justify-center">
        <PulseBadge
          name={cyanName}
          color={COLORS.cyan}
          active={mirror.turn === "cyan"}
          diceValue={mirror.turn === "cyan" ? (lastRoll ?? null) : null}
          shaking={isCyanHuman && isShaking && isMyTurn}
          onRoll={isCyanHuman && isMyTurn && !diceRolled ? onRoll : undefined}
          timeLeft={mirror.turnTimer}
          total={TURN_TIME}
        />
      </div>

      <div className={`board-wrap ${myColor === "cyan" ? "rotated-view" : ""}`} id="boardWrap">
        <div className="board">
          {cells.map((cell) => (
            <div className={cell.cls} key={cell.k}>
              {cell.arrow ? <ArrowSVG dir={cell.arrow[0]} color={cell.arrow[1]} /> : null}
              {SAFE.has(cell.k) && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <StarSVG />
                </div>
              )}
            </div>
          ))}
        </div>

        {(["tl", "tr", "bl", "br"] as const).map((y) => (
          <div className={"yard-block pos-" + y + " fill-" + yardFill(y)} key={y}>
            <div className="yard-panel">
              {yardOrder[y].map((slot: number) => {
                const color = yardFill(y);
                const player = color !== "slate" ? mirror.players[color] : null;
                const token =
                  color !== "slate" && player && typeof player === "object"
                    ? player.tokens?.find((t) => t.loc === "yard" && t.slot === slot)
                    : undefined;
                const tIdx = token && player && typeof player === "object" ? (player.tokens?.indexOf(token) ?? -1) : -1;
                const move = token ? previewMoves.find((m) => m.i === tIdx && m.color === color) : undefined;

                return (
                  <div className="yard-slot" key={slot}>
                    <div className={"ghost " + (color === "slate" ? "slate" : color)} />
                    {token ? (
                      <div
                        className={`coin-wrapper ${move ? "movable" : ""}`}
                        onClick={() => move && onPickMove(move)}
                      >
                        <CoinSVG color={COLORS[color]} id={`${color}-yard-${slot}`} style={coinStyle} />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="home-hub">
          <HomeHub />
        </div>

        <div className="tokenLayer">
          {onTrackWithOffsets.map((t) => {
            const shown = displayLocs[t.id] ?? t.loc;
            const lo = Math.floor(shown);
            const hi = Math.min(lo + 1, 56);
            const f = shown - lo;
            const [r1, c1] = cellOfRoute(t.color, lo);
            const [r2, c2] = cellOfRoute(t.color, hi);
            const r = r1 + (r2 - r1) * f;
            const c = c1 + (c2 - c1) * f;
            return (
              <div
                className={"token " + t.color + (t.movable ? " movable" : "") + (t.home ? " homed" : "")}
                key={t.color + "-" + t.i}
                style={{
                  left: (c + 0.5 + t.offsetX) * step + "%",
                  top: (r + 0.5 + t.offsetY) * step + "%",
                  zIndex: t.movable ? 10 : 5,
                }}
                onClick={() => t.move && onPickMove(t.move)}
              >
                <CoinSVG color={COLORS[t.color]} id={t.color + "-" + t.i} style={coinStyle} />
              </div>
            );
          })}
          {previewCells.map((p) => (
            <div
              className="move-preview"
              key={"p" + p.i + "-" + p.dest}
              style={{ left: (p.c + 0.5) * step + "%", top: (p.r + 0.5) * step + "%" }}
              onClick={() => onPickMove(p)}
            />
          ))}
        </div>
      </div>

      <div className="mt-2 flex justify-center">
        <PulseBadge
          name={pinkName}
          color={COLORS.pink}
          active={mirror.turn === "pink"}
          diceValue={mirror.turn === "pink" ? (lastRoll ?? null) : null}
          shaking={isPinkHuman && isShaking && isMyTurn}
          onRoll={isPinkHuman && isMyTurn && !diceRolled ? onRoll : undefined}
          timeLeft={mirror.turnTimer}
          total={TURN_TIME}
        />
      </div>
    </div>
  );
}
