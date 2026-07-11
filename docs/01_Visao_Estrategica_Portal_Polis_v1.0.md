# PORTAL PÓLIS
## Onde a política faz sentido

**DOCUMENTO DE VISÃO ESTRATÉGICA**  
**Projeto Executivo | Fase 1 — MVP**  
**Versão 1.0 | 10 de Julho de 2026**

---

**Elaborado por:** Arquitetura de Software Sênior | UX/UI Design | Jornalismo Digital | Especialista em SEO, Segurança e LGPD

**Classificação:** Documento Confidencial — Uso Interno Estratégico

**Logo Oficial:**  
![Logo Pólis](/home/workdir/artifacts/LOGO_COMPLETA.png)

---

## SUMÁRIO

1. Objetivo do Documento
2. Visão Geral do Produto
   - 2.1 Conceito Central
   - 2.2 Proposta de Valor Única (UVP)
   - 2.3 Declaração de Visão
3. Objetivos Estratégicos
4. Público-Alvo e Personas
5. Análise de Mercado e Diferenciais Competitivos
6. Requisitos Não-Funcionais de Alto Nível
7. Arquitetura Técnica de Alto Nível (Fase 1)
8. Roadmap Macro — Fase 1 (MVP)
9. Riscos e Estratégias de Mitigação
10. Métricas de Sucesso e KPIs
11. Próximos Passos e Recomendações
12. Conclusão

---

## 1. OBJETIVO DO DOCUMENTO

Este documento estabelece a **visão estratégica completa** para o desenvolvimento do **Portal Pólis** — uma plataforma moderna de jornalismo político que transcende o conceito tradicional de blog ou site de notícias.

O objetivo é fornecer uma base sólida, detalhada e profissional para que equipes de desenvolvimento, design, produto e gestão possam executar o projeto com excelência técnica e editorial, alcançando padrões comparáveis aos maiores portais de notícias do Brasil (Folha, Estadão, Poder360, etc.).

Este documento define:
- O conceito central e a proposta de valor única
- Os objetivos estratégicos mensuráveis
- O público-alvo e personas
- Os diferenciais competitivos
- A arquitetura de alto nível
- Os critérios de sucesso

Ele serve como **referência oficial** para todas as decisões de produto, tecnologia e experiência do usuário ao longo do ciclo de vida do projeto.

### 1.1 Escopo

Este documento abrange exclusivamente a **Fase 1 (MVP)** do projeto. 

**Funcionalidades de Inteligência Artificial** (resumos automáticos, perguntas sobre matérias, recomendações personalizadas, análise de tendências) estão **explicitamente planejadas para a Fase 2** e **não fazem parte do escopo inicial**.

---

## 2. VISÃO GERAL DO PRODUTO

### 2.1 Conceito Central

O nome **"Pólis"** remete às cidades-estado da Grécia Antiga, berço da democracia, do debate público e da cidadania ativa. O portal materializa esse conceito ao oferecer um espaço onde a **política "faz sentido"** — ou seja, onde a informação política é contextualizada, aprofundada e apresentada com rigor jornalístico, sem sensacionalismo ou polarização gratuita.

A identidade visual e a experiência de usuário unem **tradição e tecnologia**:

- O layout evoca a sofisticação dos jornais impressos clássicos (hierarquia tipográfica clara, colunas, "virada de página").
- A tecnologia (Next.js, animações GPU-aceleradas, arquitetura escalável) garante fluidez, acessibilidade e performance de nível internacional.

**Diferencial central:** Ao clicar em uma matéria, a página realiza uma **animação suave de virada de folha** (250 a 400 ms, acelerada por GPU via CSS 3D), simulando a abertura de um caderno de jornal. Não é um efeito exagerado — é uma experiência elegante que transmite credibilidade, leveza e sofisticação.

### 2.2 Proposta de Valor Única (UVP)

O Pólis não é apenas mais um portal de notícias. É uma **plataforma de jornalismo político premium** com os seguintes pilares:

