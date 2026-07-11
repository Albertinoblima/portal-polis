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
│   │   ├── (site)/                 Rotas públicas (Home, Matéria, Editoria, Busca, ...)
│   │   └── admin/                  Painel administrativo
│   │       ├── login/, esqueci-senha/, redefinir-senha/   (sem sidebar)
│   │       └── (painel)/           Rotas protegidas por AuthProvider + AdminSidebar
│   │           ├── dashboard/, materias/, materias/nova/, materias/editar/
│   │           ├── categorias/, usuarios/, midia/, banners/, configuracoes/
│   ├── components/
│   │   ├── layout/                 Header, Footer (site público)
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
npm run sync-content    # busca conteúdo publicado no Supabase e atualiza src/content/*.json
```

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
