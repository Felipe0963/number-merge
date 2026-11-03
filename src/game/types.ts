export const COLUMNS = 5;
export const ROWS = 7;

export interface Tile {
  /** Identificador estável: o mesmo bloco mantém o id entre eventos, mesmo quando o valor muda. */
  readonly id: number;
  readonly value: number;
}

/** Uma coluna é uma pilha de blocos, do fundo (índice 0) para cima. */
export type Column = readonly Tile[];
export type Board = readonly Column[];

export interface Position {
  readonly column: number;
  readonly row: number;
}

export interface Fall {
  readonly tile: Tile;
  readonly column: number;
  readonly from: number;
  readonly to: number;
}

/** O que aconteceu numa jogada, em ordem. `board` é o tabuleiro logo depois do evento. */
export type GameEvent =
  | { readonly type: 'drop'; readonly tile: Tile; readonly at: Position; readonly board: Board }
  | {
      readonly type: 'merge';
      readonly into: Tile;
      readonly absorbed: readonly Tile[];
      readonly at: Position;
      readonly chain: number;
      readonly points: number;
      readonly board: Board;
    }
  | { readonly type: 'fall'; readonly falls: readonly Fall[]; readonly board: Board }
  | { readonly type: 'rejected'; readonly column: number; readonly board: Board }
  | { readonly type: 'gameOver'; readonly board: Board };

export type MergeEvent = Extract<GameEvent, { readonly type: 'merge' }>;

export interface GameState {
  readonly board: Board;
  /** Valor do próximo bloco a cair. */
  readonly next: number;
  /** Valor do bloco depois do próximo. */
  readonly then: number;
  readonly score: number;
  /** Maior valor que já apareceu na partida. */
  readonly topBlock: number;
  readonly moves: number;
  readonly over: boolean;
  /** Estado interno do gerador de números. */
  readonly rng: number;
  readonly nextId: number;
}

export interface MoveResult {
  readonly state: GameState;
  readonly events: readonly GameEvent[];
}
