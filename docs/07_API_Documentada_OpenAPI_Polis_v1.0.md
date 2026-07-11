# PORTAL PÓLIS
## Onde a política faz sentido

**DOCUMENTO DE API REST DOCUMENTADA (OpenAPI / Swagger)**  
**Projeto Executivo | Fase 1 — MVP**  
**Versão 1.0 | 10 de Julho de 2026**

---

**Elaborado por:** Arquitetura de Software Sênior | Especialista em APIs e Integrações

**Classificação:** Documento Confidencial — Uso Interno e de Equipe Técnica

**Documentos de Referência:**
- 01 a 06 (todos os documentos anteriores do projeto)

---

## SUMÁRIO

1. Introdução à API
2. Informações Gerais
   - Base URL
   - Versionamento
   - Formato de Resposta Padrão
   - Paginação
   - Tratamento de Erros
3. Autenticação e Autorização
4. Convenções e Padrões
5. Endpoints — Domínio Articles (Matérias)
6. Endpoints — Domínio Editorias, Categorias e Tags
7. Endpoints — Domínio Users e Permissões
8. Endpoints — Domínio Media (Uploads)
9. Endpoints — Domínio Newsletter
10. Endpoints — Domínio Search (Busca)
11. Endpoints — Domínio Banners e Destaques
12. Endpoints — Domínio Audit Logs
13. Códigos de Erro Comuns
14. Exemplos de Integração
15. Glossário e Notas Finais

---

## 1. INTRODUÇÃO À API

Esta documentação descreve a **API REST** do Portal Pólis, projetada para suportar tanto o consumo público de conteúdo quanto as operações completas do Painel Administrativo.

A API segue os princípios REST, utiliza **JSON** como formato de troca de dados e adota boas práticas modernas de design de APIs.

**Objetivos da API:**
- Fornecer acesso programático ao conteúdo jornalístico
- Permitir integração com o Painel Administrativo
- Servir como base para futuras integrações (apps mobile, parceiros, etc.)
- Garantir segurança, consistência e documentação clara

---

## 2. INFORMAÇÕES GERAIS

### 2.1 Base URL

**Produção:** `https://api.polis.com.br/v1`  
**Staging:** `https://api.staging.polis.com.br/v1`

### 2.2 Versionamento

A API utiliza versionamento por URL: `/v1/`

### 2.3 Formato de Resposta Padrão

**Sucesso:**

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 145,
    "total_pages": 8
  }
}
```

**Erro:**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos",
    "details": [...]
  }
}
```

### 2.4 Paginação

Todos os endpoints de listagem suportam:

- `page` (padrão: 1)
- `per_page` (padrão: 20, máximo: 100)
- `sort` (ex: `published_at:desc`, `title:asc`)

### 2.5 Tratamento de Erros

Códigos HTTP padrão + código interno no corpo da resposta.

---

## 3. AUTENTICAÇÃO E AUTORIZAÇÃO

### 3.1 Autenticação

A API utiliza **JWT Bearer Token**.

**Header:**
```
Authorization: Bearer <access_token>
```

**Refresh Token:**
- Enviado via cookie `HttpOnly` seguro
- Endpoint dedicado para renovação: `POST /auth/refresh`

### 3.2 Autorização (RBAC)

A maioria dos endpoints administrativos exige papéis específicos.  
Permissões granulares por **Editoria** também são suportadas em alguns casos.

---

## 4. CONVENÇÕES E PADRÕES

- Todos os recursos no **plural**
- Uso de **snake_case** em query params e JSON
- UUIDs como identificadores principais
- Soft delete na maioria das entidades
- Timestamps em formato ISO 8601 (`2026-07-10T21:05:00Z`)

---

## 5. ENDPOINTS — DOMÍNIO ARTICLES (MATÉRIAS)

### 5.1 Listar Matérias (Público)

`GET /articles`

**Query Params:**
- `editoria_id`, `category_id`, `tag`, `author_id`, `status=published`, `search`, `page`, `per_page`, `sort`

**Resposta:** Lista paginada de artigos (campos resumidos)

### 5.2 Obter Matéria por Slug (Público)

`GET /articles/{slug}`

**Resposta:** Artigo completo com conteúdo, autor, editoria, categorias, tags e metadados SEO.

### 5.3 Criar Matéria (Admin)

`POST /articles`

**Permissão:** `editor` ou superior

**Body (exemplo):**

```json
{
  "title": "Reforma tributária é aprovada no Senado",
  "subtitle": "Texto principal da matéria...",
  "content": "<p>Conteúdo completo em HTML...</p>",
  "editoria_id": "uuid-da-editoria",
  "category_ids": ["uuid1", "uuid2"],
  "tag_names": ["Reforma Tributária", "Congresso"],
  "featured_image_id": "uuid-da-imagem",
  "seo_title": "...",
  "seo_description": "..."
}
```

### 5.4 Atualizar Matéria

`PUT /articles/{id}`

### 5.5 Publicar Matéria

`POST /articles/{id}/publish`

### 5.6 Agendar Publicação

`POST /articles/{id}/schedule`

**Body:**
```json
{
  "scheduled_at": "2026-07-15T08:00:00Z"
}
```

### 5.7 Enviar para Revisão

`POST /articles/{id}/submit-for-review`

### 5.8 Aprovar / Rejeitar Matéria

`POST /articles/{id}/approve`  
`POST /articles/{id}/reject`

---

