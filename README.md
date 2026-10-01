# Pólis — Onde a política faz sentido

Portal de jornalismo político. Este repositório contém o código-fonte do site público e do
painel administrativo (CMS), construídos em **Next.js (App Router) + React + TypeScript +
Tailwind CSS**. O site é 100% estático (`output: "export"`) e o painel administrativo grava
conteúdo diretamente no repositório via **GitHub Contents API** (login por GitHub OAuth Device
Flow) — sem backend próprio, sem banco de dados, sem Supabase.

O planejamento completo do produto está documentado em [`docs/`](./docs).

## Arquitetura em uma imagem

```
                     ┌─────────────────────────┐
  Leitor  ──────────▶│  Site público (est.)     │  GitHub Pages
                     │  100% HTML pré-gerado    │  portalpolis.idialog.com.br
                     └─────────────▲───────────┘
                                   │ build-time (next build, lê src/content/*.json)
                     ┌─────────────┴───────────┐
                     │   src/content/*.json     │  commitado no repositório
                     └─────────────▲───────────┘
                                   │ commits via GitHub Contents API
                     ┌─────────────┴───────────┐
  Editor ───────────▶│   Painel Admin (client)  │◀── GitHub OAuth Device Flow (login)
                     │   100% roda no navegador │
                     └──────────────────────────┘
```

**Por que essa forma?** GitHub Pages só serve arquivos estáticos — não roda servidor. Então:

- O **site público** é gerado 100% em build time (`next build`, `output: "export"`) lendo os
  manifestos versionados em `src/content/*.json` — isso mantém o site rápido, indexável pelo
  Google e hospedável de graça no GitHub Pages, sem nenhuma chamada a um backend externo.
- O **painel administrativo** roda inteiramente no navegador do editor (client components) e
  grava mudanças fazendo commits diretos nos arquivos de `src/content/` (matérias, editorias,
  banners, configurações) e em `public/biblioteca-midias/` (mídia), via GitHub Contents API. O
  login usa o **GitHub OAuth Device Flow** — qualquer colaborador do repositório com permissão
  de escrita consegue entrar.
- Cada commit feito pelo painel já dispara automaticamente o workflow de deploy do GitHub
  Actions — o site estático se atualiza sozinho em ~1 minuto. Um cron a cada 30 min age como
  rede de segurança.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Framework | Next.js (App Router), export estático (`output: "export"`) |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS v4 (tema com a identidade visual do Pólis) |
| Backend do admin | GitHub Contents API (commits diretos) + GitHub OAuth Device Flow (login) |
| CI/CD | GitHub Actions → GitHub Pages |
| Hospedagem | GitHub Pages, domínio customizado `portalpolis.idialog.com.br` |

## Estrutura de pastas

```
PORTAL-POLIS/
├── docs/                          Documentação de planejamento (visão, marca, wireframes, ...)
├── public/brand/                  Logos oficiais
├── scripts/
│   ├── sync-analytics.mjs         GA4 Data API → src/content/analytics.json (roda em CI)
│   ├── generate-audio.mjs         Gera áudio das matérias via Piper TTS
│   └── transcode-gif-media.mjs    Converte GIFs animados em vídeo MP4
├── src/
│   ├── app/
│   │   ├── (site)/                 Rotas públicas (Home, Matéria, Editoria, Busca, páginas
│   │   │                            institucionais, Entretenimento, ...) — layout "jornal
│   │   │                            impresso" com page-flip (ver src/components/newspaper/)
│   │   └── admin/                  Painel administrativo
│   │       ├── login/                                     Login via GitHub OAuth Device Flow (sem sidebar)
│   │       └── (painel)/           Rotas protegidas por AuthProvider + AdminSidebar
│   │           ├── dashboard/, materias/, materias/nova/, materias/editar/, midia/
│   │           ├── categorias/, banners/, aparencia/, configuracoes/
│   ├── components/
│   │   ├── newspaper/               NavBar, Newspaper, PageFlipEngine, PageChrome, Masthead (site público)
│   │   ├── layout/                  ThemeToggle (claro/escuro do site público)
│   │   ├── articles/                ArticleCard, ListenButton (TTS), ShareButtons, SearchResults
│   │   ├── games/                   TicTacToe, Crossword (seção Entretenimento — ver CLAUDE.md)
│   │   ├── forms/                   ContactForm
│   │   ├── admin/                   AuthProvider, Sidebar, Topbar, KpiCard, ArticleEditorForm
│   │   └── ui/                      Button, Badge (Design System)
│   ├── content/                    Conteúdo público versionado (articles, editorias, authors,
│   │                                banners, settings, media) — fonte única de verdade, lida
│   │                                pelo site e gravada pelo painel via GitHub Contents API
│   ├── hooks/                      useSession (sessão GitHub), useSupabaseQuery (hook genérico
│   │                                de fetch assíncrono, nome histórico)
│   ├── lib/
│   │   ├── github/                  Cliente da API do GitHub: login (Device Flow), articles.ts,
│   │   │                            editorias.ts, banners.ts, settings.ts, mediaLibrary.ts —
│   │   │                            cada operação do painel é um commit direto no repositório
│   │   ├── content.ts               Camada de leitura do site público (lê src/content/*.json)
│   │   └── crosswords.ts            Dados + motor de grade das Palavras Cruzadas (ver CLAUDE.md)
│   └── types/                      types/index.ts (todos os tipos do domínio)
├── .github/workflows/deploy.yml    CI: lint → typecheck → test → build → deploy no GitHub Pages
└── .env.local.example
```

