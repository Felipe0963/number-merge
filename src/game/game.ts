import { emptyBoard, isBoardFull, isColumnFull, topValue } from './board';
import { drawValue } from './random';
import { resolve } from './resolve';
import { COLUMNS, type GameEvent, type GameState, type MoveResult } from './types';

/**
 * Partida nova. `firstId` é o id do primeiro bloco: quem começa várias partidas seguidas pode continuar
 * a contagem, para que blocos de partidas diferentes nunca tenham o mesmo id.
 */
export function newGame(seed: number, firstId = 1): GameState {
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
    nextId: firstId,
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
