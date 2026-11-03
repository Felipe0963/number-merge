import { useEffect, useRef } from 'react';
import { copy } from '../content/copy';

interface GameOverProps {
  open: boolean;
  score: number;
  topBlock: number;
  best: number;
  isNewBest: boolean;
  onPlayAgain: () => void;
}

export function GameOver({ open, score, topBlock, best, isNewBest, onPlayAgain }: GameOverProps) {
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
      onCancel={(event) => {
        event.preventDefault();
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
