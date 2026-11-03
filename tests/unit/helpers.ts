import type { Board, GameState } from '../../src/game/types';

/** Monta um tabuleiro a partir dos valores de cada coluna, de baixo para cima. Os ids começam em 1000. */
export function boardFrom(columns: number[][]): Board {
  let id = 1000;
  return columns.map((values) => values.map((value) => ({ id: id++, value })));
}

/** Valores de cada coluna, de baixo para cima. */
export function valuesOf(board: Board): number[][] {
  return board.map((column) => column.map((tile) => tile.value));
}

export function stateWith(overrides: Partial<GameState> & Pick<GameState, 'board'>): GameState {
  return {
    next: 2,
    then: 2,
    score: 0,
    topBlock: 0,
    moves: 0,
    over: false,
    rng: 1,
    nextId: 1,
    ...overrides,
  };
}