| Pilar | Descrição |
|-------|-----------|
| **Experiência de Leitura Imersiva** | Animação de virada de página que cria conexão emocional e diferencia radicalmente do scroll infinito de blogs convencionais. |
| **Jornalismo Explicativo e Contextual** | Matérias que vão além do factual: contexto histórico, dados, vozes diversas, análise de impactos reais na vida do cidadão. |
| **Identidade Visual Sofisticada** | Combinação de elementos clássicos (coluna grega no logo) com modernidade (skyline urbano dourado), transmitindo credibilidade e inovação. |
| **Plataforma Completa (não blog)** | CMS robusto com workflow editorial completo (rascunho → revisão → aprovação → publicação), versionamento, agendamento, SEO por página, biblioteca de mídia, banners gerenciáveis, multi-autor. |
| **Foco em Municípios e Política Local** | Editoria dedicada aos municípios brasileiros — onde grande parte da política relevante acontece e é pouco coberta com profundidade. |

### 2.3 Declaração de Visão

> **“Ser a principal referência nacional de jornalismo político inteligente, contextual e confiável, onde cidadãos encontram sentido na política através de uma experiência de leitura digna do melhor jornalismo impresso adaptado ao digital.”**

---

## 3. OBJETIVOS ESTRATÉGICOS

Os objetivos abaixo são **mensuráveis** e alinhados com o posicionamento de produto premium de jornalismo político.

| Objetivo | Meta (12 meses) | Indicador-Chave (KPI) |
|----------|-----------------|-----------------------|
| **Posicionamento de Marca** | Ser reconhecido entre os 5 principais portais de jornalismo político do Brasil | Brand Awareness (pesquisa), Share of Voice |
| **Tráfego Qualificado** | 150.000 sessões/mês orgânicas até o mês 12 | Sessões orgânicas (GA4), Tempo médio de sessão > 4 min |
| **Engajamento Profundo** | Tempo médio de leitura por matéria > 5 minutos | Scroll depth médio > 70%, Páginas por sessão > 3.5 |
| **Credibilidade Editorial** | Índice de correção de erros < 0.5% das matérias publicadas | Erros corrigidos / Total publicadas, Reclamações de leitores |
| **Crescimento de Audiência** | Base de newsletter > 25.000 inscritos ativos | Taxa de abertura > 35%, Crescimento mensal > 8% |

---

## 4. PÚBLICO-ALVO E PERSONAS

O Pólis **não visa audiência de massa genérica**. Seu público é qualificado, interessado em política de forma substantiva e valoriza profundidade, contexto e qualidade editorial.

### 4.1 Segmentos Principais

- **Leitores engajados**: Cidadãos com alto interesse em política nacional, estadual e municipal.
- **Profissionais e formadores de opinião**: Jornalistas, analistas políticos, assessores, advogados, gestores públicos.
- **Estudantes e academia**: Universitários de Ciências Políticas, Direito, Jornalismo, Sociologia.
- **Cidadãos conscientes locais**: Interessados na política de seus municípios.

### 4.2 Personas Detalhadas

| Persona | Perfil e Necessidades | Como o Pólis Atende |
|---------|-----------------------|---------------------|
| **Dra. Ana Clara, 42**<br>Analista Política Sênior (Think Tank - Brasília) | Precisa de análises profundas, dados confiáveis e contexto histórico para elaborar relatórios e recomendações de política pública. | Editoria "Radar Político" e "Bastidores". Matérias com dados abertos, infográficos explicativos e histórico de projetos de lei. Filtros por tema e ente federativo. |
| **Carlos Eduardo, 35**<br>Empresário e Conselheiro Municipal (Interior de SP) | Acompanha política local e nacional para tomar decisões de negócio e participar de conselhos municipais. | Editoria "Municípios" com foco em boas práticas, impacto de leis no local e cobertura de Câmaras Municipais. Newsletter segmentada por região. |
| **Mariana Lopes, 28**<br>Jornalista Política (Veículo Regional) | Busca pautas, fontes e contexto para produzir reportagens de qualidade com prazos apertados. | Sistema de tags e categorias robusto, histórico de versões, biblioteca de documentos e imagens de alta qualidade. |
| **Prof. Roberto Mendes, 58**<br>Professor de Ciência Política (Universidade Federal) | Usa o portal como fonte para aulas e pesquisas. Valoriza rigor acadêmico e pluralidade de vozes. | Colunistas com formação acadêmica, seção "Editorial" com análises aprofundadas, RSS estruturado para agregadores acadêmicos. |

