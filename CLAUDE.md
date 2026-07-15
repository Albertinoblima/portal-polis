# Instruções para o Claude Code neste repositório

Este arquivo é carregado automaticamente no início de toda sessão do Claude Code neste projeto.
Use-o como ponto de partida antes de pedir ao usuário para reexplicar algo que já está aqui.

## Palavras Cruzadas (Entretenimento) — como criar uma nova edição

O Portal Pólis publica uma palavra cruzada por dia em `/entretenimento/palavras-cruzadas`, no
mesmo espírito do passatempo de jornal impresso. Todo o sistema é 100% estático (sem backend) —
publicar uma edição nova é só adicionar um objeto de dados; nenhum código de UI precisa mudar.

### Onde tudo mora

| Arquivo | Papel |
|---|---|
| `src/lib/crosswords.ts` | **Único arquivo que você edita.** Tipos, o array `CROSSWORDS` (o conteúdo de cada edição) e o motor que monta a grade a partir das palavras. |
| `src/components/games/Crossword.tsx` | UI interativa (tabuleiro, digitação, conferir, revelar, cronômetro). Não precisa mexer aqui para publicar uma edição nova. |
| `src/app/(site)/entretenimento/palavras-cruzadas/page.tsx` | Rota pública. Sempre renderiza a edição mais recente já publicada. |

### Modelo de dados

```ts
interface CrosswordEntry {
  number: number;              // numeração da dica (ver regra abaixo — não é arbitrária)
  direction: "across" | "down";
  row: number;                 // 0-indexado, linha onde a palavra COMEÇA
  col: number;                 // 0-indexado, coluna onde a palavra COMEÇA
  answer: string;               // MAIÚSCULAS, SEM acento/cedilha/espaço (ver abaixo)
  clue: string;                 // dica em português
}

interface CrosswordPuzzle {
  slug: string;                 // identificador único, kebab-case (ex.: "reforma-tributaria")
  date: string;                 // "YYYY-MM-DD" — data de publicação
  theme: string;                // tema exibido no cabeçalho da página
  entries: CrosswordEntry[];
}
```

`getLatestCrossword()` sempre escolhe, entre todas as entradas de `CROSSWORDS`, a de `date` mais
recente que já chegou (`<= hoje`) — e ela fica no ar até a próxima ser publicada, exatamente como
uma edição de jornal real. **Para publicar a edição de amanhã, basta acrescentar um novo objeto
ao array `CROSSWORDS` com a data de amanhã.** Não precisa remover as anteriores (elas viram um
arquivo histórico, mesmo sem UI de arquivo ainda).

### Regras de letras

`answer` só pode conter `A-Z` — sem acento, cedilha ou espaço, porque o teclado do tabuleiro só
aceita uma letra por casa sem diacríticos. Normalize assim: "educação" → `EDUCACAO`, "ação" →
`ACAO`, "país" → `PAIS`, "órgão" → `ORGAO`. Isso é uma convenção normal de palavras cruzadas
impressas (a maioria também remove acentos).

### Passo a passo para montar uma edição nova

1. **Escolha o tema e uma lista de ~6 a 10 palavras** relacionadas (política, economia,
   município, direito, o que fizer sentido). Prefira um mix de 1 palavra mais longa (7+ letras)
   como "espinha dorsal" e palavras menores cruzando nela.

2. **Monte a grade à mão, célula por célula, ANTES de escrever código.** O método mais simples
   (usado na primeira edição) é:
   - Escolha uma palavra horizontal longa como base (a "espinha").
   - Para cada palavra vertical que vai cruzá-la, escolha UMA letra da espinha e alinhe a palavra
     vertical para que a letra dela naquela posição seja EXATAMENTE a mesma letra da espinha
     naquela coluna.
   - Linhas/colunas são absolutas e 0-indexadas (linha 0 = topo). A grade final é calculada
     automaticamente a partir da posição/tamanho de cada palavra — não existe uma "grade fixa"
     para preencher, então pode começar em `row: 0, col: 0` sem se preocupar com moldura.

3. **Confira TODAS as interseções, letra por letra, à mão, antes de adicionar ao código.** Isto é
   o passo mais importante: se duas palavras compartilham uma célula (mesma `row`+`col`) e as
   letras não baterem, o quebra-cabeça fica quebrado silenciosamente — `buildCrosswordGrid()` não
   valida nada, a última palavra processada simplesmente sobrescreve a letra da célula, e o
   jogador nunca vai conseguir preencher as duas palavras corretamente ao mesmo tempo. Para cada
   par de palavras que se cruzam, escreva a célula compartilhada e confirme visualmente (ex.:
   "ORÇAMENTO linha 3 coluna 0 = O; IMPOSTO linha 3 coluna 0 = O ✓").

