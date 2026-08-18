export type CheckersColor = "w" | "b";
export type LudoColor = "pink" | "cyan";
export type PlayerId = string | null;

export interface Piece {
  id: string;
  color: CheckersColor;
  isKing: boolean;
  row: number;
  col: number;
}

export interface Move {
  from: { row: number; col: number };
  to: { row: number; col: number };
  captured?: { row: number; col: number };
}

export interface LudoToken {
  id: string;
  color: string;
  loc: number | "yard";
  slot?: number;
}

export type LudoPlayer = {
  id: PlayerId;
  tokens: LudoToken[];
};

export type ArenaPlayer = PlayerId | LudoPlayer;

export interface GameState {
  roomId: string;
  gameType: "checkers" | "ludo";
  board?: (Piece | null)[][];
  players: Record<string, ArenaPlayer>;
  usernames?: Record<string, string>;
  turn: string;
  status: "waiting" | "playing" | "ended";
  winner: string | null;
  stake: number;
  endReason?: "timeout" | "resignation" | "capture" | "completion" | "disconnect";
  botThinking?: boolean;
  turnLocked?: boolean;
  turnTimer: number;
  disconnected?: Record<string, boolean>;
  captures?: { w: number; b: number };
  lastRoll?: number | null;
  diceRolled?: boolean;
  consecutiveSixes?: number;
  captureSeq?: number;
  lastCapturedBy?: string | null;
  captureBonus?: number;
}
