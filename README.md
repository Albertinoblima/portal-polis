# Pólis — Onde a política faz sentido

Portal de jornalismo político. Este repositório contém o código-fonte do site público e do
painel administrativo (CMS), construídos em **Next.js (App Router) + React + TypeScript +
Tailwind CSS**, com **Supabase** (Postgres + Auth + Storage) como backend do painel.

O planejamento completo do produto está documentado em [`docs/`](./docs).

## Arquitetura em uma imagem

```
                     ┌─────────────────────────┐
  Leitor  ──────────▶│  Site público (est.)     │  GitHub Pages
                     │  100% HTML pré-gerado    │  portalpolis.idialog.com.br
                     └─────────────▲───────────┘
                                   │ build-time (Node, em CI)
                     ┌─────────────┴───────────┐
                     │ scripts/sync-content.mjs │
                     └─────────────▲───────────┘
                                   │ SELECT (anon key, RLS)
                     ┌─────────────┴───────────┐
  Editor ───────────▶│   Painel Admin (client)  │◀── Supabase Auth (login real)
                     │   100% roda no navegador │
                     └─────────────▲───────────┘
                                   │ INSERT/UPDATE (RLS por papel)
                     ┌─────────────┴───────────┐
                     │   Supabase (Postgres)    │
                     │   + Auth + Storage       │
                     │   + Edge Functions       │
                     └──────────────────────────┘
```

**Por que essa forma?** GitHub Pages só serve arquivos estáticos — não roda servidor. Então:

- O **site público** é gerado 100% em build time (`next build`, `output: "export"`) e não fala
  com o Supabase em tempo de execução — isso mantém o site rápido, indexável pelo Google e
  hospedável de graça no GitHub Pages.
- O **painel administrativo** roda inteiramente no navegador do editor (client components) e
  fala diretamente com o Supabase (Postgres via PostgREST, Auth, Storage). A segurança não
  depende de "esconder" botões na UI — todo acesso é reforçado por **Row Level Security (RLS)**
  no banco, por papel (`admin`, `editor_chief`, `editor`, `reviewer`, `columnist`).
- Quando uma matéria é publicada, o painel dispara uma **Supabase Edge Function** que aciona um
  novo build via `repository_dispatch` do GitHub Actions — o site estático se atualiza sozinho
  em ~1 minuto. Um cron a cada 30 min age como rede de segurança.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js (App Router), export estático (`output: "export"`) |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS v4 (tema com a identidade visual do Pólis) |
| Backend do admin | Supabase (Postgres + Row Level Security + Auth + Storage + Edge Functions) |
| CI/CD | GitHub Actions → GitHub Pages |
| Hospedagem | GitHub Pages, domínio customizado `portalpolis.idialog.com.br` |

## Estrutura de pastas

```
PORTAL-POLIS/
├── docs/                          Documentação de planejamento (visão, marca, wireframes, ...)
├── public/brand/                  Logos oficiais
├── scripts/
│   └── sync-content.mjs           Supabase → src/content/*.json (roda em CI antes do build)
├── supabase/
│   ├── migrations/0001_init.sql   Schema completo: tabelas, RLS, funções de papel
│   ├── seed.sql                   Seed inicial (editorias, tags)
│   └── functions/
│       ├── invite-user/           Edge Function: convida novo membro da equipe (admin only)
│       └── trigger-rebuild/       Edge Function: aciona rebuild do site publicado
├── src/
│   ├── app/
│   │   ├── (site)/                 Rotas públicas (Home, Matéria, Editoria, Busca, páginas
│   │   │                            institucionais, ...) — layout "jornal impresso" com
│   │   │                            page-flip (ver src/components/newspaper/)
│   │   └── admin/                  Painel administrativo
│   │       ├── login/, esqueci-senha/, redefinir-senha/   (sem sidebar)
│   │       └── (painel)/           Rotas protegidas por AuthProvider + AdminSidebar
│   │           ├── dashboard/, materias/, materias/nova/, materias/editar/
│   │           ├── categorias/, tags/, usuarios/, midia/, banners/, comentarios/
│   │           ├── mensagens/, newsletter/, auditoria/, configuracoes/
│   ├── components/
│   │   ├── newspaper/               NavBar, Newspaper, PageFlipEngine, PageChrome, Masthead (site público)
│   │   ├── layout/                  ThemeToggle (claro/escuro do site público)
│   │   ├── articles/                ArticleCard, ListenButton (TTS), ShareButtons, SearchResults
│   │   ├── admin/                   AuthProvider, Sidebar, Topbar, KpiCard, ArticleEditorForm
│   │   └── ui/                      Button, Badge (Design System)
│   ├── content/                    Conteúdo público (gerado por sync-content.mjs em CI;
│   │                                versão de exemplo commitada para dev local sem Supabase)
│   ├── hooks/                      useSession, useSupabaseQuery
│   ├── lib/
│   │   ├── content.ts               Camada de leitura do site público (lê src/content/*.json)
│   │   └── supabase/                 client.ts, auth.ts, queries.ts, audit.ts (admin, runtime)
│   └── types/                      types/index.ts (conteúdo público) e types/database.ts (Supabase)
├── .github/workflows/deploy.yml    CI: lint → sync-content → build → deploy no GitHub Pages
└── .env.local.example
```

