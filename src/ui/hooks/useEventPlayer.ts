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
  /** O evento em cena; `null` antes da primeira jogada e depois que a jogada terminou de passar. */
  readonly event: GameEvent | null;
  /** Identifica o passo mostrado (`jogada:evento`), para animações que reagem a cada passo. */
  readonly step: string;
  /** A jogada já foi toda mostrada. Com movimento reduzido, é verdadeiro desde o começo. */
  readonly done: boolean;
}

const IDLE: Omit<Frame, 'board'> = { event: null, step: 'idle', done: true };

/**
 * Mostra os tabuleiros dos eventos de uma jogada, um de cada vez, e depois o tabuleiro final. Uma
 * jogada nova cancela a anterior e começa do primeiro evento dela. Com movimento reduzido, mostra
 * direto o tabuleiro final.
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

  if (!move) return { board: finalBoard, ...IDLE };

  const index = !animated ? move.events.length : progress.moveId === move.id ? progress.index : 0;
  const event = move.events[index];
  if (!event) return { board: finalBoard, event: null, step: `${String(move.id)}:done`, done: true };
  return { board: event.board, event, step: `${String(move.id)}:${String(index)}`, done: false };
}
