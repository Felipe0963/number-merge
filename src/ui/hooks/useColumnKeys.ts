import { useCallback, useRef, useState, type KeyboardEvent } from 'react';

/**
 * Coluna que recebe o foco quando `key` é pressionada na coluna `index`: as setas andam uma coluna e
 * dão a volta nas pontas; Home e End vão para a primeira e a última. Outras teclas: `null`.
 */
export function columnForKey(key: string, index: number, count: number): number | null {
  switch (key) {
    case 'ArrowLeft':
      return (index - 1 + count) % count;
    case 'ArrowRight':
      return (index + 1) % count;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return null;
  }
}

/**
 * Teclado das colunas com tabindex itinerante: a gaveta é uma só parada do Tab (a última coluna
 * focada), e as setas, Home e End movem o foco entre as colunas.
 */
export function useColumnKeys(count: number) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);

  const columnProps = useCallback(
    (index: number) => ({
      ref: (element: HTMLButtonElement | null) => {
        refs.current[index] = element;
      },
      tabIndex: index === active ? 0 : -1,
      onFocus: () => {
        setActive(index);
      },
      onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
        const target = columnForKey(event.key, index, count);
        if (target === null) return;
        event.preventDefault();
        refs.current[target]?.focus();
      },
    }),
    [active, count],
  );

  return columnProps;
}
