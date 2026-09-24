# Proxy do GitHub OAuth Device Flow

Worker stateless que só repassa as duas chamadas do Device Flow que não
suportam CORS (`/login/device/code` e `/login/oauth/access_token`). Não
guarda nenhum estado nem segredo — o Device Flow não usa `client_secret`.

## Publicar

1. Crie um GitHub OAuth App em
   `https://github.com/settings/applications/new` (qualquer "Homepage URL"
   serve) e **habilite o Device Flow** nas configurações do app.
2. Anote o `Client ID` gerado.
3. Ajuste `ALLOWED_ORIGINS` em `worker.js` se o domínio do site mudar.
4. Publique o Worker:

   ```bash
   cd cloudflare/github-oauth-proxy
   npx wrangler deploy
   ```

5. Copie a URL do Worker publicado (ex.:
   `https://polis-github-oauth-proxy.<subdomínio>.workers.dev`) e configure
   nas variáveis de ambiente do site:

   - `NEXT_PUBLIC_GH_OAUTH_CLIENT_ID` = Client ID do passo 2
   - `NEXT_PUBLIC_GH_OAUTH_PROXY_URL` = URL do Worker publicado
