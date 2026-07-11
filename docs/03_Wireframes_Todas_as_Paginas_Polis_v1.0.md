# PORTAL PÓLIS
## Onde a política faz sentido

**DOCUMENTO DE WIREFRAMES — ESBOÇOS DE TODAS AS PÁGINAS**  
**Projeto Executivo | Fase 1 — MVP**  
**Versão 1.0 | 10 de Julho de 2026**

---

**Elaborado por:** Arquitetura de Software Sênior | UX/UI Design | Jornalismo Digital

**Classificação:** Documento Confidencial — Uso Interno

**Referências de Identidade Visual:**  
Ver documento “02_Identidade_da_Marca_Polis_v1.0.md”

---

## SUMÁRIO

1. Objetivo deste Documento
2. Metodologia e Nível de Fidelidade
3. Lista Completa de Telas do Portal (Fase 1)
4. Wireframes — Páginas Públicas (Front-end)
   - 4.1 Home
   - 4.2 Página de Matéria (com animação de virada de página)
   - 4.3 Listagem por Editoria (Política, Municípios, Eleições, etc.)
   - 4.4 Página de Colunista / Autor
   - 4.5 Página de Busca
   - 4.6 Sobre o Pólis
   - 4.7 Contato
   - 4.8 Inscrição na Newsletter
5. Wireframes — Painel Administrativo
   - 5.1 Login
   - 5.2 Dashboard
   - 5.3 Lista de Matérias + Filtros
   - 5.4 Criar / Editar Matéria (Editor WYSIWYG + HTML)
   - 5.5 Pré-visualização de Matéria
   - 5.6 Gerenciamento de Categorias, Editorias e Tags
   - 5.7 Gerenciamento de Usuários e Permissões
   - 5.8 Biblioteca de Mídia e Uploads
   - 5.9 Gerenciamento de Banners e Destaques
   - 5.10 Configurações Gerais e SEO
6. Considerações de Responsividade (Mobile First)
7. Interações e Animações Críticas
8. Componentes Reutilizáveis (Design System)
9. Observações Técnicas e Boas Práticas
10. Conclusão e Próximos Passos

---

## 1. OBJETIVO DESTE DOCUMENTO

Este documento apresenta os **wireframes (esboços de baixa e média fidelidade)** de todas as telas principais do Portal Pólis na Fase 1 (MVP).

O objetivo é:

- Definir a estrutura de layout, hierarquia de informação e navegação de cada tela
- Garantir que a experiência de leitura premium (metáfora do jornal + animação de virada de página) esteja presente desde a concepção
- Servir como base para os designers criarem os mockups de alta fidelidade no Figma
- Permitir que desenvolvedores entendam a composição de componentes e interações esperadas
- Documentar o fluxo entre telas públicas e o Painel Administrativo

Os wireframes aqui descritos seguem rigorosamente a **Identidade Visual** definida no documento anterior e priorizam:

- Legibilidade excelente em leituras longas
- Hierarquia clara (como em jornais impressos)
- Performance e acessibilidade (WCAG 2.2 AA)
- Experiência mobile-first

---

## 2. METODOLOGIA E NÍVEL DE FIDELIDADE

- **Nível:** Média fidelidade (wireframes detalhados com anotações de interação)
- **Ferramenta recomendada para evolução:** Figma (com componentes do Design System)
- **Breakpoints considerados:**
  - Mobile: 360px – 480px
  - Tablet: 768px – 1024px
  - Desktop: 1280px+
- **Foco principal:** Desktop (experiência de leitura principal) + Mobile (acesso crescente)

Cada tela contém:
- Descrição do propósito
- Estrutura de layout (seções principais)
- Componentes chave
- Anotações de interação e comportamento
- Considerações de responsividade

---

## 3. LISTA COMPLETA DE TELAS DO PORTAL (FASE 1)

### Páginas Públicas (Leitor)

| #  | Tela                          | Prioridade | Tipo          |
|----|-------------------------------|------------|---------------|
| 1  | Home                          | Alta       | Pública       |
| 2  | Página de Matéria             | Alta       | Pública       |
| 3  | Listagem por Editoria         | Alta       | Pública       |
| 4  | Página de Colunista/Autor     | Média      | Pública       |
| 5  | Busca                         | Alta       | Pública       |
| 6  | Sobre o Pólis                 | Média      | Pública       |
| 7  | Contato                       | Média      | Pública       |
| 8  | Inscrição Newsletter          | Alta       | Pública       |

### Páginas Administrativas (CMS)

