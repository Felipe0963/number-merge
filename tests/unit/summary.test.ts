import { describe, expect, it } from 'vitest';
import { summarize } from '../../src/game/summary';
import { dropTile } from '../../src/game/game';
import { boardFrom, stateWith } from './helpers';

describe('summarize', () => {
  it('jogada sem fusão', () => {
    const { events } = dropTile(stateWith({ board: boardFrom([[4], [], [], [], []]), next: 2 }), 0);
    expect(summarize(events)).toEqual({
      points: 0,
      maxChain: 0,
      lastMerge: null,
      rejected: false,
      gameOver: false,
    });
  });

  it('jogada com cadeia', () => {
    const { events } = dropTile(stateWith({ board: boardFrom([[8, 4], [], [], [], []]), next: 4 }), 0);
    expect(summarize(events)).toMatchObject({ points: 40, maxChain: 2, lastMerge: { value: 16, chain: 2 } });
  });

  it('coluna cheia', () => {
    const full = [2, 4, 8, 16, 32, 64, 128];
    const { events } = dropTile(stateWith({ board: boardFrom([full, [], [], [], []]) }), 0);
    expect(summarize(events).rejected).toBe(true);
  });
});
