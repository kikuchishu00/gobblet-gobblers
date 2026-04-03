import type { Cell } from '../types';
import { topPiece } from '../gameLogic';
import { PieceView } from './PieceView';
import styles from './BoardCell.module.css';

interface Props {
  cell: Cell;
  isHighlighted: boolean;
  isWinCell: boolean;
  isSelected: boolean;
  canDrop: boolean;
  onClick: () => void;
}

export function BoardCell({ cell, isHighlighted, isWinCell, isSelected, canDrop, onClick }: Props) {
  const top = topPiece(cell);

  return (
    <div
      className={[
        styles.cell,
        isHighlighted ? styles.highlighted : '',
        isWinCell ? styles.winCell : '',
        isSelected ? styles.selectedCell : '',
        canDrop ? styles.canDrop : '',
      ].join(' ')}
      onClick={onClick}
    >
      {top && <PieceView piece={top} />}
      {/* 下に隠れているコマの数を示すバッジ */}
      {cell.length > 1 && (
        <span className={styles.stackBadge}>{cell.length}</span>
      )}
    </div>
  );
}
