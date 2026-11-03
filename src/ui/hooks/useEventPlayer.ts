import { useEffect, useState } from 'react';
import type { Board, GameEvent } from '../../game';
import type { Move } from './useGame';

/** Tempo que cada tipo de evento fica na tela antes do próximo, em milissegundos. */
const STEP_MS: Record<GameEvent['type'], number> = {
  drop: 220,
  merge: 200,
  fall: 160,
  rejected: 0,
  gameOver: 0,
};

export interface Frame {
  readonly board: Board;
  readonly event: GameEvent | null;
  /** Muda a cada evento mostrado, para animações que reagem a cada passo. */
  readonly step: number;
}

/** Folga para que o passo de jogadas diferentes nunca se repita (uma jogada tem bem menos eventos). */
const STEPS_PER_MOVE = 1000;

/**
 * Mostra os tabuleiros dos eventos de uma jogada, um de cada vez. Uma jogada nova cancela a anterior
 * e começa do primeiro evento dela. Com movimento reduzido, mostra direto o tabuleiro final.
 */
export function useEventPlayer(move: Move | null, finalBoard: Board, reducedMotion: boolean): Frame {
  // Quantos eventos da jogada `moveId` já passaram. Só os temporizadores mudam este estado;
  // o quadro em si é derivado durante o render.
  const [progress, setProgress] = useState({ moveId: -1, index: 0 });
  const animated = move !== null && !reducedMotion && move.events.length > 0;

  useEffect(() => {
    if (!move || !animated) return;
    const timers: number[] = [];
    let delay = 0;
    move.events.forEach((event, index) => {
      delay += STEP_MS[event.type];
      timers.push(
        window.setTimeout(() => {
          setProgress({ moveId: move.id, index: index + 1 });
        }, delay),
      );
    });
    return () => {
      timers.forEach((timer) => {
        window.clearTimeout(timer);
      });
    };
  }, [move, animated]);

  if (!move || move.events.length === 0) return { board: finalBoard, event: null, step: 0 };

  const last = move.events.length - 1;
  const index = !animated ? last + 1 : progress.moveId === move.id ? progress.index : 0;
  const shown = Math.min(index, last);
  const event = move.events[shown]!;
  return {
    // Depois do último evento, o tabuleiro final da jogada.
    board: index > last ? finalBoard : event.board,
    event,
    step: move.id * STEPS_PER_MOVE + shown,
  };
}
