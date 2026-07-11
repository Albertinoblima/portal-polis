# PORTAL PÓLIS
## Onde a política faz sentido

**DOCUMENTO DE PLANO DE TESTES, QA E CRITÉRIOS DE ACEITAÇÃO**  
**Projeto Executivo | Fase 1 — MVP**  
**Versão 1.0 | 10 de Julho de 2026**

---

**Elaborado por:** Arquitetura de Software Sênior | QA Lead | Especialista em Qualidade de Software

**Classificação:** Documento Confidencial — Uso Interno

**Documentos de Referência:**
- 01 a 07 (todos os documentos anteriores do projeto)

---

## SUMÁRIO

1. Objetivo deste Documento
2. Estratégia de Testes
3. Níveis de Teste
4. Escopo de Testes por Domínio
5. Critérios de Aceitação por Funcionalidade Crítica
6. Ferramentas e Ambientes de Teste
7. Processo de QA e Fluxo de Trabalho
8. Testes de Performance e Carga
9. Testes de Segurança e LGPD
10. Testes de Acessibilidade (WCAG 2.2 AA)
11. Testes Específicos da Experiência de Leitura
12. Matriz de Rastreabilidade (Requisitos → Testes)
13. Critérios de Aceite para Lançamento (Go/No-Go)
14. Conclusão e Recomendações

---

## 1. OBJETIVO DESTE DOCUMENTO

Este documento define o **Plano de Testes, Estratégia de QA e Critérios de Aceitação** do Portal Pólis para a Fase 1 (MVP).

Seu objetivo é garantir que:

- Todas as funcionalidades sejam validadas de forma sistemática e rastreável
- A experiência de leitura premium (especialmente a animação de virada de página) atenda aos padrões de qualidade definidos
- O sistema seja seguro, acessível, performático e em conformidade com LGPD
- Haja clareza sobre o que significa “pronto para produção”
- A equipe tenha um processo claro de verificação e aceite

---

## 2. ESTRATÉGIA DE TESTES

**Abordagem:**  
Testes baseados em risco + Testes exploratórios + Automação progressiva

**Pirâmide de Testes recomendada:**

- **Base (70%)**: Testes Unitários + Testes de Integração
- **Meio (20%)**: Testes de API + Testes de Componentes
- **Topo (10%)**: Testes End-to-End (E2E) críticos + Testes Exploratórios

**Foco prioritário:**
1. Experiência de leitura e animação de virada de página
2. Workflow editorial completo (Rascunho → Publicado)
3. Segurança e LGPD
4. Performance (Core Web Vitals)
5. Acessibilidade

---

## 3. NÍVEIS DE TESTE

| Nível              | Responsável          | Cobertura                  | Automação | Ferramentas          |
|--------------------|----------------------|----------------------------|---------|----------------------|
| Unitário           | Desenvolvedor        | Lógica de negócio          | Alta    | Jest / Vitest        |
| Integração         | Desenvolvedor + QA   | API + Banco de dados       | Alta    | Supertest / Jest     |
| API / Contract     | QA + Backend         | Contratos da API           | Alta    | Pact / Postman       |
| Componentes (UI)   | Frontend + QA        | Componentes isolados       | Média   | Storybook + Testing Library |
| End-to-End (E2E)   | QA                   | Fluxos críticos do usuário | Média   | Playwright / Cypress |
| Exploratório       | QA + Product         | Experiência e edge cases   | Baixa   | Manual + Session-Based |
| Performance        | QA + DevOps          | Carga e stress             | Média   | k6 / Artillery       |
| Segurança          | Security + QA        | OWASP Top 10 + LGPD        | Média   | OWASP ZAP + Manual   |
| Acessibilidade     | QA + UX              | WCAG 2.2 AA                | Média   | axe DevTools + WAVE  |

---

## 4. ESCOPO DE TESTES POR DOMÍNIO

### 4.1 Sistema de Matérias e Workflow Editorial

**Testes Obrigatórios:**
- Criação, edição e salvamento automático de matéria
- Envio para revisão e fluxo de aprovação/rejeição
- Publicação imediata e agendada
- Histórico de versões e restauração
- Pré-visualização fiel ao que o leitor vê
- Validação de campos obrigatórios e regras de negócio

