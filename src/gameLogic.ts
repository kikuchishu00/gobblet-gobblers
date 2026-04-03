import type { Board, Cell, Difficulty, GameState, Piece, PieceSize, Player, PlayerHand } from './types';

// 勝利ライン（インデックス: row*3+col）
const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // 横
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // 縦
  [0, 4, 8], [2, 4, 6],            // 斜め
];

export function createInitialState(difficulty: Difficulty): GameState {
  const board: Board = Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, (): Cell => [])
  );

  const makePieces = (player: Player): Piece[] => {
    const pieces: Piece[] = [];
    let id = 0;
    ([1, 1, 2, 2, 3, 3] as PieceSize[]).forEach((size) => {
      pieces.push({ id: `${player}-${size}-${id++}`, player, size });
    });
    return pieces;
  };

  return {
    board,
    hand: {
      P1: makePieces('P1'),
      P2: makePieces('P2'),
    },
    currentPlayer: 'P1',
    phase: 'playing',
    winner: null,
    winLine: null,
    difficulty,
  };
}

export function topPiece(cell: Cell): Piece | null {
  return cell.length > 0 ? cell[cell.length - 1] : null;
}

/** マスのインデックス(0-8)を行・列に変換 */
export function idxToRowCol(idx: number): [number, number] {
  return [Math.floor(idx / 3), idx % 3];
}

/** 勝利チェック。勝利ラインがあれば [player, winLine] を返す */
export function checkWinner(board: Board): { winner: Player; winLine: number[] } | null {
  for (const line of WIN_LINES) {
    const tops = line.map((idx) => {
      const [r, c] = idxToRowCol(idx);
      return topPiece(board[r][c]);
    });
    if (tops[0] && tops[1] && tops[2] &&
      tops[0].player === tops[1].player &&
      tops[1].player === tops[2].player) {
      return { winner: tops[0].player, winLine: line };
    }
  }
  return null;
}

/** コマを手札からボードに置けるか */
export function canPlaceFromHand(piece: Piece, board: Board, row: number, col: number): boolean {
  const top = topPiece(board[row][col]);
  return !top || top.size < piece.size;
}

/** ボード上のコマを別のマスに移動できるか */
export function canMoveOnBoard(
  fromRow: number, fromCol: number,
  toRow: number, toCol: number,
  board: Board
): boolean {
  if (fromRow === toRow && fromCol === toCol) return false;
  const movingPiece = topPiece(board[fromRow][fromCol]);
  if (!movingPiece) return false;
  const target = topPiece(board[toRow][toCol]);
  return !target || target.size < movingPiece.size;
}

/** 手札からボードに置く。新しいGameStateを返す */
export function placeFromHand(state: GameState, piece: Piece, row: number, col: number): GameState {
  const board = cloneBoard(state.board);
  board[row][col] = [...board[row][col], { ...piece }];

  const hand: PlayerHand = {
    P1: state.hand.P1.filter((p) => p.id !== piece.id),
    P2: state.hand.P2.filter((p) => p.id !== piece.id),
  };

  return applyMove({ ...state, board, hand });
}

/** ボード上のコマを移動する。新しいGameStateを返す */
export function moveOnBoard(state: GameState, fromRow: number, fromCol: number, toRow: number, toCol: number): GameState {
  const board = cloneBoard(state.board);
  const moving = board[fromRow][fromCol].pop()!;
  board[toRow][toCol] = [...board[toRow][toCol], moving];

  return applyMove({ ...state, board });
}

function applyMove(state: GameState): GameState {
  const result = checkWinner(state.board);
  if (result) {
    return {
      ...state,
      phase: 'won',
      winner: result.winner,
      winLine: result.winLine,
      currentPlayer: state.currentPlayer,
    };
  }

  return {
    ...state,
    currentPlayer: state.currentPlayer === 'P1' ? 'P2' : 'P1',
  };
}

function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => [...cell]));
}

// ============================
// AI用: 全合法手の列挙
// ============================

