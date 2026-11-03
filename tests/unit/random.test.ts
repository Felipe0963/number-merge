import { describe, expect, it } from 'vitest';
import { drawValue, nextRandom, pickValue, spawnValues } from '../../src/game/random';

describe('nextRandom', () => {
  it('é determinístico e fica entre 0 e 1', () => {
    const [a, stateA] = nextRandom(42);
    const [b, stateB] = nextRandom(42);
    expect(a).toBe(b);
    expect(stateA).toBe(stateB);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(1);
  });

  it('muda de valor a cada chamada', () => {
    const [first, state] = nextRandom(42);
    const [second] = nextRandom(state);
    expect(second).not.toBe(first);
  });
});

describe('spawnValues', () => {
  it('começa com 2, 4 e 8', () => {
    expect(spawnValues(0)).toEqual([2, 4, 8]);
    expect(spawnValues(256)).toEqual([2, 4, 8]);
  });

  it('acompanha o maior bloco até 1/32 dele', () => {
    expect(spawnValues(512)).toEqual([2, 4, 8, 16]);
    expect(spawnValues(1024)).toEqual([2, 4, 8, 16, 32]);
  });
});

describe('pickValue', () => {
  it('rolagem baixa dá o menor valor e alta dá o maior', () => {
    expect(pickValue(0, 0)).toBe(2);
    expect(pickValue(0.9999, 0)).toBe(8);
  });

  it('valores menores são mais prováveis', () => {
    const counts = new Map<number, number>();
    for (let i = 0; i < 600; i++) {
      const value = pickValue(i / 600, 0);
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    expect(counts.get(2)!).toBeGreaterThan(counts.get(4)!);
    expect(counts.get(4)!).toBeGreaterThan(counts.get(8)!);
  });
});

describe('drawValue', () => {
  it('a mesma semente sorteia a mesma sequência', () => {
    const sequence = (seed: number) => {
      let rng = seed;
      return Array.from({ length: 10 }, () => {
        const draw = drawValue(rng, 0);
        rng = draw.rng;
        return draw.value;
      });
    };
    expect(sequence(7)).toEqual(sequence(7));
    expect(sequence(7)).not.toEqual(sequence(8));
  });
});
