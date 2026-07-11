# Pólis — Onde a política faz sentido

Portal de jornalismo político. Este repositório contém o código-fonte do site público e do
painel administrativo (CMS), construídos em **Next.js 15+ (App Router) + React + TypeScript +
Tailwind CSS**.

O planejamento completo do produto está documentado em [`docs/`](./docs).

## Estado atual do projeto

Esta é a **primeira versão da árvore de código**: estrutura de pastas, rotas, tipos de dados,
componentes de design system e conteúdo de exemplo, tudo já compilando e navegável. O conteúdo
das matérias vem de arquivos JSON locais (`src/content/`) em vez de uma API real — isso permite
validar toda a experiência (público + admin) sem depender ainda do backend.

**Próximo passo combinado:** construir o **Painel Administrativo** (autenticação, workflow
editorial rascunho → revisão → publicação, upload de mídia real) antes de conectar a um backend
e substituir o conteúdo estático por dados dinâmicos.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js (App Router) |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS v4 (tema com a identidade visual do Pólis) |
| Fontes | Inter (interface), EB Garamond (editorial/citações), JetBrains Mono (dados) |
| Conteúdo (Fase 1) | JSON local em `src/content/` |
| Hospedagem alvo | GitHub (Pages/Vercel) |

## Estrutura de pastas

```
PORTAL-POLIS/
├── docs/                        Documentação de planejamento (visão, marca, wireframes,
│                                 fluxos, arquitetura, API, QA, hospedagem, roadmap)
├── public/
│   ├── brand/                   Logos oficiais (LOGO_COMPLETA, LOGO_MARCA, ...)
│   └── favicon-*.png, site.webmanifest
├── src/
│   ├── app/
│   │   ├── layout.tsx           Layout raiz (fontes, metadata global)
│   │   ├── globals.css          Tema Tailwind (cores, tipografia)
│   │   ├── (site)/               Rotas públicas — usam Header + Footer
│   │   │   ├── page.tsx           Home
│   │   │   ├── materia/[slug]/    Página de matéria (TTS, compartilhar, relacionadas)
│   │   │   ├── editoria/[slug]/   Listagem por editoria
│   │   │   ├── colunistas/        Listagem de colunistas
│   │   │   ├── colunista/[slug]/  Página de colunista/autor
│   │   │   ├── busca/             Busca
│   │   │   ├── sobre/, contato/, newsletter/
│   │   │   └── politica-de-privacidade/, termos-de-uso/, lgpd/
│   │   └── admin/                Painel administrativo (CMS)
│   │       ├── login/              Login (sem sidebar)
│   │       └── (painel)/           Rotas protegidas — usam AdminSidebar
│   │           ├── dashboard/
│   │           ├── materias/, materias/nova/, materias/[id]/editar/
│   │           ├── categorias/, usuarios/, midia/, banners/, configuracoes/
│   ├── components/
│   │   ├── layout/               Header, Footer
│   │   ├── articles/              ArticleCard, ListenButton (TTS), ShareButtons
│   │   ├── admin/                 Sidebar, Topbar, KpiCard, ArticleEditorForm
│   │   └── ui/                    Button, Badge (Design System)
│   ├── content/                  Dados de exemplo (editorias, autores, matérias) em JSON
│   ├── lib/                      content.ts (camada de acesso a dados) e utils.ts
│   └── types/                    Tipos TypeScript alinhados ao modelo de dados (MER)
├── package.json
└── tsconfig.json
```

A árvore de rotas segue o mapa do site definido em
[`docs/04_Fluxo_Navegacao_Arquitetura_Informacao_Polis_v1.0.md`](./docs/04_Fluxo_Navegacao_Arquitetura_Informacao_Polis_v1.0.md).

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`. O painel administrativo fica em `/admin/login`.

Outros comandos:

```bash
npm run build   # build de produção
npm run start   # sobe o build de produção
npm run lint    # ESLint
```

## Identidade visual

Cores e tipografia seguem
[`docs/02_Identidade_da_Marca_Polis_v1.0.md`](./docs/02_Identidade_da_Marca_Polis_v1.0.md) e
estão configuradas em `src/app/globals.css` como tokens Tailwind: `polis-navy`, `polis-gold`,
`polis-slate`, `polis-off-white`, `polis-newsprint`, entre outros.

## Roadmap

- **Fase 1 (atual):** MVP com leitura pública + painel administrativo completo, ainda sobre
  conteúdo local.
- **Fase 2:** Backend (NestJS + PostgreSQL + Prisma), autenticação real, IA responsável
  (resumos, recomendações), monetização inicial.
- **Fase 3:** Plataforma de dados, API pública, expansão de conteúdo e comunidade.

Detalhes completos em
[`docs/10_Roadmap_Evolucao_Completo_Fases_1_2_3_Polis_v1.0.md`](./docs/10_Roadmap_Evolucao_Completo_Fases_1_2_3_Polis_v1.0.md).
