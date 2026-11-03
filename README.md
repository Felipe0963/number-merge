# Number Merge

A browser game about a letterpress type case. Drop numbered wooden type blocks into five columns; equal numbers that touch merge into one, and merges can set off chain reactions. Reach the highest block you can.

## How to play

- Choose a column (click, tap, or arrow keys + Enter/Space) to drop the next block.
- A block merges with equal blocks to its left, right and below: one neighbour doubles it, two quadruple it, three multiply it by 8.
- Blocks left unsupported fall, and anything that moved can merge again. Each merge in a chain scores its value times its place in the chain (×1, ×2, ×3…).
- The game ends when every column is full.

## Commands

| Command                | What it does                                             |
| ---------------------- | -------------------------------------------------------- |
| `npm run dev`          | Development server                                       |
| `npm test`             | Engine and helper unit tests (Vitest + fast-check)       |
| `npm run test:e2e`     | Browser tests on desktop and mobile (Playwright + axe)   |
| `npm run typecheck`    | TypeScript, strict                                       |
| `npm run lint`         | ESLint (typescript-eslint strict, React Hooks, jsx-a11y) |
| `npm run format:check` | Prettier                                                 |
| `npm run build`        | Production build in `dist/`                              |

Add `?seed=123` to the URL to replay the same game.

## Structure

| Folder                   | Contents                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| `src/game/`              | The game engine: pure TypeScript, no React. Board, seeded random, merges and chains, scoring.    |
| `src/ui/hooks/`          | Game state, event playback, best score, keyboard focus, score count-up, announcements, new inks. |
| `src/ui/components/`     | Drawer, type blocks, ledger, next blocks, press log, stamp, ink splash, title, game over.        |
| `src/ui/content/copy.ts` | Every piece of text in the game.                                                                 |
| `src/ui/styles/`         | Design tokens and styles.                                                                        |
| `tests/unit/`            | Engine rules, property tests and UI helpers.                                                     |
| `tests/e2e/`             | Browser tests: the engine plays the same moves as the browser and the screen must match.         |
| `docs/`                  | Design and implementation plan.                                                                  |

## Key decisions

- **The engine returns events.** One move is computed in full and returns the final state plus the list of events (drop, merge, fall, rejected, game over), each carrying the board after it. The UI only plays those boards back with animation, so game logic never waits for animation.
- **Columns are stacks.** A column is a list of tiles from the bottom up, so there are never gaps and gravity comes for free.
- **Deterministic.** A seeded generator draws the blocks; the same seed and moves always give the same game. Property tests check this over thousands of random games.
- **Accessible.** Keyboard play with one tab stop and arrow keys, descriptive column labels, a polite live region for merges and chains, and full support for reduced motion.

## Stack

Vite, React 19, TypeScript 6 (strict), Motion (LazyMotion), Vitest, fast-check, Playwright, axe, ESLint, Prettier, Fontsource (Alfa Slab One, IBM Plex Mono).