## 6. ENDPOINTS — DOMÍNIO EDITORIAS, CATEGORIAS E TAGS

### 6.1 Listar Editorias (Público)

`GET /editorias`

### 6.2 CRUD de Editorias (Admin)

`GET /admin/editorias`  
`POST /admin/editorias`  
`PUT /admin/editorias/{id}`  
`DELETE /admin/editorias/{id}`

### 6.3 CRUD de Categorias

`GET /admin/categories` (suporta `?editoria_id=`)
`POST /admin/categories`

### 6.4 CRUD de Tags

`GET /tags` (público - para sugestões)  
`POST /admin/tags`

---

## 7. ENDPOINTS — DOMÍNIO USERS E PERMISSÕES

### 7.1 Login

`POST /auth/login`

**Body:**
```json
{
  "email": "editor@polis.com.br",
  "password": "senha123"
}
```

**Resposta:** Access Token + Refresh Token (cookie)

### 7.2 Listar Usuários (Admin)

`GET /admin/users`

### 7.3 Criar Usuário

`POST /admin/users`

### 7.4 Atualizar Papel e Permissões

`PUT /admin/users/{id}/role`

### 7.5 Desativar Usuário

`DELETE /admin/users/{id}` (soft delete)

---

## 8. ENDPOINTS — DOMÍNIO MEDIA (UPLOADS)

### 8.1 Upload de Arquivo

`POST /media/upload`

**Content-Type:** `multipart/form-data`

**Campos:**
- `file` (obrigatório)
- `alt_text` (opcional)
- `folder` (opcional)

**Resposta:** Objeto Media com URL otimizada.

### 8.2 Listar Biblioteca de Mídia

`GET /admin/media`

### 8.3 Deletar Mídia

`DELETE /admin/media/{id}`

---

## 9. ENDPOINTS — DOMÍNIO NEWSLETTER

### 9.1 Inscrição (Público)

`POST /newsletter/subscribe`

**Body:**
```json
{
  "email": "leitor@email.com",
  "name": "Nome do Leitor",
  "preferences": {
    "editorias": ["politica", "municipios"]
  }
}
```

### 9.2 Confirmar Inscrição (Double Opt-in)

`GET /newsletter/confirm?token=...`

### 9.3 Desinscrever

`POST /newsletter/unsubscribe`

---

## 10. ENDPOINTS — DOMÍNIO SEARCH (BUSCA)

### 10.1 Busca Avançada

`GET /search`

**Query Params:**
- `q` (termo de busca)
- `editoria`, `category`, `tag`, `from_date`, `to_date`, `sort`

**Resposta:** Resultados com destaque (`highlight`) e relevância.

---

## 11. ENDPOINTS — DOMÍNIO BANNERS E DESTAQUES

### 11.1 Listar Banners Ativos (Público)

`GET /banners`

### 11.2 Gerenciar Destaques da Home (Admin)

`GET /admin/home-highlights`  
`POST /admin/home-highlights/reorder` (drag & drop via array de IDs)

### 11.3 CRUD de Banners

`POST /admin/banners`  
`PUT /admin/banners/{id}`

---

## 12. ENDPOINTS — DOMÍNIO AUDIT LOGS

### 12.1 Consultar Logs de Auditoria (Admin)

`GET /admin/audit-logs`

**Filtros:** `user_id`, `action`, `entity`, `from_date`, `to_date`

---

## 13. CÓDIGOS DE ERRO COMUNS

| Código HTTP | Código Interno              | Significado                     |
|-------------|-----------------------------|---------------------------------|
| 400         | VALIDATION_ERROR            | Dados inválidos                 |
| 401         | UNAUTHENTICATED             | Token inválido ou ausente       |
| 403         | FORBIDDEN                   | Sem permissão                   |
| 404         | NOT_FOUND                   | Recurso não encontrado          |
| 409         | CONFLICT                    | Conflito (slug duplicado, etc.) |
| 422         | UNPROCESSABLE_ENTITY        | Erro de negócio                 |
| 429         | RATE_LIMIT_EXCEEDED         | Muitas requisições              |
| 500         | INTERNAL_SERVER_ERROR       | Erro interno                    |

---

## 14. EXEMPLOS DE INTEGRAÇÃO

### Exemplo: Publicar uma matéria via API

```bash
# 1. Login
curl -X POST https://api.polis.com.br/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"editor@polis.com.br","password":"senha"}'

# 2. Criar matéria
curl -X POST https://api.polis.com.br/v1/articles \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "title": "...", ... }'

# 3. Publicar
curl -X POST https://api.polis.com.br/v1/articles/{id}/publish \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

## 15. GLOSSÁRIO E NOTAS FINAIS

- **Slug**: Identificador amigável na URL
- **Editoria**: Nível mais alto de classificação de conteúdo
- **RBAC**: Role-Based Access Control
- **Soft Delete**: Exclusão lógica (mantém registro no banco)

**Nota importante:**  
Esta documentação representa a **visão inicial** da API da Fase 1.  
O arquivo OpenAPI (YAML/JSON) completo será gerado automaticamente a partir do código (usando decorators do NestJS + Swagger) durante o desenvolvimento.

---

**— Fim do Documento de API Documentada v1.0 —**

**Aguardando sua aprovação para continuar.**

---

*Recomenda-se gerar o arquivo OpenAPI oficial (swagger.json) automaticamente via código durante o desenvolvimento para manter a documentação sempre sincronizada.*