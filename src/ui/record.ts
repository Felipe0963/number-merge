/** Recorde ao fim de uma partida: nunca menor que o da sessão, o score da partida ou o guardado. */
export const bestAfterGame = (sessionBest: number, score: number, stored: number): number =>
  Math.max(sessionBest, score, stored);

/** "New best" só quando havia um recorde anterior e a partida o superou (nunca na primeira partida). */
export const isNewBest = (previousBest: number, score: number): boolean =>
  previousBest > 0 && score > previousBest;