4. **Numere as dicas seguindo a convenção padrão de palavras cruzadas** — a numeração NÃO é
   arbitrária:
   - Percorra a grade em ordem de leitura (linha 0 esquerda→direita, depois linha 1, etc.).
   - Toda célula que **inicia** uma palavra horizontal (não tem casa ativa imediatamente à
     esquerda) E/OU inicia uma palavra vertical (não tem casa ativa imediatamente acima) recebe o
     próximo número sequencial.
   - Se uma célula inicia as duas ao mesmo tempo, ela recebe um único número, compartilhado pelas
     duas entradas (`entries` diferentes, mesmo `number`).

5. **Escreva as dicas em português**, claras e no tema. Palavras de ligação curtas sem relação
   direta com o tema (ex.: "SUA", "É", pronomes/preposições) são normais e esperadas — servem só
   para conectar duas palavras vizinhas na grade, como em qualquer palavra cruzada real.

6. **Acrescente o objeto ao array `CROSSWORDS`** em `src/lib/crosswords.ts`, com a data de
   publicação desejada.

7. **Valide antes de considerar pronto:**
   ```bash
   npm run typecheck
   npm run lint
   npm run dev
   ```
   Depois, no navegador, abra `/entretenimento/palavras-cruzadas/`, clique em **"Revelar
   solução"** e confira visualmente se cada interseção mostra a mesma letra nas duas direções (é
   a forma mais rápida de pegar um erro de grade antes de publicar).

### Exemplo de referência (primeira edição, tema "Políticas Públicas")

Espinha horizontal `ORCAMENTO` cruzada por cinco palavras verticais, mais uma palavra curta de
ligação (`SUA`). Grade resultante (linhas 0–11, colunas 0–8; números entre colchetes marcam onde
uma dica começa; `·` = casa bloqueada):

```
     col0  col1  col2  col3  col4  col5  col6  col7  col8
row0 [1]I   ·   [2]E    ·     ·     ·     ·     ·   [3]D
row1   M    ·     D     ·     ·     ·   [4]S    ·     E
row2   P    ·     U     ·     ·     ·     A     ·     M
row3 [5]O   R     C     A   [6]M    E     N     T     O
row4 [7]S   U     A     ·     U     ·     E     ·     C
row5   T    ·     C     ·     N     ·     A     ·     R
row6   O    ·     A     ·     I     ·     M     ·     A
row7   ·    ·     O     ·     C     ·     E     ·     C
row8   ·    ·     ·     ·     I     ·     N     ·     I
row9   ·    ·     ·     ·     P     ·     T     ·     A
row10  ·    ·     ·     ·     I     ·     O     ·     ·
row11  ·    ·     ·     ·     O     ·     ·     ·     ·
```

Entradas correspondentes: `1↓ IMPOSTO`, `2↓ EDUCACAO`, `3↓ DEMOCRACIA`, `4↓ SANEAMENTO`,
`5→ ORCAMENTO`, `6↓ MUNICIPIO`, `7→ SUA`. O código completo está em `src/lib/crosswords.ts` — use
como molde para copiar o formato.

### O que evitar

- Grades gigantes (15×15 estilo NYT) — são difíceis de verificar à mão e o risco de publicar uma
  interseção quebrada cresce muito. Prefira o tamanho da edição de referência (grade compacta,
  6–8 palavras).
- Inventar a numeração sem seguir a varredura linha-a-linha — quebra a expectativa de quem já
  joga palavras cruzadas.
- Respostas com acento, cedilha ou espaço.

## Caça-Palavras (Entretenimento) — como criar uma nova edição

O Portal Pólis publica um caça-palavras por dia em `/entretenimento/caca-palavras`. Ao contrário
das palavras cruzadas, a grade **não é montada à mão** — um motor determinístico
(`buildWordSearchGrid`) posiciona as palavras sozinho nas 8 direções (incluindo de trás para
frente) e preenche o resto com letras aleatórias. Publicar uma edição nova é só escrever a lista
de palavras; nenhum posicionamento manual é necessário.

### Onde tudo mora (Caça-Palavras)