### 4.2 Experiência de Leitura (Público)

**Testes Críticos:**
- Animação de virada de página (performance, suavidade, fallback)
- Text-to-Speech (funcionamento, controles, acessibilidade)
- Tempo de leitura calculado corretamente
- Matérias relacionadas e navegação contextual
- Compartilhamento social
- Modo escuro/claro
- Responsividade em diferentes dispositivos e navegadores

### 4.3 Busca, Newsletter, Comentários e Outros

- Busca com filtros e destaque de termos
- Inscrição em newsletter (double opt-in)
- Comentários (criação, moderação, respostas)
- Gerenciamento de mídia e uploads
- Banners e destaques da Home (drag & drop)

---

## 5. CRITÉRIOS DE ACEITAÇÃO POR FUNCIONALIDADE CRÍTICA

### 5.1 Animação de Virada de Página (Diferencial Principal)

**Critérios de Aceitação:**

1. A animação é disparada ao clicar em qualquer card de matéria na Home ou listagens.
2. Duração entre **300ms e 400ms**.
3. Executada com aceleração de GPU (60fps estável).
4. Não causa “quebra” de layout ou flickering.
5. Respeita `prefers-reduced-motion` (desativa animação quando ativado).
6. Em dispositivos de baixa performance, aplica fallback suave (fade ou transição simples).
7. O conteúdo da próxima página começa a carregar durante a animação.
8. Testado e aprovado em Chrome, Firefox, Safari e Edge (últimas 2 versões).

### 5.2 Workflow Editorial Completo

**Critérios de Aceitação:**

1. Usuário com papel “Editor” consegue criar, editar e enviar matéria para revisão.
2. Usuário com papel “Revisor/Editor-chefe” consegue aprovar ou rejeitar com comentário.
3. Matéria rejeitada volta para o autor com histórico visível.
4. Matéria aprovada pode ser publicada imediatamente ou agendada.
5. Publicação agendada ocorre automaticamente no horário definido.
6. Todo publish gera nova versão no histórico.
7. Apenas usuários autorizados conseguem publicar.

### 5.3 Experiência de Leitura

**Critérios de Aceitação:**

1. Tempo médio de carregamento da página de matéria < 2.5s (LCP).
2. Text-to-Speech funciona corretamente e é acessível via teclado.
3. Tempo de leitura é calculado e exibido corretamente.
4. Matérias relacionadas são relevantes e funcionam com navegação por virada de página.
5. Compartilhamento gera metadados corretos (Open Graph).

---

## 6. FERRAMENTAS E AMBIENTES DE TESTE

| Finalidade             | Ferramenta Recomendada       | Ambiente          |
|------------------------|------------------------------|-------------------|
| Testes Unitários       | Jest / Vitest                | Local + CI        |
| Testes E2E             | Playwright (recomendado)     | Staging + CI      |
| Testes de API          | Postman + Newman             | Staging           |
| Performance            | k6                           | Staging           |
| Segurança              | OWASP ZAP + Burp Suite       | Staging           |
| Acessibilidade         | axe DevTools + WAVE          | Todos             |
| Testes Exploratórios   | TestRail ou Notion + Jira    | Manual            |
| Gerenciamento de Testes| TestRail / Jira + Xray       | Todos             |

**Ambientes:**
- **Development**: Para testes do desenvolvedor
- **Staging**: Espelho mais próximo possível da produção (dados anonimizados)
- **Production**: Apenas testes de smoke após deploy

---

## 7. PROCESSO DE QA E FLUXO DE TRABALHO

**Fluxo recomendado:**

1. Desenvolvimento → Testes Unitários + Integração (dev)
2. Pull Request → Code Review + Testes Automatizados (CI)
3. Deploy em Staging → QA executa testes de regressão + exploratórios
4. Aprovação de QA → Deploy em Production
5. Smoke Tests em Production → Liberação para usuários

**Definição de Pronto (Definition of Done):**
- Código revisado
- Testes unitários passando (> 80% cobertura nos módulos críticos)
- Testes E2E críticos passando
- Critérios de Aceitação validados por QA
- Sem bugs críticos ou blockers abertos
- Documentação técnica atualizada

---

## 8. TESTES DE PERFORMANCE E CARGA

