# PORTAL PÓLIS
## Onde a política faz sentido

**DOCUMENTO DE FLUXO COMPLETO DE NAVEGAÇÃO + ARQUITETURA DA INFORMAÇÃO**  
**Projeto Executivo | Fase 1 — MVP**  
**Versão 1.0 | 10 de Julho de 2026**

---

**Elaborado por:** Arquitetura de Software Sênior | UX/UI Design | Jornalismo Digital

**Classificação:** Documento Confidencial — Uso Interno

**Documentos de Referência:**
- 01_Visao_Estrategica_Portal_Polis_v1.0.md
- 02_Identidade_da_Marca_Polis_v1.0.md
- 03_Wireframes_Todas_as_Paginas_Polis_v1.0.md

---

## SUMÁRIO

1. Objetivo deste Documento
2. Arquitetura da Informação
   - 2.1 Taxonomia e Hierarquia de Conteúdo
   - 2.2 Mapa do Site (Sitemap)
3. Navegação Global
   - 3.1 Header (Desktop e Mobile)
   - 3.2 Footer
   - 3.3 Breadcrumbs e Elementos de Orientação
4. Fluxos de Navegação — Leitor (Público)
   - 4.1 Fluxo Principal de Leitura (Home → Matéria com Virada de Página)
   - 4.2 Fluxo de Descoberta por Editoria
   - 4.3 Fluxo de Busca
   - 4.4 Fluxo de Newsletter e Engajamento
5. Fluxos de Navegação — Painel Administrativo
   - 5.1 Fluxo de Publicação de Matéria (Workflow Editorial)
   - 5.2 Fluxo de Gerenciamento de Conteúdo
   - 5.3 Fluxo de Administração de Usuários
6. Diagramas de Fluxo (Representação Visual)
7. Padrões de Navegação e Interação
8. Considerações Técnicas e de Performance
9. Boas Práticas de Arquitetura da Informação
10. Conclusão e Próximos Passos

---

## 1. OBJETIVO DESTE DOCUMENTO

Este documento define a **Arquitetura da Informação** e os **Fluxos Completos de Navegação** do Portal Pólis.

Seu objetivo é:

- Estabelecer uma estrutura clara, lógica e escalável de organização da informação
- Mapear todos os caminhos que usuários (leitores e administradores) podem percorrer
- Garantir que a experiência de “jornal sofisticado” seja suportada pela navegação
- Servir como referência para designers, desenvolvedores e product managers
- Antecipar pontos de fricção e otimizar a jornada do usuário

A navegação do Pólis deve reforçar os valores da marca: **confiança, sofisticação, profundidade e pluralidade**.

---

## 2. ARQUITETURA DA INFORMAÇÃO

### 2.1 Taxonomia e Hierarquia de Conteúdo

**Estrutura principal de classificação:**

```
Pólis
├── Editorias (nível principal - visível no menu)
│   ├── Política (Nacional)
│   ├── Municípios
│   ├── Eleições
│   ├── Editorial (Opinião institucional)
│   ├── Opinião (Colunistas)
│   ├── Bastidores
│   └── Radar Político (curadoria / mais relevantes)
│
├── Categorias (dentro de cada editoria)
│   └── Ex: Reforma Tributária, Congresso, Governos Estaduais, etc.
│
├── Tags (livres, para cruzamento de conteúdo)
│   └── Ex: #Lula, #Congresso, #SãoPaulo, #Eleições2026
│
└── Autores / Colunistas
    └── Perfis individuais com bio e lista de publicações
```

**Regras de Taxonomia:**
- Editorias são fixas e limitadas (máximo 7-8)
- Categorias são hierárquicas (uma matéria pode pertencer a múltiplas)
- Tags são livres e usadas para recomendações e buscas relacionadas
- Cada matéria deve ter **no mínimo 1 editoria** e **pelo menos 1 categoria**

### 2.2 Mapa do Site (Sitemap) — Fase 1

**Nível 1 (Menu Principal)**
- Home
- Política
- Municípios
- Eleições
- Editorial
- Opinião
- Bastidores
- Radar Político
- Colunistas
- Sobre
- Contato

