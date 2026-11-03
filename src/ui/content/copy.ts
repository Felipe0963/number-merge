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
