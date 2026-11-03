import type { GameEvent } from './types';

export interface MoveSummary {
  readonly points: number;
  /** Maior posição de cadeia na jogada; 0 sem fusão. */
  readonly maxChain: number;
  readonly lastMerge: { readonly value: number; readonly chain: number } | null;
  readonly rejected: boolean;
  readonly gameOver: boolean;
}

export function summarize(events: readonly GameEvent[]): MoveSummary {
  let points = 0;
  let maxChain = 0;
  let lastMerge: MoveSummary['lastMerge'] = null;
  for (const event of events) {
    if (event.type !== 'merge') continue;
    points += event.points;
    maxChain = Math.max(maxChain, event.chain);
    lastMerge = { value: event.into.value, chain: event.chain };
  }
  return {
    points,
    maxChain,
    lastMerge,
    rejected: events.some((event) => event.type === 'rejected'),
    gameOver: events.some((event) => event.type === 'gameOver'),
  };
}
