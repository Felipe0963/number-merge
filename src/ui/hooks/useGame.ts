import { useCallback, useRef, useState } from 'react';
import { dropTile, newGame, summarize, type GameEvent, type GameState, type MoveSummary } from '../../game';

export interface Move {
  /** Aumenta a cada jogada (sem voltar a zero entre partidas), para os efeitos saberem que é nova. */
  readonly id: number;
  readonly events: readonly GameEvent[];
  readonly summary: MoveSummary;
  /** Estado de antes da jogada: o placar mostra este até a animação da jogada terminar. */
  readonly before: GameState;
}

export interface LogEntry {
  readonly id: number;
  readonly chain: number;
  readonly points: number;
}

const LOG_SIZE = 5;

export function useGame(initialSeed: number) {
  const [state, setState] = useState<GameState>(() => newGame(initialSeed));
  const [gameId, setGameId] = useState(1);
  const [move, setMove] = useState<Move | null>(null);
  const [log, setLog] = useState<readonly LogEntry[]>([]);
  const stateRef = useRef(state);
  const moveId = useRef(0);

  const drop = useCallback((column: number) => {
    const before = stateRef.current;
    const result = dropTile(before, column);
    stateRef.current = result.state;
    moveId.current += 1;
    const id = moveId.current;
    const summary = summarize(result.events);
    setState(result.state);
    setMove({ id, events: result.events, summary, before });
    if (summary.maxChain >= 2) {
      setLog((entries) =>
        [{ id, chain: summary.maxChain, points: summary.points }, ...entries].slice(0, LOG_SIZE),
      );
    }
  }, []);

  const restart = useCallback((seed: number) => {
    // Os ids continuam a contagem: blocos da partida anterior que ainda estejam saindo não colidem.
    const fresh = newGame(seed, stateRef.current.nextId);
    stateRef.current = fresh;
    setState(fresh);
    setGameId((id) => id + 1);
    setMove(null);
    setLog([]);
  }, []);

  return { gameId, state, move, log, drop, restart };
}
