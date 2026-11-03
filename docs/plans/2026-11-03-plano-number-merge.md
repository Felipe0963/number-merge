# Number Merge — Plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para executar este plano tarefa por tarefa. Os passos usam caixas de seleção (`- [ ]`) para acompanhamento.

**Objetivo:** construir o Number Merge descrito em `docs/2026-11-03-number-merge-design.md`: um jogo de blocos numerados que caem em colunas, se fundem e encadeiam reações, com o visual de gaveta de tipos.

**Arquitetura:** o motor do jogo (`src/game/`) é TypeScript puro, sem React. Uma jogada é calculada inteira de uma vez e devolve o estado final e a lista de eventos. Cada evento carrega o tabuleiro logo depois dele, então a interface só precisa mostrar esses tabuleiros em sequência, com animação. A interface (`src/ui/`) é React com componentes pequenos e hooks com uma responsabilidade cada.

**Stack:** Node 24, Vite 8, React 19, TypeScript 6 (estrito), Motion 14, Vitest 5, fast-check 4, Playwright, @axe-core/playwright, ESLint 9 + typescript-eslint, Prettier, Fontsource.

---

## Decisões de implementação

- **TypeScript 6 em vez do 7:** o typescript-eslint ainda só aceita TypeScript até a versão 6.0.
- **ESLint 9 em vez do 10:** o eslint-plugin-jsx-a11y ainda só aceita até a versão 9.
- **Colunas como pilhas:** cada coluna é uma lista de blocos de baixo para cima. Assim não existem buracos: tirar um bloco de uma coluna já faz os de cima "caírem".
- **Eventos com o tabuleiro:** cada evento traz o tabuleiro depois dele. A interface não reconstrói nada; só mostra.
- **O bloco que pousa guarda o seu `id` ao se fundir.** O valor muda, mas o bloco é o mesmo. Os vizinhos absorvidos somem.
- **Semente pela URL:** `?seed=123` começa uma partida com essa semente. Serve para os testes de navegador e, no futuro, para um desafio do dia. Sem `seed`, a semente é aleatória.
- **Teclado:** as setas movem o foco entre colunas; Enter e espaço soltam o bloco (comportamento nativo do botão). O hook se chama `useColumnKeys`.
- **Folha de registro:** guarda as 5 últimas jogadas que tiveram cadeia (×2 ou mais).
- **Sem testes de componente:** o motor tem testes unitários e de propriedade; a interface é coberta pelos testes de navegador, que comparam o jogo na tela com o motor jogando as mesmas jogadas.

## Pré-requisitos

- Node 24 (`node --version` → `v24.x.x`).
- Comandos em `projetos/number-merge/`.
- O repositório já existe, com o documento de design (`e7d7cd3`).

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `package.json`, `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `.gitignore`, `playwright.config.ts`, `index.html` | Projeto e ferramentas |
| `src/game/types.ts` | Tamanho do tabuleiro, tipos e eventos |
| `src/game/board.ts` | Funções de leitura do tabuleiro |
| `src/game/random.ts` | Gerador com semente e sorteio dos blocos |
| `src/game/score.ts` | Pontos de uma fusão |
| `src/game/resolve.ts` | Fusões, gravidade e cadeias |
| `src/game/game.ts` | `newGame` e `dropTile` |
| `src/game/summary.ts` | Resumo de uma jogada (pontos, maior cadeia, última fusão) |
| `src/game/index.ts` | Exportações públicas do motor |
| `src/ui/content/copy.ts` | Todos os textos |
| `src/ui/ink.ts` | Faixa de tinta de cada valor |
| `src/ui/seed.ts` | Semente da URL ou aleatória |
| `src/ui/hooks/useGame.ts` | Estado da partida, última jogada e registro |
| `src/ui/hooks/useEventPlayer.ts` | Mostra os tabuleiros dos eventos em sequência |
| `src/ui/hooks/useBestScore.ts` | Recorde no navegador |
| `src/ui/hooks/useColumnKeys.ts` | Setas entre colunas |
| `src/ui/hooks/useCountUp.ts` | Número do placar rolando |
| `src/ui/hooks/useAnnouncer.ts` | Texto da região `aria-live` |
| `src/ui/components/*.tsx` | `Drawer`, `TypeBlock`, `Ledger`, `NextBlocks`, `PressLog`, `Stamp`, `Intro`, `GameOver` |
| `src/ui/styles/tokens.css`, `src/ui/styles/app.css` | Tokens e estilos |
| `src/App.tsx`, `src/main.tsx` | Montagem |
| `tests/unit/*.test.ts` | Testes do motor |
| `tests/e2e/*.spec.ts` | Testes de navegador |

---

### Tarefa 1: criar o projeto

- [ ] **Passo 1: instalar as dependências**

```bash
npm init -y
npm install react@19 react-dom@19 motion@14 @fontsource/alfa-slab-one @fontsource/ibm-plex-mono
npm install -D vite@8 @vitejs/plugin-react@6 typescript@6 @types/react @types/react-dom @types/node@24 vitest@5 fast-check@4 @playwright/test @axe-core/playwright eslint@9 @eslint/js@9 typescript-eslint eslint-plugin-react-hooks eslint-plugin-jsx-a11y eslint-config-prettier globals prettier
npx playwright install chromium
```

- [ ] **Passo 2: substituir o `package.json` gerado (mantendo as dependências instaladas) por:**

```json
{
  "name": "number-merge",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22.12.0" },
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

Depois de colar, rodar `npm install` para o npm reescrever `dependencies` e `devDependencies` a partir do `package-lock.json`. Conferir que as dependências continuam listadas; se não, rodar de novo os dois `npm install` do passo 1.

- [ ] **Passo 3: criar `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vite/client", "node"]
  },
  "include": ["src", "tests", "vite.config.ts", "playwright.config.ts"]
}
```

- [ ] **Passo 4: criar `vite.config.ts`**

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['tests/unit/**/*.test.ts'],
  },
});
```

Se o TypeScript reclamar da chave `test`, trocar o import por `import { defineConfig } from 'vitest/config';`.

- [ ] **Passo 5: criar `eslint.config.js`**

```js
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'playwright-report', 'test-results'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // Com noUncheckedIndexedAccess, `!` marca índices que o código já garante; proibir só geraria ruído.
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    files: ['**/*.tsx'],
    plugins: { 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
    },
  },
  {
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },
  prettier,
);
```

- [ ] **Passo 6: criar `.prettierrc.json`, `.prettierignore` e `.gitignore`**

`.prettierrc.json`:

```json
{ "singleQuote": true, "printWidth": 110 }
```

`.prettierignore`:

```
dist
playwright-report
test-results
package-lock.json
docs
```

`.gitignore`:

```
node_modules/
dist/
playwright-report/
test-results/
```

- [ ] **Passo 7: criar `index.html`, `src/main.tsx` e um `src/App.tsx` provisório**

`index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="Number Merge: drop numbered type blocks into a drawer and merge them into the highest value you can." />
    <title>Number Merge</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/main.tsx`:

```tsx
import '@fontsource/alfa-slab-one/400.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './ui/styles/tokens.css';
import './ui/styles/app.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element.');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`src/App.tsx` (provisório, substituído na Tarefa 8):

```tsx
export function App() {
  return <h1>Number Merge</h1>;
}
```

Criar também `src/ui/styles/tokens.css` e `src/ui/styles/app.css` vazios (o conteúdo vem na Tarefa 6).

- [ ] **Passo 8: conferir**

Rodar `npm run build` → build concluído. Rodar `npm run lint` → sem erros. Rodar `npm run format:check` → sem diferenças (se houver, rodar `npm run format`).

- [ ] **Passo 9: commit**

```bash
git add -A
git commit -m "chore: cria o projeto com Vite, React, TypeScript estrito, ESLint e Prettier

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 2: tipos, tabuleiro e sorteio

**Arquivos:** criar `src/game/types.ts`, `board.ts`, `random.ts`; testes `tests/unit/board.test.ts`, `tests/unit/random.test.ts`, `tests/unit/helpers.ts`.

- [ ] **Passo 1: criar `src/game/types.ts`**

```ts
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
```

- [ ] **Passo 2: criar `tests/unit/helpers.ts`**

```ts
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
```

- [ ] **Passo 3: escrever `tests/unit/board.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { emptyBoard, isBoardFull, isColumnFull, topValue } from '../../src/game/board';
import { COLUMNS, ROWS } from '../../src/game/types';
import { boardFrom } from './helpers';

