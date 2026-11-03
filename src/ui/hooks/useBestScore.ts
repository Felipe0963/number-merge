import { useCallback, useEffect, useState } from 'react';
import { bestAfterGame, isNewBest } from '../record';

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

/**
 * Recorde guardado no navegador. `previousBest` é o recorde de antes da partida atual; `score`, o da
 * partida, é guardado assim que supera o recorde. `isNewBest` só vale se havia um recorde e ele caiu.
 */
export function useBestScore(score: number) {
  const [previousBest, setPreviousBest] = useState(readBest);

  useEffect(() => {
    if (score > previousBest) writeBest(score);
  }, [score, previousBest]);

  /** Chamado ao começar uma partida nova: o recorde atual vira a referência, mesmo sem armazenamento. */
  const commit = useCallback(() => {
    setPreviousBest(bestAfterGame(previousBest, score, readBest()));
  }, [previousBest, score]);

  return { previousBest, isNewBest: isNewBest(previousBest, score), commit };
}
