import { useEffect, useRef } from 'react';
import { copy } from '../content/copy';

interface GameOverProps {
  open: boolean;
  score: number;
  topBlock: number;
  best: number;
  isNewBest: boolean;
  onPlayAgain: () => void;
  /** O jogador fechou a folha (Escape). O App decide como ela volta. */
  onDismiss: () => void;
}

/**
 * A folha impressa do fim de jogo, num `<dialog>` modal. Escape fecha a folha, como em qualquer modal
 * (o navegador nem sempre deixa impedir isso); o evento `close` avisa o App, que mantém o estado em dia.
 */
export function GameOver({ open, score, topBlock, best, isNewBest, onPlayAgain, onDismiss }: GameOverProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className="game-over"
      aria-labelledby="game-over-title"
      onClose={() => {
        // Fechada por fora enquanto devia estar aberta: foi o jogador. Quando o App fecha, `open` já é falso.
        if (open) onDismiss();
      }}
    >
      <h2 id="game-over-title">{copy.drawerFull}</h2>
      {isNewBest && <p className="new-best">{copy.newBest}</p>}
      <dl>
        <dt>{copy.score}</dt>
        <dd>{score}</dd>
        <dt>{copy.topBlock}</dt>
        <dd>{topBlock}</dd>
        <dt>{copy.best}</dt>
        <dd>{best}</dd>
      </dl>
      <button type="button" onClick={onPlayAgain}>
        {copy.playAgain}
      </button>
    </dialog>
  );
}
