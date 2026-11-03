import { useEffect, useState } from 'react';

const KEY = 'number-merge:best';

function readBest(): number {
  try {
    const value = Number(window.localStorage.getItem(KEY));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function writeBest(value: number): void {
  try {
    window.localStorage.setItem(KEY, String(value));
  } catch {
    // Sem armazenamento (modo privado, bloqueado): o jogo segue sem guardar o recorde.
  }
}

/** Recorde guardado no navegador. `isNewBest` indica que a partida atual superou o recorde anterior. */
export function useBestScore(score: number) {
  const [previousBest, setPreviousBest] = useState(readBest);
  const best = Math.max(previousBest, score);

  useEffect(() => {
    if (score > previousBest) writeBest(score);
  }, [score, previousBest]);

  /** Chamado ao começar uma partida nova: o recorde atual vira a referência. */
  const commit = () => {
    setPreviousBest(readBest());
  };

  return { best, isNewBest: score > 0 && score > previousBest, commit };
}
