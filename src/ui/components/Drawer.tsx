import { AnimatePresence } from 'motion/react';
import { useAnimate } from 'motion/react-mini';
import { useEffect, useMemo } from 'react';
import { COLUMNS, type Board, type MergeEvent, type Position } from '../../game';
import { copy } from '../content/copy';
import { useColumnKeys } from '../hooks/useColumnKeys';
import { InkSplash } from './InkSplash';
import { TypeBlock, type ExitTargets } from './TypeBlock';

interface DrawerProps {
  board: Board;
  /** A fusão em cena (para a saída dos absorvidos, o tremor e o respingo), ou `null`. */
  merge: MergeEvent | null;
  step: string;
  /** Blocos que trouxeram uma tinta nova na partida e ganham o brilho de destaque. */
  newInkIds: ReadonlySet<number>;
  reducedMotion: boolean;
  /** Coluna escolhida. O App decide o que ela faz (soltar o bloco ou, com a gaveta cheia, mostrar o resultado). */
  onChoose: (column: number) => void;
}

/** Tremor da gaveta, em pixels, para a fusão na posição `chain` da cadeia. */
const shakeFor = (chain: number) => Math.min(2 + chain * 1.5, 9);

export function Drawer({ board, merge, step, newInkIds, reducedMotion, onChoose }: DrawerProps) {
  const columnProps = useColumnKeys(COLUMNS);
  const exitTargets: ExitTargets = useMemo(
    () => new Map<number, Position>(merge ? merge.absorbed.map((tile) => [tile.id, merge.at]) : []),
    [merge],
  );
  // No passo de uma fusão, o tabuleiro ainda tem os blocos absorvidos (eles saem no passo seguinte).
  // Tirá-los já aqui faz com que deslizem para o bloco novo enquanto o valor dele é impresso.
  const tiles = board
    .flatMap((column, columnIndex) => column.map((tile, row) => ({ tile, at: { column: columnIndex, row } })))
    .filter(({ tile }) => !exitTargets.has(tile.id));
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const chain = merge?.chain ?? 0;

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
            {...columnProps(index)}
            type="button"
            className="drawer__column"
            aria-label={copy.columnLabel(index, column)}
            onClick={() => {
              onChoose(index);
            }}
          />
        ))}
      </div>
      <div className="drawer__blocks" aria-hidden="true">
        <AnimatePresence custom={exitTargets}>
          {tiles.map(({ tile, at }) => (
            <TypeBlock key={tile.id} tile={tile} at={at} newInk={newInkIds.has(tile.id)} />
          ))}
        </AnimatePresence>
        {/* Com movimento reduzido, sem respingo (design, §3). */}
        {!reducedMotion && <InkSplash merge={merge} step={step} />}
      </div>
    </div>
  );
}