## Rodando localmente

```bash
npm install
cp .env.local.example .env.local   # preencha com as credenciais do seu OAuth App do GitHub
npm run dev
```

Acesse `http://localhost:3000`. O painel administrativo fica em `/admin/login`.

Sem `.env.local` configurado, o site público continua funcionando normalmente (lê o conteúdo
versionado em `src/content/`), mas o painel administrativo não consegue autenticar.

Outros comandos:

```bash
npm run build          # build de produção (export estático em ./out)
npm run start          # sobe o build de produção
npm run lint            # ESLint
npm run typecheck       # tsc --noEmit
npm run test            # testes unitários/componente (Vitest + Testing Library)
npm run test:e2e        # smoke tests E2E (Playwright, serve ./out estático)
```

## Testes

- **Unitários/componente** (`npm run test`, Vitest + Testing Library): cobrem as funções puras
  de `src/lib/utils.ts` e `src/lib/content.ts` (slugify, formatação de data, busca, filtros por
  editoria/autor) e um teste de renderização do `ArticleCard`. Não é cobertura completa — é a
  base para expandir conforme o projeto cresce.
- **E2E** (`npm run test:e2e`, Playwright): builda o export estático e sobe um servidor mínimo
  (`scripts/serve-static.mjs`) para rodar smoke tests reais — home carrega, navegação para uma
  matéria funciona, `/admin/*` redireciona para login sem sessão, e `sitemap.xml`/`robots.txt`/
  `rss.xml` respondem. Requer `npx playwright install --with-deps chromium` na primeira vez.
- O CI (`.github/workflows/deploy.yml`) roda lint, typecheck, testes unitários e o smoke E2E
  antes de todo deploy — um deploy só sai se os quatro passarem.
- Não implementado ainda: cobertura ampla (>80%) dos módulos críticos, testes de API/componente
  mais profundos, k6 (performance) e OWASP ZAP (segurança), conforme sugerido no plano de QA
  original. Ficam como próximo passo, não como algo já entregue.

## Configurando o login do painel (GitHub OAuth Device Flow)

O painel administrativo não tem backend próprio: o login usa o **Device Flow** do GitHub OAuth
e toda escrita (matérias, editorias, banners, mídia, configurações) é um commit direto no
repositório via GitHub Contents API. Qualquer colaborador com permissão de escrita no
repositório já consegue entrar — não há papeis granulares nem cadastro de usuários separado.

### 1. Criar o OAuth App

