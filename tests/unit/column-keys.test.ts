import { describe, expect, it } from 'vitest';
import { columnForKey } from '../../src/ui/hooks/useColumnKeys';

describe('columnForKey', () => {
  it('as setas andam uma coluna e dão a volta nas pontas', () => {
    expect(columnForKey('ArrowRight', 1, 5)).toBe(2);
    expect(columnForKey('ArrowLeft', 1, 5)).toBe(0);
    expect(columnForKey('ArrowLeft', 0, 5)).toBe(4);
    expect(columnForKey('ArrowRight', 4, 5)).toBe(0);
  });

  it('Home e End vão para a primeira e a última coluna', () => {
    expect(columnForKey('Home', 3, 5)).toBe(0);
    expect(columnForKey('End', 1, 5)).toBe(4);
  });

  it('outras teclas não movem o foco', () => {
    for (const key of ['Enter', ' ', 'ArrowUp', 'Tab', 'a']) expect(columnForKey(key, 2, 5)).toBeNull();
  });
});
