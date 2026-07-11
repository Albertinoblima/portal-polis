# PORTAL PÓLIS
## Onde a política faz sentido

**DOCUMENTO DE ESPECIFICAÇÃO FUNCIONAL DETALHADA DE CADA RECURSO**  
**Projeto Executivo | Fase 1 — MVP**  
**Versão 1.0 | 10 de Julho de 2026**

---

**Elaborado por:** Arquitetura de Software Sênior | UX/UI Design | Jornalismo Digital | Especialista em SEO e LGPD

**Classificação:** Documento Confidencial — Uso Interno

**Documentos de Referência:**
- 01_Visao_Estrategica_Portal_Polis_v1.0.md
- 02_Identidade_da_Marca_Polis_v1.0.md
- 03_Wireframes_Todas_as_Paginas_Polis_v1.0.md
- 04_Fluxo_Navegacao_Arquitetura_Informacao_Polis_v1.0.md

---

## SUMÁRIO

1. Objetivo deste Documento
2. Sistema de Matérias e Conteúdo Editorial
3. Sistema de Editorias, Categorias e Tags
4. Sistema de Autores e Colunistas
5. Sistema de Comentários
6. Sistema de Newsletter
7. Sistema de Busca Avançada
8. Sistema de Usuários, Perfis e Permissões (RBAC)
9. Sistema de Mídia, Uploads e Biblioteca
10. Sistema de Banners, Destaques e Publicidade
11. Sistema de Menus e Rodapé Editáveis
12. SEO Avançado, Open Graph, Schema.org, Sitemap e RSS
13. Histórico de Versões, Aprovação Editorial e Logs
14. Text-to-Speech (Leitura em Voz) e Tempo de Leitura
15. Animação de Virada de Página (Especificação Funcional)
16. Modo Escuro / Tema e Preferências do Usuário
17. Considerações Transversais (LGPD, Segurança, Performance)
18. Conclusão e Próximos Passos

---

## 1. OBJETIVO DESTE DOCUMENTO

Este documento apresenta a **Especificação Funcional Detalhada** de todos os recursos principais do Portal Pólis na Fase 1.

Ele serve como:
- Referência inequívoca para desenvolvedores implementarem cada funcionalidade
- Base para testes de aceitação (QA)
- Garantia de que todos os requisitos de negócio, UX e técnicos estão alinhados
- Documento oficial do projeto executivo

Cada recurso é descrito com:
- Objetivo
- Funcionalidades principais
- Requisitos funcionais detalhados
- Regras de negócio
- Integrações com outros módulos
- Considerações de UX/UI
- Observações técnicas

---

## 2. SISTEMA DE MATÉRIAS E CONTEÚDO EDITORIAL

### 2.1 Objetivo
Permitir a criação, edição, revisão, aprovação, agendamento e publicação de matérias jornalísticas com alto rigor editorial e excelente experiência de leitura.

### 2.2 Funcionalidades Principais

**No Painel Administrativo:**
- Criar nova matéria
- Editar matéria existente (Visual WYSIWYG + HTML bruto)
- Salvar automaticamente (autosave a cada 30 segundos)
- Enviar para revisão
- Aprovar / Rejeitar com comentários
- Publicar imediatamente ou agendar data/hora
- Visualizar histórico de versões
- Pré-visualizar exatamente como o leitor verá

**No Portal Público:**
- Exibir matéria com tipografia otimizada para leitura longa
- Animação de virada de página ao acessar
- Tempo estimado de leitura
- Botão de Text-to-Speech
- Matérias relacionadas
- Compartilhamento social
- Comentários (moderados)
- Breadcrumbs e navegação contextual

### 2.3 Requisitos Funcionais Detalhados

