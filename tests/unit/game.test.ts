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

  it('os ids podem continuar de onde a partida anterior parou', () => {
    const fresh = newGame(123, 57);
    expect(fresh.nextId).toBe(57);
    expect(dropTile(fresh, 0).state.board[0]![0]!.id).toBe(57);
    expect(newGame(123).nextId).toBe(1);
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
    const full = Array<number>(ROWS)
      .fill(2)
      .map((_, i) => 2 ** (i + 1));
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

  it('nenhum bloco que se moveu na jogada fica encostado num igual', () => {
    // 2 na coluna 4: funde com o 2 da coluna 3 (vira 4); o 4 e o 8 de cima da coluna 3 caem.
    // O 4 que caiu funde com o 4 novo (vira 8, ×2) e o 8 que caiu funde com ele (vira 16, ×3).
    const board = boardFrom([[16, 2, 4], [8], [64, 2, 4, 8], [8], [4, 16, 2]]);
    const { state: after } = dropTile(stateWith({ board, next: 2 }), 3);
    expect(valuesOf(after.board)).toEqual([[16, 2, 4], [8], [64, 16], [8], [4, 16, 2]]);
    expect(after.score).toBe(4 + 8 * 2 + 16 * 3);
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