describe('board', () => {
  it('emptyBoard tem cinco colunas vazias', () => {
    const board = emptyBoard();
    expect(board).toHaveLength(COLUMNS);
    expect(board.every((column) => column.length === 0)).toBe(true);
  });

  it('isColumnFull só é verdadeiro com sete blocos', () => {
    const board = boardFrom([Array<number>(ROWS).fill(2), Array<number>(ROWS - 1).fill(2), [], [], []]);
    expect(isColumnFull(board, 0)).toBe(true);
    expect(isColumnFull(board, 1)).toBe(false);
  });

  it('isBoardFull só é verdadeiro com todas as colunas cheias', () => {
    const full = Array.from({ length: COLUMNS }, () => Array<number>(ROWS).fill(2));
    expect(isBoardFull(boardFrom(full))).toBe(true);
    expect(isBoardFull(boardFrom([...full.slice(1), [2]]))).toBe(false);
  });

  it('topValue é o maior valor no tabuleiro, ou 0 vazio', () => {
    expect(topValue(emptyBoard())).toBe(0);
    expect(topValue(boardFrom([[2, 64], [8], [], [128], []]))).toBe(128);
  });
});
```

- [ ] **Passo 4: escrever `tests/unit/random.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { drawValue, nextRandom, pickValue, spawnValues } from '../../src/game/random';

describe('nextRandom', () => {
  it('é determinístico e fica entre 0 e 1', () => {
    const [a, stateA] = nextRandom(42);
    const [b, stateB] = nextRandom(42);
    expect(a).toBe(b);
    expect(stateA).toBe(stateB);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(1);
  });

  it('muda de valor a cada chamada', () => {
    const [first, state] = nextRandom(42);
    const [second] = nextRandom(state);
    expect(second).not.toBe(first);
  });
});

describe('spawnValues', () => {
  it('começa com 2, 4 e 8', () => {
    expect(spawnValues(0)).toEqual([2, 4, 8]);
    expect(spawnValues(256)).toEqual([2, 4, 8]);
  });

  it('acompanha o maior bloco até 1/32 dele', () => {
    expect(spawnValues(512)).toEqual([2, 4, 8, 16]);
    expect(spawnValues(1024)).toEqual([2, 4, 8, 16, 32]);
  });
});

