import { useCallback, useRef, useState } from 'react';
import { dropTile, newGame, summarize, type GameEvent, type GameState } from '../../game';

export interface Move {
  /** Aumenta a cada jogada, para os efeitos saberem que é uma jogada nova. */
  readonly id: number;
  readonly events: readonly GameEvent[];
}

export interface LogEntry {
  readonly id: number;
  readonly chain: number;
  readonly points: number;
}

const LOG_SIZE = 5;

export function useGame(initialSeed: number) {
  const [state, setState] = useState<GameState>(() => newGame(initialSeed));
  const [move, setMove] = useState<Move | null>(null);
  const [log, setLog] = useState<readonly LogEntry[]>([]);
  const stateRef = useRef(state);
  const moveId = useRef(0);

  const drop = useCallback((column: number) => {
    const result = dropTile(stateRef.current, column);
    stateRef.current = result.state;
    moveId.current += 1;
    const id = moveId.current;
    setState(result.state);
    setMove({ id, events: result.events });
    const summary = summarize(result.events);
    if (summary.maxChain >= 2) {
      setLog((entries) =>
        [{ id, chain: summary.maxChain, points: summary.points }, ...entries].slice(0, LOG_SIZE),
      );
    }
  }, []);

  const restart = useCallback((seed: number) => {
    const fresh = newGame(seed);
    stateRef.current = fresh;
    setState(fresh);
    setMove(null);
    setLog([]);
  }, []);

  return { state, move, log, drop, restart };
}