| #  | Tela                                      | Prioridade | Tipo          |
|----|-------------------------------------------|------------|---------------|
| 9  | Login do Painel                           | Alta       | Admin         |
| 10 | Dashboard                                 | Alta       | Admin         |
| 11 | Lista de Matérias + Filtros               | Alta       | Admin         |
| 12 | Criar / Editar Matéria (Editor)           | Alta       | Admin         |
| 13 | Pré-visualização de Matéria               | Alta       | Admin         |
| 14 | Gerenciamento de Categorias/Editorias/Tags| Alta       | Admin         |
| 15 | Gerenciamento de Usuários e Permissões    | Alta       | Admin         |
| 16 | Biblioteca de Mídia e Uploads             | Alta       | Admin         |
| 17 | Gerenciamento de Banners e Destaques      | Média      | Admin         |
| 18 | Configurações Gerais + SEO                | Alta       | Admin         |

---

## 4. WIREFRAMES — PÁGINAS PÚBLICAS (FRONT-END)

### 4.1 Tela: Home (Desktop)

**Propósito:**  
Primeira impressão. Transmitir sofisticação jornalística + dar acesso rápido às principais matérias e editorias.

**Estrutura de Layout (Desktop 1280px+):**

```
┌────────────────────────────────────────────────────────────┐
│ HEADER (fixo no scroll)                                    │
│ [Logo Pólis] | Menu: Home | Política | Municípios | ...   │
│ [Busca] [Modo Escuro] [Entrar (Admin)]                     │
├────────────────────────────────────────────────────────────┤
│ HERO / MANCHETE PRINCIPAL                                  │
│ (Imagem grande + título grande + subtítulo + "Ler mais")   │
├────────────────────────────────────────────────────────────┤
│ DESTAQUES DO DIA (Grid 3 colunas)                          │
│ Card 1 | Card 2 | Card 3                                   │
├────────────────────────────────────────────────────────────┤
│ EDIÇÕES EM DESTAQUE                                        │
│ [Política] [Municípios] [Eleições] [Editorial]             │
├────────────────────────────────────────────────────────────┤
│ ÚLTIMAS NOTÍCIAS (Grid 2 colunas + sidebar)                │
│ Matéria 1                  | Radar Político / Mais lidas   │
│ Matéria 2                  | Newsletter signup             │
│ ...                        | Colunistas em destaque        │
├────────────────────────────────────────────────────────────┤
│ RODAPÉ                                                     │
│ Links institucionais + Newsletter + Créditos               │
└────────────────────────────────────────────────────────────┘
```

**Anotações importantes:**
- Ao clicar em qualquer matéria → animação de **virada de página** (transição 300-400ms) levando para a tela da matéria.
- Grid de destaques com hover sutil (leve elevação + borda dourada fina).
- Sidebar com “Radar Político” (matérias mais relevantes do momento).

**Versão Mobile:**
- Hero em destaque full-width
- Grid de destaques vira carrossel horizontal ou lista vertical
- Menu hamburguer
- Priorizar conteúdo acima da dobra

---

### 4.2 Tela: Página de Matéria (Desktop) — A mais importante

**Propósito:**  
Oferecer a **melhor experiência de leitura** possível, simulando a abertura de um jornal de qualidade.

**Estrutura de Layout:**

```
┌────────────────────────────────────────────────────────────┐
│ HEADER (simplificado durante leitura)                      │
│ Logo pequeno | Nome da Editoria (com cor de borda)        │
├────────────────────────────────────────────────────────────┤
│ TÍTULO DA MATÉRIA (grande, hierarquia jornalística)        │
│ Subtítulo / Lide                                           │
│ [Autor] [Data] [Tempo de leitura] [Compartilhar]           │
├────────────────────────────────────────────────────────────┤
│ IMAGEM DE DESTAQUE (se houver)                             │
├────────────────────────────────────────────────────────────┤
│ CONTEÚDO DA MATÉRIA                                        │
│ (Tipografia confortável, 17-18px, line-height 1.7)         │
│                                                            │
│ Blocos de citação com borda dourada à esquerda             │
│                                                            │
│ [Botão: Ouvir matéria (Text-to-Speech)]                    │
│                                                            │
│ Matérias relacionadas (no final ou sidebar)                │
├────────────────────────────────────────────────────────────┤
│ RODAPÉ DA MATÉRIA                                          │
│ [Compartilhar] [Comentar] [Salvar para depois]             │
│ Créditos e fontes                                          │
└────────────────────────────────────────────────────────────┘
```