---

## 5. ANÁLISE DE MERCADO E DIFERENCIAIS COMPETITIVOS

### 5.1 Posicionamento no Ecossistema

O mercado brasileiro de jornalismo político digital é dominado por:
- Grandes veículos generalistas (Folha, Estadão, O Globo)
- Veículos nativos digitais mais rápidos e opinativos (Poder360, Metrópoles, etc.)

Existe uma **lacuna clara** para um veículo que combine:
- Profundidade e contexto (ausente em veículos de breaking news)
- Credibilidade e pluralidade (ausente em muitos veículos opinativos)
- Experiência de usuário premium e "jornalística" (inexistente na maioria dos sites atuais)

### 5.2 Matriz SWOT

| **FORÇAS** | **FRAQUEZAS** |
|------------|---------------|
| Experiência de leitura única (virada de página) | Marca nova (sem reconhecimento inicial) |
| Identidade visual sofisticada e memorável | Necessidade de construir audiência do zero |
| Foco editorial em "política que faz sentido" | Custo de produção de conteúdo de qualidade |
| Arquitetura técnica moderna e escalável | Dependência de talentos jornalísticos especializados |
| Time com expertise em jornalismo + tecnologia | — |

| **OPORTUNIDADES** | **AMEAÇAS** |
|-------------------|-------------|
| Crescimento da demanda por jornalismo explicativo | Concorrência agressiva de grandes grupos de mídia |
| Desconfiança crescente em relação a fake news e sensacionalismo | Algoritmos de redes sociais favorecendo conteúdo polarizante |
| Expansão do consumo de notícias em dispositivos móveis com boa UX | Crise de sustentabilidade financeira do jornalismo |
| Parcerias com universidades, ONGs e órgãos públicos | Mudanças regulatórias (PL das Fake News, etc.) |
| Monetização via conteúdo premium e eventos (Fase 2+) | Fadiga de audiência com excesso de conteúdo político |

### 5.3 Diferenciais-Chave

Diferente de portais que priorizam **velocidade e volume**, o Pólis prioriza **qualidade, profundidade e experiência**. A animação de virada de página não é mero "efeito": é um *statement* de que o leitor merece uma experiência digna, que convida à reflexão em vez de consumo rápido e superficial.

---

## 6. REQUISITOS NÃO-FUNCIONAIS DE ALTO NÍVEL

| Categoria | Requisito |
|-----------|-----------|
| **Performance** | LCP < 2.5s, INP < 200ms, CLS < 0.1 (Core Web Vitals "Good"). Tempo de carregamento inicial < 3s em conexão 4G. Animações estáveis a 60fps. |
| **Acessibilidade** | Conformidade WCAG 2.2 AA. Suporte completo a leitores de tela. Contraste mínimo 4.5:1. Navegação por teclado. Text-to-Speech nativo nas matérias. |
| **Segurança** | HTTPS obrigatório. Proteção contra OWASP Top 10. Autenticação JWT + refresh tokens. Rate limiting. Logs de auditoria imutáveis. Backup diário criptografado. |
| **Escalabilidade** | Preparado para 1M+ sessões/mês sem degradação. CDN global. Cache agressivo. Banco de dados com pooling e read replicas. |
| **SEO** | Schema.org completo (Article, NewsArticle, Organization, Person). Open Graph otimizado. Sitemap.xml dinâmico. RSS 2.0 + Atom. Meta tags por página editáveis no CMS. |
| **LGPD & Privacidade** | Consentimento granular para cookies e newsletter. Direito ao esquecimento. Minimização de dados. Política de privacidade clara. DPO designado. |

---

## 7. ARQUITETURA TÉCNICA DE ALTO NÍVEL (FASE 1)

### 7.1 Stack Tecnológica Recomendada

