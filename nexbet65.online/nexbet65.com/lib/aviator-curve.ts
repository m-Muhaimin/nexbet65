export type CurvePoint = {
  x: number;
  y: number;
  angle: number;
  growth: number;
};

/**
 * Shared Aviator curve math, used by both the 2D canvas and the 3D plane so
 * the plane always sits exactly on the curve tip. Coordinates are in CSS
 * pixels with y growing downward (matching the 2D canvas), and `angle` is the
 * curve tangent angle in that same y-down screen space (radians).
 */
export function curvePoint(multiplier: number, w: number, h: number): CurvePoint {
  const m = Math.max(multiplier, 1.0001);
  const growth = Math.log(m) / 0.06;
  const spanX = Math.max(w * 0.85, Math.min(w, growth * 36));
  const spanY = h - 24;
  const denom = Math.exp(0.06 * growth) - 1 || 1;
  const x = spanX;
  const y = h - (Math.exp(0.06 * growth) - 1) * (spanY / denom);
  const dx = spanX / growth;
  const dy = -0.06 * Math.exp(0.06 * growth) * (spanY / denom);
  const angle = Math.atan2(dy, dx);
  return { x, y, angle, growth };
}