**Interação Crítica — Animação de Virada de Página:**

- Ao clicar em uma matéria na Home ou listagem:
  1. A tela atual “vira” como uma folha de jornal (efeito 3D CSS + Framer Motion)
  2. Duração: **300–400ms** (suave, não exagerada)
  3. GPU acelerada
  4. Ao final da animação, carrega o conteúdo da nova matéria
- O efeito deve ser **opcional** (respeitar `prefers-reduced-motion`)

**Elementos fixos durante leitura:**
- Barra superior com nome da editoria + botão “Voltar para Home”
- Botão flutuante “Ouvir esta matéria”

**Mobile:**
- Layout em coluna única
- Imagem de destaque menor
- Botão de TTS bem visível

---

### 4.3 Tela: Listagem por Editoria (ex: Política)

**Estrutura:**

- Header com nome da editoria + descrição curta
- Filtros: Data | Mais lidas | Mais comentadas
- Grid de cards de matéria (2 ou 3 colunas no desktop)
- Paginação ou “Carregar mais”
- Sidebar: “No Radar desta editoria” + Newsletter segmentada

**Anotação:**  
Cada card de matéria deve ter uma **pequena faixa colorida** na borda superior ou lateral representando a editoria (ex: azul escuro para Política, dourado para Editorial, etc.).

---

### 4.4 Tela: Página de Colunista / Autor

- Foto grande do colunista
- Bio curta + redes sociais
- Lista das últimas colunas/materias publicadas por ele
- Botão “Seguir este colunista” (futuro)

---

### 4.5 Tela: Busca

- Campo de busca grande e centralizado no topo
- Filtros: Editoria | Data | Tipo de conteúdo
- Resultados com destaque do termo buscado
- Sugestões de buscas relacionadas

---

### 4.6–4.8 Telas Institucionais (Sobre, Contato, Newsletter)

- Layout limpo, com bastante espaço em branco (sensação de sofisticação)
- Formulários bem estruturados (especialmente Newsletter e Contato)
- Mapa (se aplicável no Contato)

---

## 5. WIREFRAMES — PAINEL ADMINISTRATIVO

O Painel Administrativo é um dos **grandes diferenciais** do Pólis. Deve ser moderno, intuitivo e poderoso.

### 5.1 Tela: Login do Painel

- Logo centralizado
- Campos: E-mail + Senha
- Botão “Entrar”
- Link “Esqueci minha senha”
- Design limpo, sem distrações

### 5.2 Tela: Dashboard

**Layout:**

```
┌────────────────────────────────────────────────────────────┐
│ SIDEBAR (fixa)                                             │
│ Logo | Dashboard | Matérias | Categorias | Usuários | ... │
├────────────────────────────────────────────────────────────┤
│ HEADER: Saudação + Foto do usuário + Notificações         │
├────────────────────────────────────────────────────────────┤
│ KPIs RÁPIDOS (cards)                                       │
│ Publicadas hoje | Em revisão | Visualizações totais | ... │
├────────────────────────────────────────────────────────────┤
│ GRÁFICOS (mini)                                            │
│ Tráfego últimos 7 dias | Matérias mais lidas              │
├────────────────────────────────────────────────────────────┤
│ ATIVIDADE RECENTE                                          │
│ Lista das últimas ações (publicações, edições, etc.)      │
└────────────────────────────────────────────────────────────┘
```

**Anotação:** Integrar com Google Analytics ou ferramenta similar para dados em tempo real (conforme pedido original).

### 5.3 Tela: Lista de Matérias

- Tabela com: Título | Editoria | Autor | Status | Data | Ações
- Filtros avançados (status, editoria, autor, data)
- Botão grande “+ Nova Matéria”
- Busca rápida

### 5.4 Tela: Criar / Editar Matéria (Editor)

**Esta é uma das telas mais críticas.**

**Layout dividido em duas colunas (ou abas):**

**Coluna Esquerda (Editor):**
- Campo Título
- Campo Subtítulo / Lide
- **Editor Visual (WYSIWYG)** — TipTap ou Lexical (recomendado)
- Alternância: Modo Visual ↔ Modo HTML (código)
- Campos: Editoria | Categorias | Tags | Autor principal | Colunistas secundários
- Upload de imagem de destaque
- Configurações de SEO (meta title, description, slug)

**Coluna Direita (Sidebar):**
- Status: Rascunho | Em Revisão | Aprovado | Publicado
- Agendamento de publicação (data/hora)
- Botões: Salvar rascunho | Enviar para revisão | Publicar agora
- Pré-visualização (abre em nova aba ou modal)
- Histórico de versões (últimas 5 alterações)

