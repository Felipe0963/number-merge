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
  return NEIGHBOR_OFFSETS.map((offset) => ({
    column: at.column + offset.column,
    row: at.row + offset.row,
  })).filter((position) => board[position.column]?.[position.row]?.value === value);
}

/** Tira os blocos absorvidos; os de cima descem. Devolve o novo tabuleiro e quem caiu. */
function collapse(
  board: MutableBoard,
  absorbedIds: ReadonlySet<number>,
): { board: MutableBoard; falls: Fall[] } {
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
