import { copy } from '../content/copy';
import { useCountUp } from '../hooks/useCountUp';

interface LedgerProps {
  score: number;
  best: number;
  topBlock: number;
  reducedMotion: boolean;
}

export function Ledger({ score, best, topBlock, reducedMotion }: LedgerProps) {
  const shownScore = useCountUp(score, reducedMotion);
  return (
    <dl className="ledger">
      <div>
        <dt>{copy.score}</dt>
        <dd data-testid="score" data-value={score}>
          {shownScore}
        </dd>
      </div>
      <div>
        <dt>{copy.best}</dt>
        <dd data-testid="best">{best}</dd>
      </div>
      <div>
        <dt>{copy.topBlock}</dt>
        <dd data-testid="top-block">{topBlock}</dd>
      </div>
    </dl>
  );
}
