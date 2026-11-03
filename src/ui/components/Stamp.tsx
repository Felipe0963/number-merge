import { AnimatePresence, m } from 'motion/react';

interface StampProps {
  chain: number;
  step: string;
}

/** Carimbo de borracha "×2", "×3"… a cada fusão de uma cadeia. */
export function Stamp({ chain, step }: StampProps) {
  return (
    <AnimatePresence>
      {chain >= 2 && (
        <m.span
          key={step}
          className="stamp"
          aria-hidden="true"
          initial={{ scale: 1.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
        >
          ×{chain}
        </m.span>
      )}
    </AnimatePresence>
  );
}
