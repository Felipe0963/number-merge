import type { Board } from '../game';

export type Ink = 'black' | 'navy' | 'green' | 'ochre' | 'carmine';

/** Tinta do número impresso no bloco, por faixa de valor. Quanto maior o valor, mais rara a tinta. */
export function inkFor(value: number): Ink {
  if (value <= 8) return 'black';
  if (value <= 64) return 'navy';
  if (value <= 512) return 'green';
  if (value <= 4096) return 'ochre';
  return 'carmine';
}

/**
 * Tintas que a partida já começa conhecendo: os blocos sorteados no início (2, 4 e 8) são todos
 * pretos, então o brilho de "nova tinta" fica para as faixas que o jogador conquista.
 */
export const STARTING_INKS: ReadonlySet<Ink> = new Set<Ink>(['black']);

/** Para cada tinta do tabuleiro que não está em `seen`, o id de um bloco que a mostra (o primeiro achado). */
export function newInkTiles(board: Board, seen: ReadonlySet<Ink>): Map<Ink, number> {
  const found = new Map<Ink, number>();
  for (const tile of board.flat()) {
    const ink = inkFor(tile.value);
    if (!seen.has(ink) && !found.has(ink)) found.set(ink, tile.id);
  }
  return found;
}
