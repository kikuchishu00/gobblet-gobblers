export type Player = 'P1' | 'P2';

export type PieceSize = 1 | 2 | 3; // 1=small, 2=medium, 3=large

export interface Piece {
  id: string;
  player: Player;
  size: PieceSize;
}

// 各マスはコマのスタック（上が表に見える）
export type Cell = Piece[];

// 3x3ボード
export type Board = Cell[][];

export interface PlayerHand {
  P1: Piece[];
  P2: Piece[];
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export type GamePhase = 'playing' | 'won' | 'draw';

export interface GameState {
  board: Board;
  hand: PlayerHand;
  currentPlayer: Player;
  phase: GamePhase;
  winner: Player | null;
  winLine: number[] | null; // 勝利マスのインデックス [0..8]
  difficulty: Difficulty;
}

// 選択中の状態
export type SelectionSource =
  | { kind: 'hand'; piece: Piece }
  | { kind: 'board'; row: number; col: number };
