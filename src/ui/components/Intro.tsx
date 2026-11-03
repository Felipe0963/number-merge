import { copy } from '../content/copy';

export function Intro() {
  return (
    <div className="intro">
      <p>{copy.howTo}</p>
      <p>{copy.begin}</p>
    </div>
  );
}
