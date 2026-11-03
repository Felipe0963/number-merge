/** Menor teto de sorteio: no começo saem 2, 4 e 8. */
const MIN_CEILING = 8;
/** O teto acompanha o maior bloco do tabuleiro, dividido por este fator. */
const CEILING_RATIO = 32;

/** Gerador mulberry32: devolve um número em [0, 1) e o próximo estado. */
export function nextRandom(state: number): [number, number] {
  const next = (state + 0x6d2b79f5) >>> 0;
  let r = Math.imul(next ^ (next >>> 15), next | 1);
  r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
  return [((r ^ (r >>> 14)) >>> 0) / 4294967296, next];
}

/** Valores que podem ser sorteados quando o maior bloco do tabuleiro é `top`. */
export function spawnValues(top: number): number[] {
  const ceiling = Math.max(MIN_CEILING, top / CEILING_RATIO);
  const values: number[] = [];
  for (let value = 2; value <= ceiling; value *= 2) values.push(value);
  return values;
}

/** Escolhe um valor a partir de uma rolagem em [0, 1). Valores menores têm peso maior. */
export function pickValue(roll: number, top: number): number {
  const values = spawnValues(top);
  const weights = values.map((_, index) => values.length - index);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let remaining = roll * total;
  for (let i = 0; i < values.length; i++) {
    remaining -= weights[i]!;
    if (remaining < 0) return values[i]!;
  }
  return values[values.length - 1]!;
}

export function drawValue(rng: number, top: number): { value: number; rng: number } {
  const [roll, next] = nextRandom(rng);
  return { value: pickValue(roll, top), rng: next };
}