1. Toda matéria deve pertencer a **pelo menos uma Editoria**.
2. O slug deve ser gerado automaticamente a partir do título, mas editável.
3. O sistema deve suportar **blocos de conteúdo** no editor (parágrafo, citação, imagem, vídeo embed, tabela, lista, etc.).
4. Imagem de destaque é obrigatória para publicação.
5. É possível marcar matéria como “Patrocinada” ou “Conteúdo Especial” (com tratamento visual diferenciado).
6. Ao publicar, o sistema deve:
   - Gerar automaticamente meta tags de SEO
   - Atualizar sitemap
   - Notificar equipe via e-mail/Slack (configurável)
7. Matérias agendadas devem ser publicadas automaticamente via job/cron.
8. O editor deve permitir **inserção de embeds** de YouTube, Twitter/X, Instagram, etc., de forma segura.

### 2.4 Regras de Negócio

- Apenas usuários com permissão “Publicar” podem colocar matéria no ar.
- Matérias em revisão não aparecem publicamente.
- Todo publish gera uma nova versão no histórico.
- É possível reverter para qualquer versão anterior (com confirmação).

---

## 3. SISTEMA DE EDITORIAS, CATEGORIAS E TAGS

### 3.1 Objetivo
Organizar o conteúdo de forma hierárquica, permitindo navegação clara e recomendações inteligentes.

### 3.2 Funcionalidades

- CRUD de Editorias (limitado a admins)
- CRUD de Categorias (hierárquicas)
- CRUD de Tags (livres)
- Associação de cor por Editoria (usada nas bordas das matérias e navegação)
- Filtros automáticos em listagens

### 3.3 Requisitos Funcionais

1. Uma matéria pode pertencer a **múltiplas categorias**, mas apenas **uma editoria principal**.
2. Tags devem sugerir automaticamente durante a digitação (typeahead).
3. Ao criar uma nova tag ou categoria, o sistema sugere similar existentes para evitar duplicação.
4. Editorias aparecem no menu principal (máximo 8).

---

## 4. SISTEMA DE AUTORES E COLUNISTAS

### 4.1 Objetivo
Dar visibilidade e credibilidade aos profissionais que produzem conteúdo no Pólis.

### 4.2 Funcionalidades

- Perfil público de autor/colunista
- Bio, foto, redes sociais e e-mail de contato (opcional)
- Lista paginada de todas as matérias publicadas pelo autor
- Badge de “Colunista” vs “Editor/Repórter”
- Possibilidade de “Seguir autor” (Fase 1: apenas notificação por e-mail)

### 4.3 Requisitos Funcionais

1. Todo conteúdo publicado deve ter pelo menos um autor responsável.
2. Colunistas podem ter acesso restrito ao painel para editar apenas suas próprias matérias (permissão granular).

---

## 5. SISTEMA DE COMENTÁRIOS

### 5.1 Objetivo
Permitir debate qualificado e engajamento sem abrir mão do controle editorial.

### 5.2 Funcionalidades

- Comentários em matérias (ativado por editoria ou globalmente)
- Moderação prévia ou pós-publicação (configurável)
- Respostas aninhadas (1 nível)
- Like/Deslike em comentários (opcional)
- Reportar comentário inadequado
- Bloqueio de usuários por IP/e-mail

### 5.3 Regras de Negócio

- Comentários de usuários não logados exigem nome + e-mail + captcha.
- Comentários com links são automaticamente colocados em moderação.
- O sistema deve ter filtro básico de palavras ofensivas (lista configurável).

---

## 6. SISTEMA DE NEWSLETTER

### 6.1 Objetivo
Construir audiência direta e engajada.

### 6.2 Funcionalidades

- Inscrição em newsletter (double opt-in obrigatório)
- Segmentação por editorias de interesse (checkboxes)
- Envio de newsletters automáticas (diárias ou semanais) com as principais matérias
- Gerenciamento de preferências pelo próprio leitor
- Desinscrição com um clique (LGPD)

### 6.3 Requisitos Funcionais

1. O sistema deve integrar com provedor de e-mail transacional (ex: Resend, SendGrid, Amazon SES).
2. Taxa de abertura e cliques devem ser rastreadas (privacidade-friendly).
3. Newsletters devem respeitar o horário de preferência do usuário (quando possível).

