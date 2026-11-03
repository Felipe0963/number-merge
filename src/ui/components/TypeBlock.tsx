import { motion } from 'motion/react';
import { ROWS, type Position, type Tile } from '../../game';
import { TypeFace } from './TypeFace';

export type ExitTargets = ReadonlyMap<number, Position>;

const place = (at: Position) => ({
  left: `${String(at.column * 20)}%`,
  bottom: `${String((at.row * 100) / ROWS)}%`,
});

interface TypeBlockProps {
  tile: Tile;
  at: Position;
}

/** Um bloco na gaveta. Entra caindo do topo da coluna; ao ser absorvido, desliza até o bloco resultante. */
export function TypeBlock({ tile, at }: TypeBlockProps) {
  return (
    <motion.div
      className="type-block"
      initial={{ ...place({ column: at.column, row: ROWS }), opacity: 0 }}
      animate={{ ...place(at), opacity: 1 }}
      exit="absorbed"
      variants={{
        absorbed: (targets: ExitTargets) => {
          const target = targets.get(tile.id);
          return target ? { ...place(target), opacity: 0 } : { opacity: 0 };
        },
      }}
      transition={{ duration: 0.2, ease: [0.55, 0, 1, 0.45] }}
    >
      <TypeFace value={tile.value} />
    </motion.div>
  );
}
