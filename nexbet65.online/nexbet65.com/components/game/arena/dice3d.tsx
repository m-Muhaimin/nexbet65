"use client";

import { useEffect, useRef } from "react";

const FACES: Record<number, number[]> = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
};
const faceRot: Record<number, string> = {
  1: "rotateY(0deg)",
  2: "rotateY(180deg)",
  3: "rotateY(90deg)",
  4: "rotateY(-90deg)",
  5: "rotateX(-90deg)",
  6: "rotateX(90deg)",
};

interface Dice3DProps {
  value: number | null;
  shaking?: boolean;
  onClick?: (() => void) | null;
}

export default function Dice3D({ value, shaking = false, onClick = null }: Dice3DProps) {
  const cubeRef = useRef<HTMLDivElement>(null);
  const flickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFaceRef = useRef<string | null>(null);

  useEffect(() => {
    const cube = cubeRef.current;
    if (!cube) return;
    if (shaking) {
      cube.style.transition = "none";
      flickRef.current = setInterval(() => {
        cube.style.transform =
          "rotateX(" + (Math.random() * 720 - 360) + "deg) rotateY(" + (Math.random() * 720 - 360) + "deg)";
      }, 90);
    } else {
      if (flickRef.current) {
        clearInterval(flickRef.current);
        flickRef.current = null;
      }
      // Show the face for the current live roll. When the roll has been
      // consumed by a move (value === null) we keep the last shown face
      // instead of snapping back to a fixed neutral corner. The neutral
      // corner is only used before the first roll of a match.
      const target = value && value > 0 ? faceRot[value] : null;
      cube.style.transition = "transform .5s cubic-bezier(.2,.9,.3,1.2)";
      if (target) {
        lastFaceRef.current = target;
        cube.style.transform = target;
      } else if (!lastFaceRef.current) {
        cube.style.transform = "rotateX(-25deg) rotateY(35deg)";
      }
    }
    return () => {
      if (flickRef.current) clearInterval(flickRef.current);
    };
  }, [value, shaking]);

  return (
    <div
      className={"mini-stage" + (onClick ? " clickable" : "")}
      onClick={onClick || undefined}
      role={onClick ? "button" : undefined}
      aria-label={onClick ? "Roll dice" : undefined}
      title={onClick ? "Tap to roll" : undefined}
    >
      <div className="mini-cube" ref={cubeRef}>
        {[1, 2, 3, 4, 5, 6].map((f) => {
          const on = new Set(FACES[f]);
          return (
            <div className={"mface f" + f} key={f}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <i key={i} className={on.has(i) ? "on" : ""} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
