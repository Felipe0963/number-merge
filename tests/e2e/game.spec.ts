import { expect, test } from '@playwright/test';
import { COLUMNS, ROWS } from '../../src/game';
import { column, expectBoard, expectScore, replay, simulate, spreadLeftToRight } from './replay';

const SEED = 4242;
/** Uma partida inteira tem quase cem jogadas; com vários navegadores em paralelo, passa de 30 s. */
const FULL_GAME = 'Repete uma partida inteira, até a gaveta encher.';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('começa com a explicação, cinco colunas vazias e placar zerado', async ({ page }) => {
  await page.goto(`/?seed=${String(SEED)}`);
  // O título é composto em blocos, mas é lido como um só título.
  await expect(page.getByRole('heading', { level: 1, name: 'NUMBER MERGE' })).toBeVisible();
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

test('a gaveta é uma só parada do Tab; Home e End vão para as pontas', async ({ page }) => {
  await page.goto(`/?seed=${String(SEED)}`);
  const columns = page.getByRole('group', { name: 'Drawer' }).getByRole('button');
  await expect(columns.and(page.locator('[tabindex="0"]'))).toHaveCount(1);
  await expect(column(page, 0)).toHaveAttribute('tabindex', '0');

  await column(page, 0).focus();
  await page.keyboard.press('End');
  await expect(column(page, COLUMNS - 1)).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(column(page, COLUMNS - 2)).toBeFocused();
  // A coluna focada por último é a que o Tab encontra ao voltar para a gaveta.
  await expect(column(page, COLUMNS - 2)).toHaveAttribute('tabindex', '0');
  await expect(columns.and(page.locator('[tabindex="0"]'))).toHaveCount(1);
  await page.keyboard.press('Home');
  await expect(column(page, 0)).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(columns.and(page.locator(':focus'))).toHaveCount(0);
  await page.keyboard.press('Shift+Tab');
  await expect(column(page, 0)).toBeFocused();
});

test('a tela segue o motor numa partida inteira, até o fim', async ({ page }) => {
  test.slow(true, FULL_GAME);
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
  await expectBoard(page, state.board);
  await expect(page.getByRole('dialog', { name: 'The drawer is full.' })).toBeVisible();
});

test('coluna cheia não muda nada e é anunciada', async ({ page }) => {
  const { columns, state } = simulate(
    SEED,
    () => 0,
    (_, rejected) => rejected,
  );
  // Pré-condição da semente: a coluna 0 enche e rejeita antes de o tabuleiro inteiro encher.
  expect(state.over).toBe(false);
  await page.goto(`/?seed=${String(SEED)}`);
  await replay(page, columns);
  await expect(page.getByTestId('announcer')).toHaveText('Column full.');
  await expect(column(page, 0)).toHaveAccessibleName(new RegExp(`${String(ROWS)} blocks, .*full`));
  await expectScore(page, state.score);
});

test('uma cadeia aparece no registro e é anunciada', async ({ page, isMobile }) => {
  const { columns, state } = simulate(SEED, spreadLeftToRight, (_, __, maxChain) => maxChain >= 2);
  await page.goto(`/?seed=${String(SEED)}`);
  await replay(page, columns);
  await expectScore(page, state.score);
  await expect(page.getByTestId('announcer')).toHaveText(/Chain ×\d+\./);
  if (!isMobile)
    await expect(page.getByRole('region', { name: 'Press log' })).toContainText(/Chain ×\d+ · \+\d+/);
});

test('o recorde fica salvo entre recarregamentos', async ({ page }) => {
  test.slow(true, FULL_GAME);
  const { columns, state } = simulate(
    SEED,
    (_, move) => (move * 2) % COLUMNS,
    () => false,
  );
  await page.goto(`/?seed=${String(SEED)}`);
  await replay(page, columns);
  await expect(page.getByRole('dialog')).toBeVisible();
  // Primeira partida, sem recorde anterior: não há "New best".
  await expect(page.getByText('New best')).toBeHidden();
  await page.reload();
  await expect(page.getByTestId('best')).toHaveText(String(state.score));
});

test('New best aparece quando a partida supera um recorde anterior', async ({ page }) => {
  test.slow(true, FULL_GAME);
  const { columns, state } = simulate(
    SEED,
    (_, move) => (move * 2) % COLUMNS,
    () => false,
  );
  await page.addInitScript((best) => {
    window.localStorage.setItem('number-merge:best', String(best));
  }, state.score - 1);
  await page.goto(`/?seed=${String(SEED)}`);
  await expect(page.getByTestId('best')).toHaveText(String(state.score - 1));
  await replay(page, columns);
  await expect(page.getByRole('dialog')).toContainText('New best');
  await expect(page.getByTestId('best')).toHaveText(String(state.score));
});

test('Play again começa uma partida nova', async ({ page }) => {
  test.slow(true, FULL_GAME);
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

test('Escape fecha a folha do fim de jogo e escolher uma coluna a traz de volta', async ({ page }) => {
  test.slow(true, FULL_GAME);
  const { columns, state } = simulate(
    SEED,
    (_, move) => (move * 2) % COLUMNS,
    () => false,
  );
  await page.goto(`/?seed=${String(SEED)}`);
  await replay(page, columns);
  const results = page.getByRole('dialog', { name: 'The drawer is full.' });
  await expect(results).toBeVisible();

  // Escape seguidos fecham a folha; o jogo continua terminado e nada quebra.
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(results).toBeHidden();
  await expect(column(page, 0)).toHaveAccessibleName(/, full$/);
  await expectScore(page, state.score);

  // Com o mouse ou com o teclado, escolher uma coluna mostra a folha de novo, com o mesmo resultado.
  await column(page, 0).click();
  await expect(results).toBeVisible();
  await expect(results).toContainText(String(state.score));
  await page.keyboard.press('Escape');
  await expect(results).toBeHidden();
  await column(page, 3).focus();
  await page.keyboard.press('Enter');
  await expect(results).toBeVisible();

  await page.getByRole('button', { name: 'Play again' }).click();
  await expect(results).toBeHidden();
  await expectScore(page, 0);
});

test('com movimento reduzido, uma cadeia não tem carimbo, tremor, respingo, brilho nem placar rolando', async ({
  page,
}) => {
  const { columns, state } = simulate(SEED, spreadLeftToRight, (_, __, maxChain) => maxChain >= 2);
  await page.goto(`/?seed=${String(SEED)}`);
  await replay(page, columns.slice(0, -1));
  await column(page, columns.at(-1)!).click();

  // No quadro em que o placar recebe o resultado da cadeia, a tela já está no estado final e o número
  // não rola. Daí até a página ficar parada, toda animação que aparece é só de opacidade (design, §3).
  const scene = await page.evaluate(async (score) => {
    const ledger = document.querySelector('[data-testid="score"]')!;
    while (ledger.getAttribute('data-value') !== String(score)) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    const shownScore = ledger.textContent;
    const animated = new Set<string>();
    const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
    const unfinished = () =>
      document.getAnimations().filter((animation) => animation.playState !== 'finished');
    // Repete até dois quadros seguidos sem animação: as saídas dos absorvidos começam um quadro depois.
    for (let quietFrames = 0; quietFrames < 2;) {
      const running = unfinished();
      quietFrames = running.length === 0 ? quietFrames + 1 : 0;
      for (const animation of running) {
        for (const keyframe of (animation.effect as KeyframeEffect).getKeyframes()) {
          for (const key of Object.keys(keyframe)) animated.add(key);
        }
      }
      await Promise.all(running.map((animation) => animation.finished.catch(() => undefined)));
      await nextFrame();
    }
    return {
      shownScore,
      animatedProperties: [...animated].filter(
        (key) => !['offset', 'computedOffset', 'easing', 'composite', 'opacity'].includes(key),
      ),
      stamp: document.querySelectorAll('.stamp').length,
      splash: document.querySelectorAll('.ink-splash').length,
      newInk: document.querySelectorAll('[data-new-ink]').length,
      shake: (document.querySelector('.drawer') as HTMLElement).style.transform,
    };
  }, state.score);

  expect(scene).toEqual({
    shownScore: String(state.score),
    animatedProperties: [],
    stamp: 0,
    splash: 0,
    newInk: 0,
    shake: '',
  });
  await expect(page.getByTestId('announcer')).toHaveText(/Chain ×\d+\./);
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
    await expectBoard(page, state.board);
  });

  test('a primeira vez que uma tinta aparece, o bloco brilha; uma partida nova recomeça', async ({
    page,
  }) => {
    const { columns, state } = simulate(SEED, spreadLeftToRight, (s) => s.topBlock >= 16);
    expect(state.topBlock).toBeGreaterThanOrEqual(16);
    const glowing = page.locator('.type-block[data-new-ink]');
    await page.goto(`/?seed=${String(SEED)}`);
    await replay(page, columns.slice(0, -1));
    // Até aqui, só a tinta preta, que a partida já começa conhecendo.
    await expect(glowing).toHaveCount(0);

    await column(page, columns.at(-1)!).click();
    await expect(glowing).toHaveCount(1);
    await expect(glowing.locator('.type-face')).toHaveAttribute('data-ink', 'navy');
    // A fusão deixou um respingo na tinta do bloco novo.
    await expect(page.locator('.ink-splash')).toHaveCount(1);
    await expectBoard(page, state.board);

    await page.getByRole('button', { name: 'New game' }).click();
    await expect(glowing).toHaveCount(0);
  });
});