Em [github.com/settings/applications/new](https://github.com/settings/applications/new), crie um
OAuth App (a "Homepage URL" pode ser a URL do site) e **habilite o Device Flow** nas
configurações do app. Anote o **Client ID** gerado.

### 2. Publicar o proxy do Device Flow

O Device Flow não suporta CORS direto do navegador, então um proxy stateless precisa repassar a
troca de token — publique o worker em `cloudflare/github-oauth-proxy/` (ver o README naquela
pasta) e anote a URL publicada.

### 3. Preencher as variáveis de ambiente

Em `.env.local` (dev) e nos secrets/variáveis do GitHub Actions (produção, já commitados em
`.github/workflows/deploy.yml`):

| Variável | Valor |
| --- | --- |
| `NEXT_PUBLIC_GH_OWNER` | dono do repositório (ex.: `Albertinoblima`) |
| `NEXT_PUBLIC_GH_REPO` | nome do repositório (ex.: `portal-polis`) |
| `NEXT_PUBLIC_GH_BRANCH` | branch de produção (ex.: `main`) |
| `NEXT_PUBLIC_GH_OAUTH_CLIENT_ID` | Client ID do passo 1 |
| `NEXT_PUBLIC_GH_OAUTH_PROXY_URL` | URL do proxy publicado no passo 2 |

### 4. Segurança dos dados

Não há Row Level Security nem papeis granulares — a segurança vem inteiramente das permissões
de escrita do próprio repositório GitHub: só quem tem acesso de escrita consegue autenticar e
gravar conteúdo. Todo colaborador autenticado é tratado como `admin` no painel.

## Entretenimento

Todo jornal impresso tem uma seção de passatempos — o Pólis também. Em `/entretenimento` (menu
"Entretenimento" na navegação, com os submenus "Jogos" e "Palavras Cruzadas"):

- **Jogos** (`/entretenimento/jogos`): hoje só o Jogo da Velha (`/entretenimento/jogos/jogo-da-velha`),
  contra o computador (IA por minimax, imbatível) ou com outra pessoa no mesmo dispositivo. Placar
  por partida salvo no navegador (sem backend).
- **Palavras Cruzadas** (`/entretenimento/palavras-cruzadas`): uma edição nova por dia, com
  tabuleiro interativo (digitação com avanço automático, conferência de respostas, revelar
  solução, cronômetro e progresso salvo no navegador). Todo o conteúdo é estático, definido em
  `src/lib/crosswords.ts`.

**Publicando a próxima palavra cruzada:** o processo completo (como montar a grade, verificar
interseções e numerar as dicas corretamente) está documentado em [`CLAUDE.md`](./CLAUDE.md), para
que qualquer sessão do Claude Code — nova ou retomada — saiba reproduzi-lo sem precisar
reexplicar.

## Identidade visual

Cores e tipografia seguem
[`docs/02_Identidade_da_Marca_Polis_v1.0.md`](./docs/02_Identidade_da_Marca_Polis_v1.0.md) e
estão configuradas em `src/app/globals.css` como tokens Tailwind: `polis-navy`, `polis-gold`,
`polis-slate`, `polis-off-white`, `polis-newsprint`, entre outros.

## Roadmap

- **Fase 1 (atual):** MVP com leitura pública estática + painel administrativo completo sobre
  Supabase (auth real, workflow editorial, mídia, RLS).
- **Fase 2:** IA responsável (resumos, recomendações), assinatura premium, comentários avançados.
- **Fase 3:** Plataforma de dados, API pública, expansão de conteúdo e comunidade.

Detalhes completos em
[`docs/10_Roadmap_Evolucao_Completo_Fases_1_2_3_Polis_v1.0.md`](./docs/10_Roadmap_Evolucao_Completo_Fases_1_2_3_Polis_v1.0.md).

## Painel Administrativo — Roadmap de profissionalização (v2.0)

O painel hoje é um CRUD funcional sobre Supabase, mas ainda tem lacunas identificadas no uso
real: seleção de imagem por URL solta (em vez da Biblioteca de Mídia), editor de matéria sem
barra de ferramentas, nenhuma edição de páginas/menus/rodapé do site pelo painel, sem
monitoramento de erros e sem Google Analytics configurável. O plano abaixo organiza a evolução
em fases — a arquitetura estática (site público 100% pré-gerado via `sync-content.mjs`, sem
servidor em runtime) é a restrição que toda fase precisa respeitar.

1. **Fase 1 — Correções relatadas:** componente `MediaPicker` reutilizável (substitui as três
   implementações duplicadas de upload/seleção de imagem hoje espalhadas entre Banners, imagem
   de destaque da matéria e a Biblioteca de Mídia); editor de texto rico (Tiptap) em Nova
   Matéria, com barra de ferramentas e sanitização de HTML (DOMPurify) tanto no salvamento
   quanto na sincronização estática; Google Analytics configurável em `site_settings` em vez de
   variável de ambiente fixa.
2. **Fase 2 — CMS de Páginas:** tabela `pages` no Supabase + CRUD no painel para as páginas
   institucionais (Sobre, Contato, LGPD, Privacidade, Cookies, Termos, Newsletter), hoje HTML
   fixo no código-fonte. Inclui formalizar "Equipe Editorial" (nome, cargo, foto, ordem) como
   registros geridos pelo painel.
3. **Fase 3 — Menus e Submenus:** tabela `menu_items` (com hierarquia via `parent_id` e
   ordenação drag-and-drop), painel de CRUD, `NavBar` passa a renderizar a partir de dados em
   vez dos arrays fixos atuais (`INSTITUTIONAL_LINKS` etc.).
4. **Fase 4 — Rodapé do site:** nova barra fixa de rodapé (o design atual de "jornal impresso"
   não tem rodapé de site, só um rodapé por página dentro do livro) com colunas de link, redes
   sociais e copyright, editável em Configurações.
5. **Fase 5 — Construtor de widgets da Home:** blocos ordenáveis por drag-and-drop (Destaques,
   Editorias, Radar Político, Newsletter, Anúncio) editáveis pelo painel, em vez da ordem fixa
   atual no código.
6. **Fase 6 — Monitoramento de erros:** integração com Sentry (requer conta em sentry.io e DSN
   configurado pelo responsável do projeto).
7. **Fase 7 — Polimento sênior geral:** validação de formulário consistente
   (`react-hook-form` + `zod`) em todo o painel, loading states com skeleton, substituição de
   `alert()`/`confirm()` nativos por componentes de UI próprios.

A Fase 1 já tem um plano de implementação detalhado (arquivos exatos a criar/editar, biblioteca
escolhida, migração SQL, sequenciamento) pronto para ser retomado quando a v2.0 entrar em
desenvolvimento.
