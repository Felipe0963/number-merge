import { expect, type Page } from '@playwright/test';
import { COLUMNS, ROWS, dropTile, newGame, summarize, type Board, type GameState } from '../../src/game';
import { copy } from '../../src/ui/content/copy';

export const column = (page: Page, index: number) =>
  page.getByRole('group', { name: 'Drawer' }).getByRole('button').nth(index);

/** Estratégia que espalha os blocos da esquerda para a direita e faz cadeias logo no começo (semente 4242). */
export const spreadLeftToRight = (state: GameState, move: number): number =>
  state.board[move % COLUMNS]!.length < ROWS ? move % COLUMNS : (move + 1) % COLUMNS;

/** Joga no motor seguindo `choose` até `stop` ser verdadeiro (ou até `limit` jogadas). */
export function simulate(
  seed: number,
  choose: (state: GameState, move: number) => number,
  stop: (state: GameState, rejected: boolean, maxChain: number) => boolean,
  limit = 400,
): { columns: number[]; state: GameState } {
  let state = newGame(seed);
  const columns: number[] = [];
  for (let move = 0; move < limit && !state.over; move++) {
    const chosen = choose(state, move);
    const result = dropTile(state, chosen);
    columns.push(chosen);
    state = result.state;
    const summary = summarize(result.events);
    if (stop(state, summary.rejected, summary.maxChain)) break;
  }
  return { columns, state };
}

/** Repete as jogadas na tela, clicando nas colunas. */
export async function replay(page: Page, columns: readonly number[]): Promise<void> {
  for (const index of columns) await column(page, index).click();
}

export async function expectScore(page: Page, score: number): Promise<void> {
  await expect(page.getByTestId('score')).toHaveAttribute('data-value', String(score));
}

/** Cada coluna da tela tem o nome acessível que o tabuleiro do motor descreve. */
export async function expectBoard(page: Page, board: Board): Promise<void> {
  for (const [index, cells] of board.entries()) {
    await expect(column(page, index)).toHaveAccessibleName(copy.columnLabel(index, cells));
  }
}
