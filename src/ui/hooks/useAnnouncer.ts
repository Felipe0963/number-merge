import { useEffect, useState } from 'react';

/**
 * Texto para a região aria-live. Limpa e preenche de novo a cada `id`, para que uma mensagem
 * repetida (por exemplo, "Column full." duas vezes) seja anunciada de novo.
 */
export function useAnnouncer(message: string, id: number): string {
  const [shown, setShown] = useState<{ id: number; message: string } | null>(null);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => {
      setShown({ id, message });
    }, 50);
    return () => {
      window.clearTimeout(timer);
    };
  }, [message, id]);

  // Até o tempo passar, a região fica vazia; assim cada jogada nova é anunciada, mesmo com o mesmo texto.
  return shown?.id === id && shown.message === message ? message : '';
}
