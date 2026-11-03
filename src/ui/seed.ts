/** Semente da URL (`?seed=123`) ou, sem ela, uma semente aleatória. */
export function readSeed(search: string): number {
  const value = Number(new URLSearchParams(search).get('seed'));
  if (Number.isInteger(value) && value > 0) return value;
  return randomSeed();
}

export function randomSeed(): number {
  const [value = 1] = crypto.getRandomValues(new Uint32Array(1));
  return (value % 2147483646) + 1;
}
