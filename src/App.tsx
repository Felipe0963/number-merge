import { MotionConfig, useReducedMotion } from 'motion/react';
import { useMemo, useState } from 'react';
import { summarize, type Position } from './game';
import { Drawer } from './ui/components/Drawer';
import { GameOver } from './ui/components/GameOver';
import { Intro } from './ui/components/Intro';
import { Ledger } from './ui/components/Ledger';
import { NextBlocks } from './ui/components/NextBlocks';
import { PressLog } from './ui/components/PressLog';
import { Stamp } from './ui/components/Stamp';
import { copy } from './ui/content/copy';
import { useAnnouncer } from './ui/hooks/useAnnouncer';
import { useBestScore } from './ui/hooks/useBestScore';
import { useEventPlayer } from './ui/hooks/useEventPlayer';
import { useGame } from './ui/hooks/useGame';
import { randomSeed, readSeed } from './ui/seed';

export function App() {
  const [seed] = useState(() => readSeed(window.location.search));
  const reducedMotion = useReducedMotion() ?? false;
  const { state, move, log, drop, restart } = useGame(seed);
  const frame = useEventPlayer(move, state.board, reducedMotion);
  const { best, isNewBest, commit } = useBestScore(state.score);

  const event = frame.event;
  const chain = event?.type === 'merge' ? event.chain : 0;
  const exitTargets = useMemo(() => {
    const targets = new Map<number, Position>();
    if (event?.type === 'merge') for (const tile of event.absorbed) targets.set(tile.id, event.at);
    return targets;
  }, [event]);

  const message = useMemo(() => {
    if (!move) return '';
    const summary = summarize(move.events);
    if (summary.rejected) return copy.columnFull;
    const merged = summary.lastMerge ? copy.merged(summary.lastMerge.value, summary.lastMerge.chain) : '';
    return summary.gameOver ? `${merged} ${copy.drawerFull}`.trim() : merged;
  }, [move]);
  const announcement = useAnnouncer(message, move?.id ?? 0);

  const playAgain = () => {
    commit();
    restart(randomSeed());
  };

  return (
    <MotionConfig reducedMotion="user">
      <main className="app">
        <header className="app__header">
          <h1 className="title">{copy.title}</h1>
          <Ledger score={state.score} best={best} topBlock={state.topBlock} reducedMotion={reducedMotion} />
          <NextBlocks next={state.next} then={state.then} />
        </header>

        <div className="app__play">
          {state.moves === 0 && <Intro />}
          <div style={{ position: 'relative' }}>
            <Drawer
              board={frame.board}
              exitTargets={exitTargets}
              chain={chain}
              step={frame.step}
              over={state.over}
              onDrop={drop}
            />
            <Stamp chain={chain} step={frame.step} />
          </div>
        </div>

        <aside className="app__side">
          <PressLog entries={log} />
          <button type="button" className="new-game" onClick={playAgain}>
            {copy.newGame}
          </button>
        </aside>

        <p className="visually-hidden" aria-live="polite" data-testid="announcer">
          {announcement}
        </p>

        <GameOver
          open={state.over}
          score={state.score}
          topBlock={state.topBlock}
          best={best}
          isNewBest={isNewBest}
          onPlayAgain={playAgain}
        />
      </main>
    </MotionConfig>
  );
}
