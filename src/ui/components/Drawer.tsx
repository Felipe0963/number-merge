import { AnimatePresence, useAnimate, useReducedMotion } from 'motion/react';
import { useEffect } from 'react';
import { COLUMNS, type Board } from '../../game';
import { copy } from '../content/copy';
import { useColumnKeys } from '../hooks/useColumnKeys';
import { TypeBlock, type ExitTargets } from './TypeBlock';

interface DrawerProps {
  board: Board;
  exitTargets: ExitTargets;
  /** Tamanho da cadeia do passo atual (0 sem fusão), para o tremor. */
  chain: number;
  step: number;
  over: boolean;
  onDrop: (column: number) => void;
}

export function Drawer({ board, exitTargets, chain, step, over, onDrop }: DrawerProps) {
  const { setRef, onKeyDown } = useColumnKeys(COLUMNS);
  const tiles = board.flatMap((column, columnIndex) =>
    column.map((tile, row) => ({ tile, at: { column: columnIndex, row } })),
  );
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reducedMotion = useReducedMotion() ?? false;

  // Tremor proporcional à cadeia, a cada fusão de ×2 ou mais.
  useEffect(() => {
    if (reducedMotion || chain < 2) return;
    const shake = Math.min(2 + chain * 1.5, 9);
    void animate(scope.current, { x: [0, -shake, shake, -shake / 2, 0] }, { duration: 0.28 });
  }, [step, chain, reducedMotion, animate, scope]);

  return (
    <div ref={scope} className="drawer" role="group" aria-label={copy.drawerLabel}>
      <div className="drawer__columns">
        {board.map((column, index) => (
          <button
            key={index}
            ref={setRef(index)}
            type="button"
            className="drawer__column"
            aria-label={copy.columnLabel(index, column)}
            aria-disabled={over}
            onClick={() => {
              if (!over) onDrop(index);
            }}
            onKeyDown={onKeyDown(index)}
          />
        ))}
      </div>
      <div className="drawer__blocks" aria-hidden="true">
        <AnimatePresence custom={exitTargets}>
          {tiles.map(({ tile, at }) => (
            <TypeBlock key={tile.id} tile={tile} at={at} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
