# Number Merge — Design

Status: aprovado e implementado
Projeto: `projetos/number-merge`
Idioma do jogo: inglês
Idioma da documentação: português

## 1. Visão geral

Um jogo de navegador em que o jogador solta blocos numerados em colunas. Blocos iguais que se encostam se fundem no dobro, e as fusões podem encadear reações. O objetivo é chegar ao maior bloco possível.

É uma peça de portfólio: deve mostrar lógica de jogo bem testada, animação cuidadosa, acessibilidade e código bem organizado em React + TypeScript.

A mecânica é própria (blocos que caem em colunas), e não uma cópia de jogos conhecidos do gênero, como o 2048.

## 2. Regras

### Tabuleiro

- 5 colunas por 7 linhas.

### Jogada

1. No topo aparecem o **próximo bloco** e, menor, o **seguinte**.
2. O jogador escolhe uma coluna (clique, toque, ou setas + Enter/espaço).
3. O bloco cai até a primeira casa livre da coluna.
4. Coluna cheia: a jogada é ignorada e o jogo anuncia `Column full.` para leitores de tela.

### Fusão

- Ao pousar, o bloco se funde com os blocos de **mesmo valor** encostados à esquerda, à direita e embaixo.
- Com 1 vizinho igual, o valor dobra. Com 2, quadruplica. Com 3, multiplica por 8.
- O resultado fica na casa do bloco que pousou. Os vizinhos absorvidos saem do tabuleiro.

### Gravidade e cadeia

- Depois de cada fusão, os blocos que ficaram sem apoio caem.
- Cada bloco que se moveu (o resultado da fusão e os que caíram) verifica de novo seus vizinhos. Novas fusões continuam a **cadeia**.
- A cadeia termina quando nenhuma fusão nova acontece.
- Ordem determinística: as fusões de um mesmo passo são resolvidas de baixo para cima e da esquerda para a direita.

### Pontuação

- Cada fusão vale o valor criado vezes a posição dela na cadeia: a 1ª vale ×1, a 2ª ×2, a 3ª ×3 e assim por diante.
- A pontuação nunca diminui.

### Blocos sorteados

- No começo saem 2, 4 e 8.
- Conforme o maior bloco do tabuleiro cresce, podem sair valores maiores, até 1/32 do maior bloco (nunca menos que 8 como teto).
- Valores menores são mais prováveis que os maiores.
- O sorteio usa um gerador com semente: a mesma semente sempre gera a mesma sequência.

### Fim de jogo

- Quando nenhuma coluna tem casa livre.

### Resultado

- **Score:** soma das fusões com multiplicadores.
- **Top block:** o maior valor alcançado na partida.
- **Best:** o melhor score salvo no navegador (`localStorage`). Se o armazenamento falhar, o recorde vale só durante a visita.
- **New best:** aparece no fim de jogo só quando havia um recorde anterior e ele foi superado (nunca na primeira partida).

### Fora do escopo desta versão

- Desfazer jogada, power-ups, fases, desafio do dia e som.

## 3. Visual: a gaveta de tipos

O tabuleiro é uma **gaveta de tipos** de oficina de tipografia. As colunas são compartimentos, e cada número é um **bloco de tipo de madeira**.

### Cores

| Token | Uso |
|---|---|
| `--walnut` | Fundo: madeira escura da gaveta, com veios sutis |
| `--brass` | Filetes que dividem as colunas |
| `--boxwood` | Face dos blocos: madeira clara |
| `--paper` | Texto claro sobre a madeira escura |

Tintas por faixa de valor (cor do número impresso no bloco):

| Valores | Tinta |
|---|---|
| 2 a 8 | Preto |
| 16 a 64 | Azul-marinho |
| 128 a 512 | Verde-garrafa |
| 1024 a 4096 | Ocre |
| 8192 em diante | Vermelho-carmim |

Os valores exatos das cores saem do protótipo visual e precisam ter contraste mínimo de 4,5:1 entre a tinta e a madeira do bloco, e entre os textos e o fundo.

### Tipografia

- **Números dos blocos e título:** Alfa Slab One.
- **Placar, rótulos e registro:** IBM Plex Mono.
- As fontes são servidas pelo próprio site (Fontsource), sem pedidos para fora.

### Layout

- **Celular (prioridade):** placar no topo; próximo e seguinte logo abaixo; a gaveta ocupando a maior parte da tela; botão de novo jogo embaixo.
- **Computador:** a gaveta no centro e, ao lado, a **folha de registro** com as últimas cadeias.

