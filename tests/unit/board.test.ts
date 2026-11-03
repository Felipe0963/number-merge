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
