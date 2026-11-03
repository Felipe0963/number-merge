import { copy } from '../content/copy';
import type { LogEntry } from '../hooks/useGame';

export function PressLog({ entries }: { entries: readonly LogEntry[] }) {
  return (
    <section className="press-log" aria-labelledby="press-log-title">
      <h2 id="press-log-title">{copy.pressLog}</h2>
      <ol>
        {entries.map((entry) => (
          <li key={entry.id}>{copy.logEntry(entry.chain, entry.points)}</li>
        ))}
      </ol>
    </section>
  );
}
