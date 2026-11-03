import { m } from 'motion/react';
import { useState } from 'react';
import type { MergeEvent } from '../../game';
import { inkFor } from '../ink';
import { place } from './TypeBlock';

/**
 * Gotas do respingo: direção (em graus) e distância (em % do tamanho da gota), fixas para o render ser
 * puro. As distâncias mantêm as gotas sobre a face clara do bloco, onde a tinta escura aparece.
 */
const DROPLETS = [
  { angle: 0, reach: 330 },
  { angle: 52, reach: 270 },
  { angle: 104, reach: 300 },
  { angle: 156, reach: 260 },
  { angle: 208, reach: 320 },
  { angle: 260, reach: 280 },
  { angle: 312, reach: 310 },
] as const;

/** Duração do respingo, em segundos. */
const SPLASH_S = 0.42;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

function Burst({ merge }: { merge: MergeEvent }) {
  return (
    <m.div className="ink-splash" data-ink={inkFor(merge.into.value)} style={place(merge.at)}>
      {DROPLETS.map(({ angle, reach }) => (
        <m.span
          key={angle}
          className="ink-splash__drop"
          initial={{ x: '-50%', y: '-50%', scale: 0.5, opacity: 1 }}
          animate={{
            x: `${String(-50 + Math.cos(toRadians(angle)) * reach)}%`,
            y: `${String(-50 + Math.sin(toRadians(angle)) * reach)}%`,
            scale: [0.5, 1.15, 0.8],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: SPLASH_S,
            ease: [0.2, 0.7, 0.4, 1],
            scale: { duration: SPLASH_S, times: [0, 0.55, 1] },
            opacity: { duration: SPLASH_S, times: [0, 0.55, 1] },
          }}
        />
      ))}
    </m.div>
  );
}

interface InkSplashProps {
  /** A fusão em cena, ou `null` entre fusões. */
  merge: MergeEvent | null;
  step: string;
}

/**
 * Respingo de tinta em volta do bloco que acabou de ser impresso, na cor da tinta dele. O último
 * respingo continua montado depois do passo da fusão, para que a animação termine mesmo que a queda
 * seguinte venha antes; cada fusão nova começa um respingo novo.
 */
export function InkSplash({ merge, step }: InkSplashProps) {
  const [last, setLast] = useState<{ merge: MergeEvent; step: string } | null>(null);
  if (merge && merge !== last?.merge) setLast({ merge, step });
  if (!last) return null;
  return <Burst key={last.step} merge={last.merge} />;
}
