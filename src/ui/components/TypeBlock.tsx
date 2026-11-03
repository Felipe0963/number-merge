import { m } from 'motion/react';
import { ROWS, type Position, type Tile } from '../../game';
import { TypeFace } from './TypeFace';

export type ExitTargets = ReadonlyMap<number, Position>;

/**
 * Posição de uma casa como deslocamento a partir do canto de baixo à esquerda da gaveta. As
 * porcentagens de `translate` são do próprio bloco, que mede uma casa: cada casa vale 100%.
 */
export const place = (at: Position) => ({
  x: `${String(at.column * 100)}%`,
  y: `${String(-at.row * 100)}%`,
});

interface TypeBlockProps {
  tile: Tile;
  at: Position;
}

/** Um bloco na gaveta. Entra caindo do topo da coluna; ao ser absorvido, desliza até o bloco resultante. */
export function TypeBlock({ tile, at }: TypeBlockProps) {
  return (
    <m.div
      className="type-block"
      initial={{ ...place({ column: at.column, row: ROWS }), opacity: 0, scaleY: 1 }}
      // Ao pousar, o bloco achata de leve e volta (só na entrada; o movimento reduzido tira a escala).
      animate={{ ...place(at), opacity: 1, scaleY: [1, 1, 0.88, 1] }}
      style={{ transformOrigin: '50% 100%' }}
      exit="absorbed"
      variants={{
        absorbed: (targets: ExitTargets) => {
          const target = targets.get(tile.id);
          return target ? { ...place(target), opacity: 0 } : { opacity: 0 };
        },
      }}
      transition={{
        duration: 0.2,
        ease: [0.55, 0, 1, 0.45],
        scaleY: { duration: 0.32, times: [0, 0.6, 0.78, 1], ease: 'easeOut' },
      }}
    >
      <TypeFace value={tile.value} />
    </m.div>
  );
}
