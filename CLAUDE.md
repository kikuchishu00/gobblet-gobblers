# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # 開発サーバー起動 (http://localhost:5173)
npm run build     # 型チェック + プロダクションビルド
npm run lint      # ESLint
npm run preview   # ビルド済み成果物をプレビュー
```

テストフレームワークは未導入。

## Architecture

ゲームロジックとUIを完全に分離した設計。

### データフロー

```
types.ts         ← 全型定義 (Piece, Board, GameState, etc.)
gameLogic.ts     ← 純粋関数のみ。副作用なし
Game.tsx         ← useState で GameState を保持。唯一の状態管理点
```

`GameState` は immutable に扱い、各操作は新しい `GameState` を返す。

### ゲームロジック (`src/gameLogic.ts`)

- **`createInitialState(difficulty)`** — 初期状態生成
- **`placeFromHand / moveOnBoard`** — 手を適用して新 GameState を返す
- **`applyAnyMove`** — AI用の統一的な手の適用
- **`getLegalMoves`** — 合法手列挙（AIと将来の検証に使用）
- **`getAIMove`** — 難易度に応じてランダム or ミニマックス+α-β剪定で手を返す

### AI難易度

| 難易度 | 実装 |
|--------|------|
| easy   | ランダム選択 |
| medium | ミニマックス depth 2 |
| hard   | ミニマックス + α-β剪定 depth 4 |

AIは常に P2。手番は `GameState.currentPlayer` で管理し、`Game.tsx` の `useEffect` がAIターンを検出して `setTimeout(600ms)` 後に実行。

### 盤面表現

`Board = Cell[][]`（3×3）。各 `Cell = Piece[]` はスタック（配列末尾が表に見えるコマ）。ゴブル判定は `topPiece(cell).size < piece.size` で行う。

### `import type` ルール

`verbatimModuleSyntax` が有効なため、型のみのインポートは必ず `import type` を使う。
