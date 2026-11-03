import { copy } from '../content/copy';
import { TypeFace } from './TypeFace';

interface NextBlocksProps {
  next: number;
  then: number;
}

export function NextBlocks({ next, then }: NextBlocksProps) {
  return (
    <div className="next-blocks">
      <figure data-testid="next" data-value={next}>
        <TypeFace value={next} />
        <figcaption>{copy.next}</figcaption>
      </figure>
      <figure data-testid="then" data-value={then}>
        <TypeFace value={then} variant="then" />
        <figcaption>{copy.then}</figcaption>
      </figure>
    </div>
  );
}