### Animações

| Momento | Animação |
|---|---|
| Queda | Aceleração de gravidade e leve achatamento ao pousar |
| Fusão | Choque de prensa, respingo de tinta e o novo valor "impresso" |
| Cadeia | Carimbo inclinado "×2", "×3"… e tremor da gaveta proporcional à cadeia |
| Pontuação | Números do placar rolando até o valor novo |
| Nova tinta | Brilho de destaque na primeira vez que uma faixa de valor aparece na partida (o preto já começa visto, porque todo bloco inicial é preto) |

- Se o jogador fizer uma jogada nova durante uma animação, a animação em andamento termina na hora e a nova começa.
- O placar, o anúncio, a folha de registro e o fim de jogo só mudam quando a animação da jogada termina.
- **Movimento reduzido:** sem queda animada, achatamento, tremor, respingo, brilho, carimbo ou placar rolando; só transições curtas de opacidade.

### Telas

1. **Início:** título composto em blocos de madeira, uma faixa de papel sobre a gaveta vazia com a frase de como jogar. Escolher uma coluna começa a partida.
2. **Jogo:** gaveta, placar, próximos blocos e (no computador) a folha de registro.
3. **Fim de jogo:** uma "folha impressa" com score, top block, best e o botão para jogar de novo. Escape fecha a folha; escolher qualquer coluna a abre de novo.

O jogo inteiro cabe na tela, sem rolagem, em 1280×800, 1440×900 e no celular.

## 4. Textos (inglês)

| Onde | Texto |
|---|---|
| Título | `NUMBER MERGE` |
| Como jogar | `Drop blocks into the drawer. Equal numbers that touch merge into one.` |
| Convite para começar | `Choose a column to begin.` |
| Rótulos do placar | `Score` · `Best` · `Top block` |
| Próximos blocos | `Next` · `Then` |
| Botão de novo jogo | `New game` |
| Folha de registro | `Press log` |
| Linha do registro | `Chain ×3 · +384` (exemplo) |
| Coluna cheia (leitor de tela) | `Column full.` |
| Fusão (leitor de tela) | `Merged into 32.` e, em cadeia, `Merged into 64. Chain ×2.` |
| Coluna (nome acessível) | `Column 1, 3 blocks, top 16` (exemplo) |
| Fim de jogo | `The drawer is full.` |
| Novo recorde | `New best` |
| Jogar de novo | `Play again` |

## 5. Arquitetura

### Princípio

A lógica do jogo é TypeScript puro e não conhece o React. Uma jogada é calculada inteira de uma vez e devolve o estado final e a **lista de eventos** que aconteceram. Cada evento carrega o tabuleiro logo depois dele; a exceção é o `merge`, cujo tabuleiro ainda mostra os blocos absorvidos no lugar (o instante do choque), que saem no `fall` seguinte. A interface só mostra esses tabuleiros em sequência, com animação.

Os blocos que se moveram durante a jogada (o que caiu, os resultados das fusões e os que desceram) ficam num conjunto que vale para a cadeia inteira. A cada passo, o mais baixo e mais à esquerda que tem vizinhos iguais se funde; a cadeia termina quando nenhum deles tem.

A URL aceita `?seed=123` para repetir uma partida. Os testes de navegador usam isso para jogar no motor e na tela ao mesmo tempo e comparar.

### Motor (`src/game/`)

| Arquivo | Responsabilidade |
|---|---|
| `types.ts` | `Board`, `Tile`, `GameState`, `GameEvent` |
| `board.ts` | Criar o tabuleiro, ler e escrever casas, achar a casa livre de uma coluna |
| `random.ts` | Gerador com semente e sorteio dos blocos |
| `resolve.ts` | Fusões, gravidade e cadeias, gerando eventos |
| `score.ts` | Pontos de cada fusão com multiplicador |
| `game.ts` | `newGame(seed, firstId)` e `dropTile(state, column)` → `{ state, events }` |
| `summary.ts` | Resumo de uma jogada: pontos, maior cadeia, última fusão |

Eventos (`GameEvent`):

| Tipo | Dados |
|---|---|
| `drop` | bloco, coluna, linha de destino |
| `merge` | blocos absorvidos, bloco resultante, novo valor, posição na cadeia, pontos |
| `fall` | blocos que caíram e suas linhas de destino |
| `rejected` | coluna cheia |
| `gameOver` | — |