## Rodando localmente

```bash
npm install
cp .env.local.example .env.local   # preencha com as credenciais do seu projeto Supabase
npm run dev
```

Acesse `http://localhost:3000`. O painel administrativo fica em `/admin/login`.

Sem `.env.local` configurado, o site público continua funcionando normalmente (usa o conteúdo de
exemplo versionado em `src/content/`), mas o painel administrativo não consegue autenticar.

Outros comandos:

```bash
npm run build          # build de produção (export estático em ./out)
npm run start          # sobe o build de produção
npm run lint            # ESLint
npm run typecheck       # tsc --noEmit
npm run test            # testes unitários/componente (Vitest + Testing Library)
npm run test:e2e        # smoke tests E2E (Playwright, serve ./out estático)
npm run sync-content    # busca conteúdo publicado no Supabase e atualiza src/content/*.json
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

## Configurando o Supabase (obrigatório para o painel funcionar de verdade)

### 1. Criar o projeto

Crie um projeto em [supabase.com](https://supabase.com/dashboard) (plano gratuito é suficiente
para começar). Anote a **Project URL** e a **anon key** (Project Settings → API).

### 2. Aplicar o schema

Com o [Supabase CLI](https://supabase.com/docs/guides/cli) instalado:

```bash
npx supabase login
npx supabase link --project-ref <seu-project-ref>
npx supabase db push        # aplica supabase/migrations/0001_init.sql
```

Depois, rode `supabase/seed.sql` uma vez (SQL Editor do painel Supabase, ou
`npx supabase db execute -f supabase/seed.sql`) para popular editorias e tags iniciais.

### 3. Criar o primeiro usuário admin

Matérias e o proprio usuário staff só existem depois de um login real (o trigger
`handle_new_user` cria a linha em `profiles` automaticamente). Passos:

1. No painel do Supabase → Authentication → Users → **Add user**, crie seu usuário com e-mail e
   senha.
2. No SQL Editor, promova-o a admin:
   ```sql
   update public.profiles set role = 'admin' where email = 'voce@exemplo.com';
   ```
3. Faça login em `/admin/login` com esse e-mail/senha.

Os próximos usuários podem ser convidados direto pela tela **Usuários** do painel (que chama a
Edge Function `invite-user`).

### 4. Deploy das Edge Functions

```bash
npx supabase functions deploy invite-user
npx supabase functions deploy trigger-rebuild

# Secrets usados pelas functions (nunca ficam no código nem no navegador):
npx supabase secrets set GITHUB_PAT=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
npx supabase secrets set GITHUB_REPO=Albertinoblima/portal-polis
```

O `GITHUB_PAT` precisa de um [token de acesso pessoal](https://github.com/settings/tokens) com
escopo `repo` (ou um fine-grained token com permissão de "Contents: write" só neste repositório),
usado exclusivamente para disparar o rebuild via `repository_dispatch`.

`SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` já ficam disponíveis
automaticamente dentro das Edge Functions — não precisam ser configurados manualmente.

### 5. Configurar os secrets do GitHub Actions

No repositório GitHub → Settings → Secrets and variables → Actions, adicione:

| Secret | Valor |
|---|---|
| `SUPABASE_URL` | Project URL do Supabase |
| `SUPABASE_ANON_KEY` | anon key do Supabase |

Esses dois secrets alimentam tanto `scripts/sync-content.mjs` (geração do site público) quanto o
bundle do navegador do painel administrativo (`NEXT_PUBLIC_SUPABASE_URL`/`_ANON_KEY`, definidos a
partir dos mesmos secrets em `.github/workflows/deploy.yml`).

### 6. Segurança dos dados

Toda escrita é validada por Row Level Security no Postgres — não pelo front-end. Ver
`supabase/migrations/0001_init.sql` para a matriz completa de permissões por papel. Regras
centrais:

- Leitor anônimo só lê matérias com `status = 'published'` e `published_at <= now()`.
- `reviewer`/`columnist` só editam as próprias matérias, e o banco **rejeita** qualquer tentativa
  deles de setar `status` para `approved`/`published`/`scheduled` — mesmo chamando a API
  diretamente, sem passar pela UI.
- Só `admin` convida novos usuários e só `admin`/`editor_chief` leem a newsletter e os
  audit logs.

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
