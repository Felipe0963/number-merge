import { useCallback, useRef, type KeyboardEvent } from 'react';

/** Setas para a esquerda e a direita movem o foco entre as colunas, dando a volta nas pontas. */
export function useColumnKeys(count: number) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const setRef = useCallback(
    (index: number) => (element: HTMLButtonElement | null) => {
      refs.current[index] = element;
    },
    [],
  );

  const onKeyDown = useCallback(
    (index: number) => (event: KeyboardEvent<HTMLButtonElement>) => {
      const direction = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
      if (direction === 0) return;
      event.preventDefault();
      refs.current[(index + direction + count) % count]?.focus();
    },
    [count],
  );

  return { setRef, onKeyDown };
}
