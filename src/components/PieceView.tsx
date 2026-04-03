import type { Piece } from '../types';
import styles from './PieceView.module.css';

interface Props {
  piece: Piece;
  isSelected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

const SIZE_LABEL: Record<number, string> = { 1: 'S', 2: 'M', 3: 'L' };

export function PieceView({ piece, isSelected, onClick, disabled }: Props) {
  return (
    <div
      className={[
        styles.piece,
        styles[`player${piece.player}`],
        styles[`size${piece.size}`],
        isSelected ? styles.selected : '',
        disabled ? styles.disabled : '',
      ].join(' ')}
      onClick={disabled ? undefined : onClick}
      role="button"
      aria-pressed={isSelected}
    >
      {SIZE_LABEL[piece.size]}
    </div>
  );
}
