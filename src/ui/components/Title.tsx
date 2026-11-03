import { copy } from '../content/copy';

/**
 * O título composto em blocos de tipo de madeira, uma letra por bloco. Leitores de tela ouvem um só
 * título ("NUMBER MERGE"); os blocos são decoração. Cada palavra fica inteira e quebra de linha sozinha.
 */
export function Title() {
  return (
    <h1 className="title">
      <span className="visually-hidden">{copy.title}</span>
      <span className="title__words" aria-hidden="true">
        {copy.title.split(' ').map((word) => (
          <span key={word} className="title__word">
            {word.split('').map((letter, index) => (
              <span key={index} className="title__letter">
                {letter}
              </span>
            ))}
          </span>
        ))}
      </span>
    </h1>
  );
}