**Anotação importante:**  
O editor deve permitir **inserção fácil de blocos** (citação, imagem, vídeo embed, tabela, etc.).

### 5.5 Tela: Pré-visualização de Matéria

- Renderização fiel da página pública
- Botão “Publicar” / “Voltar para edição”
- Simulação de mobile + desktop

### 5.6 Tela: Gerenciamento de Categorias, Editorias e Tags

- Árvore hierárquica de Editorias → Categorias
- CRUD completo
- Associação de cores por editoria (para bordas visuais nas matérias)

### 5.7 Tela: Gerenciamento de Usuários e Permissões

- Tabela de usuários
- Papéis: Administrador | Editor-chefe | Editor | Colunista | Revisor
- Permissões granulares por módulo (ex: só pode publicar em certas editorias)

### 5.8 Tela: Biblioteca de Mídia

- Grid de imagens e documentos
- Upload múltiplo com drag & drop
- Busca por nome / tags
- Uso em matérias (inserir diretamente do editor)

### 5.9–5.10 Outras telas administrativas

- Banners e Destaques da Home (drag & drop para reordenar)
- Configurações Gerais (nome do site, redes sociais, integrações)
- SEO global + Sitemap / RSS controls

---

## 6. CONSIDERAÇÕES DE RESPONSIVIDADE (MOBILE FIRST)

- Todo o portal deve funcionar **excelentemente em mobile**
- A animação de virada de página deve ter fallback suave em dispositivos de baixo desempenho
- Menus: Desktop = horizontal | Mobile = hamburguer + drawer
- Cards e grids: adaptáveis (1 coluna no mobile, 2-3 no desktop)
- Tipografia: escalável e legível em telas pequenas

---

## 7. INTERAÇÕES E ANIMAÇÕES CRÍTICAS

| Interação                        | Descrição                                      | Tecnologia sugerida     |
|----------------------------------|------------------------------------------------|-------------------------|
| Virada de página                 | 300-400ms, CSS 3D + GPU                        | Framer Motion           |
| Modo escuro / claro              | Transição suave                                | Tailwind + JS           |
| Text-to-Speech                   | Botão “Ouvir matéria”                          | Web Speech API          |
| Hover em cards                   | Elevação sutil + borda dourada                 | Tailwind transitions    |
| Scroll infinito / “Carregar mais”| Suave                                          | Intersection Observer   |
| Drag & drop de destaques (Admin) | Reordenar matérias na Home                     | @hello-pangea/dnd       |

---

## 8. COMPONENTES REUTILIZÁVEIS (DESIGN SYSTEM)

Recomenda-se criar um Design System com os seguintes componentes principais:

- Button (primário, secundário, ghost, danger)
- Card de Matéria
- Card de Colunista
- Header / Navbar
- Footer
- Input / Textarea / Select
- Modal
- Toast / Notificação
- Badge de Status (Publicado, Rascunho, etc.)
- Editor WYSIWYG customizado

---

## 9. OBSERVAÇÕES TÉCNICAS E BOAS PRÁTICAS

- Priorizar **acessibilidade** em todos os wireframes (alt texts, ARIA labels, navegação por teclado)
- Usar **componentes** desde o início para evitar duplicação de código
- A animação de virada de página deve ser **performática** (testar em dispositivos médios)
- Todo formulário do admin deve ter **validação em tempo real** e tratamento de erros claro
- Implementar **undo/redo** no editor de matérias (crítico para editores)
- Logs de alterações devem ser automáticos no backend

---

## 10. CONCLUSÃO E PRÓXIMOS PASSOS

Os wireframes aqui descritos fornecem uma base sólida e detalhada para o desenvolvimento do Portal Pólis.

Eles foram pensados para entregar:

- Uma experiência de leitura premium e diferenciada
- Um painel administrativo poderoso e intuitivo (grande diferencial competitivo)
- Consistência com a identidade visual e o conceito de “jornal sofisticado”

**Próximo documento recomendado:**

**Fluxo Completo de Navegação + Arquitetura da Informação**  
(ou diretamente **Especificação Funcional de cada recurso**)

---

**— Fim do Documento de Wireframes v1.0 —**

**Aguardando sua aprovação para continuar com o próximo documento.**

---

*Este documento será complementado futuramente com mockups de alta fidelidade no Figma, protótipos interativos e especificações técnicas detalhadas por tela.*