**Nível 2 (Páginas de Conteúdo)**
- /materia/[slug]
- /editoria/[slug]
- /colunista/[slug]
- /busca
- /newsletter

**Nível 3 (Administrativo)**
- /admin (protegido)
  - /admin/dashboard
  - /admin/materias
  - /admin/materias/nova
  - /admin/materias/[id]/editar
  - /admin/categorias
  - /admin/usuarios
  - /admin/midia
  - /admin/configuracoes

**Páginas Legais / Institucionais**
- /politica-de-privacidade
- /termos-de-uso
- /lgpd

---

## 3. NAVEGAÇÃO GLOBAL

### 3.1 Header (Desktop)

**Estrutura recomendada:**

```
[Logo Pólis]          | Política | Municípios | Eleições | Editorial | Opinião | Bastidores | Radar | Colunistas | Sobre

[Campo de Busca] [Ícone Modo Escuro] [Ícone Newsletter] [Botão "Entrar" (Admin)]
```

**Comportamento:**
- Header fixo no scroll (com leve redução de altura após 100px de scroll)
- Menu com hover mostrando dropdowns sutis nas editorias com muitas subcategorias
- Botão “Entrar” leva ao login do painel administrativo

### 3.2 Header (Mobile)

- Logo centralizado ou à esquerda
- Ícone de hamburguer (abre drawer com navegação completa)
- Ícones de busca, modo escuro e perfil

### 3.3 Footer

**Colunas:**
1. Institucional (Sobre, Contato, Equipe, Transparência)
2. Editorias (links diretos)
3. Legal (Privacidade, Termos, LGPD, Correções)
4. Newsletter (formulário compacto)
5. Redes Sociais + Copyright

### 3.4 Elementos de Orientação

- **Breadcrumbs** em todas as páginas internas (exceto Home)
- **Nome da editoria** com cor de destaque na página de matéria (reforça identidade visual)
- **Indicador de “Você está lendo”** durante a leitura de matérias longas (barra de progresso sutil)

---

## 4. FLUXOS DE NAVEGAÇÃO — LEITOR (PÚBLICO)

### 4.1 Fluxo Principal de Leitura (Home → Matéria com Virada de Página)

**Caminho principal:**

```
Home
  ↓ (clique em card de matéria)
Animação de Virada de Página (300-400ms)
  ↓
Página da Matéria
  ↓ (leitura)
Ações disponíveis:
  - Ouvir matéria (TTS)
  - Compartilhar
  - Comentar
  - Matérias relacionadas (clique → nova virada de página)
  - Voltar (com animação reversa suave)
```

**Regras de UX:**
- A animação de virada de página só acontece em cliques em cards de matéria (não em links internos da matéria)
- Usuário pode desativar animações via `prefers-reduced-motion`
- Após a leitura, o sistema sugere **“Próxima leitura sugerida”** com base em tags e editoria

### 4.2 Fluxo de Descoberta por Editoria

```
Home ou Header
  ↓
Clique em Editoria (ex: Política)
  ↓
Página de Listagem da Editoria
  ↓ (filtros: Mais recentes | Mais lidas | Data)
Cards de matéria
  ↓
Clique → Virada de página → Matéria
```

### 4.3 Fluxo de Busca

```
Qualquer página
  ↓
Campo de busca (header)
  ↓
Página de Resultados
  ↓ (filtros laterais: Editoria | Período | Tipo)
Clique em resultado → Virada de página → Matéria
```

### 4.4 Fluxo de Newsletter

```
Home / Matéria / Footer
  ↓
Formulário de inscrição
  ↓
Confirmação por e-mail (double opt-in)
  ↓
Página de agradecimento + “Gerenciar preferências”
```

---

## 5. FLUXOS DE NAVEGAÇÃO — PAINEL ADMINISTRATIVO

### 5.1 Fluxo de Publicação de Matéria (Workflow Editorial)

Este é o fluxo mais importante do sistema.

