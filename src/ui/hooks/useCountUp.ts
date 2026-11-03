import { useEffect, useRef, useState } from 'react';

const DURATION_MS = 400;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/**
 * Valor que rola até `target`, sempre a partir do último número mostrado: se o alvo muda no meio da
 * rolagem, ela continua de onde estava, sem salto. Com movimento reduzido (ou alvo menor), salta direto.
 */
export function useCountUp(target: number, reducedMotion: boolean): number {
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);

  useEffect(() => {
    const show = (value: number) => {
      shownRef.current = value;
      setShown(value);
    };
    const origin = shownRef.current;
    if (origin === target) return;
    if (reducedMotion || target < origin) {
      show(target);
      return;
    }
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now: number) {
      const t = Math.min(1, (now - start) / DURATION_MS);
      show(Math.round(origin + (target - origin) * easeOutCubic(t)));
      if (t < 1) frame = requestAnimationFrame(tick);
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [target, reducedMotion]);

  return shown;
}
