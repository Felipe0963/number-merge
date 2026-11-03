import { expect, type Page } from '@playwright/test';
import { dropTile, newGame, summarize, type GameState } from '../../src/game';

export const column = (page: Page, index: number) =>
  page.getByRole('group', { name: 'Drawer' }).getByRole('button').nth(index);

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
