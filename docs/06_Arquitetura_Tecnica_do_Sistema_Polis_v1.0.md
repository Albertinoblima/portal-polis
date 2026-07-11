# PORTAL PÓLIS
## Onde a política faz sentido

**DOCUMENTO DE ARQUITETURA TÉCNICA DO SISTEMA**  
**Projeto Executivo | Fase 1 — MVP**  
**Versão 1.0 | 10 de Julho de 2026**

---

**Elaborado por:** Arquitetura de Software Sênior | Especialista em Sistemas Escaláveis e Segurança

**Classificação:** Documento Confidencial — Uso Interno e de Equipe Técnica

**Documentos de Referência:**
- 01 a 05 (Visão Estratégica, Identidade Visual, Wireframes, Fluxos e Especificação Funcional)

---

## SUMÁRIO

1. Objetivo deste Documento
2. Visão Geral da Arquitetura
3. Princípios Arquiteturais
4. Stack Tecnológica Detalhada
5. Diagrama de Arquitetura (Visão de Alto Nível)
6. Modelo de Banco de Dados (MER)
7. Arquitetura de API REST
8. Módulos e Componentes do Sistema
9. Estratégias de Cache e Performance
10. Segurança em Profundidade
11. Escalabilidade e Alta Disponibilidade
12. CI/CD, DevOps e Infraestrutura como Código
13. Monitoramento, Logs e Observabilidade
14. Backup, Recuperação de Desastres e Continuidade
15. Considerações de LGPD na Arquitetura
16. Decisões Arquiteturais e Trade-offs
17. Recomendações de Evolução (Fase 2+)
18. Conclusão

---

## 1. OBJETIVO DESTE DOCUMENTO

Este documento define a **Arquitetura Técnica** completa do Portal Pólis para a Fase 1 (MVP).

Ele tem como objetivo:

- Fornecer uma visão clara e técnica do sistema para equipes de desenvolvimento e infraestrutura
- Garantir que a arquitetura seja **escalável, segura, manutenível e alinhada** com os objetivos de produto
- Servir como base para decisões de implementação, infraestrutura e contratação de ferramentas
- Documentar trade-offs e decisões arquiteturais tomadas

A arquitetura foi desenhada para suportar:
- Experiência de leitura premium (animação de virada de página performática)
- Workflow editorial robusto
- Alto volume de tráfego orgânico
- Conformidade com LGPD e boas práticas de segurança

---

## 2. VISÃO GERAL DA ARQUITETURA

O Portal Pólis adota uma arquitetura **modular monolítica** com separação clara entre camadas, preparada para evolução para microsserviços quando necessário.

**Características principais:**
- Frontend: Next.js (SSR + Static Generation híbrido)
- Backend: API REST bem estruturada (NestJS recomendado)
- Banco de dados relacional com cache em memória
- Armazenamento de arquivos em objeto storage + CDN
- Arquitetura orientada a domínio nos módulos principais

---

## 3. PRINCÍPIOS ARQUITETURAIS

1. **Separação de Responsabilidades** — Frontend de consumo vs. Painel Administrativo vs. API
2. **Modularidade** — Cada domínio (Matérias, Usuários, Mídia, etc.) é um módulo independente
3. **Type Safety** — TypeScript em todas as camadas
4. **Performance First** — Core Web Vitals como requisito não-funcional prioritário
5. **Security by Design** — Defesa em profundidade
6. **Observability** — Logs, métricas e tracing desde o início
7. **Evolutibilidade** — Preparada para Fase 2 (IA) sem grandes refatorações

---

## 4. STACK TECNOLÓGICA DETALHADA

### 4.1 Frontend (Portal Público + Painel Admin)

| Camada              | Tecnologia                          | Justificativa |
|---------------------|-------------------------------------|-------------|
| Framework           | Next.js 15 (App Router)             | SSR, Static Generation, Server Actions, excelente DX |
| Linguagem           | TypeScript                          | Type safety obrigatório |
| Estilização         | Tailwind CSS + shadcn/ui ou similar | Design System rápido e consistente |
| Animações           | Framer Motion                       | Animação de virada de página performática |
| Estado Global       | Zustand ou Jotai                    | Leveza (evitar Redux quando possível) |
| Formulários         | React Hook Form + Zod               | Validação robusta e performática |
| Editor WYSIWYG      | TipTap (recomendado) ou Lexical     | Extensível, acessível e moderno |

### 4.2 Backend / API

| Camada              | Tecnologia                          | Justificativa |
|---------------------|-------------------------------------|-------------|
| Framework           | NestJS (recomendado) ou Express modular | Arquitetura limpa, decorators, injeção de dependência |
| Linguagem           | TypeScript / Node.js 20+            | Consistência com frontend |
| Validação           | Zod ou class-validator              | Type-safe validation |
| Autenticação        | JWT + Refresh Tokens + HttpOnly cookies | Padrão moderno e seguro |
| Autorização         | CASL ou RBAC customizado            | Controle granular por editoria |