Cada bloco tem um `id` estável, para a interface acompanhar o mesmo bloco entre eventos.

### Interface (`src/ui/`)

| Arquivo | Responsabilidade |
|---|---|
| `hooks/useGame.ts` | Estado da partida, última jogada e folha de registro |
| `hooks/useEventPlayer.ts` | Mostra os tabuleiros dos eventos em sequência e diz quando a jogada terminou |
| `hooks/useBestScore.ts` | Recorde no `localStorage`, tolerante a falhas |
| `hooks/useColumnKeys.ts` | Tabindex itinerante: setas, Home e End entre colunas |
| `hooks/useCountUp.ts` | Placar rolando até o valor novo |
| `hooks/useAnnouncer.ts` | Texto da região `aria-live`, repetindo mensagens iguais |
| `hooks/useNewInks.ts` | Tintas já vistas na partida, para o brilho de nova tinta |
| `components/Title.tsx` | Título composto em blocos de madeira |
| `components/Drawer.tsx` | Gaveta e colunas focáveis e clicáveis |
| `components/TypeBlock.tsx` | Um bloco na gaveta, com queda, achatamento e deslize ao ser absorvido |
| `components/TypeFace.tsx` | A face do bloco com o número impresso |
| `components/InkSplash.tsx` | Respingo de tinta na fusão |
| `components/Ledger.tsx` | Placar |
| `components/PressLog.tsx` | Folha de registro das cadeias |
| `components/NextBlocks.tsx` | Próximo e seguinte |
| `components/Stamp.tsx` | Carimbo da cadeia |
| `components/Intro.tsx` | Faixa de como jogar sobre a gaveta vazia |
| `components/GameOver.tsx` | Folha de fim de jogo |
| `content/copy.ts` | Todos os textos e o anúncio de cada jogada |
| `ink.ts` | Tinta por faixa de valor e tintas novas no tabuleiro |
| `record.ts` | Regras do recorde e do "New best" |
| `seed.ts` | Semente da URL ou aleatória |
| `styles/tokens.css`, `styles/app.css` | Cores, fontes, espaçamentos, tintas e estilos |

### Fluxo

Coluna escolhida → `useGame` chama `dropTile` → recebe `{ state, events }` → `useEventPlayer` anima os eventos → a tela fica no estado final.

### Acessibilidade

- Cada coluna é um botão com nome acessível que descreve o conteúdo.
- A gaveta é uma única parada de Tab. Setas movem o foco entre colunas (dando a volta), Home e End vão à primeira e à última; Enter e espaço soltam o bloco.
- O título é lido como um único "NUMBER MERGE"; os blocos de letras são decorativos.
- Uma região `aria-live="polite"` anuncia fusões, cadeias, coluna cheia e fim de jogo.
- Contraste mínimo de 4,5:1 nos textos e números.
- `prefers-reduced-motion` respeitado.

## 6. Stack e qualidade

- Vite + React + TypeScript estrito (sem `any`).
- Motion para animações.
- ESLint (regras de React, hooks e acessibilidade) e Prettier.
- Fontsource para as fontes.
- Componentes pequenos, uma responsabilidade por arquivo.

## 7. Testes

### Motor (Vitest)

- Queda até a casa livre; coluna cheia rejeitada.
- Fusão com 1, 2 e 3 vizinhos.
- Gravidade depois da fusão.
- Cadeia com multiplicador e ordem determinística.
- Sorteio: valores iniciais, teto que acompanha o maior bloco, mesma semente gera a mesma sequência.
- Fim de jogo.
- **Testes de propriedade** (fast-check): em milhares de partidas aleatórias, o tabuleiro nunca tem blocos flutuando, a pontuação nunca diminui, todo valor é potência de 2 e a mesma semente com as mesmas jogadas gera o mesmo resultado.

### Navegador (Playwright + axe, desktop e celular)

- Jogar com mouse, teclado e toque.
- Coluna cheia não muda nada e é anunciada.
- Cadeia aparece no placar e no registro.
- Fim de jogo e jogar de novo.
- Recorde salvo entre recarregamentos.
- Movimento reduzido: nenhuma animação rodando.
- axe sem violações em todas as telas.

## 8. Fora do escopo

- Desfazer, power-ups, fases, desafio do dia, som, placar online e publicação (fica para depois).
