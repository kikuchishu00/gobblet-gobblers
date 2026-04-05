import type { Piece, Player, PieceSize, SelectionSource } from '../types';
import { PieceView } from './PieceView';
import styles from './HandArea.module.css';

interface Props {
  player: Player;
  pieces: Piece[];
  isActive: boolean;
  selection: SelectionSource | null;
  onSelectPiece: (piece: Piece) => void;
  label: string;
  vertical?: boolean;
}

// 常に全サイズ分のスロットを描画し、手札にないものは透明にする
const ALL_SIZES: PieceSize[] = [3, 2, 1];

export function HandArea({ player, pieces, isActive, selection, onSelectPiece, label, vertical }: Props) {
  const sizeMap = new Map<number, Piece[]>();
  for (const p of pieces) {
    if (!sizeMap.has(p.size)) sizeMap.set(p.size, []);
    sizeMap.get(p.size)!.push(p);
  }

  return (
    <div className={[styles.hand, isActive ? styles.active : '', vertical ? styles.vertical : ''].join(' ')}>
      <div className={styles.label}>{label}</div>
      <div className={[styles.pieces, vertical ? styles.piecesVertical : ''].join(' ')}>
        {ALL_SIZES.map((size) => {
          const stack = sizeMap.get(size);
          const isEmpty = !stack || stack.length === 0;
          // 手札にないサイズはダミーのコマを透明で表示してスペースを確保
          const dummyPiece: Piece = { id: `dummy-${player}-${size}`, player, size };
          const rep = isEmpty ? dummyPiece : stack[0];
          const isSelected = !isEmpty && selection?.kind === 'hand' && selection.piece.id === rep.id;
          return (
            <div key={size} className={[styles.pieceWrapper, isEmpty ? styles.invisible : ''].join(' ')}>
              <PieceView
                piece={rep}
                isSelected={isSelected}
                onClick={() => !isEmpty && isActive && onSelectPiece(rep)}
                disabled={isEmpty || !isActive}
              />
              <span className={[styles.count, (!isEmpty && stack!.length > 1) ? '' : styles.invisible].join(' ')}>
                ×{!isEmpty ? stack!.length : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
