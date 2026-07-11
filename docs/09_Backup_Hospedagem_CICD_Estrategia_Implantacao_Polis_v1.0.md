# PORTAL PÓLIS
## Onde a política faz sentido

**DOCUMENTO DE BACKUP, HOSPEDAGEM, CI/CD E ESTRATÉGIA DE IMPLANTAÇÃO**  
**Projeto Executivo | Fase 1 — MVP**  
**Versão 1.0 | 10 de Julho de 2026**

---

**Elaborado por:** Arquitetura de Software Sênior | DevOps & Infrastructure Lead

**Classificação:** Documento Confidencial — Uso Interno e de Operações

**Documentos de Referência:**
- 01 a 08 (todos os documentos anteriores do projeto, especialmente Arquitetura Técnica)

---

## SUMÁRIO

1. Objetivo deste Documento
2. Visão Geral da Infraestrutura
3. Hospedagem Recomendada (Fase 1)
   - Frontend
   - Backend / API
   - Banco de Dados
   - Armazenamento de Arquivos
   - CDN
4. Arquitetura de Infraestrutura Proposta
5. CI/CD Pipeline Detalhado
6. Estratégia de Implantação (Deployment Strategy)
7. Estratégia de Backup
8. Recuperação de Desastres (Disaster Recovery)
9. Monitoramento, Alertas e Observabilidade
10. Segurança na Infraestrutura
11. Custos Estimados (Alto Nível)
12. Boas Práticas e Recomendações
13. Conclusão e Próximos Passos

---

## 1. OBJETIVO DESTE DOCUMENTO

Este documento define a **estratégia de hospedagem, pipeline de CI/CD, backup, recuperação de desastres e processo de implantação** do Portal Pólis para a Fase 1 (MVP).

Seu objetivo é garantir que:

- O sistema seja hospedado de forma **confiável, escalável e com bom custo-benefício**
- Os deploys sejam **rápidos, seguros e com baixo risco**
- Exista uma estratégia clara de **backup e recuperação** de desastres
- A operação seja **monitorada e observável** desde o primeiro dia
- A equipe tenha clareza sobre responsabilidades e processos operacionais

---

## 2. VISÃO GERAL DA INFRAESTRUTURA

O Pólis adota uma arquitetura **cloud-native** com forte separação entre camadas, priorizando:

- Velocidade de desenvolvimento e deploy na Fase 1
- Facilidade de manutenção
- Boa performance global
- Custo controlado
- Preparação para crescimento futuro

**Princípio central:**  
Usar serviços gerenciados sempre que possível na Fase 1, reduzindo complexidade operacional.

---

## 3. HOSPEDAGEM RECOMENDADA (FASE 1)

### 3.1 Frontend (Portal Público + Painel Administrativo)

**Recomendação principal:** **Vercel**

**Justificativa:**
- Excelente integração nativa com Next.js
- Deploy instantâneo via Git
- Edge Network global (baixa latência)
- Preview deployments automáticos por Pull Request
- Serverless Functions / Edge Functions
- Analytics e Web Vitals integrados
- Escalabilidade automática

**Alternativas:** Cloudflare Pages + Workers, Netlify

### 3.2 Backend / API

**Recomendações (em ordem de preferência para Fase 1):**

| Opção              | Vantagens                                      | Desvantagens                     | Recomendado para |
|--------------------|------------------------------------------------|----------------------------------|------------------|
| **Railway**        | Muito fácil, Postgres + Redis integrados, bom preço | Menos controle granular         | MVP inicial      |
| **Render**         | Bom equilíbrio entre facilidade e controle     | Menos maduro que Railway        | Boa alternativa  |
| **Fly.io**         | Excelente performance global, containers       | Curva de aprendizado maior      | Quando precisar de edge |
| **AWS ECS + RDS**  | Máximo controle e escalabilidade               | Complexidade operacional alta   | Quando crescer   |

**Recomendação para Fase 1:** **Railway** ou **Render**

### 3.3 Banco de Dados (PostgreSQL)

**Recomendações:**

- **Neon** (serverless Postgres) — Excelente para Next.js + Vercel
- **Supabase** (Postgres + Auth + Storage + Realtime)
- **Railway Postgres** (se usar Railway)
- **AWS RDS** (quando precisar de mais controle)

