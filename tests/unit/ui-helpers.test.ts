import { describe, expect, it } from 'vitest';
import { copy } from '../../src/ui/content/copy';
import { inkFor } from '../../src/ui/ink';
import { readSeed } from '../../src/ui/seed';

describe('inkFor', () => {
  it('cada faixa de valor tem a sua tinta', () => {
    expect([2, 8].map(inkFor)).toEqual(['black', 'black']);
    expect([16, 64].map(inkFor)).toEqual(['navy', 'navy']);
    expect([128, 512].map(inkFor)).toEqual(['green', 'green']);
    expect([1024, 4096].map(inkFor)).toEqual(['ochre', 'ochre']);
    expect([8192, 65536].map(inkFor)).toEqual(['carmine', 'carmine']);
  });
});

describe('readSeed', () => {
  it('lê a semente da URL', () => {
    expect(readSeed('?seed=123')).toBe(123);
  });

  it('sem semente válida, gera uma aleatória positiva', () => {
    for (const search of ['', '?seed=abc', '?seed=0', '?seed=-4']) {
      const seed = readSeed(search);
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThan(0);
    }
  });
});

describe('copy', () => {
  it('descreve as colunas para leitores de tela', () => {
    expect(copy.columnLabel(0, [])).toBe('Column 1, empty');
    expect(
      copy.columnLabel(2, [
        { id: 1, value: 2 },
        { id: 2, value: 16 },
      ]),
    ).toBe('Column 3, 2 blocks, top 16');
    expect(copy.columnLabel(1, [{ id: 1, value: 4 }])).toBe('Column 2, 1 block, top 4');
  });

  it('anuncia fusões e cadeias', () => {
    expect(copy.merged(32, 1)).toBe('Merged into 32.');
    expect(copy.merged(64, 2)).toBe('Merged into 64. Chain ×2.');
  });

  it('linha do registro', () => {
    expect(copy.logEntry(3, 384)).toBe('Chain ×3 · +384');
  });
});