```
Login no Painel
  ↓
Dashboard
  ↓
Clique em “+ Nova Matéria”
  ↓
Editor de Matéria
  ↓ (preenchimento)
Salvar como Rascunho (automático a cada 30s)
  ↓
Enviar para Revisão
  ↓
Notificação para Revisor / Editor-chefe
  ↓
Revisão → Comentários ou Aprovação
  ↓
Aprovação → Status muda para “Aprovado”
  ↓
Publicar agora OU Agendar publicação
  ↓
Matéria vai ao ar + Notificação para equipe + Indexação SEO
```

**Estados possíveis de uma matéria:**
- Rascunho
- Em Revisão
- Aprovado
- Publicado
- Agendado
- Arquivado

### 5.2 Fluxo de Gerenciamento de Conteúdo

```
Admin → Matérias
  ↓
Filtros + Busca
  ↓
Ações em massa (publicar, arquivar, mover de editoria)
  ↓
Clique em matéria → Editar (mesmo fluxo acima)
```

### 5.3 Fluxo de Administração de Usuários

```
Admin → Usuários
  ↓
Criar novo usuário → Definir papel (RBAC)
  ↓
Editar permissões por editoria (ex: “Pode publicar apenas em Municípios”)
  ↓
Desativar usuário (mantém histórico de alterações)
```

---

## 6. DIAGRAMAS DE FLUXO (Representação Visual)

### Fluxo de Publicação de Matéria (simplificado)

```
Rascunho ──► Em Revisão ──► Aprovado ──► Publicado
   │              │              │
   └── Salvar     └── Rejeitar   └── Agendar
```

### Fluxo de Leitura com Virada de Página

```
Home / Listagem
      │
      ▼ (clique)
Animação de Virada de Página (300-400ms)
      │
      ▼
Página da Matéria
      │
      ├── TTS
      ├── Compartilhar
      ├── Comentar
      └── Matérias Relacionadas → (nova virada)
```

---

## 7. PADRÕES DE NAVEGAÇÃO E INTERAÇÃO

- **Navegação persistente**: Header fixo + breadcrumbs
- **Navegação contextual**: “Leia também” e “Da mesma editoria” no final das matérias
- **Navegação por tags**: Clique em tag leva para busca filtrada
- **Deep linking**: Toda matéria, categoria e autor tem URL limpa e estável
- **Histórico de navegação**: Botão “Voltar” deve respeitar o fluxo (incluindo animação reversa quando aplicável)

---

## 8. CONSIDERAÇÕES TÉCNICAS E DE PERFORMANCE

- A navegação deve ser **instantânea** sempre que possível (prefetch de links importantes)
- A animação de virada de página deve carregar o conteúdo da próxima página em paralelo (otimização percebida)
- Implementar **View Transitions API** (quando suportado) como fallback moderno para a virada de página
- Manter URLs estáveis e amigáveis para SEO e compartilhamento
- Breadcrumbs devem ser implementados com dados estruturados (Schema.org)

---

## 9. BOAS PRÁTICAS DE ARQUITETURA DA INFORMAÇÃO

1. **Menos é mais**: Limitar o número de editorias no menu principal
2. **Consistência**: Mesma estrutura de navegação em todas as páginas de conteúdo
3. **Orientação clara**: Sempre mostrar onde o usuário está
4. **Previsibilidade**: O usuário deve conseguir antecipar o que acontece ao clicar em algo
5. **Acessibilidade**: Toda navegação deve funcionar 100% via teclado
6. **Mobile**: Menu hamburguer deve dar acesso a **toda** a navegação (não esconder editorias)

---

## 10. CONCLUSÃO E PRÓXIMOS PASSOS

Este documento consolida a **Arquitetura da Informação** e os **Fluxos de Navegação** do Portal Pólis, garantindo que a experiência de leitura premium e o workflow editorial robusto estejam perfeitamente integrados.

Com os Wireframes + este documento de Fluxos, a equipe de desenvolvimento possui base suficiente para iniciar a implementação da navegação e da estrutura de componentes.

**Próximo documento recomendado:**

**Especificação Funcional Detalhada de cada Recurso**  
(ou **Arquitetura Técnica do Sistema**)

---

**— Fim do Documento de Fluxo de Navegação + Arquitetura da Informação v1.0 —**

**Aguardando sua aprovação para continuar.**

---

*Este documento deve ser atualizado sempre que houver mudanças significativas na taxonomia ou nos fluxos principais.*