**Recomendação:** **Neon** ou **Supabase** (facilidade + recursos modernos)

### 3.4 Armazenamento de Arquivos (Imagens, PDFs, etc.)

**Recomendação principal:** **Cloudflare R2**

**Justificativa:**
- Compatível com API S3
- Sem custo de egress (saída de dados)
- Integração excelente com Cloudflare CDN
- Preço muito competitivo

**Alternativa:** AWS S3 + CloudFront

### 3.5 CDN

**Recomendação:** **Cloudflare** (já incluso com R2)

- Cache agressivo de assets estáticos
- Proteção DDoS e WAF
- DNS rápido e confiável

---

## 4. ARQUITETURA DE INFRAESTRUTURA PROPOSTA (FASE 1)

```
Usuário
   │
   ▼
Cloudflare (CDN + WAF + DNS)
   │
   ├── Vercel (Next.js Frontend + Edge Functions)
   │
   └── Railway / Render (Backend NestJS)
            │
            ├── Neon / Supabase (PostgreSQL)
            │
            └── Redis (Cache + Sessões)
                     │
                     └── Cloudflare R2 (Arquivos + CDN)
```

---

## 5. CI/CD PIPELINE DETALHADO

**Ferramenta recomendada:** **GitHub Actions**

### Pipeline Proposto (`.github/workflows/deploy.yml`)

**Etapas principais:**

1. **Trigger**
   - Push para `main` → Deploy em Staging + Production
   - Pull Request → Deploy em Preview Environment (Vercel)

2. **CI (Continuous Integration)**
   - Checkout do código
   - Setup Node.js + pnpm/yarn
   - Instalar dependências
   - Lint + Type Check
   - Testes Unitários + Integração
   - Build do Frontend e Backend

3. **CD (Continuous Deployment)**
   - Deploy Frontend no Vercel
   - Deploy Backend no Railway/Render
   - Rodar migrations do Prisma (se aplicável)
   - Smoke Tests pós-deploy
   - Notificação no Slack/Discord (sucesso/falha)

**Boas Práticas:**
- Usar environments (staging / production) com secrets separados
- Aprovação manual para deploy em Production (pelo menos nas primeiras semanas)
- Rollback fácil via Vercel + Railway

---

## 6. ESTRATÉGIA DE IMPLANTAÇÃO (DEPLOYMENT STRATEGY)

### Fase 1 (MVP) — Recomendação

**Estratégia inicial:** **Direct Deploy + Preview Environments**

- Deploy automático em `main`
- Preview deployments automáticos por Pull Request (Vercel)
- Aprovação manual para produção nas primeiras semanas

### Evolução Recomendada (após 2-3 meses estáveis)

| Estratégia       | Quando adotar                  | Vantagens                          | Complexidade |
|------------------|--------------------------------|------------------------------------|--------------|
| **Rolling Update** | Após estabilidade inicial     | Simples                            | Baixa        |
| **Blue-Green**     | Quando volume crescer         | Zero downtime, rollback rápido     | Média        |
| **Canary**         | Quando quiser validação gradual | Teste com tráfego real            | Alta         |

**Recomendação:** Começar com **Direct Deploy** e evoluir para **Blue-Green** quando o tráfego justificar.

---

## 7. ESTRATÉGIA DE BACKUP

### 7.1 Banco de Dados (PostgreSQL)

- **Backup diário automático** (full backup)
- **Point-in-Time Recovery (PITR)** — se o provedor oferecer (Neon, Supabase, RDS)
- Retenção: 7 dias (padrão) + 30 dias para backups semanais
- Teste de restore **trimestral** (obrigatório)

### 7.2 Arquivos (Imagens, PDFs)

- **Cloudflare R2** com Versioning ativado
- Retenção de versões antigas por 30-90 dias
- Backup cruzado (opcional) para outro bucket/região

### 7.3 Configurações e Secrets

- Gerenciados pela plataforma (Vercel / Railway)
- Backup manual das variáveis de ambiente mais críticas (documentado)

### 7.4 Código-fonte