### 4.3 Banco de Dados e Cache

| Camada              | Tecnologia                          | Justificativa |
|---------------------|-------------------------------------|-------------|
| Banco Principal     | PostgreSQL 16                       | ACID, JSONB, full-text search, extensibilidade |
| Cache / Sessões     | Redis                               | Alta performance para cache, rate limiting e sessões |
| ORM                 | Prisma                              | Type safety excelente e migrations |

### 4.4 Infraestrutura e DevOps

| Camada              | Tecnologia / Serviço                | Justificativa |
|---------------------|-------------------------------------|-------------|
| Hospedagem Frontend | Vercel (recomendado)                | Excelente integração com Next.js, Edge Functions |
| Hospedagem Backend  | Railway, Render, AWS ECS ou Fly.io  | Facilidade + auto-scaling |
| Armazenamento       | AWS S3 ou Cloudflare R2             | Durabilidade e custo-benefício |
| CDN                 | Cloudflare ou Bunny.net             | Performance global e cache de assets |
| CI/CD               | GitHub Actions                      | Nativo e poderoso |
| Monitoramento       | Sentry + Better Stack / Logtail     | Erros + Logs centralizados |
| Analytics           | Plausible ou PostHog (self-hosted)  | Privacidade-friendly |

---

## 5. DIAGRAMA DE ARQUITETURA (VISÃO DE ALTO NÍVEL)

```
Usuário (Browser)
        │
        ▼
Vercel (Next.js) ←── CDN (Cloudflare)
        │
        ├── SSR / Static Pages
        ├── Server Actions / API Routes (públicas)
        └── Painel Admin (protegido)
                │
                ▼
        API Gateway / NestJS Backend
                │
        ┌───────┼───────┐
        │       │       │
   Prisma    Redis   S3 / R2
        │       │       │
   PostgreSQL  Cache  Mídia
```

**Fluxo típico de requisição de matéria:**
1. Usuário acessa `/materia/slug`
2. Next.js faz SSR ou serve página estática (se ISR)
3. Dados vêm do PostgreSQL via Prisma (com cache Redis)
4. Imagens servidas via CDN
5. Animação de virada de página executada no cliente

---

## 6. MODELO DE BANCO DE DADOS (MER - PRINCIPAL)

### Entidades Principais (Fase 1)

**users**
- id (PK)
- email (unique)
- password_hash
- name
- avatar_url
- role (enum: admin, editor_chief, editor, reviewer, columnist, user)
- is_active
- created_at, updated_at

**articles**
- id (PK)
- title
- slug (unique)
- subtitle
- content (JSONB ou texto longo)
- featured_image_id (FK → media)
- editoria_id (FK)
- author_id (FK → users)
- status (enum: draft, in_review, approved, published, scheduled, archived)
- published_at
- scheduled_at
- seo_title, seo_description
- reading_time_minutes (calculado)
- view_count
- created_at, updated_at, deleted_at (soft delete)

**editorias**
- id, name, slug, color, description, is_active

**categories**
- id, name, slug, editoria_id (FK), parent_id (self FK)

**tags**
- id, name, slug

**article_categories**, **article_tags** (tabelas de junção many-to-many)

**comments**
- id, article_id, user_id, content, parent_id, status, created_at

**media**
- id, filename, url, mime_type, size, alt_text, uploaded_by (FK)

**banners**
- id, title, image_id, link_url, position, start_date, end_date, is_active

**audit_logs**
- id, user_id, action, entity, entity_id, old_value, new_value, ip, created_at

**newsletter_subscribers**
- id, email, name, preferences (JSONB), confirmed_at, unsubscribed_at

---

## 7. ARQUITETURA DE API REST

### Padrões Recomendados

- **Versionamento**: `/api/v1/...`
- **Recursos no plural**: `/api/v1/articles`, `/api/v1/users`
- **Respostas consistentes**:
  ```json
  {
    "success": true,
    "data": { ... },
    "meta": { "page": 1, "per_page": 20, "total": 145 }
  }
  ```
- **Autenticação**: JWT no header `Authorization: Bearer <token>`
- **Rate Limiting**: Por IP + por usuário autenticado
- **Documentação**: OpenAPI / Swagger (obrigatório)

### Endpoints Críticos (exemplos)

- `GET /api/v1/articles` (com filtros e paginação)
- `POST /api/v1/articles` (criar)
- `PUT /api/v1/articles/:id` (atualizar)
- `POST /api/v1/articles/:id/publish`
- `POST /api/v1/articles/:id/schedule`
- `GET /api/v1/articles/:slug` (pública)

---

## 8. MÓDULOS E COMPONENTES DO SISTEMA

Recomenda-se estrutura modular no backend:

```
src/
├── modules/
│   ├── articles/
│   ├── editorias/
│   ├── users/
│   ├── media/
│   ├── comments/
│   ├── newsletter/
│   └── audit/
├── common/
├── config/
├── shared/
└── main.ts
```