| Camada | Tecnologia e Justificativa |
|--------|----------------------------|
| **Frontend** | Next.js 15 (App Router) + React 19 + TypeScript. Tailwind CSS para Design System. Framer Motion para animações de página (virada de folha com CSS 3D + GPU). |
| **Backend / API** | Node.js + NestJS (ou Express modular). API REST bem documentada (OpenAPI/Swagger). Autenticação JWT + RBAC. |
| **Banco de Dados** | PostgreSQL 16 (principal) + Redis para cache e sessões. Prisma ORM para type-safety. Migrações versionadas. |
| **CMS / Admin** | Painel administrativo customizado em Next.js. Editor WYSIWYG (TipTap ou Lexical) + modo HTML bruto. Workflow editorial completo. |
| **Armazenamento** | AWS S3 (ou compatível) para imagens, documentos e uploads. CDN (CloudFront ou Bunny.net) para assets estáticos. |
| **Hospedagem** | Vercel (frontend) + Railway / Render / AWS ECS (backend). GitHub Actions para CI/CD. |
| **Observabilidade** | Sentry (erros), Logtail / Better Stack (logs), PostHog ou Plausible (analytics privacy-friendly). Uptime monitoring. |

### 7.2 Princípios Arquiteturais

- **Modularidade**: Sistema desenvolvido em módulos independentes (Notícias, Páginas Institucionais, Usuários, Newsletter, etc.).
- **Separação de responsabilidades**: Frontend de consumo vs. Painel Administrativo vs. API.
- **Data-driven**: Decisões de produto baseadas em dados (analytics, heatmaps, A/B tests futuros).
- **Mobile-first + Progressive Enhancement**: Experiência excelente em mobile, com enriquecimento progressivo em desktop.
- **Design System único**: Todos os componentes documentados e reutilizáveis entre portal e admin.

---

## 8. ROADMAP MACRO — FASE 1 (MVP)

Duração estimada: **4 a 6 meses** (dependendo do tamanho do time).

| Sprint / Fase | Entregas Principais | Critérios de Aceite |
|---------------|---------------------|---------------------|
| **Sprint 0 (Setup)** | Repositórios, CI/CD, Design System inicial, ambiente de staging, documentação técnica base. | Pipeline de deploy automatizado. Storybook rodando. Primeiras páginas estáticas publicadas. |
| **Sprint 1-2 (Foundation)** | Home com layout de jornal. Sistema de notícias básico (CRUD). Editor WYSIWYG. Autenticação e RBAC inicial. Banco de dados modelado. | Home responsiva e com animação de destaque. Criação/publicação de matéria funcionando end-to-end. |
| **Sprint 3-4 (Core UX)** | Animação de virada de página (Framer Motion + CSS 3D). Página de matéria completa com TTS, tempo de leitura, relacionados, compartilhamento. Modo escuro. | Animação estável a 60fps. Experiência de leitura validada por testes de usuário internos. |
| **Sprint 5-6 (Content & SEO)** | Editorias e categorias completas. Sistema de tags. Autores e colunistas. SEO por página + Schema.org. Sitemap e RSS. Biblioteca de imagens. | Todas as editorias navegáveis. Matérias indexáveis e com rich snippets. 20+ matérias de exemplo publicadas. |
| **Sprint 7-8 (Admin & Ops)** | Painel administrativo completo (dashboard, usuários, aprovações, logs). Newsletter básica. Comentários moderados. Backup automatizado. Configurações gerais. | Workflow editorial completo (rascunho → revisão → publicado). Logs de auditoria funcionando. LGPD compliance checklist aprovado. |
| **Sprint 9 (Launch Prep)** | Testes de carga, segurança e acessibilidade. Ajustes de performance. Política de privacidade e termos. Plano de comunicação de lançamento. | Zero critical bugs. Lighthouse score > 90 em todas as categorias. Documentação de handoff completa. |

---

## 9. RISCOS E ESTRATÉGIAS DE MITIGAÇÃO

