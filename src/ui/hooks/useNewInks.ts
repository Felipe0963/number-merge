import { useState } from 'react';
import type { Board } from '../../game';
import { STARTING_INKS, newInkTiles, type Ink } from '../ink';

interface Tracked {
  readonly board: Board;
  readonly gameId: number;
  readonly seen: ReadonlySet<Ink>;
  readonly glowing: ReadonlySet<number>;
}

const NONE: ReadonlySet<number> = new Set();

/**
 * Ids dos blocos que trouxeram uma tinta pela primeira vez na partida, para o brilho de "nova tinta".
 * Acompanha o tabuleiro mostrado (o brilho aparece junto com o bloco) e recomeça a cada partida.
 */
export function useNewInks(board: Board, gameId: number): ReadonlySet<number> {
  const [tracked, setTracked] = useState<Tracked>({ board, gameId, seen: STARTING_INKS, glowing: NONE });

  // Ajusta o estado quando o tabuleiro muda, durante o render (sem efeito e sem quadro intermediário).
  if (tracked.board !== board || tracked.gameId !== gameId) {
    const sameGame = tracked.gameId === gameId;
    const seen = sameGame ? tracked.seen : STARTING_INKS;
    const fresh = newInkTiles(board, seen);
    setTracked({
      board,
      gameId,
      seen: fresh.size > 0 ? new Set([...seen, ...fresh.keys()]) : seen,
      glowing: fresh.size > 0 ? new Set(fresh.values()) : sameGame ? tracked.glowing : NONE,
    });
  }

  return tracked.glowing;
}