Cada módulo deve conter:
- controller
- service
- repository (ou usar Prisma diretamente com services bem definidos)
- dto
- guards / decorators de permissão

---

## 9. ESTRATÉGIAS DE CACHE E PERFORMANCE

- **Redis**:
  - Cache de listagens de artigos (5-15 minutos)
  - Cache de artigo individual (com invalidação em update)
  - Rate limiting
  - Sessões de admin

- **Next.js**:
  - ISR (Incremental Static Regeneration) para páginas de listagem
  - Static Generation para páginas institucionais
  - Server Components para dados dinâmicos

- **CDN**: Cache agressivo de assets estáticos e imagens otimizadas

---

## 10. SEGURANÇA EM PROFUNDIDADE

**Camadas de defesa:**

1. **Perímetro**: WAF (Cloudflare) + DDoS protection
2. **Transporte**: HTTPS obrigatório + HSTS
3. **Aplicação**:
   - Validação rigorosa de input (Zod)
   - Sanitização de HTML no editor
   - Proteção contra SQL Injection (Prisma)
   - CSRF protection
   - Rate limiting
4. **Autenticação/Autorização**: JWT + RBAC + CASL
5. **Dados**: Criptografia de senhas (bcrypt/argon2), soft delete, backup criptografado
6. **Monitoramento**: Sentry + logs de ações sensíveis

---

## 11. ESCALABILIDADE E ALTA DISPONIBILIDADE

- Frontend: Vercel Edge Network (distribuição global)
- Backend: Auto-scaling (Railway/Render/AWS)
- Banco de dados: Read replicas (quando necessário)
- Cache: Redis cluster (quando volume alto)
- Armazenamento: S3 com replicação

A arquitetura suporta facilmente **500k+ sessões/mês** na Fase 1 com baixo custo.

---

## 12. CI/CD, DEVOPS E INFRAESTRUTURA COMO CÓDIGO

- **CI/CD**: GitHub Actions
  - Lint + Type Check + Testes
  - Build e deploy automático em `main`
- **Infra como Código**: Terraform ou Pulumi (recomendado para produção)
- **Secrets**: Gerenciados via plataforma (Vercel / Railway) ou AWS Secrets Manager

---

## 13. MONITORAMENTO, LOGS E OBSERVABILIDADE

- **Erros**: Sentry (frontend + backend)
- **Logs**: Better Stack ou Logtail (centralizado)
- **Métricas**: Plausible / PostHog + métricas customizadas
- **Uptime**: UptimeRobot ou Better Uptime
- **Performance**: Web Vitals reportados para dashboard interno

---

## 14. BACKUP, RECUPERAÇÃO DE DESASTRES E CONTINUIDADE

- **Banco de dados**: Backup diário automático + point-in-time recovery
- **Arquivos**: S3 com versioning + replicação cross-region
- **Testes de restore**: Realizar trimestralmente
- **RPO/RTO**: Definir metas claras (ex: RPO 1h, RTO 4h)

---

## 15. CONSIDERAÇÕES DE LGPD NA ARQUITETURA

- Minimização de dados coletados
- Criptografia em trânsito e em repouso
- Direito ao esquecimento implementado (soft delete + anonimização)
- Logs de tratamento de dados pessoais
- Consentimento granular armazenado
- DPO como papel (mesmo que pessoa jurídica)

---

## 16. DECISÕES ARQUITETURAIS E TRADE-OFFS

| Decisão                    | Alternativa Considerada       | Justificativa |
|---------------------------|-------------------------------|-------------|
| Next.js + NestJS          | Full-stack em Next.js         | Melhor separação de responsabilidades e escalabilidade |
| PostgreSQL                | MongoDB                       | Consistência transacional e relacionamentos complexos |
| Prisma                    | TypeORM                       | Melhor DX e type safety |
| JWT + Refresh Tokens      | Session-based                 | Melhor escalabilidade e mobile support |
| Vercel + Railway/Render   | Tudo em AWS                   | Velocidade de desenvolvimento inicial |

---

## 17. RECOMENDAÇÕES DE EVOLUÇÃO (FASE 2+)

- Migração gradual para microsserviços (quando o domínio crescer)
- Introdução de GraphQL (opcional, para clientes complexos)
- Integração com ferramentas de IA (resumos, perguntas sobre matérias)
- Sistema de recomendações personalizadas
- App mobile (React Native ou PWA)

---

## 18. CONCLUSÃO

A arquitetura proposta é **moderna, segura, escalável e alinhada** com os objetivos estratégicos do Portal Pólis.

Ela permite entregar rapidamente um MVP de alta qualidade enquanto mantém portas abertas para evolução contínua.

**Próximo documento recomendado:**

**API Documentada (OpenAPI / Swagger detalhado)**  
ou  
**Plano de Testes e QA**

---

**— Fim do Documento de Arquitetura Técnica do Sistema v1.0 —**

**Aguardando sua aprovação para continuar.**

---

*Este documento deve ser revisado periodicamente conforme o projeto evolui.*