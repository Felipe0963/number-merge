export type Ink = 'black' | 'navy' | 'green' | 'ochre' | 'carmine';

/** Tinta do número impresso no bloco, por faixa de valor. Quanto maior o valor, mais rara a tinta. */
export function inkFor(value: number): Ink {
  if (value <= 8) return 'black';
  if (value <= 64) return 'navy';
  if (value <= 512) return 'green';
  if (value <= 4096) return 'ochre';
  return 'carmine';
}