| Risco | Probabilidade / Impacto | Mitigação |
|-------|-------------------------|-----------|
| Baixa adoção inicial da audiência | Média / Alta | Investir pesado em SEO desde o dia 1. Parcerias com influenciadores e veículos complementares. Conteúdo de alta qualidade desde o lançamento. Campanha de newsletter com oferta de valor claro. |
| Dificuldade em manter consistência editorial | Média / Alta | Processo editorial rigoroso com checklist de qualidade. Editores experientes. Reuniões semanais de pauta e revisão. Style guide detalhado. |
| Complexidade técnica da animação de página | Média / Média | Prototipagem precoce com Framer Motion. Testes extensivos em dispositivos reais. Fallback graceful para browsers antigos. Métricas de performance monitoradas continuamente. |
| Custo de infraestrutura e ferramentas | Baixa / Média | Arquitetura serverless-first (Vercel, Supabase ou similar). Escolha de ferramentas open-source ou com free tier generoso. Monitoramento de custos desde o início. |
| LGPD e questões regulatórias | Média / Alta | Consultoria jurídica especializada desde a fase de planejamento. Implementação de consentimento granular. Documentação completa de tratamentos de dados. Auditoria pré-lançamento. |

---

## 10. MÉTRICAS DE SUCESSO E KPIs

Além dos KPIs estratégicos da seção 3, o time de produto acompanhará:

- **Core Web Vitals** (LCP, INP, CLS) — meta: todos em "Good"
- Taxa de rejeição por tipo de página (Home vs. Matéria)
- Profundidade de scroll médio nas matérias
- Taxa de conclusão de leitura (estimada via scroll + tempo)
- Uso do Text-to-Speech (quantas vezes ativado por sessão)
- Taxa de compartilhamento por matéria
- Tempo médio no painel administrativo por editor
- Taxa de aprovação na primeira revisão editorial
- NPS ou CSAT de leitores (pesquisa periódica)

---

## 11. PRÓXIMOS PASSOS E RECOMENDAÇÕES

Com a aprovação deste documento de Visão Estratégica, recomenda-se:

1. **Aprovação formal** deste documento pela liderança do projeto.
2. Elaboração do próximo documento: **Identidade da Marca Pólis — Onde a política faz sentido** (manual de uso do logo, paleta de cores completa, tipografia, ícones e voz da marca).
3. Definição do **time mínimo viável** (Product Owner, Tech Lead, UX/UI Lead, 1-2 desenvolvedores full-stack, 1 editor-chefe).
4. Kick-off do **Design System** e prototipagem de alta fidelidade das telas principais.
5. Definição do **backlog priorizado do MVP** com base neste documento.

### Recomendação de Melhoria (Proativa)

Sugiro que, ainda na Fase 1, seja implementado um sistema simples de **"Notas do Editor"** ou **"Contexto Adicional"** nas matérias, permitindo que o leitor entenda rapidamente o que mudou ou por que a matéria foi atualizada. Isso reforça transparência e credibilidade — valores centrais do Pólis.

---

## 12. CONCLUSÃO

O Portal Pólis tem o potencial de se tornar uma **referência nacional em jornalismo político de qualidade**, não apenas pela excelência do conteúdo, mas pela experiência única que oferece ao leitor.

A combinação de:
- Uma identidade visual sofisticada
- Uma experiência de leitura que evoca o melhor do jornalismo impresso
- Uma arquitetura técnica moderna e escalável

posiciona o projeto para competir em alto nível no mercado brasileiro.

Este documento de Visão Estratégica fornece a fundação necessária. Os próximos documentos detalharão cada aspecto (identidade visual, wireframes, arquitetura técnica, API, painel administrativo, etc.) com o mesmo rigor, permitindo que qualquer equipe qualificada execute o projeto com clareza e excelência.

**Estamos prontos para construir algo duradouro e significativo.**

---

**— Fim do Documento de Visão Estratégica v1.0 —**

**Aguardando sua aprovação para elaboração do próximo documento:**

**IDENTIDADE DA MARCA PÓLIS — ONDE A POLÍTICA FAZ SENTIDO**

*(Inclui: Manual completo de identidade visual, paleta de cores, tipografia, ícones, voz da marca, aplicações em diferentes contextos e guidelines de uso do logo)*

---

*Documento elaborado com rigor profissional, seguindo padrões de grandes empresas de tecnologia e veículos de comunicação de referência.*