---

## 7. SISTEMA DE BUSCA AVANÇADA

### 7.1 Objetivo
Permitir que leitores encontrem conteúdo de forma rápida e precisa.

### 7.2 Funcionalidades

- Busca full-text em títulos, subtítulos e corpo das matérias
- Filtros: Editoria, Categoria, Tag, Data, Autor
- Sugestões enquanto digita
- Resultados com destaque do termo buscado
- Ordenação: Relevância | Mais recentes | Mais lidas

### 7.3 Requisitos Funcionais

1. A busca deve ser indexada (recomenda-se Meilisearch, Typesense ou Elasticsearch na Fase 1, ou PostgreSQL full-text como solução inicial).
2. Resultados devem carregar em menos de 300ms.

---

## 8. SISTEMA DE USUÁRIOS, PERFIS E PERMISSÕES (RBAC)

### 8.1 Objetivo
Garantir controle granular de acesso e segurança editorial.

### 8.2 Papéis Padrão (Fase 1)

| Papel            | Permissões Principais                              |
|------------------|----------------------------------------------------|
| Administrador    | Acesso total                                       |
| Editor-chefe     | Aprovar/rejeitar tudo, gerenciar usuários         |
| Editor           | Criar, editar e enviar para revisão                |
| Revisor          | Revisar e aprovar/rejeitar matérias                |
| Colunista        | Criar e editar apenas suas próprias matérias       |
| Leitor (público) | Ler, comentar, inscrever newsletter                |

### 8.3 Requisitos Funcionais

1. Permissões podem ser refinadas por **Editoria** (ex: “Editor só pode publicar em Municípios”).
2. Todo login no painel deve gerar log de acesso.
3. Suporte a 2FA (TOTP) é altamente recomendado (mesmo que opcional na Fase 1).

---

## 9. SISTEMA DE MÍDIA, UPLOADS E BIBLIOTECA

### 9.1 Objetivo
Centralizar e organizar todos os arquivos de mídia do portal.

### 9.2 Funcionalidades

- Upload de imagens (com redimensionamento automático e otimização)
- Upload de documentos PDF
- Biblioteca com busca, tags e pastas
- Inserção direta de imagens do editor de matérias
- Geração automática de diferentes tamanhos (thumbnail, medium, large)
- Exclusão segura (verificar se imagem está em uso)

### 9.3 Requisitos Funcionais

1. Todos os uploads devem passar por otimização (WebP + fallback).
2. O sistema deve bloquear tipos de arquivo perigosos.
3. Imagens devem ter alt text editável.

---

## 10. SISTEMA DE BANNERS, DESTAQUES E PUBLICIDADE

### 10.1 Objetivo
Permitir destaque de matérias na Home e gerenciamento de espaços publicitários de forma simples.

### 10.2 Funcionalidades

- Destaques da Home por drag & drop (no admin)
- Banners em posições definidas (topo, sidebar, entre matérias)
- Controle de período de exibição do banner
- Relatório básico de impressões e cliques (Fase 1 simples)

### 10.3 Requisitos Funcionais

1. Destaques da Home devem ter limite de quantidade (ex: 6 matérias).
2. Banners devem suportar link externo ou interno.

---

## 11. SISTEMA DE MENUS E RODAPÉ EDITÁVEIS

### 11.1 Objetivo
Dar flexibilidade editorial sem depender de desenvolvedores para mudanças simples de navegação.

### 11.2 Funcionalidades

- Editor visual de menus (drag & drop de itens)
- Criação de menus secundários
- Edição do rodapé (links, textos institucionais)
- Suporte a links externos e internos

---

## 12. SEO AVANÇADO, OPEN GRAPH, SCHEMA.ORG, SITEMAP E RSS

### 12.1 Objetivo
Maximizar visibilidade orgânica e compartilhamento social.

### 12.2 Funcionalidades por Matéria

- Meta Title e Meta Description editáveis
- Open Graph tags automáticas (com fallback)
- Schema.org NewsArticle + Author + Organization
- Slug editável
- Indexação / No-index por matéria

