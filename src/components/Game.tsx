import { useCallback, useEffect, useRef, useState } from 'react';
import {
  applyAnyMove,
  canMoveOnBoard,
  canPlaceFromHand,
  createInitialState,
  getAIMove,
  moveOnBoard,
  placeFromHand,
  topPiece,
} from '../gameLogic';
import type { Difficulty, GameState, Piece, SelectionSource } from '../types';
import { BoardCell } from './BoardCell';
import { HandArea } from './HandArea';
import styles from './Game.module.css';

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: '弱い',
  medium: '普通',
  hard: '強い',
};

export function Game() {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialState('medium')
  );
  const [selection, setSelection] = useState<SelectionSource | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAiTurn = gameState.currentPlayer === 'P2' && gameState.phase === 'playing';

  useEffect(() => {
    if (!isAiTurn || aiThinking) return;

    setAiThinking(true);
    setSelection(null);

    aiTimerRef.current = setTimeout(() => {
      setGameState((prev) => {
        const move = getAIMove(prev);
        if (!move) return prev;
        return applyAnyMove(prev, move);
      });
      setAiThinking(false);
    }, 600);

    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, [isAiTurn]);

  const handleReset = useCallback(() => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    setAiThinking(false);
    setSelection(null);
    setGameState(createInitialState(difficulty));
  }, [difficulty]);

  const handleDifficultyChange = (d: Difficulty) => {
    setDifficulty(d);
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    setAiThinking(false);
    setSelection(null);
    setGameState(createInitialState(d));
  };

  const handleSelectHandPiece = useCallback((piece: Piece) => {
    if (gameState.currentPlayer !== 'P1' || gameState.phase !== 'playing') return;
    setSelection((prev) => {
      if (prev?.kind === 'hand' && prev.piece.id === piece.id) return null;
      return { kind: 'hand', piece };
    });
  }, [gameState]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (gameState.currentPlayer !== 'P1' || gameState.phase !== 'playing') return;

    const top = topPiece(gameState.board[row][col]);

    if (!selection) {
      if (top?.player === 'P1') {
        setSelection({ kind: 'board', row, col });
      }
      return;
    }

    if (selection.kind === 'hand') {
      if (canPlaceFromHand(selection.piece, gameState.board, row, col)) {
        setGameState((prev) => placeFromHand(prev, selection.piece, row, col));
        setSelection(null);
      } else if (top?.player === 'P1') {
        setSelection({ kind: 'board', row, col });
      } else {
        setSelection(null);
      }
      return;
    }

    if (selection.kind === 'board') {
      if (selection.row === row && selection.col === col) {
        setSelection(null);
        return;
      }
      if (canMoveOnBoard(selection.row, selection.col, row, col, gameState.board)) {
        setGameState((prev) => moveOnBoard(prev, selection.row, selection.col, row, col));
        setSelection(null);
      } else if (top?.player === 'P1') {
        setSelection({ kind: 'board', row, col });
      } else {
        setSelection(null);
      }
    }
  }, [gameState, selection]);

  const { board, hand, phase, winner, winLine, currentPlayer } = gameState;

  const canDropAt = (row: number, col: number): boolean => {
    if (!selection) return false;
    if (selection.kind === 'hand') return canPlaceFromHand(selection.piece, board, row, col);
    return canMoveOnBoard(selection.row, selection.col, row, col, board);
  };

  const statusText = () => {
    if (aiThinking) return 'CPUが考えています...';
    if (phase === 'won') return winner === 'P1' ? 'あなたの勝ち！' : 'CPUの勝ち！';
    if (currentPlayer === 'P1') return 'あなたの番';
    return 'CPUの番';
  };

  return (
    <div className={styles.container}>
      {/* ヘッダー */}
      <div className={styles.header}>
        <h1 className={styles.title}>Gobblet Gobblers</h1>
        <div className={styles.difficultyRow}>
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
            <button
              key={d}
              className={[styles.diffBtn, difficulty === d ? styles.diffActive : ''].join(' ')}
              onClick={() => handleDifficultyChange(d)}
            >
              {DIFFICULTY_LABELS[d]}
            </button>
          ))}
        </div>
        <div className={[styles.status, phase === 'won' ? styles.statusWon : ''].join(' ')}>
          {statusText()}
        </div>
      </div>

      {/* メインエリア: 手札 | ボード | 手札 */}
      <div className={styles.gameArea}>
        <HandArea
          player="P2"
          pieces={hand.P2}
          isActive={false}
          selection={null}
          onSelectPiece={() => {}}
          label="CPU"
          vertical
        />

        <div className={styles.board}>
          {board.map((row, r) =>
            row.map((cell, c) => {
              const idx = r * 3 + c;
              const isWinCell = winLine?.includes(idx) ?? false;
              const isBoardSelected =
                selection?.kind === 'board' && selection.row === r && selection.col === c;
              return (
                <BoardCell
                  key={idx}
                  cell={cell}
                  isHighlighted={false}
                  isWinCell={isWinCell}
                  isSelected={isBoardSelected}
                  canDrop={canDropAt(r, c)}
                  onClick={() => handleCellClick(r, c)}
                />
              );
            })
          )}
        </div>

        <HandArea
          player="P1"
          pieces={hand.P1}
          isActive={currentPlayer === 'P1' && phase === 'playing'}
          selection={selection}
          onSelectPiece={handleSelectHandPiece}
          label="あなた"
          vertical
        />
      </div>

      {/* リセット */}
      <button className={styles.resetBtn} onClick={handleReset}>
        最初からやり直す
      </button>

      {/* 勝利オーバーレイ */}
      {phase === 'won' && (
        <div className={styles.overlay} onClick={handleReset}>
          <div className={styles.overlayCard}>
            <div className={styles.overlayEmoji}>
              {winner === 'P1' ? '🎉' : '🤖'}
            </div>
            <div className={styles.overlayTitle}>
              {winner === 'P1' ? 'あなたの勝ち！' : 'CPUの勝ち！'}
            </div>
            <div className={styles.overlayHint}>クリックで再戦</div>
          </div>
        </div>
      )}
    </div>
  );
}
