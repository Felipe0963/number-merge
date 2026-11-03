import { AnimatePresence } from 'motion/react';
import { useAnimate } from 'motion/react-mini';
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
  step: string;
  over: boolean;
  reducedMotion: boolean;
  onDrop: (column: number) => void;
}

/** Tremor da gaveta, em pixels, para a fusão na posição `chain` da cadeia. */
const shakeFor = (chain: number) => Math.min(2 + chain * 1.5, 9);

export function Drawer({ board, exitTargets, chain, step, over, reducedMotion, onDrop }: DrawerProps) {
  const { setRef, onKeyDown } = useColumnKeys(COLUMNS);
  // No passo de uma fusão, o tabuleiro ainda tem os blocos absorvidos (eles saem no passo seguinte).
  // Tirá-los já aqui faz com que deslizem para o bloco novo enquanto o valor dele é impresso.
  const tiles = board
    .flatMap((column, columnIndex) => column.map((tile, row) => ({ tile, at: { column: columnIndex, row } })))
    .filter(({ tile }) => !exitTargets.has(tile.id));
  const [scope, animate] = useAnimate<HTMLDivElement>();

  // Tremor proporcional à cadeia, a cada fusão de ×2 ou mais.
  useEffect(() => {
    if (reducedMotion || chain < 2) return;
    const shake = shakeFor(chain);
    const offsets = [0, -shake, shake, -shake / 2, 0].map((x) => `translateX(${String(x)}px)`);
    void animate(scope.current, { transform: offsets }, { duration: 0.28 });
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