export interface Move {
  type: 'place';
  piece: Piece;
  toRow: number;
  toCol: number;
}
export interface BoardMove {
  type: 'boardMove';
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
}

export type AnyMove = Move | BoardMove;

export function getLegalMoves(state: GameState, player: Player): AnyMove[] {
  const moves: AnyMove[] = [];
  const hand = state.hand[player];

  // 手札からの配置
  // 同じサイズのコマは同じ手なので重複除去
  const seenSizes = new Set<PieceSize>();
  for (const piece of hand) {
    if (seenSizes.has(piece.size)) continue;
    seenSizes.add(piece.size);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (canPlaceFromHand(piece, state.board, r, c)) {
          moves.push({ type: 'place', piece, toRow: r, toCol: c });
        }
      }
    }
  }

  // ボード上のコマ移動
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const top = topPiece(state.board[r][c]);
      if (!top || top.player !== player) continue;
      for (let tr = 0; tr < 3; tr++) {
        for (let tc = 0; tc < 3; tc++) {
          if (canMoveOnBoard(r, c, tr, tc, state.board)) {
            moves.push({ type: 'boardMove', fromRow: r, fromCol: c, toRow: tr, toCol: tc });
          }
        }
      }
    }
  }

  return moves;
}

export function applyAnyMove(state: GameState, move: AnyMove): GameState {
  if (move.type === 'place') {
    return placeFromHand(state, move.piece, move.toRow, move.toCol);
  } else {
    return moveOnBoard(state, move.fromRow, move.fromCol, move.toRow, move.toCol);
  }
}

// ============================
// ミニマックス AI
// ============================

const DEPTH_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 0,    // ランダム
  medium: 2,
  hard: 4,
};

export function getAIMove(state: GameState): AnyMove | null {
  const difficulty = state.difficulty;
  const player = state.currentPlayer; // AI = P2

  const moves = getLegalMoves(state, player);
  if (moves.length === 0) return null;

  if (difficulty === 'easy') {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const depth = DEPTH_BY_DIFFICULTY[difficulty];
  let bestScore = -Infinity;
  let bestMove = moves[0];

  for (const move of moves) {
    const next = applyAnyMove(state, move);
    // AIが即勝利できるなら即選ぶ
    if (next.phase === 'won' && next.winner === player) {
      return move;
    }
    const score = minimax(next, depth - 1, -Infinity, Infinity, false, player);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

function minimax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiPlayer: Player
): number {
  if (state.phase === 'won') {
    return state.winner === aiPlayer ? 1000 + depth : -(1000 + depth);
  }
  if (depth === 0) {
    return evaluate(state, aiPlayer);
  }

  const currentPlayer = state.currentPlayer;
  const moves = getLegalMoves(state, currentPlayer);

  if (moves.length === 0) return 0;

  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const move of moves) {
      const next = applyAnyMove(state, move);
      const score = minimax(next, depth - 1, alpha, beta, false, aiPlayer);
      maxScore = Math.max(maxScore, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    for (const move of moves) {
      const next = applyAnyMove(state, move);
      const score = minimax(next, depth - 1, alpha, beta, true, aiPlayer);
      minScore = Math.min(minScore, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return minScore;
  }
}

/** 盤面評価関数（0が引き分け相当） */
function evaluate(state: GameState, aiPlayer: Player): number {
  let score = 0;
  const humanPlayer: Player = aiPlayer === 'P2' ? 'P1' : 'P2';

  for (const line of WIN_LINES) {
    const tops = line.map((idx) => {
      const [r, c] = idxToRowCol(idx);
      return topPiece(state.board[r][c]);
    });
    const aiCount = tops.filter((p) => p?.player === aiPlayer).length;
    const humanCount = tops.filter((p) => p?.player === humanPlayer).length;

    if (humanCount === 0) score += aiCount * aiCount;
    if (aiCount === 0) score -= humanCount * humanCount;
  }

  return score;
}
