import { expect, test } from '@playwright/test';
import { COLUMNS, ROWS } from '../../src/game';
import { column, expectScore, replay, simulate } from './replay';

const SEED = 4242;

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('começa com a explicação, cinco colunas vazias e placar zerado', async ({ page }) => {
  await page.goto(`/?seed=${String(SEED)}`);
  await expect(page.getByText('Choose a column to begin.')).toBeVisible();
  await expect(page.getByRole('group', { name: 'Drawer' }).getByRole('button')).toHaveCount(COLUMNS);
  await expect(column(page, 0)).toHaveAccessibleName('Column 1, empty');
  await expectScore(page, 0);
});

test('clicar numa coluna solta o próximo bloco nela', async ({ page }) => {
  await page.goto(`/?seed=${String(SEED)}`);
  const next = await page.getByTestId('next').getAttribute('data-value');
  await column(page, 2).click();
  await expect(column(page, 2)).toHaveAccessibleName(`Column 3, 1 block, top ${next!}`);
  await expect(page.getByText('Choose a column to begin.')).toBeHidden();
});

test('as setas movem entre colunas e Enter solta o bloco', async ({ page }) => {
  await page.goto(`/?seed=${String(SEED)}`);
  await column(page, 0).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(column(page, COLUMNS - 1)).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(column(page, 1)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(column(page, 1)).toHaveAccessibleName(/Column 2, 1 block/);
});

test('a tela segue o motor numa partida inteira, até o fim', async ({ page }) => {
  const { columns, state } = simulate(
    SEED,
    (_, move) => (move * 2) % COLUMNS,
    () => false,
  );
  expect(state.over).toBe(true);
  await page.goto(`/?seed=${String(SEED)}`);
  await replay(page, columns);
  await expectScore(page, state.score);
  await expect(page.getByTestId('top-block')).toHaveText(String(state.topBlock));
  await expect(page.getByRole('dialog', { name: 'The drawer is full.' })).toBeVisible();
});

test('coluna cheia não muda nada e é anunciada', async ({ page }) => {
  const { columns, state } = simulate(
    SEED,
    () => 0,
    (_, rejected) => rejected,
  );
  test.skip(state.over, 'Esta semente encheu o tabuleiro antes de rejeitar; trocar de semente.');
  await page.goto(`/?seed=${String(SEED)}`);
  await replay(page, columns);
  await expect(page.getByTestId('announcer')).toHaveText('Column full.');
  await expect(column(page, 0)).toHaveAccessibleName(new RegExp(`${String(ROWS)} blocks, .*full`));
  await expectScore(page, state.score);
});

test('uma cadeia aparece no registro e é anunciada', async ({ page, isMobile }) => {
  const { columns, state } = simulate(
    SEED,
    (s, move) => (s.board[move % COLUMNS]!.length < ROWS ? move % COLUMNS : (move + 1) % COLUMNS),
    (_, __, maxChain) => maxChain >= 2,
  );
  await page.goto(`/?seed=${String(SEED)}`);
  await replay(page, columns);
  await expectScore(page, state.score);
  await expect(page.getByTestId('announcer')).toHaveText(/Chain ×\d+\./);
  if (!isMobile)
    await expect(page.getByRole('region', { name: 'Press log' })).toContainText(/Chain ×\d+ · \+\d+/);
});

test('o recorde fica salvo entre recarregamentos', async ({ page }) => {
  const { columns, state } = simulate(
    SEED,
    (_, move) => (move * 2) % COLUMNS,
    () => false,
  );
  await page.goto(`/?seed=${String(SEED)}`);
  await replay(page, columns);
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('best')).toHaveText(String(state.score));
});

test('Play again começa uma partida nova', async ({ page }) => {
  const { columns } = simulate(
    SEED,
    (_, move) => (move * 2) % COLUMNS,
    () => false,
  );
  await page.goto(`/?seed=${String(SEED)}`);
  await replay(page, columns);
  await page.getByRole('button', { name: 'Play again' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expectScore(page, 0);
  await expect(column(page, 0)).toHaveAccessibleName('Column 1, empty');
});

test('com movimento reduzido, nada fica animando depois da jogada', async ({ page }) => {
  await page.goto(`/?seed=${String(SEED)}`);
  await column(page, 0).click();
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});

test('sem erros no console e sem pedidos para fora do site', async ({ page, baseURL }) => {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(message.text());
  });
  page.on('pageerror', (error) => problems.push(error.message));
  page.on('request', (request) => {
    if (!request.url().startsWith(baseURL!)) problems.push(request.url());
  });
  await page.goto(`/?seed=${String(SEED)}`);
  await replay(page, [0, 1, 2, 3, 4, 0, 1]);
  expect(problems).toEqual([]);
});

test.describe('com animações', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  });

  test('jogar rápido não quebra o resultado', async ({ page }) => {
    const { columns, state } = simulate(
      SEED,
      (_, move) => move % COLUMNS,
      () => false,
      25,
    );
    await page.goto(`/?seed=${String(SEED)}`);
    await replay(page, columns);
    await expectScore(page, state.score);
  });
});
