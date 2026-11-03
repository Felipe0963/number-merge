import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { COLUMNS } from '../../src/game';
import { replay, simulate } from './replay';

const SEED = 4242;

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('tela inicial sem violações', async ({ page }) => {
  await page.goto(`/?seed=${String(SEED)}`);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('meio da partida sem violações', async ({ page }) => {
  await page.goto(`/?seed=${String(SEED)}`);
  await replay(page, [0, 1, 2, 3, 4, 2, 2]);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('fim de jogo sem violações', async ({ page }) => {
  const { columns } = simulate(
    SEED,
    (_, move) => (move * 2) % COLUMNS,
    () => false,
  );
  await page.goto(`/?seed=${String(SEED)}`);
  await replay(page, columns);
  await expect(page.getByRole('dialog')).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
