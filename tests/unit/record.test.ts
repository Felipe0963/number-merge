import { describe, expect, it } from 'vitest';
import { bestAfterGame, isNewBest } from '../../src/ui/record';

describe('bestAfterGame', () => {
  it('é o maior entre o recorde da sessão, o score da partida e o guardado', () => {
    expect(bestAfterGame(100, 40, 100)).toBe(100);
    expect(bestAfterGame(100, 250, 100)).toBe(250);
    expect(bestAfterGame(100, 40, 300)).toBe(300);
  });

  it('sem armazenamento (guardado = 0), não perde o recorde da sessão', () => {
    expect(bestAfterGame(180, 90, 0)).toBe(180);
    expect(bestAfterGame(0, 90, 0)).toBe(90);
  });
});

describe('isNewBest', () => {
  it('só quando havia um recorde e ele foi superado', () => {
    expect(isNewBest(100, 101)).toBe(true);
    expect(isNewBest(100, 100)).toBe(false);
    expect(isNewBest(100, 40)).toBe(false);
  });

  it('não na primeira partida, sem recorde anterior', () => {
    expect(isNewBest(0, 500)).toBe(false);
  });
});
