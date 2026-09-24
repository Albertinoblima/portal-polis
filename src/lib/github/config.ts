// Configuração do acesso à API do GitHub usada pelo painel administrativo
// (login via OAuth Device Flow + Biblioteca de Mídia). Todas as variáveis
// são públicas de propósito (prefixo NEXT_PUBLIC_): nenhuma delas é um
// segredo — o client_id de um OAuth App não precisa ficar oculto, e o
// Device Flow não usa client_secret. Ver .env.local.example.

export const GITHUB_OWNER = process.env.NEXT_PUBLIC_GH_OWNER ?? "";
export const GITHUB_REPO = process.env.NEXT_PUBLIC_GH_REPO ?? "";
export const GITHUB_BRANCH = process.env.NEXT_PUBLIC_GH_BRANCH ?? "main";
export const GITHUB_OAUTH_CLIENT_ID = process.env.NEXT_PUBLIC_GH_OAUTH_CLIENT_ID ?? "";
// URL do Cloudflare Worker que repassa as duas chamadas do Device Flow que
// o navegador não pode fazer direto (github.com/login/* não responde CORS).
// Ver cloudflare/github-oauth-proxy/README.md.
export const GITHUB_OAUTH_PROXY_URL = process.env.NEXT_PUBLIC_GH_OAUTH_PROXY_URL ?? "";
