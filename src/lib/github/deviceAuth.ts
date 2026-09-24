// Cliente do OAuth Device Flow do GitHub (RFC 8628), usado pelo login do
// painel administrativo. As duas chamadas abaixo passam pelo proxy stateless
// do Cloudflare Worker (GITHUB_OAUTH_PROXY_URL) porque github.com/login/*
// não responde CORS para chamadas vindas do navegador — sem isso, o fetch
// falharia silenciosamente com um erro de rede. O Worker não guarda nada,
// só repassa a requisição (ver cloudflare/github-oauth-proxy/worker.js).
import { GITHUB_OAUTH_CLIENT_ID, GITHUB_OAUTH_PROXY_URL } from "./config";

export interface DeviceCodeResponse {
    device_code: string;
    user_code: string;
    verification_uri: string;
    expires_in: number;
    interval: number;
}

export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
    if (!GITHUB_OAUTH_CLIENT_ID || !GITHUB_OAUTH_PROXY_URL) {
        throw new Error(
            "Login com GitHub não configurado (defina NEXT_PUBLIC_GH_OAUTH_CLIENT_ID e NEXT_PUBLIC_GH_OAUTH_PROXY_URL)."
        );
    }

    const res = await fetch(`${GITHUB_OAUTH_PROXY_URL}/device/code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: GITHUB_OAUTH_CLIENT_ID, scope: "repo read:user" }),
    });

    if (!res.ok) {
        throw new Error("Não foi possível iniciar o login com GitHub. Tente novamente.");
    }

    return res.json();
}

export type PollResult =
    | { status: "pending" }
    | { status: "slow_down"; interval: number }
    | { status: "success"; accessToken: string }
    | { status: "error"; message: string };

export async function pollAccessToken(deviceCode: string): Promise<PollResult> {
    const res = await fetch(`${GITHUB_OAUTH_PROXY_URL}/access-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            client_id: GITHUB_OAUTH_CLIENT_ID,
            device_code: deviceCode,
            grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        }),
    });

    const data = await res.json().catch(() => null);
    if (!data) return { status: "error", message: "Resposta inválida do GitHub." };

    if (data.error === "authorization_pending") return { status: "pending" };
    if (data.error === "slow_down") return { status: "slow_down", interval: (data.interval ?? 5) + 5 };
    if (data.error) {
        return { status: "error", message: data.error_description ?? data.error };
    }
    if (data.access_token) return { status: "success", accessToken: data.access_token };
    return { status: "error", message: "Resposta inesperada do GitHub." };
}
