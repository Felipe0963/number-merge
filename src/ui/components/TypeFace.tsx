import { m } from 'motion/react';
import { inkFor } from '../ink';

interface TypeFaceProps {
  value: number;
  variant?: 'then';
}

/** A face de madeira com o número impresso. Ao mudar de valor, o número entra com uma "batida". */
export function TypeFace({ value, variant }: TypeFaceProps) {
  return (
    <span
      className={variant ? `type-face type-face--${variant}` : 'type-face'}
      data-ink={inkFor(value)}
      // O CSS encolhe o número conforme a quantidade de algarismos, para que nunca passe da face.
      style={{ '--digits': String(value).length }}
    >
      <m.span key={value} initial={{ scale: 1.35 }} animate={{ scale: 1 }} transition={{ duration: 0.18 }}>
        {value}
      </m.span>
    </span>
  );
}
