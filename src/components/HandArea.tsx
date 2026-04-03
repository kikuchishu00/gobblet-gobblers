import type { Piece, Player, SelectionSource } from '../types';
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

export function HandArea({ pieces, isActive, selection, onSelectPiece, label, vertical }: Props) {
  const sizeMap = new Map<number, Piece[]>();
  for (const p of pieces) {
    if (!sizeMap.has(p.size)) sizeMap.set(p.size, []);
    sizeMap.get(p.size)!.push(p);
  }
  // 縦レイアウト時: 大→中→小の順で上から並べる
  const uniqueSizes = [3, 2, 1].filter((s) => sizeMap.has(s));

  return (
    <div className={[styles.hand, isActive ? styles.active : '', vertical ? styles.vertical : ''].join(' ')}>
      <div className={styles.label}>{label}</div>
      <div className={[styles.pieces, vertical ? styles.piecesVertical : ''].join(' ')}>
        {uniqueSizes.map((size) => {
          const stack = sizeMap.get(size)!;
          const rep = stack[0];
          const isSelected =
            selection?.kind === 'hand' && selection.piece.id === rep.id;
          return (
            <div key={size} className={styles.pieceWrapper}>
              <PieceView
                piece={rep}
                isSelected={isSelected}
                onClick={() => isActive && onSelectPiece(rep)}
                disabled={!isActive}
              />
              {stack.length > 1 && (
                <span className={styles.count}>×{stack.length}</span>
              )}
            </div>
          );
        })}
        {pieces.length === 0 && (
          <span className={styles.empty}>なし</span>
        )}
      </div>
    </div>
  );
}
