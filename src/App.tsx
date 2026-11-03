import { LazyMotion, MotionConfig, domAnimation, useReducedMotion } from 'motion/react';
import { useMemo, useState } from 'react';
import { COLUMNS, ROWS, type Position } from './game';
import { Drawer } from './ui/components/Drawer';
import { GameOver } from './ui/components/GameOver';
import { Intro } from './ui/components/Intro';
import { Ledger } from './ui/components/Ledger';
import { NextBlocks } from './ui/components/NextBlocks';
import { PressLog } from './ui/components/PressLog';
import { Stamp } from './ui/components/Stamp';
import { Title } from './ui/components/Title';
import { announcementFor, copy } from './ui/content/copy';
import { useAnnouncer } from './ui/hooks/useAnnouncer';
import { useBestScore } from './ui/hooks/useBestScore';
import { useEventPlayer } from './ui/hooks/useEventPlayer';
import { useGame } from './ui/hooks/useGame';
import { randomSeed, readSeed } from './ui/seed';

export function App() {
  const [seed] = useState(() => readSeed(window.location.search));
  // A preferência de movimento é lida só aqui e passada adiante, inclusive para o Motion.
  const reducedMotion = useReducedMotion() ?? false;
  const { gameId, state, move, log, drop, restart } = useGame(seed);
  const frame = useEventPlayer(move, state.board, reducedMotion);
  const { previousBest, isNewBest, commit } = useBestScore(state.score);

  // O motor já tem o resultado da jogada; o placar, o anúncio e o fim de jogo esperam a animação dela.
  const shown = frame.done || !move ? state : move.before;
  const best = Math.max(previousBest, shown.score);

  const event = frame.event;
  const chain = event?.type === 'merge' ? event.chain : 0;
  const exitTargets = useMemo(() => {
    const targets = new Map<number, Position>();
    if (event?.type === 'merge') for (const tile of event.absorbed) targets.set(tile.id, event.at);
    return targets;
  }, [event]);

  const message = move && frame.done ? announcementFor(move.summary) : '';
  const announcement = useAnnouncer(message, move?.id ?? 0);

  // Escape fecha a folha do fim de jogo; escolher uma coluna com a gaveta cheia traz a folha de volta.
  const [dismissedGame, setDismissedGame] = useState<number | null>(null);
  const resultsOpen = shown.over && dismissedGame !== gameId;
  const chooseColumn = (column: number) => {
    if (state.over) setDismissedGame(null);
    else drop(column);
  };

  const playAgain = () => {
    commit();
    restart(randomSeed());
  };

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion={reducedMotion ? 'always' : 'never'}>
        {/* As medidas do tabuleiro vêm do motor: o CSS as usa na grade, nos blocos e na proporção. */}
        <main className="app" style={{ '--columns': COLUMNS, '--rows': ROWS }}>
          <header className="app__header">
            <Title />
            <Ledger score={shown.score} best={best} topBlock={shown.topBlock} reducedMotion={reducedMotion} />
            <NextBlocks next={state.next} then={state.then} />
          </header>

          <div className="app__play">
            <div className="app__drawer">
              {/* A explicação fica impressa sobre a gaveta vazia, sem empurrar o layout. */}
              {state.moves === 0 && <Intro />}
              <Drawer
                board={frame.board}
                exitTargets={exitTargets}
                chain={chain}
                step={frame.step}
                reducedMotion={reducedMotion}
                onChoose={chooseColumn}
              />
              {/* Com movimento reduzido, sem carimbo (design, §3). */}
              {!reducedMotion && <Stamp chain={chain} step={frame.step} />}
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
            open={resultsOpen}
            score={state.score}
            topBlock={state.topBlock}
            best={best}
            isNewBest={isNewBest}
            onPlayAgain={playAgain}
            onDismiss={() => {
              setDismissedGame(gameId);
            }}
          />
        </main>
      </MotionConfig>
    </LazyMotion>
  );
}
