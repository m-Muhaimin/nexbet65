import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GridCell, WaysHit } from '../types';
import { SYMBOLS } from '../utils/symbols';

interface WinningWaysLinePathProps {
  grid: GridCell[][];
  waysHits: WaysHit[];
  cascadeDepth?: number;
}

interface PathSegment {
  id: string;
  d: string;
  color: string;
  strokeWidth: number;
  symbol: string;
}

interface NodePoint {
  x: number;
  y: number;
  col: number;
  row: number;
  symbol: string;
  color: string;
}

export const WinningWaysLinePath: React.FC<WinningWaysLinePathProps> = ({
  grid,
  waysHits,
  cascadeDepth = 0,
}) => {
  const { paths, nodes, hitSummary } = useMemo(() => {
    if (!waysHits || waysHits.length === 0 || !grid || grid.length === 0) {
      return { paths: [], nodes: [], hitSummary: null };
    }

    const calculatedPaths: PathSegment[] = [];
    const calculatedNodes: NodePoint[] = [];
    const nodeSet = new Set<string>();

    const SVG_W = 1000;
    const SVG_H = 1000;
    const numCols = 5;
    const colWidth = SVG_W / numCols;

    const getCellCenter = (colIdx: number, rowIdx: number) => {
      const colHeight = grid[colIdx]?.length || 4;
      const rowHeight = SVG_H / colHeight;
      const x = colIdx * colWidth + colWidth / 2;
      const y = rowIdx * rowHeight + rowHeight / 2;
      return { x, y };
    };

    const getSymbolColor = (sym: string) => {
      switch (sym) {
        case 'A':
          return '#f6b01a';
        case 'K':
          return '#60a5fa';
        case 'Q':
          return '#f87171';
        case 'J':
          return '#4ade80';
        case 'S':
          return '#94a3b8';
        case 'G':
          return '#facc15';
        case 'SC':
          return '#ef4444';
        default:
          return '#ffd25e';
      }
    };

    waysHits.forEach((hit, hitIdx) => {
      const symColor = getSymbolColor(hit.symbol);
      const hitCellIdSet = new Set(hit.cellIds);

      const colPoints: { col: number; points: { x: number; y: number; cell: GridCell }[] }[] = [];

      for (let c = 0; c < hit.matchedCols && c < grid.length; c++) {
        const matchingInCol: { x: number; y: number; cell: GridCell }[] = [];
        for (let r = 0; r < grid[c].length; r++) {
          const cell = grid[c][r];
          if (hitCellIdSet.has(cell.id)) {
            const { x, y } = getCellCenter(c, r);
            matchingInCol.push({ x, y, cell });

            const nodeKey = `${c}_${r}_${hit.symbol}`;
            if (!nodeSet.has(nodeKey)) {
              nodeSet.add(nodeKey);
              calculatedNodes.push({
                x,
                y,
                col: c,
                row: r,
                symbol: hit.symbol,
                color: symColor,
              });
            }
          }
        }
        if (matchingInCol.length > 0) {
          colPoints.push({ col: c, points: matchingInCol });
        }
      }

      // Bezier curve connecting matching symbols across columns
      for (let i = 0; i < colPoints.length - 1; i++) {
        const fromCol = colPoints[i];
        const toCol = colPoints[i + 1];

        fromCol.points.forEach((pFrom, fromIdx) => {
          toCol.points.forEach((pTo, toIdx) => {
            const dx = pTo.x - pFrom.x;
            const cp1x = pFrom.x + dx * 0.45;
            const cp1y = pFrom.y;
            const cp2x = pTo.x - dx * 0.45;
            const cp2y = pTo.y;

            const d = `M ${pFrom.x} ${pFrom.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pTo.x} ${pTo.y}`;

            calculatedPaths.push({
              id: `path_${hitIdx}_${i}_${fromIdx}_${toIdx}`,
              d,
              color: symColor,
              strokeWidth: Math.max(3, 7 - waysHits.length),
              symbol: hit.symbol,
            });
          });
        });
      }
    });

    const summary = waysHits.map((h) => ({
      name: SYMBOLS[h.symbol]?.name || h.symbol,
      ways: h.ways,
      payout: h.payout,
      color: getSymbolColor(h.symbol),
    }));

    return {
      paths: calculatedPaths,
      nodes: calculatedNodes,
      hitSummary: summary,
    };
  }, [grid, waysHits]);

  if (!waysHits || waysHits.length === 0 || paths.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      <svg
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <defs>
          <filter id="waysGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Underlying Radiant Glow Path */}
        {paths.map((p) => (
          <motion.path
            key={`glow_${p.id}`}
            d={p.d}
            fill="none"
            stroke={p.color}
            strokeWidth={p.strokeWidth + 8}
            strokeOpacity={0.45}
            strokeLinecap="round"
            filter="url(#waysGlow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0.4, 0.8, 0.4] }}
            transition={{
              pathLength: { duration: 0.6, ease: 'easeOut' },
              opacity: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
            }}
          />
        ))}

        {/* 2. Core Solid Connecting Way Line */}
        {paths.map((p) => (
          <motion.path
            key={`core_${p.id}`}
            d={p.d}
            fill="none"
            stroke={p.color}
            strokeWidth={p.strokeWidth}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}

        {/* 3. Glowing Node Rings at Winning Symbol Centers */}
        {nodes.map((n, i) => (
          <g key={`node_${i}`}>
            <motion.circle
              cx={n.x}
              cy={n.y}
              r={22}
              fill="none"
              stroke={n.color}
              strokeWidth={3}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{
                scale: [0.9, 1.25, 0.9],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
            />
            <circle
              cx={n.x}
              cy={n.y}
              r={6}
              fill="#ffffff"
              stroke={n.color}
              strokeWidth={2.5}
              filter="url(#waysGlow)"
            />
          </g>
        ))}
      </svg>

      {/* Floating Bottom Ways Ribbon */}
      <AnimatePresence>
        {hitSummary && hitSummary.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-2 inset-x-2 flex items-center justify-center gap-1.5 flex-wrap z-40 pointer-events-none"
          >
            {hitSummary.map((item, idx) => (
              <div
                key={`summary_${idx}`}
                className="bg-[#0a1424]/95 border border-[#a07830] rounded-full px-2.5 py-0.5 shadow-[0_0_12px_rgba(246,176,26,0.8)] flex items-center gap-1.5 backdrop-blur-xs"
              >
                <div
                  className="w-2 h-2 rounded-full shadow-[0_0_6px_currentColor]"
                  style={{ backgroundColor: item.color, color: item.color }}
                />
                <span className="font-['MStiffHei_PRC_UltraBold'] font-black text-[9px] text-[#fff6d8] uppercase tracking-tight">
                  {item.name}
                </span>
                <span className="font-bold text-[10px] text-[#f6b01a]">
                  {item.ways.toLocaleString()} WAYS
                </span>
                <span className="font-black text-[10px] text-[#2ecc71]">
                  +${(item.payout ?? 0).toFixed(2)}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
