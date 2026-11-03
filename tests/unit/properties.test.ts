import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { dropTile, newGame } from '../../src/game/game';
import { COLUMNS, ROWS, type Board, type GameEvent, type GameState } from '../../src/game/types';

const isPowerOfTwo = (value: number) => value >= 2 && Number.isInteger(Math.log2(value));

function play(seed: number, columns: readonly number[]): GameState[] {
  const states = [newGame(seed)];
  for (const column of columns) states.push(dropTile(states[states.length - 1]!, column).state);
  return states;
}

/** Ids dos blocos que se moveram na jogada: o que caiu, os resultados das fusões e os que caíram. */
function movedIds(events: readonly GameEvent[]): Set<number> {
  const ids = new Set<number>();
  for (const event of events) {
    if (event.type === 'drop') ids.add(event.tile.id);
    if (event.type === 'merge') ids.add(event.into.id);
    if (event.type === 'fall') for (const fall of event.falls) ids.add(fall.tile.id);
  }
  return ids;
}

/** Blocos de `ids` que terminaram encostados (esquerda, direita ou embaixo) num bloco de mesmo valor. */
function restingNextToEqual(board: Board, ids: ReadonlySet<number>): number[] {
  const valueAt = (column: number, row: number) => board[column]?.[row]?.value;
  return board.flatMap((column, c) =>
    column
      .filter(
        (tile, r) =>
          ids.has(tile.id) && [valueAt(c - 1, r), valueAt(c + 1, r), valueAt(c, r - 1)].includes(tile.value),
      )
      .map((tile) => tile.id),
  );
}

const seeds = fc.integer({ min: 1, max: 2 ** 31 - 1 });
const moves = fc.array(fc.integer({ min: 0, max: COLUMNS - 1 }), { maxLength: 200 });
/**
 * Partidas longas: com o tamanho padrão do fast-check, `moves` gera poucas jogadas e quase nenhuma
 * cadeia; as regras de cadeia só aparecem depois de o tabuleiro encher um pouco.
 */
const longGames = fc.array(fc.integer({ min: 0, max: COLUMNS - 1 }), { minLength: 60, maxLength: 200 });

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

  it('nenhum bloco que se moveu na jogada termina encostado num igual', () => {
    fc.assert(
      fc.property(seeds, longGames, (seed, columns) => {
        let state = newGame(seed);
        for (const column of columns) {
          const result = dropTile(state, column);
          expect(restingNextToEqual(result.state.board, movedIds(result.events))).toEqual([]);
          state = result.state;
        }
      }),
      { numRuns: 300 },
    );
  });
});
