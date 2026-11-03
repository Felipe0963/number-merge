import { COLUMNS, ROWS, type Board } from './types';

export const emptyBoard = (): Board => Array.from({ length: COLUMNS }, () => []);

export const isColumnFull = (board: Board, column: number): boolean =>
  (board[column]?.length ?? ROWS) >= ROWS;

export const isBoardFull = (board: Board): boolean => board.every((column) => column.length >= ROWS);

export const topValue = (board: Board): number =>
  board.reduce((max, column) => column.reduce((m, tile) => Math.max(m, tile.value), max), 0);