**Objetivos:**
- LCP < 2.5s | INP < 200ms | CLS < 0.1 em 90% das páginas
- Tempo de resposta da API < 300ms (p95)
- Suportar pelo menos **1.000 usuários simultâneos** sem degradação

**Testes de Carga:**
- Teste de baseline
- Teste de carga normal (usuários esperados)
- Teste de stress (pico 3x o normal)
- Teste de endurance (longa duração)

Ferramenta: **k6** (recomendado)

---

## 9. TESTES DE SEGURANÇA E LGPD

**Escopo mínimo:**
- OWASP Top 10
- Autenticação e autorização (JWT, RBAC)
- Proteção contra injeção, XSS, CSRF
- Validação de inputs
- Exposição de dados sensíveis
- Testes de LGPD (direito ao esquecimento, consentimento, minimização de dados)

Ferramentas: OWASP ZAP + testes manuais + revisão de código

---

## 10. TESTES DE ACESSIBILIDADE (WCAG 2.2 AA)

**Abrangência:**
- Navegação por teclado em todo o portal e painel admin
- Leitores de tela (NVDA, VoiceOver)
- Contraste de cores
- ARIA labels e roles corretos
- Formulários acessíveis
- Animações respeitando `prefers-reduced-motion`

Ferramentas: axe DevTools, WAVE, Lighthouse Accessibility

---

## 11. TESTES ESPECÍFICOS DA EXPERIÊNCIA DE LEITURA

**Itens prioritários:**
- Animação de virada de página (conforme seção 5.1)
- Text-to-Speech em diferentes navegadores e dispositivos
- Tempo de leitura em matérias curtas e longas
- Comportamento em conexões lentas (3G/4G)
- Experiência em mobile (scroll, menus, leitura)
- Modo escuro em todas as telas

---

## 12. MATRIZ DE RASTREABILIDADE (EXEMPLO)

| Requisito (do documento de Especificação Funcional) | Teste Associado                  | Tipo de Teste     | Status |
|-------------------------------------------------------|----------------------------------|-------------------|--------|
| Animação de virada de página 300-400ms                | TC-ANIM-001                      | E2E + Performance | -      |
| Workflow editorial completo                           | TC-WF-001 a TC-WF-012            | E2E + Integração  | -      |
| Text-to-Speech funcional                              | TC-TTS-001                       | E2E               | -      |
| Publicação agendada                                   | TC-PUB-003                       | Integração        | -      |
| Busca com filtros                                     | TC-SEA-001                       | E2E               | -      |

---

## 13. CRITÉRIOS DE ACEITE PARA LANÇAMENTO (GO/NO-GO)

**Checklist de Go-Live (obrigatório):**

- [ ] Todos os testes E2E críticos passando
- [ ] Zero bugs críticos ou blockers abertos
- [ ] Lighthouse Score ≥ 90 em Performance, Accessibility e Best Practices
- [ ] Testes de carga aprovados (suporta tráfego esperado)
- [ ] Testes de segurança sem vulnerabilidades críticas
- [ ] Acessibilidade WCAG 2.2 AA validada
- [ ] Animação de virada de página aprovada em todos os navegadores principais
- [ ] Workflow editorial validado end-to-end por editores reais
- [ ] Backup e restore testados com sucesso
- [ ] Documentação técnica e de usuário atualizada
- [ ] Plano de rollback documentado e testado

---

## 14. CONCLUSÃO E RECOMENDAÇÕES

Este Plano de Testes, QA e Critérios de Aceitação garante que o Portal Pólis seja entregue com **alta qualidade**, especialmente nos diferenciais que definem a marca (experiência de leitura e workflow editorial robusto).

**Recomendações:**
- Iniciar automação de testes E2E desde as primeiras sprints
- Realizar testes exploratórios semanais com editores reais
- Manter o plano vivo e atualizado conforme o produto evolui

**Próximo documento recomendado:**

**Backup, Hospedagem, CI/CD e Estratégia de Implantação**  
ou  
**Roadmap de Evolução (Fase 1, 2 e 3)**

---

**— Fim do Documento de Plano de Testes, QA e Critérios de Aceitação v1.0 —**

**Aguardando sua aprovação para continuar.**