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
