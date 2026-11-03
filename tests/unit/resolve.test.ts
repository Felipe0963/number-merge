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

  it('um bloco que caiu num passo anterior ainda verifica os vizinhos', () => {
    // O 2 pousa entre dois 2: vira 8 e os dois 16/32 de cima caem. O 16 da esquerda funde primeiro
    // (mais à esquerda); o 32 da direita também caiu e precisa fundir no passo seguinte.
    const board = boardFrom([[16, 2, 16], [4], [32, 2, 32], [], []]);
    const result = landAndResolve(board, 1, 2);
    expect(valuesOf(result.board)).toEqual([[32], [4, 8], [64], [], []]);
    const merges = result.events.filter((event) => event.type === 'merge');
    expect(merges.map((event) => [event.into.value, event.chain])).toEqual([
      [8, 1],
      [32, 2],
      [64, 3],
    ]);
    expect(result.points).toBe(8 + 32 * 2 + 64 * 3);
  });

  it('não altera o tabuleiro recebido', () => {
    const board = boardFrom([[8], [], [], [], []]);
    const landed = board.map((c, i) => (i === 0 ? [...c, { id: 1, value: 8 }] : [...c]));
    const snapshot = JSON.stringify(landed);
    resolve(landed, { column: 0, row: 1 });
    expect(JSON.stringify(landed)).toBe(snapshot);
  });
});