| Arquivo | Papel |
|---|---|
| `src/lib/wordsearch.ts` | **Único arquivo que você edita.** Tipos, o array `WORDSEARCHES` (o conteúdo de cada edição) e o motor que monta a grade a partir da lista de palavras. |
| `src/components/games/WordSearch.tsx` | UI interativa (arrastar/tocar para selecionar, cronômetro, revelar). Não precisa mexer aqui para publicar uma edição nova. |
| `src/app/(site)/entretenimento/caca-palavras/page.tsx` | Rota pública. Sempre renderiza a edição mais recente já publicada. |

### Modelo de dados (Caça-Palavras)

```ts
interface WordSearchPuzzle {
  slug: string;   // identificador único, kebab-case (ex.: "reforma-tributaria")
  date: string;   // "YYYY-MM-DD" — data de publicação
  theme: string;  // tema exibido no cabeçalho da página
  size: number;   // lado da grade (ela é sempre quadrada: size x size)
  words: string[]; // MAIÚSCULAS, SEM acento/cedilha/espaço — mesma regra das cruzadas
}
```

`getLatestWordSearch()` segue exatamente a mesma regra do `getLatestCrossword()`: a edição do dia
é sempre a de `date` mais recente com `date <= hoje`, e fica no ar até a próxima ser publicada.
**Para publicar a edição de amanhã, basta acrescentar um novo objeto ao array `WORDSEARCHES`** com
a data de amanhã — não precisa remover as anteriores.

### Como o motor posiciona as palavras (`buildWordSearchGrid`)

A grade é gerada por um PRNG determinístico (mulberry32, semeado a partir de um hash do `slug`) —
**não** usa `Math.random()`. Isso é proposital: a mesma semente sempre produz exatamente a mesma
grade, então o HTML renderizado no servidor bate com a primeira renderização no cliente. Se algum
dia trocar essa lógica por algo que usa `Math.random()`/`Date.now()` direto no cálculo da grade,
vai quebrar a hidratação do React (isso já aconteceu uma vez no Jogo da Cobrinha — ver histórico
do componente `Snake.tsx` para o sintoma).

O motor tenta até 500 posições aleatórias (linha, coluna, uma das 8 direções) por palavra,
aceitando um encaixe quando todas as casas estão livres ou já têm exatamente a mesma letra (o que
cria cruzamentos naturais entre palavras, como nas cruzadas). **Se não conseguir posicionar uma
palavra depois de 500 tentativas, `buildWordSearchGrid()` lança uma exceção** — isso é
intencional (falha alto e cedo, em vez de publicar silenciosamente um caça-palavras com uma
palavra faltando). Se isso acontecer ao adicionar uma edição, aumente `size` ou reduza/encurte a
lista de palavras.

### Passo a passo para montar uma edição nova (Caça-Palavras)

1. **Escolha o tema e de 8 a 14 palavras** relacionadas, todas em `MAIÚSCULAS SEM ACENTO` (mesma
   normalização das cruzadas: "eleição" → `ELEICAO`).

2. **Escolha `size`** de forma que a maior palavra caiba com folga — regra prática:
   `size >= palavra_mais_longa + 2`. Para ~10-14 palavras de até 12 letras, `14` costuma bastar
   (é o valor usado na edição de referência, tema "Democracia").

3. **Acrescente o objeto ao array `WORDSEARCHES`** em `src/lib/wordsearch.ts`, com a data de
   publicação desejada.

4. **Valide antes de considerar pronto:**

   ```bash
   npm run typecheck
   npm run lint
   npm run dev
   ```

   Depois, no navegador, abra `/entretenimento/caca-palavras/` — se a página renderizar sem erro
   no console, o motor conseguiu posicionar todas as palavras (se não conseguisse, teria lançado a
   exceção descrita acima e a página quebraria). Clique em **"Revelar todas"** para conferir
   visualmente se cada palavra da lista corresponde a uma linha reta na grade.

### O que evitar (Caça-Palavras)

- Palavras muito parecidas ou uma sendo substring de outra em posições que possam se sobrepor de
  forma ambígua — não quebra o jogo (a checagem de acerto compara o conjunto exato de casas, não
  só a string), mas pode confundir o jogador visualmente.
- Grades enormes (20+) só para "caber mais palavras" — prefira o tamanho compacto da edição de
  referência; grades grandes demais ficam cansativas de escanear visualmente.
- Respostas com acento, cedilha ou espaço.