### 12.3 Funcionalidades Globais

- Sitemap.xml dinâmico
- RSS feed por editoria e geral
- Robots.txt configurável

---

## 13. HISTÓRICO DE VERSÕES, APROVAÇÃO EDITORIAL E LOGS

### 13.1 Objetivo
Garantir rastreabilidade editorial e segurança.

### 13.2 Funcionalidades

- Todo save gera versão
- Comparação visual entre versões (diff)
- Restauração de versão anterior
- Log completo de ações (quem fez o quê, quando)
- Auditoria de publicações e alterações

---

## 14. TEXT-TO-SPEECH (LEITURA EM VOZ) E TEMPO DE LEITURA

### 14.1 Objetivo
Aumentar acessibilidade e tempo de permanência.

### 14.2 Funcionalidades

- Botão “Ouvir esta matéria” em todas as matérias
- Controle de velocidade, pausa e avanço
- Seleção de voz (quando disponível no navegador)
- Tempo estimado de leitura calculado automaticamente (baseado em palavras)

### 14.3 Requisitos Funcionais

1. Usar Web Speech API nativa do navegador (sem custo).
2. Fallback: oferecer transcrição em texto caso TTS não esteja disponível.

---

## 15. ANIMAÇÃO DE VIRADA DE PÁGINA (ESPECIFICAÇÃO FUNCIONAL)

### 15.1 Objetivo
Diferencial central de experiência — simular a abertura de um jornal.

### 15.2 Comportamento Esperado

- Disparada ao clicar em card de matéria na Home ou listagens
- Duração: **300 a 400 milissegundos**
- Efeito 3D suave (rotação no eixo Y com perspectiva)
- GPU acelerada (transform e backface-visibility)
- Durante a animação, o conteúdo da próxima página deve começar a carregar
- Respeitar `prefers-reduced-motion`
- Em dispositivos de baixa performance, fallback para transição simples de fade

### 15.3 Requisitos Técnicos

- Implementar com Framer Motion ou View Transitions API
- Manter performance (LCP e INP não devem ser prejudicados)

---

## 16. MODO ESCURO / TEMA E PREFERÊNCIAS DO USUÁRIO

### 16.1 Objetivo
Oferecer conforto visual e respeitar preferências do usuário.

### 16.2 Funcionalidades

- Alternância manual entre claro/escuro
- Respeito automático à preferência do sistema (`prefers-color-scheme`)
- Persistência da escolha via localStorage + conta (futuro)
- Ajustes de contraste acessíveis

---

## 17. CONSIDERAÇÕES TRANSVERSAIS

### LGPD
- Consentimento granular para cookies e newsletter
- Direito ao esquecimento implementado
- Política de Privacidade acessível em todas as páginas

### Segurança
- Proteção contra CSRF, XSS e SQL Injection
- Rate limiting em APIs e formulários
- Logs de ações sensíveis

### Performance
- Todas as páginas devem atingir Lighthouse ≥ 90
- Imagens otimizadas automaticamente
- Lazy loading em listas longas

---

## 18. CONCLUSÃO E PRÓXIMOS PASSOS

Este documento de **Especificação Funcional Detalhada** fornece todos os requisitos necessários para que a equipe de desenvolvimento implemente o Portal Pólis com clareza, consistência e qualidade.

Juntos com os documentos anteriores, formamos o **Projeto Executivo completo** da Fase 1.

**Próximo documento recomendado:**

**Arquitetura Técnica do Sistema**  
(Inclui: diagrama de arquitetura, modelo de banco de dados, estrutura de pastas, tecnologias detalhadas, estratégias de cache, segurança em profundidade, etc.)

---

**— Fim do Documento de Especificação Funcional Detalhada v1.0 —**

**Aguardando sua aprovação para continuar.**

---

*Este documento deve ser revisado e atualizado sempre que houver mudanças de escopo ou novas funcionalidades forem adicionadas.*