import 'react';

declare module 'react' {
  /** Propriedades personalizadas do CSS (`--columns`, `--digits`…) no atributo `style`. */
  interface CSSProperties {
    [variable: `--${string}`]: string | number | undefined;
  }
}
