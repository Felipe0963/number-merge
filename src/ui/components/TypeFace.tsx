import { motion } from 'motion/react';
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
      data-digits={String(value).length}
    >
      <motion.span
        key={value}
        initial={{ scale: 1.35 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.18 }}
      >
        {value}
      </motion.span>
    </span>
  );
}
