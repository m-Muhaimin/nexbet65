const TRACK: [number, number][] = [
  [6,0],[6,1],[6,2],[6,3],[6,4],[6,5],[5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
  [0,7],[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
  [7,14],[8,14],[8,13],[8,12],[8,11],[8,10],[8,9],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
  [14,7],[14,6],[13,6],[12,6],[11,6],[10,6],[9,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0],
];

const HOME: Record<string, [number, number][]> = {
  pink: [[13,7],[12,7],[11,7],[10,7],[9,7],[7,7]],
  cyan: [[1,7],[2,7],[3,7],[4,7],[5,7],[7,7]],
};

export const TRACK_SET = new Set(TRACK.map((p) => p[0] + "," + p[1]));

export const HOME_OF: Record<string, string> = {};
Object.entries(HOME).forEach(([color, cells]) => {
  cells.forEach((p) => {
    HOME_OF[p[0] + "," + p[1]] = color;
  });
});

export const START_OF: Record<string, string> = {
  "13,6": "pink", // Real entry: pink's loc 0 is TRACK index 40 = [13,6]
  "1,8": "cyan", // Real entry: cyan's loc 0 is TRACK index 14 = [1,8]
};

const START_IDX: Record<string, number> = {
  pink: 40,
  cyan: 14,
};

export const SAFE = new Set([
  "6,1","2,6","1,8","6,12","8,13","12,8","13,6","8,2",
]);

export function cellOfRoute(color: string, loc: number): [number, number] {
  if (loc < 51) {
    const idx = (START_IDX[color] + loc) % 52;
    return TRACK[idx] as [number, number];
  }
  const homeIdx = loc - 51;
  const path = HOME[color] || HOME.pink;
  return (path[homeIdx] || [7, 7]) as [number, number];
}

export function inYard(r: number, c: number): string | null {
  if (r < 6 && c < 6) return "tl";
  if (r < 6 && c > 8) return "tr";
  if (r > 8 && c < 6) return "bl";
  if (r > 8 && c > 8) return "br";
  return null;
}
