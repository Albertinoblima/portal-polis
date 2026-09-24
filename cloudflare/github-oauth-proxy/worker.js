// Proxy stateless para o GitHub OAuth Device Flow.
//
// Os endpoints `github.com/login/device/code` e
// `github.com/login/oauth/access_token` não suportam CORS, então o painel
// administrativo (rodando 100% no navegador) não consegue chamá-los
// diretamente. Este Worker só repassa essas duas chamadas, adicionando os
// cabeçalhos CORS necessários — não guarda nenhum estado, não conhece
// nenhum client_secret (o Device Flow não usa/aceita um) e não vê o token
// de acesso além de repassá-lo na resposta.
const ALLOWED_ORIGINS = new Set([
    "https://portalpolis.idialog.com.br",
    "http://localhost:3000",
]);

const UPSTREAM = {
    "/device/code": "https://github.com/login/device/code",
    "/access-token": "https://github.com/login/oauth/access_token",
};

function corsHeaders(origin) {
    const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "";
    return {
        "Access-Control-Allow-Origin": allowOrigin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        Vary: "Origin",
    };
}

const handler = {
    async fetch(request) {
        const origin = request.headers.get("Origin") ?? "";
        const headers = corsHeaders(origin);

        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers });
        }

        if (request.method !== "POST") {
            return new Response("Method Not Allowed", { status: 405, headers });
        }

        const url = new URL(request.url);
        const upstreamUrl = UPSTREAM[url.pathname];
        if (!upstreamUrl) {
            return new Response("Not Found", { status: 404, headers });
        }

        const body = await request.text();
        const upstreamResponse = await fetch(upstreamUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body,
        });

        const responseBody = await upstreamResponse.text();
        return new Response(responseBody, {
            status: upstreamResponse.status,
            headers: {
                ...headers,
                "Content-Type": "application/json",
            },
        });
    },
};

export default handler;