describe('pickValue', () => {
  it('rolagem baixa dá o menor valor e alta dá o maior', () => {
    expect(pickValue(0, 0)).toBe(2);
    expect(pickValue(0.9999, 0)).toBe(8);
  });

  it('valores menores são mais prováveis', () => {
    const counts = new Map<number, number>();
    for (let i = 0; i < 600; i++) {
      const value = pickValue(i / 600, 0);
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    expect(counts.get(2)!).toBeGreaterThan(counts.get(4)!);
    expect(counts.get(4)!).toBeGreaterThan(counts.get(8)!);
  });
});

describe('drawValue', () => {
  it('a mesma semente sorteia a mesma sequência', () => {
    const sequence = (seed: number) => {
      let rng = seed;
      return Array.from({ length: 10 }, () => {
        const draw = drawValue(rng, 0);
        rng = draw.rng;
        return draw.value;
      });
    };
    expect(sequence(7)).toEqual(sequence(7));
    expect(sequence(7)).not.toEqual(sequence(8));
  });
});
```

Rodar `npm test` → FAIL, módulos `board` e `random` não encontrados.

- [ ] **Passo 5: criar `src/game/board.ts`**

```ts
import { COLUMNS, ROWS, type Board } from './types';

export const emptyBoard = (): Board => Array.from({ length: COLUMNS }, () => []);

export const isColumnFull = (board: Board, column: number): boolean => (board[column]?.length ?? ROWS) >= ROWS;

export const isBoardFull = (board: Board): boolean => board.every((column) => column.length >= ROWS);

export const topValue = (board: Board): number =>
  board.reduce((max, column) => column.reduce((m, tile) => Math.max(m, tile.value), max), 0);
```

- [ ] **Passo 6: criar `src/game/random.ts`**

```ts
/** Menor teto de sorteio: no começo saem 2, 4 e 8. */
const MIN_CEILING = 8;
/** O teto acompanha o maior bloco do tabuleiro, dividido por este fator. */
const CEILING_RATIO = 32;

/** Gerador mulberry32: devolve um número em [0, 1) e o próximo estado. */
export function nextRandom(state: number): [number, number] {
  const next = (state + 0x6d2b79f5) >>> 0;
  let r = Math.imul(next ^ (next >>> 15), next | 1);
  r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
  return [((r ^ (r >>> 14)) >>> 0) / 4294967296, next];
}

/** Valores que podem ser sorteados quando o maior bloco do tabuleiro é `top`. */
export function spawnValues(top: number): number[] {
  const ceiling = Math.max(MIN_CEILING, top / CEILING_RATIO);
  const values: number[] = [];
  for (let value = 2; value <= ceiling; value *= 2) values.push(value);
  return values;
}

/** Escolhe um valor a partir de uma rolagem em [0, 1). Valores menores têm peso maior. */
export function pickValue(roll: number, top: number): number {
  const values = spawnValues(top);
  const weights = values.map((_, index) => values.length - index);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let remaining = roll * total;
  for (let i = 0; i < values.length; i++) {
    remaining -= weights[i]!;
    if (remaining < 0) return values[i]!;
  }
  return values[values.length - 1]!;
}

export function drawValue(rng: number, top: number): { value: number; rng: number } {
  const [roll, next] = nextRandom(rng);
  return { value: pickValue(roll, top), rng: next };
}
```

- [ ] **Passo 7: rodar e confirmar**

Rodar `npm test` → PASS. Rodar `npm run typecheck` e `npm run lint` → sem erros.

- [ ] **Passo 8: commit**

```bash
git add src/game tests/unit
git commit -m "feat: tipos do jogo, leitura do tabuleiro e sorteio com semente

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 3: fusões, gravidade e cadeias

**Arquivos:** criar `src/game/score.ts`, `src/game/resolve.ts`; teste `tests/unit/resolve.test.ts`.

- [ ] **Passo 1: escrever `tests/unit/resolve.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { resolve } from '../../src/game/resolve';
import { mergePoints } from '../../src/game/score';
import type { Board, GameEvent, Position } from '../../src/game/types';
import { boardFrom, valuesOf } from './helpers';

/** Coloca um bloco no topo de uma coluna e resolve, como depois de uma queda. */
function landAndResolve(board: Board, column: number, value: number) {
  const landed = board.map((c, i) => (i === column ? [...c, { id: 1, value }] : [...c]));
  const at: Position = { column, row: landed[column]!.length - 1 };
  return resolve(landed, at);
}

const types = (events: readonly GameEvent[]) => events.map((event) => event.type);

describe('mergePoints', () => {
  it('é o valor criado vezes a posição na cadeia', () => {
    expect(mergePoints(16, 1)).toBe(16);
    expect(mergePoints(16, 3)).toBe(48);
  });
});

describe('resolve', () => {
  it('sem vizinhos iguais, nada acontece', () => {
    const result = landAndResolve(boardFrom([[4], [], [], [], []]), 0, 2);
    expect(valuesOf(result.board)).toEqual([[4, 2], [], [], [], []]);
    expect(result.events).toEqual([]);
    expect(result.points).toBe(0);
  });

  it('funde com o bloco de baixo e cai uma casa', () => {
    const result = landAndResolve(boardFrom([[8], [], [], [], []]), 0, 8);
    expect(valuesOf(result.board)).toEqual([[16], [], [], [], []]);
    expect(types(result.events)).toEqual(['merge', 'fall']);
    const merge = result.events[0];
    expect(merge).toMatchObject({ type: 'merge', into: { id: 1, value: 16 }, chain: 1, points: 16 });
    expect(result.points).toBe(16);
  });

  it('o bloco que pousa guarda o id ao se fundir', () => {
    const result = landAndResolve(boardFrom([[8], [], [], [], []]), 0, 8);
    expect(result.board[0]![0]!.id).toBe(1);
  });

  it('funde com a esquerda e a direita ao mesmo tempo e quadruplica', () => {
    const result = landAndResolve(boardFrom([[4], [], [4], [], []]), 1, 4);
    expect(valuesOf(result.board)).toEqual([[], [16], [], [], []]);
    expect(result.events[0]).toMatchObject({ type: 'merge', chain: 1, points: 16 });
    expect(result.events[0]).toHaveProperty('absorbed.length', 2);
  });

  it('com três vizinhos iguais, multiplica por 8', () => {
    const result = landAndResolve(boardFrom([[2, 8], [8], [4, 8], [], []]), 1, 8);
    expect(valuesOf(result.board)).toEqual([[2], [64], [4], [], []]);
    expect(result.points).toBe(64);
  });

  it('blocos acima do vizinho absorvido caem', () => {
    const result = landAndResolve(boardFrom([[4, 2, 8], [16], [], [], []]), 1, 2);
    // O 2 pousa na linha 1 da coluna 1 e absorve o 2 da coluna 0; o 8 cai da linha 2 para a 1.
    expect(valuesOf(result.board)).toEqual([[4, 8], [16, 4], [], [], []]);
    const fall = result.events.find((event) => event.type === 'fall');
    expect(fall).toMatchObject({ type: 'fall', falls: [{ column: 0, from: 2, to: 1 }] });
  });

  it('encadeia fusões, com multiplicador crescente', () => {
    const result = landAndResolve(boardFrom([[8, 4], [], [], [], []]), 0, 4);
    // 4 + 4 = 8 (×1) cai sobre o 8; 8 + 8 = 16 (×2).
    expect(valuesOf(result.board)).toEqual([[16], [], [], [], []]);
    expect(types(result.events)).toEqual(['merge', 'fall', 'merge', 'fall']);
    expect(result.events[2]).toMatchObject({ type: 'merge', into: { value: 16 }, chain: 2, points: 32 });
    expect(result.points).toBe(8 + 32);
  });

  it('cada evento traz o tabuleiro logo depois dele', () => {
    const result = landAndResolve(boardFrom([[8, 4], [], [], [], []]), 0, 4);
    // No instante da fusão, os absorvidos ainda estão no lugar (é o choque); a queda seguinte já os tira.
    expect(result.events.map((event) => valuesOf(event.board))).toEqual([
      [[8, 4, 8], [], [], [], []],
      [[8, 8], [], [], [], []],
      [[8, 16], [], [], [], []],
      [[16], [], [], [], []],
    ]);
  });

  it('não altera o tabuleiro recebido', () => {
    const board = boardFrom([[8], [], [], [], []]);
    const landed = board.map((c, i) => (i === 0 ? [...c, { id: 1, value: 8 }] : [...c]));
    const snapshot = JSON.stringify(landed);
    resolve(landed, { column: 0, row: 1 });
    expect(JSON.stringify(landed)).toBe(snapshot);
  });
});
```

Rodar `npm test` → FAIL, módulos `resolve` e `score` não encontrados.

- [ ] **Passo 2: criar `src/game/score.ts`**

```ts
/** Pontos de uma fusão: o valor criado vezes a posição dela na cadeia (1ª = ×1, 2ª = ×2…). */
export const mergePoints = (value: number, chain: number): number => value * chain;
```

- [ ] **Passo 3: criar `src/game/resolve.ts`**

```ts
import { mergePoints } from './score';
import type { Board, Fall, GameEvent, Position, Tile } from './types';

export interface Resolution {
  readonly board: Board;
  readonly events: readonly GameEvent[];
  readonly points: number;
}

type MutableBoard = Tile[][];

const NEIGHBOR_OFFSETS: readonly Position[] = [
  { column: -1, row: 0 },
  { column: 1, row: 0 },
  { column: 0, row: -1 },
];

const byBottomThenLeft = (a: Position, b: Position) => a.row - b.row || a.column - b.column;

function equalNeighbors(board: MutableBoard, at: Position, value: number): Position[] {
  return NEIGHBOR_OFFSETS.map((offset) => ({ column: at.column + offset.column, row: at.row + offset.row })).filter(
    (position) => board[position.column]?.[position.row]?.value === value,
  );
}

/** Tira os blocos absorvidos; os de cima descem. Devolve o novo tabuleiro e quem caiu. */
function collapse(board: MutableBoard, absorbedIds: ReadonlySet<number>): { board: MutableBoard; falls: Fall[] } {
  const falls: Fall[] = [];
  const next = board.map((column, columnIndex) => {
    const kept = column.filter((tile) => !absorbedIds.has(tile.id));
    kept.forEach((tile, to) => {
      const from = column.indexOf(tile);
      if (from !== to) falls.push({ tile, column: columnIndex, from, to });
    });
    return kept;
  });
  return { board: next, falls };
}

function positionOf(board: MutableBoard, id: number): Position {
  for (let column = 0; column < board.length; column++) {
    const row = board[column]!.findIndex((tile) => tile.id === id);
    if (row >= 0) return { column, row };
  }
  throw new Error(`Tile ${String(id)} is not on the board.`);
}

/**
 * Resolve as fusões a partir do bloco que acabou de pousar em `landed`. A cada passo, uma única fusão
 * acontece: a do bloco em movimento mais baixo e mais à esquerda que tem vizinhos iguais. Depois dela,
 * os blocos sem apoio caem, e os que se moveram podem fundir no passo seguinte. Não altera `board`.
 */
export function resolve(board: Board, landed: Position): Resolution {
  let current: MutableBoard = board.map((column) => [...column]);
  const events: GameEvent[] = [];
  let points = 0;
  let chain = 0;
  let moving: Position[] = [landed];

  for (;;) {
    const candidate = [...moving]
      .sort(byBottomThenLeft)
      .map((at) => ({ at, tile: current[at.column]?.[at.row] }))
      .map(({ at, tile }) => ({ at, tile, neighbors: tile ? equalNeighbors(current, at, tile.value) : [] }))
      .find(({ neighbors }) => neighbors.length > 0);
    if (!candidate?.tile) break;

    const { at, tile, neighbors } = candidate;
    chain++;
    const into: Tile = { id: tile.id, value: tile.value * 2 ** neighbors.length };
    const absorbed = neighbors.map((position) => current[position.column]![position.row]!);
    const gained = mergePoints(into.value, chain);
    points += gained;

    current[at.column]![at.row] = into;
    const snapshot = current.map((column) => [...column]);
    events.push({ type: 'merge', into, absorbed, at, chain, points: gained, board: snapshot });

    const collapsed = collapse(current, new Set(absorbed.map((t) => t.id)));
    current = collapsed.board;
    if (collapsed.falls.length > 0) {
      events.push({ type: 'fall', falls: collapsed.falls, board: current.map((column) => [...column]) });
    }

    const mergedAt = positionOf(current, into.id);
    moving = [mergedAt, ...collapsed.falls.map((fall) => ({ column: fall.column, row: fall.to }))];
  }

  return { board: current, events, points };
}
```

No evento `merge`, o tabuleiro ainda mostra os blocos absorvidos no lugar (é o instante do choque); o evento `fall` seguinte já mostra o tabuleiro sem eles. É isso que permite à interface animar os absorvidos indo até o bloco resultante. Quando a fusão não deixa nada para cair (só vizinhos laterais, sem blocos acima), não há evento `fall`: a interface termina a jogada mostrando o tabuleiro final.

A ordem "de baixo para cima e da esquerda para a direita" vem de `byBottomThenLeft`, aplicada aos blocos que se moveram em cada passo. O teste de propriedade da Tarefa 5 garante que o resultado é sempre o mesmo para as mesmas jogadas.

- [ ] **Passo 4: rodar e confirmar**

Rodar `npm test` → PASS. Rodar `npm run typecheck` e `npm run lint` → sem erros.

- [ ] **Passo 5: commit**

```bash
git add src/game tests/unit
git commit -m "feat: fusões, gravidade e cadeias com eventos

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 4: partida, jogada e resumo

**Arquivos:** criar `src/game/game.ts`, `summary.ts`, `index.ts`; testes `tests/unit/game.test.ts`, `tests/unit/summary.test.ts`.

- [ ] **Passo 1: escrever `tests/unit/game.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { dropTile, newGame } from '../../src/game/game';
import { COLUMNS, ROWS } from '../../src/game/types';
import { boardFrom, stateWith, valuesOf } from './helpers';

describe('newGame', () => {
  it('começa vazio, com dois próximos blocos e placar zerado', () => {
    const state = newGame(123);
    expect(valuesOf(state.board)).toEqual([[], [], [], [], []]);
    expect([2, 4, 8]).toContain(state.next);
    expect([2, 4, 8]).toContain(state.then);
    expect(state).toMatchObject({ score: 0, topBlock: 0, moves: 0, over: false });
  });

  it('a mesma semente gera a mesma partida', () => {
    expect(newGame(123)).toEqual(newGame(123));
  });
});

describe('dropTile', () => {
  it('o bloco cai até a primeira casa livre', () => {
    const state = stateWith({ board: boardFrom([[4], [], [], [], []]), next: 2, then: 8 });
    const { state: after, events } = dropTile(state, 0);
    expect(valuesOf(after.board)).toEqual([[4, 2], [], [], [], []]);
    expect(events[0]).toMatchObject({ type: 'drop', tile: { value: 2 }, at: { column: 0, row: 1 } });
  });

  it('o seguinte vira o próximo e um novo seguinte é sorteado', () => {
    const state = stateWith({ board: boardFrom([[], [], [], [], []]), next: 2, then: 8 });
    const { state: after } = dropTile(state, 2);
    expect(after.next).toBe(8);
    expect([2, 4, 8]).toContain(after.then);
    expect(after.moves).toBe(1);
    expect(after.nextId).toBe(state.nextId + 1);
  });

  it('coluna cheia é rejeitada e o estado não muda', () => {
    const full = Array<number>(ROWS).fill(2).map((_, i) => 2 ** (i + 1));
    const state = stateWith({ board: boardFrom([full, [], [], [], []]) });
    const { state: after, events } = dropTile(state, 0);
    expect(after).toBe(state);
    expect(events).toEqual([{ type: 'rejected', column: 0, board: state.board }]);
  });

  it('soma os pontos e atualiza o maior bloco', () => {
    const state = stateWith({ board: boardFrom([[8, 4], [], [], [], []]), next: 4, score: 10, topBlock: 8 });
    const { state: after } = dropTile(state, 0);
    expect(after.score).toBe(10 + 8 + 32);
    expect(after.topBlock).toBe(16);
  });

  it('termina quando nenhuma coluna tem espaço', () => {
    const almost = Array.from({ length: COLUMNS }, (_, c) =>
      Array.from({ length: c === COLUMNS - 1 ? ROWS - 1 : ROWS }, (_, r) => 2 ** (((c + r) % 9) + 1)),
    );
    const board = boardFrom(almost);
    const lastTop = board[COLUMNS - 1]![ROWS - 2]!.value;
    const value = lastTop === 2 ? 4 : 2;
    const state = stateWith({ board, next: value });
    const result = dropTile(state, COLUMNS - 1);
    expect(result.state.over).toBe(true);
    expect(result.events.at(-1)).toMatchObject({ type: 'gameOver' });
  });

  it('depois do fim, novas jogadas não fazem nada', () => {
    const state = stateWith({ board: boardFrom([[], [], [], [], []]), over: true });
    expect(dropTile(state, 0)).toEqual({ state, events: [] });
  });

  it('coluna fora do tabuleiro é um erro de programação', () => {
    const state = stateWith({ board: boardFrom([[], [], [], [], []]) });
    expect(() => dropTile(state, COLUMNS)).toThrow(RangeError);
  });
});
```

No teste "termina quando nenhuma coluna tem espaço", os valores seguem `2 ** (((coluna + linha) % 9) + 1)`, então vizinhos nunca são iguais. O bloco solto é 4, diferente dos dois vizinhos da última casa (ambos 2), e por isso não funde: o tabuleiro fica cheio.

- [ ] **Passo 2: escrever `tests/unit/summary.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { summarize } from '../../src/game/summary';
import { dropTile } from '../../src/game/game';
import { boardFrom, stateWith } from './helpers';

describe('summarize', () => {
  it('jogada sem fusão', () => {
    const { events } = dropTile(stateWith({ board: boardFrom([[4], [], [], [], []]), next: 2 }), 0);
    expect(summarize(events)).toEqual({ points: 0, maxChain: 0, lastMerge: null, rejected: false, gameOver: false });
  });

  it('jogada com cadeia', () => {
    const { events } = dropTile(stateWith({ board: boardFrom([[8, 4], [], [], [], []]), next: 4 }), 0);
    expect(summarize(events)).toMatchObject({ points: 40, maxChain: 2, lastMerge: { value: 16, chain: 2 } });
  });

  it('coluna cheia', () => {
    const full = [2, 4, 8, 16, 32, 64, 128];
    const { events } = dropTile(stateWith({ board: boardFrom([full, [], [], [], []]) }), 0);
    expect(summarize(events).rejected).toBe(true);
  });
});
```

Rodar `npm test` → FAIL, módulos não encontrados.

- [ ] **Passo 3: criar `src/game/game.ts`**

```ts
import { emptyBoard, isBoardFull, isColumnFull, topValue } from './board';
import { drawValue } from './random';
import { resolve } from './resolve';
import { COLUMNS, type GameEvent, type GameState, type MoveResult } from './types';

export function newGame(seed: number): GameState {
  const first = drawValue(seed >>> 0 || 1, 0);
  const second = drawValue(first.rng, 0);
  return {
    board: emptyBoard(),
    next: first.value,
    then: second.value,
    score: 0,
    topBlock: 0,
    moves: 0,
    over: false,
    rng: second.rng,
    nextId: 1,
  };
}

/** Solta o próximo bloco em `column`. Coluna cheia não muda nada; depois do fim, nenhuma jogada vale. */
export function dropTile(state: GameState, column: number): MoveResult {
  if (!Number.isInteger(column) || column < 0 || column >= COLUMNS) {
    throw new RangeError(`Column must be an integer from 0 to ${String(COLUMNS - 1)}.`);
  }
  if (state.over) return { state, events: [] };
  if (isColumnFull(state.board, column)) {
    return { state, events: [{ type: 'rejected', column, board: state.board }] };
  }

  const tile = { id: state.nextId, value: state.next };
  const landed = state.board.map((c, i) => (i === column ? [...c, tile] : c));
  const at = { column, row: landed[column]!.length - 1 };
  const resolution = resolve(landed, at);

  const events: GameEvent[] = [{ type: 'drop', tile, at, board: landed }, ...resolution.events];
  const top = topValue(resolution.board);
  const draw = drawValue(state.rng, top);
  const over = isBoardFull(resolution.board);
  if (over) events.push({ type: 'gameOver', board: resolution.board });

  return {
    state: {
      board: resolution.board,
      next: state.then,
      then: draw.value,
      score: state.score + resolution.points,
      topBlock: Math.max(state.topBlock, top),
      moves: state.moves + 1,
      over,
      rng: draw.rng,
      nextId: state.nextId + 1,
    },
    events,
  };
}
```

- [ ] **Passo 4: criar `src/game/summary.ts`**

```ts
import type { GameEvent } from './types';

export interface MoveSummary {
  readonly points: number;
  /** Maior posição de cadeia na jogada; 0 sem fusão. */
  readonly maxChain: number;
  readonly lastMerge: { readonly value: number; readonly chain: number } | null;
  readonly rejected: boolean;
  readonly gameOver: boolean;
}

export function summarize(events: readonly GameEvent[]): MoveSummary {
  let points = 0;
  let maxChain = 0;
  let lastMerge: MoveSummary['lastMerge'] = null;
  for (const event of events) {
    if (event.type !== 'merge') continue;
    points += event.points;
    maxChain = Math.max(maxChain, event.chain);
    lastMerge = { value: event.into.value, chain: event.chain };
  }
  return {
    points,
    maxChain,
    lastMerge,
    rejected: events.some((event) => event.type === 'rejected'),
    gameOver: events.some((event) => event.type === 'gameOver'),
  };
}
```

- [ ] **Passo 5: criar `src/game/index.ts`**

```ts
export { COLUMNS, ROWS } from './types';
export type { Board, Column, Fall, GameEvent, GameState, MoveResult, Position, Tile } from './types';
export { dropTile, newGame } from './game';
export { summarize, type MoveSummary } from './summary';
```

- [ ] **Passo 6: rodar, conferir e commitar**

Rodar `npm test` → PASS; `npm run typecheck` e `npm run lint` → sem erros.

```bash
git add src/game tests/unit
git commit -m "feat: partida, jogada e resumo da jogada

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 5: testes de propriedade

**Arquivos:** teste `tests/unit/properties.test.ts`.

- [ ] **Passo 1: escrever**

```ts
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { dropTile, newGame } from '../../src/game/game';
import { COLUMNS, ROWS, type GameState } from '../../src/game/types';

const isPowerOfTwo = (value: number) => value >= 2 && Number.isInteger(Math.log2(value));

function play(seed: number, columns: readonly number[]): GameState[] {
  const states = [newGame(seed)];
  for (const column of columns) states.push(dropTile(states[states.length - 1]!, column).state);
  return states;
}

const seeds = fc.integer({ min: 1, max: 2 ** 31 - 1 });
const moves = fc.array(fc.integer({ min: 0, max: COLUMNS - 1 }), { maxLength: 200 });

describe('propriedades do motor', () => {
  it('o tabuleiro nunca passa do tamanho e só tem potências de 2', () => {
    fc.assert(
      fc.property(seeds, moves, (seed, columns) => {
        for (const state of play(seed, columns)) {
          expect(state.board).toHaveLength(COLUMNS);
          for (const column of state.board) {
            expect(column.length).toBeLessThanOrEqual(ROWS);
            for (const tile of column) expect(isPowerOfTwo(tile.value)).toBe(true);
          }
        }
      }),
      { numRuns: 200 },
    );
  });

  it('a pontuação e o maior bloco nunca diminuem', () => {
    fc.assert(
      fc.property(seeds, moves, (seed, columns) => {
        const states = play(seed, columns);
        for (let i = 1; i < states.length; i++) {
          expect(states[i]!.score).toBeGreaterThanOrEqual(states[i - 1]!.score);
          expect(states[i]!.topBlock).toBeGreaterThanOrEqual(states[i - 1]!.topBlock);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('os ids dos blocos no tabuleiro são únicos', () => {
    fc.assert(
      fc.property(seeds, moves, (seed, columns) => {
        for (const state of play(seed, columns)) {
          const ids = state.board.flat().map((tile) => tile.id);
          expect(new Set(ids).size).toBe(ids.length);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('a mesma semente com as mesmas jogadas dá o mesmo resultado', () => {
    fc.assert(
      fc.property(seeds, moves, (seed, columns) => {
        expect(play(seed, columns).at(-1)).toEqual(play(seed, columns).at(-1));
      }),
      { numRuns: 100 },
    );
  });

  it('o fim de jogo acontece exatamente quando o tabuleiro enche', () => {
    fc.assert(
      fc.property(seeds, moves, (seed, columns) => {
        for (const state of play(seed, columns)) {
          const full = state.board.every((column) => column.length === ROWS);
          expect(state.over).toBe(full);
        }
      }),
      { numRuns: 200 },
    );
  });
});
```

- [ ] **Passo 2: rodar, conferir e commitar**

Rodar `npm test` → PASS. Se uma propriedade falhar, o fast-check mostra o menor caso que falha: corrigir o motor (não a propriedade) e acrescentar esse caso como teste unitário em `resolve.test.ts` ou `game.test.ts`.

```bash
git add tests/unit/properties.test.ts
git commit -m "test: propriedades do motor com fast-check

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 6: base da interface

**Arquivos:** criar `src/ui/content/copy.ts`, `src/ui/ink.ts`, `src/ui/seed.ts`, `src/ui/styles/tokens.css`, `src/ui/styles/app.css`; teste `tests/unit/ui-helpers.test.ts`.

- [ ] **Passo 1: escrever `tests/unit/ui-helpers.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { copy } from '../../src/ui/content/copy';
import { inkFor } from '../../src/ui/ink';
import { readSeed } from '../../src/ui/seed';

describe('inkFor', () => {
  it('cada faixa de valor tem a sua tinta', () => {
    expect([2, 8].map(inkFor)).toEqual(['black', 'black']);
    expect([16, 64].map(inkFor)).toEqual(['navy', 'navy']);
    expect([128, 512].map(inkFor)).toEqual(['green', 'green']);
    expect([1024, 4096].map(inkFor)).toEqual(['ochre', 'ochre']);
    expect([8192, 65536].map(inkFor)).toEqual(['carmine', 'carmine']);
  });
});

describe('readSeed', () => {
  it('lê a semente da URL', () => {
    expect(readSeed('?seed=123')).toBe(123);
  });

  it('sem semente válida, gera uma aleatória positiva', () => {
    for (const search of ['', '?seed=abc', '?seed=0', '?seed=-4']) {
      const seed = readSeed(search);
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThan(0);
    }
  });
});

describe('copy', () => {
  it('descreve as colunas para leitores de tela', () => {
    expect(copy.columnLabel(0, [])).toBe('Column 1, empty');
    expect(copy.columnLabel(2, [{ id: 1, value: 2 }, { id: 2, value: 16 }])).toBe('Column 3, 2 blocks, top 16');
    expect(copy.columnLabel(1, [{ id: 1, value: 4 }])).toBe('Column 2, 1 block, top 4');
  });

  it('anuncia fusões e cadeias', () => {
    expect(copy.merged(32, 1)).toBe('Merged into 32.');
    expect(copy.merged(64, 2)).toBe('Merged into 64. Chain ×2.');
  });

  it('linha do registro', () => {
    expect(copy.logEntry(3, 384)).toBe('Chain ×3 · +384');
  });
});
```

Rodar `npm test` → FAIL, módulos não encontrados.

- [ ] **Passo 2: criar `src/ui/content/copy.ts`**

```ts
import { ROWS, type Column } from '../../game';

export const copy = {
  title: 'NUMBER MERGE',
  howTo: 'Drop blocks into the drawer. Equal numbers that touch merge into one.',
  begin: 'Choose a column to begin.',
  score: 'Score',
  best: 'Best',
  topBlock: 'Top block',
  next: 'Next',
  then: 'Then',
  newGame: 'New game',
  pressLog: 'Press log',
  columnFull: 'Column full.',
  drawerFull: 'The drawer is full.',
  newBest: 'New best',
  playAgain: 'Play again',
  drawerLabel: 'Drawer',
  logEntry: (chain: number, points: number) => `Chain ×${String(chain)} · +${String(points)}`,
  merged: (value: number, chain: number) =>
    chain > 1 ? `Merged into ${String(value)}. Chain ×${String(chain)}.` : `Merged into ${String(value)}.`,
  columnLabel: (index: number, column: Column) => {
    const name = `Column ${String(index + 1)}`;
    const top = column.at(-1);
    if (!top) return `${name}, empty`;
    const count = `${String(column.length)} ${column.length === 1 ? 'block' : 'blocks'}`;
    const full = column.length >= ROWS ? ', full' : '';
    return `${name}, ${count}, top ${String(top.value)}${full}`;
  },
} as const;
```

- [ ] **Passo 3: criar `src/ui/ink.ts`**

```ts
export type Ink = 'black' | 'navy' | 'green' | 'ochre' | 'carmine';

/** Tinta do número impresso no bloco, por faixa de valor. Quanto maior o valor, mais rara a tinta. */
export function inkFor(value: number): Ink {
  if (value <= 8) return 'black';
  if (value <= 64) return 'navy';
  if (value <= 512) return 'green';
  if (value <= 4096) return 'ochre';
  return 'carmine';
}
```

- [ ] **Passo 4: criar `src/ui/seed.ts`**

```ts
/** Semente da URL (`?seed=123`) ou, sem ela, uma semente aleatória. */
export function readSeed(search: string): number {
  const value = Number(new URLSearchParams(search).get('seed'));
  if (Number.isInteger(value) && value > 0) return value;
  return randomSeed();
}

export function randomSeed(): number {
  const [value = 1] = crypto.getRandomValues(new Uint32Array(1));
  return (value % 2147483646) + 1;
}
```

- [ ] **Passo 5: criar `src/ui/styles/tokens.css`**

```css
:root {
  /* A gaveta de tipos. Contraste conferido: --paper sobre --walnut ≈ 12:1; tintas sobre --boxwood ≥ 4,5:1. */
  --walnut: #2b1d14;
  --walnut-deep: #1e140e;
  --brass: #b08d57;
  --boxwood: #e8d5b0;
  --boxwood-edge: #c9b48c;
  --paper: #efe4cf;
  --paper-muted: #cdbfa4;

  --ink-black: #1a1410;
  --ink-navy: #1f3a5f;
  --ink-green: #1f4d3a;
  --ink-ochre: #6e4a0c;
  --ink-carmine: #8f1d2c;

  --font-type: 'Alfa Slab One', 'Rockwell', Georgia, serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, Consolas, monospace;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;

  --radius-block: 0.35rem;
  --drop-duration: 220ms;

  color-scheme: dark;
}
```

- [ ] **Passo 6: criar `src/ui/styles/app.css`**

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-height: 100%;
  background: var(--walnut-deep);
  color: var(--paper);
  font-family: var(--font-mono);
}

button {
  font: inherit;
  color: inherit;
}

:focus-visible {
  outline: 2px solid var(--paper);
  outline-offset: 3px;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

.app {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-4);
  width: min(100% - 2rem, 28rem);
  margin: 0 auto;
  padding-block: var(--space-6);
}

@media (min-width: 900px) {
  .app {
    width: min(100% - 4rem, 56rem);
    grid-template-columns: minmax(0, 28rem) minmax(0, 1fr);
    grid-template-areas:
      'header header'
      'drawer side';
    align-items: start;
    column-gap: var(--space-8);
  }

  .app__header { grid-area: header; }
  .app__play { grid-area: drawer; }
  .app__side { grid-area: side; }
}

.app__header {
  display: grid;
  gap: var(--space-3);
}

.title {
  margin: 0;
  font-family: var(--font-type);
  font-weight: 400;
  font-size: clamp(1.75rem, 7vw, 2.5rem);
  letter-spacing: 0.06em;
  color: var(--paper);
}

/* Placar */
.ledger {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-2);
  margin: 0;
}

.ledger div {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--brass);
}

.ledger dt {
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--paper-muted);
}

.ledger dd {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

/* Próximos blocos */
.next-blocks {
  display: flex;
  align-items: end;
  gap: var(--space-4);
}

.next-blocks figure {
  display: grid;
  gap: var(--space-1);
  justify-items: center;
  margin: 0;
}

.next-blocks figcaption {
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--paper-muted);
}

.next-blocks .type-face--then {
  font-size: 0.75em;
}

/* A gaveta */
.app__play {
  display: grid;
  gap: var(--space-3);
}

.intro p {
  margin: 0;
  line-height: 1.5;
}

.drawer {
  position: relative;
  aspect-ratio: 5 / 7;
  padding: var(--space-2);
  background:
    repeating-linear-gradient(92deg, rgb(255 255 255 / 0.02) 0 2px, transparent 2px 9px),
    var(--walnut);
  border: 3px solid var(--brass);
  border-radius: 0.5rem;
}

.drawer__columns,
.drawer__blocks {
  position: absolute;
  inset: var(--space-2);
}

.drawer__columns {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.drawer__column {
  padding: 0;
  background: transparent;
  border: 0;
  border-right: 1px solid rgb(176 141 87 / 0.55);
  cursor: pointer;
}

.drawer__column:last-child {
  border-right: 0;
}

.drawer__column:hover {
  background: rgb(239 228 207 / 0.05);
}

.drawer__column:focus-visible {
  outline-offset: -3px;
}

.drawer__column[aria-disabled='true'] {
  cursor: default;
}

.drawer__blocks {
  pointer-events: none;
}

/* Bloco de tipo */
.type-block {
  position: absolute;
  width: 20%;
  height: calc(100% / 7);
  padding: 3%;
}

.type-face {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  font-family: var(--font-type);
  font-size: clamp(0.9rem, 4.2vw, 1.6rem);
  line-height: 1;
  background: var(--boxwood);
  border-bottom: 4px solid var(--boxwood-edge);
  border-radius: var(--radius-block);
  box-shadow: 0 2px 0 rgb(0 0 0 / 0.35);
}

.type-face[data-ink='black'] { color: var(--ink-black); }
.type-face[data-ink='navy'] { color: var(--ink-navy); }
.type-face[data-ink='green'] { color: var(--ink-green); }
.type-face[data-ink='ochre'] { color: var(--ink-ochre); }
.type-face[data-ink='carmine'] { color: var(--ink-carmine); }

.next-blocks .type-face {
  width: 3.25rem;
  height: 3.25rem;
}

.next-blocks .type-face--then {
  width: 2.5rem;
  height: 2.5rem;
}

/* Carimbo da cadeia */
.stamp {
  position: absolute;
  top: 12%;
  right: 6%;
  padding: var(--space-1) var(--space-3);
  font-family: var(--font-type);
  font-size: clamp(1.5rem, 7vw, 2.25rem);
  color: var(--ink-carmine);
  background: var(--paper);
  border: 3px double var(--ink-carmine);
  rotate: -12deg;
  pointer-events: none;
}

/* Lado */
.app__side {
  display: grid;
  gap: var(--space-4);
}

.press-log {
  display: none;
}

@media (min-width: 900px) {
  .press-log {
    display: block;
    padding: var(--space-4);
    color: var(--ink-black);
    background: var(--paper);
    border-radius: 0.25rem;
  }

  .press-log h2 {
    margin: 0 0 var(--space-3);
    font-size: 0.75rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .press-log ol {
    display: grid;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
    font-variant-numeric: tabular-nums;
  }
}

.new-game {
  justify-self: start;
  padding: var(--space-2) var(--space-4);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: transparent;
  border: 1px solid var(--brass);
  cursor: pointer;
}

.new-game:hover {
  background: rgb(176 141 87 / 0.15);
}

/* Fim de jogo */
.game-over {
  width: min(100% - 2rem, 22rem);
  padding: var(--space-6);
  color: var(--ink-black);
  background: var(--paper);
  border: 0;
  border-radius: 0.25rem;
}

.game-over::backdrop {
  background: rgb(30 20 14 / 0.75);
}

.game-over h2 {
  margin: 0 0 var(--space-4);
  font-family: var(--font-type);
  font-weight: 400;
  font-size: 1.5rem;
}

.game-over dl {
  display: grid;
  grid-template-columns: auto auto;
  gap: var(--space-2) var(--space-4);
  margin: 0 0 var(--space-4);
}

.game-over dd {
  margin: 0;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.game-over .new-best {
  margin: 0 0 var(--space-4);
  color: var(--ink-carmine);
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.game-over button {
  width: 100%;
  padding: var(--space-3);
  color: var(--paper);
  background: var(--walnut);
  border: 0;
  cursor: pointer;
}
```

- [ ] **Passo 7: rodar, conferir e commitar**

Rodar `npm test` → PASS; `npm run typecheck`, `npm run lint`, `npm run format:check` → sem erros.

```bash
git add src/ui tests/unit/ui-helpers.test.ts
git commit -m "feat: textos, tintas, semente e estilos da gaveta de tipos

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 7: hooks

**Arquivos:** criar os seis hooks em `src/ui/hooks/`.

- [ ] **Passo 1: criar `useGame.ts`**

```ts
import { useCallback, useRef, useState } from 'react';
import { dropTile, newGame, summarize, type GameEvent, type GameState } from '../../game';

export interface Move {
  /** Aumenta a cada jogada, para os efeitos saberem que é uma jogada nova. */
  readonly id: number;
  readonly events: readonly GameEvent[];
}

export interface LogEntry {
  readonly id: number;
  readonly chain: number;
  readonly points: number;
}

const LOG_SIZE = 5;

export function useGame(initialSeed: number) {
  const [state, setState] = useState<GameState>(() => newGame(initialSeed));
  const [move, setMove] = useState<Move | null>(null);
  const [log, setLog] = useState<readonly LogEntry[]>([]);
  const stateRef = useRef(state);
  const moveId = useRef(0);

  const drop = useCallback((column: number) => {
    const result = dropTile(stateRef.current, column);
    stateRef.current = result.state;
    moveId.current += 1;
    const id = moveId.current;
    setState(result.state);
    setMove({ id, events: result.events });
    const summary = summarize(result.events);
    if (summary.maxChain >= 2) {
      setLog((entries) => [{ id, chain: summary.maxChain, points: summary.points }, ...entries].slice(0, LOG_SIZE));
    }
  }, []);

  const restart = useCallback((seed: number) => {
    const fresh = newGame(seed);
    stateRef.current = fresh;
    setState(fresh);
    setMove(null);
    setLog([]);
  }, []);

  return { state, move, log, drop, restart };
}
```

- [ ] **Passo 2: criar `useEventPlayer.ts`**

```ts
import { useEffect, useState } from 'react';
import type { Board, GameEvent } from '../../game';
import type { Move } from './useGame';

/** Tempo que cada tipo de evento fica na tela antes do próximo, em milissegundos. */
const STEP_MS: Record<GameEvent['type'], number> = {
  drop: 220,
  merge: 200,
  fall: 160,
  rejected: 0,
  gameOver: 0,
};

export interface Frame {
  readonly board: Board;
  readonly event: GameEvent | null;
  /** Aumenta a cada evento mostrado, para animações que reagem a cada passo. */
  readonly step: number;
}

/**
 * Mostra os tabuleiros dos eventos de uma jogada, um de cada vez. Uma jogada nova cancela a anterior
 * e começa do primeiro evento dela. Com movimento reduzido, mostra direto o tabuleiro final.
 */
export function useEventPlayer(move: Move | null, finalBoard: Board, reducedMotion: boolean): Frame {
  const [frame, setFrame] = useState<Frame>({ board: finalBoard, event: null, step: 0 });

  useEffect(() => {
    if (!move || reducedMotion || move.events.length === 0) {
      const last = move?.events.at(-1) ?? null;
      setFrame((previous) => ({ board: finalBoard, event: last, step: previous.step + 1 }));
      return;
    }

    const timers: number[] = [];
    let delay = 0;
    move.events.forEach((event, index) => {
      timers.push(
        window.setTimeout(() => {
          setFrame((previous) => ({ board: event.board, event, step: previous.step + 1 }));
        }, delay),
      );
      delay += STEP_MS[event.type];
      if (index === move.events.length - 1) {
        timers.push(
          window.setTimeout(() => {
            setFrame((previous) => ({ board: finalBoard, event, step: previous.step }));
          }, delay),
        );
      }
    });
    return () => {
      timers.forEach((timer) => {
        window.clearTimeout(timer);
      });
    };
  }, [move, finalBoard, reducedMotion]);

  return frame;
}
```

- [ ] **Passo 3: criar `useBestScore.ts`**

```ts
import { useEffect, useState } from 'react';

const KEY = 'number-merge:best';

function readBest(): number {
  try {
    const value = Number(window.localStorage.getItem(KEY));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function writeBest(value: number): void {
  try {
    window.localStorage.setItem(KEY, String(value));
  } catch {
    // Sem armazenamento (modo privado, bloqueado): o jogo segue sem guardar o recorde.
  }
}

/** Recorde guardado no navegador. `isNewBest` indica que a partida atual superou o recorde anterior. */
export function useBestScore(score: number) {
  const [previousBest, setPreviousBest] = useState(readBest);
  const best = Math.max(previousBest, score);

  useEffect(() => {
    if (score > previousBest) writeBest(score);
  }, [score, previousBest]);

  /** Chamado ao começar uma partida nova: o recorde atual vira a referência. */
  const commit = () => {
    setPreviousBest(readBest());
  };

  return { best, isNewBest: score > 0 && score > previousBest, commit };
}
```

- [ ] **Passo 4: criar `useColumnKeys.ts`**

```ts
import { useCallback, useRef, type KeyboardEvent } from 'react';

/** Setas para a esquerda e a direita movem o foco entre as colunas, dando a volta nas pontas. */
export function useColumnKeys(count: number) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const setRef = useCallback((index: number) => (element: HTMLButtonElement | null) => {
    refs.current[index] = element;
  }, []);

  const onKeyDown = useCallback(
    (index: number) => (event: KeyboardEvent<HTMLButtonElement>) => {
      const direction = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
      if (direction === 0) return;
      event.preventDefault();
      refs.current[(index + direction + count) % count]?.focus();
    },
    [count],
  );

  return { setRef, onKeyDown };
}
```

- [ ] **Passo 5: criar `useCountUp.ts`**

```ts
import { useEffect, useRef, useState } from 'react';

const DURATION_MS = 400;

/** Valor que rola até `target`. Com movimento reduzido, salta direto. */
export function useCountUp(target: number, reducedMotion: boolean): number {
  const [shown, setShown] = useState(target);
  const from = useRef(target);

  useEffect(() => {
    if (reducedMotion || target < from.current) {
      from.current = target;
      setShown(target);
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION_MS);
      const eased = 1 - (1 - t) ** 3;
      setShown(Math.round(origin + (target - origin) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
      else from.current = target;
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      from.current = target;
    };
  }, [target, reducedMotion]);

  return shown;
}
```

- [ ] **Passo 6: criar `useAnnouncer.ts`**

```ts
import { useEffect, useState } from 'react';

/**
 * Texto para a região aria-live. Limpa e preenche de novo a cada `id`, para que uma mensagem
 * repetida (por exemplo, "Column full." duas vezes) seja anunciada de novo.
 */
export function useAnnouncer(message: string, id: number): string {
  const [text, setText] = useState('');

  useEffect(() => {
    setText('');
    if (!message) return;
    const timer = window.setTimeout(() => {
      setText(message);
    }, 50);
    return () => {
      window.clearTimeout(timer);
    };
  }, [message, id]);

  return text;
}
```

- [ ] **Passo 7: conferir e commitar**

Rodar `npm run typecheck` e `npm run lint` → sem erros. Se a regra `react-hooks/set-state-in-effect` (ou equivalente do eslint-plugin-react-hooks 7) acusar `setState` dentro de efeitos em `useEventPlayer`, `useCountUp` ou `useAnnouncer`, manter o comportamento e resolver do jeito que a regra recomenda (por exemplo, derivar valores durante o render quando possível); se não houver alternativa limpa, desligar a regra só naquela linha com um comentário explicando o motivo.

```bash
git add src/ui/hooks
git commit -m "feat: hooks da partida, dos eventos, do recorde, do teclado, do placar e dos anúncios

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 8: componentes e App

**Arquivos:** criar os componentes em `src/ui/components/`; substituir `src/App.tsx`.

- [ ] **Passo 1: `TypeFace.tsx` (a face do bloco, usada no tabuleiro e nos próximos)**

```tsx
import { motion } from 'motion/react';
import { inkFor } from '../ink';

interface TypeFaceProps {
  value: number;
  variant?: 'then';
}

/** A face de madeira com o número impresso. Ao mudar de valor, o número entra com uma "batida". */
export function TypeFace({ value, variant }: TypeFaceProps) {
  return (
    <span className={variant ? `type-face type-face--${variant}` : 'type-face'} data-ink={inkFor(value)}>
      <motion.span key={value} initial={{ scale: 1.35 }} animate={{ scale: 1 }} transition={{ duration: 0.18 }}>
        {value}
      </motion.span>
    </span>
  );
}
```

- [ ] **Passo 2: `TypeBlock.tsx`**

```tsx
import { motion } from 'motion/react';
import { ROWS, type Position, type Tile } from '../../game';
import { TypeFace } from './TypeFace';

export type ExitTargets = ReadonlyMap<number, Position>;

const place = (at: Position) => ({ left: `${String(at.column * 20)}%`, bottom: `${String((at.row * 100) / ROWS)}%` });

interface TypeBlockProps {
  tile: Tile;
  at: Position;
}

/** Um bloco na gaveta. Entra caindo do topo da coluna; ao ser absorvido, desliza até o bloco resultante. */
export function TypeBlock({ tile, at }: TypeBlockProps) {
  return (
    <motion.div
      className="type-block"
      initial={{ ...place({ column: at.column, row: ROWS }), opacity: 0 }}
      animate={{ ...place(at), opacity: 1 }}
      exit="absorbed"
      variants={{
        absorbed: (targets: ExitTargets) => {
          const target = targets.get(tile.id);
          return target ? { ...place(target), opacity: 0 } : { opacity: 0 };
        },
      }}
      transition={{ duration: 0.2, ease: [0.55, 0, 1, 0.45] }}
    >
      <TypeFace value={tile.value} />
    </motion.div>
  );
}
```

- [ ] **Passo 3: `Drawer.tsx`**

```tsx
import { AnimatePresence, useAnimate, useReducedMotion } from 'motion/react';
import { useEffect } from 'react';
import { COLUMNS, type Board } from '../../game';
import { copy } from '../content/copy';
import { useColumnKeys } from '../hooks/useColumnKeys';
import { TypeBlock, type ExitTargets } from './TypeBlock';

interface DrawerProps {
  board: Board;
  exitTargets: ExitTargets;
  /** Tamanho da cadeia do passo atual (0 sem fusão), para o tremor. */
  chain: number;
  step: number;
  over: boolean;
  onDrop: (column: number) => void;
}

export function Drawer({ board, exitTargets, chain, step, over, onDrop }: DrawerProps) {
  const { setRef, onKeyDown } = useColumnKeys(COLUMNS);
  const tiles = board.flatMap((column, columnIndex) =>
    column.map((tile, row) => ({ tile, at: { column: columnIndex, row } })),
  );
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reducedMotion = useReducedMotion() ?? false;

  // Tremor proporcional à cadeia, a cada fusão de ×2 ou mais.
  useEffect(() => {
    if (reducedMotion || chain < 2) return;
    const shake = Math.min(2 + chain * 1.5, 9);
    void animate(scope.current, { x: [0, -shake, shake, -shake / 2, 0] }, { duration: 0.28 });
  }, [step, chain, reducedMotion, animate, scope]);

  return (
    <div ref={scope} className="drawer" role="group" aria-label={copy.drawerLabel}>
      <div className="drawer__columns">
        {board.map((column, index) => (
          <button
            key={index}
            ref={setRef(index)}
            type="button"
            className="drawer__column"
            aria-label={copy.columnLabel(index, column)}
            aria-disabled={over}
            onClick={() => {
              if (!over) onDrop(index);
            }}
            onKeyDown={onKeyDown(index)}
          />
        ))}
      </div>
      <div className="drawer__blocks" aria-hidden="true">
        <AnimatePresence custom={exitTargets}>
          {tiles.map(({ tile, at }) => (
            <TypeBlock key={tile.id} tile={tile} at={at} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
```

- [ ] **Passo 4: `Ledger.tsx`**

```tsx
import { copy } from '../content/copy';
import { useCountUp } from '../hooks/useCountUp';

interface LedgerProps {
  score: number;
  best: number;
  topBlock: number;
  reducedMotion: boolean;
}

export function Ledger({ score, best, topBlock, reducedMotion }: LedgerProps) {
  const shownScore = useCountUp(score, reducedMotion);
  return (
    <dl className="ledger">
      <div>
        <dt>{copy.score}</dt>
        <dd data-testid="score" data-value={score}>
          {shownScore}
        </dd>
      </div>
      <div>
        <dt>{copy.best}</dt>
        <dd data-testid="best">{best}</dd>
      </div>
      <div>
        <dt>{copy.topBlock}</dt>
        <dd data-testid="top-block">{topBlock}</dd>
      </div>
    </dl>
  );
}
```

- [ ] **Passo 5: `NextBlocks.tsx`**

```tsx
import { copy } from '../content/copy';
import { TypeFace } from './TypeFace';

interface NextBlocksProps {
  next: number;
  then: number;
}

export function NextBlocks({ next, then }: NextBlocksProps) {
  return (
    <div className="next-blocks">
      <figure data-testid="next" data-value={next}>
        <TypeFace value={next} />
        <figcaption>{copy.next}</figcaption>
      </figure>
      <figure data-testid="then" data-value={then}>
        <TypeFace value={then} variant="then" />
        <figcaption>{copy.then}</figcaption>
      </figure>
    </div>
  );
}
```

- [ ] **Passo 6: `PressLog.tsx`**

```tsx
import { copy } from '../content/copy';
import type { LogEntry } from '../hooks/useGame';

export function PressLog({ entries }: { entries: readonly LogEntry[] }) {
  return (
    <section className="press-log" aria-labelledby="press-log-title">
      <h2 id="press-log-title">{copy.pressLog}</h2>
      <ol>
        {entries.map((entry) => (
          <li key={entry.id}>{copy.logEntry(entry.chain, entry.points)}</li>
        ))}
      </ol>
    </section>
  );
}
```

- [ ] **Passo 7: `Stamp.tsx`**

```tsx
import { AnimatePresence, motion } from 'motion/react';

interface StampProps {
  chain: number;
  step: number;
}

/** Carimbo de borracha "×2", "×3"… a cada fusão de uma cadeia. */
export function Stamp({ chain, step }: StampProps) {
  return (
    <AnimatePresence>
      {chain >= 2 && (
        <motion.span
          key={step}
          className="stamp"
          aria-hidden="true"
          initial={{ scale: 1.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
        >
          ×{chain}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Passo 8: `Intro.tsx` e `GameOver.tsx`**

`Intro.tsx`:

```tsx
import { copy } from '../content/copy';

export function Intro() {
  return (
    <div className="intro">
      <p>{copy.howTo}</p>
      <p>{copy.begin}</p>
    </div>
  );
}
```

`GameOver.tsx`:

```tsx
import { useEffect, useRef } from 'react';
import { copy } from '../content/copy';

interface GameOverProps {
  open: boolean;
  score: number;
  topBlock: number;
  best: number;
  isNewBest: boolean;
  onPlayAgain: () => void;
}

export function GameOver({ open, score, topBlock, best, isNewBest, onPlayAgain }: GameOverProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className="game-over"
      aria-labelledby="game-over-title"
      onCancel={(event) => {
        event.preventDefault();
      }}
    >
      <h2 id="game-over-title">{copy.drawerFull}</h2>
      {isNewBest && <p className="new-best">{copy.newBest}</p>}
      <dl>
        <dt>{copy.score}</dt>
        <dd>{score}</dd>
        <dt>{copy.topBlock}</dt>
        <dd>{topBlock}</dd>
        <dt>{copy.best}</dt>
        <dd>{best}</dd>
      </dl>
      <button type="button" onClick={onPlayAgain}>
        {copy.playAgain}
      </button>
    </dialog>
  );
}
```

- [ ] **Passo 9: substituir `src/App.tsx`**

```tsx
import { MotionConfig, useReducedMotion } from 'motion/react';
import { useMemo, useState } from 'react';
import { summarize, type Position } from './game';
import { Drawer } from './ui/components/Drawer';
import { GameOver } from './ui/components/GameOver';
import { Intro } from './ui/components/Intro';
import { Ledger } from './ui/components/Ledger';
import { NextBlocks } from './ui/components/NextBlocks';
import { PressLog } from './ui/components/PressLog';
import { Stamp } from './ui/components/Stamp';
import { copy } from './ui/content/copy';
import { useAnnouncer } from './ui/hooks/useAnnouncer';
import { useBestScore } from './ui/hooks/useBestScore';
import { useEventPlayer } from './ui/hooks/useEventPlayer';
import { useGame } from './ui/hooks/useGame';
import { randomSeed, readSeed } from './ui/seed';

export function App() {
  const [seed] = useState(() => readSeed(window.location.search));
  const reducedMotion = useReducedMotion() ?? false;
  const { state, move, log, drop, restart } = useGame(seed);
  const frame = useEventPlayer(move, state.board, reducedMotion);
  const { best, isNewBest, commit } = useBestScore(state.score);

  const event = frame.event;
  const chain = event?.type === 'merge' ? event.chain : 0;
  const exitTargets = useMemo(() => {
    const targets = new Map<number, Position>();
    if (event?.type === 'merge') for (const tile of event.absorbed) targets.set(tile.id, event.at);
    return targets;
  }, [event]);

  const message = useMemo(() => {
    if (!move) return '';
    const summary = summarize(move.events);
    if (summary.rejected) return copy.columnFull;
    const merged = summary.lastMerge ? copy.merged(summary.lastMerge.value, summary.lastMerge.chain) : '';
    return summary.gameOver ? `${merged} ${copy.drawerFull}`.trim() : merged;
  }, [move]);
  const announcement = useAnnouncer(message, move?.id ?? 0);

  const playAgain = () => {
    commit();
    restart(randomSeed());
  };

  return (
    <MotionConfig reducedMotion="user">
      <main className="app">
        <header className="app__header">
          <h1 className="title">{copy.title}</h1>
          <Ledger score={state.score} best={best} topBlock={state.topBlock} reducedMotion={reducedMotion} />
          <NextBlocks next={state.next} then={state.then} />
        </header>

        <div className="app__play">
          {state.moves === 0 && <Intro />}
          <div style={{ position: 'relative' }}>
            <Drawer
              board={frame.board}
              exitTargets={exitTargets}
              chain={chain}
              step={frame.step}
              over={state.over}
              onDrop={drop}
            />
            <Stamp chain={chain} step={frame.step} />
          </div>
        </div>

        <aside className="app__side">
          <PressLog entries={log} />
          <button type="button" className="new-game" onClick={playAgain}>
            {copy.newGame}
          </button>
        </aside>

        <p className="visually-hidden" aria-live="polite" data-testid="announcer">
          {announcement}
        </p>

        <GameOver
          open={state.over}
          score={state.score}
          topBlock={state.topBlock}
          best={best}
          isNewBest={isNewBest}
          onPlayAgain={playAgain}
        />
      </main>
    </MotionConfig>
  );
}
```

O `style={{ position: 'relative' }}` do invólucro da gaveta pode virar uma classe `.app__drawer-wrap` em `app.css`, se o lint de estilo do projeto preferir.

- [ ] **Passo 10: conferir e commitar**

Rodar `npm run typecheck`, `npm run lint`, `npm run format:check` e `npm run build` → sem erros. Rodar `npm run dev`, abrir a página e jogar algumas partidas para ver que blocos caem, fundem, encadeiam e que o placar sobe.

```bash
git add -A
git commit -m "feat: gaveta, blocos, placar, próximos, registro, carimbo e fim de jogo

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 9: conferência visual e testes de navegador

**Arquivos:** criar `playwright.config.ts`, `tests/e2e/replay.ts`, `tests/e2e/game.spec.ts`, `tests/e2e/a11y.spec.ts`; ajustes de CSS e animação.

- [ ] **Passo 1: conferência visual**

Com `npm run build` e `npm run preview`, tirar capturas com Playwright (fora do repositório) em 1280×800 e no Pixel 7:
- tela inicial;
- meio de uma partida;
- uma cadeia ×2 com o carimbo;
- fim de jogo;
- o mesmo meio de partida com movimento reduzido.

Conferir:
- a gaveta parece de madeira, com filetes de latão;
- os blocos são legíveis e as tintas variam por valor;
- a queda e a fusão parecem "pesadas";
- o carimbo aparece e não cobre o placar;
- nada vaza na horizontal no celular;
- o contraste das tintas sobre `--boxwood` é de pelo menos 4,5:1, medido nas capturas.

Ajustar CSS e tempos de animação dentro do design, registrando cada ajuste no relatório.

- [ ] **Passo 2: criar `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  use: { baseURL: 'http://localhost:4173', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Passo 3: criar `tests/e2e/replay.ts`**

O motor roda no próprio teste para decidir as jogadas e prever o resultado. Assim o teste confirma que o jogo na tela é igual ao motor.

```ts
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
```

- [ ] **Passo 4: criar `tests/e2e/game.spec.ts`**

```ts
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
  if (!isMobile) await expect(page.getByRole('region', { name: 'Press log' })).toContainText(/Chain ×\d+ · \+\d+/);
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
      (_, __, ___) => false,
      25,
    );
    await page.goto(`/?seed=${String(SEED)}`);
    await replay(page, columns);
    await expectScore(page, state.score);
  });
});
```

Se a semente `4242` não produzir uma cadeia ou uma coluna cheia antes do fim, os próprios testes indicam: trocar `SEED` (ou criar uma constante por teste) por uma que produza o caso.

- [ ] **Passo 5: criar `tests/e2e/a11y.spec.ts`**

```ts
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
```

- [ ] **Passo 6: rodar tudo duas vezes**

Rodar `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test` e `npm run test:e2e` duas vezes seguidas. Tudo deve passar nos dois projetos.

- [ ] **Passo 7: commit**

```bash
git add -A
git commit -m "test: partida no navegador igual ao motor, teclado, recorde e acessibilidade

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tarefa 10: README e documento

