"use client";

import { useEffect, useState } from "react";
import type { GameState, Move, Piece } from "@/lib/arena/types";

interface BoardProps {
  state: GameState;
  playerColor: string | null;
  onMove: (move: Move) => void;
}

export default function CheckersBoard({ state, playerColor, onMove }: BoardProps) {
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Move[]>([]);

  const board = state.board ?? [];
  const { turn, status } = state;

  const isMyTurn = playerColor === turn && status === "playing" && !state.turnLocked;

  useEffect(() => {
    if (!isMyTurn) {
      setSelectedPiece(null);
      setPossibleMoves([]);
    }
  }, [isMyTurn]);

  const getValidMoves = (piece: Piece): Move[] => {
    const moves: Move[] = [];
    const dirs = piece.isKing
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : piece.color === "w"
        ? [[-1, -1], [-1, 1]]
        : [[1, -1], [1, 1]];

    for (const [dr, dc] of dirs) {
      const tr = piece.row + dr;
      const tc = piece.col + dc;
      if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8 && !board[tr][tc]) {
        moves.push({ from: { row: piece.row, col: piece.col }, to: { row: tr, col: tc } });
      }

      const jr = piece.row + dr * 2;
      const jc = piece.col + dc * 2;
      if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8 && !board[jr][jc]) {
        const midR = piece.row + dr;
        const midC = piece.col + dc;
        const midPiece = board[midR][midC];
        if (midPiece && midPiece.color !== piece.color) {
          moves.push({
            from: { row: piece.row, col: piece.col },
            to: { row: jr, col: jc },
            captured: { row: midR, col: midC },
          });
        }
      }
    }
    return moves;
  };

  const handleSquareClick = (r: number, c: number) => {
    if (!isMyTurn) return;

    // Mandatory jump: when any capture is available anywhere, only captures count.
    const allPieces = board.flat().filter((p): p is Piece => !!p && p.color === playerColor);
    const mustCapture = allPieces.some((p) => getValidMoves(p).some((m) => m.captured));

    const targetPiece = board[r][c];

    if (targetPiece && targetPiece.color === playerColor) {
      // Re-clicking the selected coin moves it to its first legal destination
      if (selectedPiece?.row === targetPiece.row && selectedPiece?.col === targetPiece.col) {
        if (possibleMoves.length > 0) onMove(possibleMoves[0]);
        setSelectedPiece(null);
        setPossibleMoves([]);
        return;
      }

      const moves = getValidMoves(targetPiece);
      const usable = mustCapture ? moves.filter((m) => m.captured) : moves;
      if (usable.length === 0) {
        setSelectedPiece(null);
        setPossibleMoves([]);
        return;
      }
      // A single legal move → move immediately on the coin click
      if (usable.length === 1) {
        onMove(usable[0]);
        setSelectedPiece(null);
        setPossibleMoves([]);
        return;
      }
      setSelectedPiece(targetPiece);
      setPossibleMoves(usable);
      return;
    }

    if (selectedPiece) {
      const move = possibleMoves.find((m) => m.to.row === r && m.to.col === c);
      if (move) {
        onMove(move);
        setSelectedPiece(null);
        setPossibleMoves([]);
        return;
      }
    }

    setSelectedPiece(null);
    setPossibleMoves([]);
  };

  const pieceKey = (p: Piece) => p.id || `${p.row}-${p.col}-${p.color}`;

  return (
    <div className="flex w-full flex-col items-center">
      <div className="arena-checkers-frame">
        <div className="arena-checkers-canvas">
          <div className="arena-checkers-board">
            {Array.from({ length: 8 }).map((_, r) =>
              Array.from({ length: 8 }).map((_, c) => {
                const isDark = (r + c) % 2 === 1;
                const isSelected = selectedPiece?.row === r && selectedPiece?.col === c;
                const isPossibleTarget = possibleMoves.some((m) => m.to.row === r && m.to.col === c);
                const piece = board[r][c];

                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => handleSquareClick(r, c)}
                    className={`arena-checkers-cell ${isDark ? "dark" : "light"} ${
                      isPossibleTarget ? "highlight" : ""
                    }`}
                  >
                    {isPossibleTarget && (
                      <div className="absolute h-4 w-4 rounded-full bg-brand/60 shadow-[0_0_10px_rgba(163,230,53,0.5)]" />
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 z-10 border-2 border-brand bg-brand/20" />
                    )}
                    {piece && (
                      <div
                        key={pieceKey(piece)}
                        className={`arena-checkers-piece ${piece.color} ${piece.isKing ? "king" : ""} ${
                          isMyTurn && piece.color === playerColor ? "mine" : ""
                        }`}
                      >
                        {piece.isKing && (
                          <div className={`arena-checkers-king ${piece.color}`}>👑</div>
                        )}
                        <div className="arena-checkers-gloss" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