- GitHub (versionamento completo + histórico)
- Branches protegidas + Code Review obrigatório

---

## 8. RECUPERAÇÃO DE DESASTRES (DISASTER RECOVERY)

| Métrica          | Meta para Fase 1      | Meta para Fase 2+     |
|------------------|-----------------------|-----------------------|
| **RPO** (Recovery Point Objective) | 1 hora               | 15 minutos           |
| **RTO** (Recovery Time Objective)  | 4 horas              | 1 hora               |

**Procedimento de Recuperação Documentado:**
1. Identificar o escopo do incidente
2. Restaurar banco de dados do último backup válido
3. Restaurar arquivos do R2 (se necessário)
4. Redeploy da última versão estável
5. Validação com smoke tests
6. Comunicação interna e (se necessário) para usuários

**Testes de Disaster Recovery:** Realizar pelo menos **1x por semestre**.

---

## 9. MONITORAMENTO, ALERTAS E OBSERVABILIDADE

**Stack Recomendada:**

- **Erros de Aplicação:** Sentry (Frontend + Backend)
- **Logs:** Better Stack / Logtail ou Datadog
- **Uptime e Incidentes:** Better Uptime ou UptimeRobot
- **Performance:** Vercel Analytics + Web Vitals + Sentry Performance
- **Infraestrutura:** Métricas da plataforma (Railway/Render) + Cloudflare Analytics

**Alertas Críticos (configurar desde o dia 1):**
- Downtime do site ou API
- Taxa de erro > 1%
- LCP ou INP degradado
- Falha em deploy
- Quase esgotamento de recursos (CPU, memória, storage)

---

## 10. SEGURANÇA NA INFRAESTRUTURA

- **HTTPS** obrigatório em todos os serviços
- **WAF + DDoS Protection** via Cloudflare
- **Secrets** gerenciados pela plataforma (nunca no código)
- **Least Privilege** em todas as contas e serviços
- **Backup criptografado** (quando a plataforma oferecer)
- **Auditoria de acessos** (logs de quem acessou o quê)
- **Rotação de credenciais** periódica

---

## 11. CUSTOS ESTIMADOS (ALTO NÍVEL) — FASE 1

| Componente             | Estimativa Mensal (inicial) | Observação |
|------------------------|-----------------------------|----------|
| Vercel (Frontend)      | $0 – $20                    | Hobby/Pro gratuito no início |
| Railway / Render       | $5 – $40                    | Depende do uso |
| PostgreSQL (Neon/Supabase) | $0 – $25                 | Plano gratuito generoso |
| Cloudflare R2 + CDN    | $5 – $15                    | Muito barato |
| Sentry / Monitoramento | $0 – $29                    | Plano gratuito bom |
| **Total Estimado**     | **$20 – $80/mês**           | Muito acessível para MVP |

---

## 12. BOAS PRÁTICAS E RECOMENDAÇÕES

1. **Comece simples** — Use serviços gerenciados na Fase 1.
2. **Automatize tudo** que for repetitivo (deploy, backup, migrations).
3. **Tenha rollback rápido** — Vercel e Railway permitem reverter deploys facilmente.
4. **Documente o runbook** de incidentes e recuperação de desastres.
5. **Monitore desde o primeiro deploy** — Não espere problemas aparecerem.
6. **Teste restore de backup** periodicamente.
7. **Separe ambientes** claramente (staging vs production).
8. **Use Infrastructure as Code** (Terraform ou Pulumi) quando a complexidade crescer.

---

## 13. CONCLUSÃO E PRÓXIMOS PASSOS

Esta estratégia de hospedagem, CI/CD, backup e implantação foi desenhada para ser **prática, confiável e alinhada** com os objetivos do Portal Pólis na Fase 1.

Ela permite lançar o produto rapidamente com boa qualidade operacional, mantendo espaço para evolução.

**Próximo documento recomendado:**

**Roadmap de Evolução Completo (Fase 1, 2 e 3)**  
(Inclui visão de longo prazo, incluindo funcionalidades de IA)

---

**— Fim do Documento de Backup, Hospedagem, CI/CD e Estratégia de Implantação v1.0 —**

**Aguardando sua aprovação para continuar.**