- [ ] **Passo 1:** criar `README.md` com: o que é o jogo, como jogar, os comandos (`npm run dev`, `npm test`, `npm run test:e2e`, `npm run build`), a estrutura de pastas em uma tabela curta, as decisões principais (motor puro com eventos, semente pela URL) e a lista de tecnologias.
- [ ] **Passo 2:** em `docs/2026-11-03-number-merge-design.md`, trocar `Status: em revisão` por `Status: aprovado e implementado` e acrescentar ao §5 uma linha dizendo que cada evento carrega o tabuleiro depois dele e que `?seed=` define a semente.
- [ ] **Passo 3:** rodar `npm run format:check` e commitar `docs: README e design atualizados`, com a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

---

## Cobertura do design

| Requisito do design | Onde |
|---|---|
| Regras: tabuleiro, jogada, fusão, gravidade, cadeia, pontuação, sorteio, fim (§2) | Tarefas 2, 3, 4 e 5 |
| Recorde no navegador, tolerante a falhas (§2) | Tarefas 7 e 9 |
| Cores, tintas, tipografia, layout (§3) | Tarefas 6, 8 e 9 |
| Animações e movimento reduzido (§3) | Tarefas 7, 8 e 9 |
| Telas: início, jogo, fim (§3) | Tarefa 8 |
| Textos (§4) | Tarefa 6 |
| Arquitetura: motor puro, eventos, hooks, componentes (§5) | Tarefas 2 a 8 |
| Acessibilidade (§5) | Tarefas 6, 7, 8 e 9 |
| Stack e qualidade (§6) | Tarefa 1 |
| Testes (§7) | Tarefas 2 a 5 e 9 |
