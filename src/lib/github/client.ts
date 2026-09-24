// Cliente mínimo da API REST do GitHub (api.github.com), usado pelo painel
// administrativo para autenticação (checar se o usuário é colaborador do
// repositório com permissão de escrita) e para ler/gravar conteúdo via
// Contents API (usado hoje pela Biblioteca de Mídia). Ao contrário de
// github.com/login/*, api.github.com responde CORS para chamadas
// autenticadas com Bearer token, então isso funciona direto do navegador,
// sem precisar de proxy.
import { GITHUB_BRANCH, GITHUB_OWNER, GITHUB_REPO } from "./config";

const API_BASE = "https://api.github.com";

export interface GithubUser {
    id: number;
    login: string;
    name: string | null;
    email: string | null;
    avatar_url: string;
}

async function githubFetch(path: string, token: string, init: RequestInit = {}): Promise<Response> {
    return fetch(`${API_BASE}${path}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            ...init.headers,
        },
    });
}

export async function getAuthenticatedUser(token: string): Promise<GithubUser> {
    const res = await githubFetch("/user", token);
    if (!res.ok) throw new Error("Token do GitHub inválido ou expirado.");
    return res.json();
}

// Usa o campo `permissions` que a própria API devolve para o requisitante
// autenticado (não precisa de escopo extra tipo `read:org`/listar
// colaboradores — reflete só a permissão da conta que está chamando).
export async function getRepoWritePermission(token: string): Promise<boolean> {
    const res = await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}`, token);
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data?.permissions?.push);
}

interface ContentsGetResponse {
    sha: string;
    content: string;
    encoding: string;
}

export async function getFile(token: string, path: string): Promise<{ sha: string; text: string } | null> {
    const res = await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`, token);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Falha ao ler "${path}" no GitHub.`);
    const data: ContentsGetResponse = await res.json();
    return { sha: data.sha, text: decodeBase64ToText(data.content) };
}

export async function putFile(
    token: string,
    path: string,
    content: string | ArrayBuffer,
    message: string,
    sha?: string
): Promise<{ sha: string; downloadUrl: string | null }> {
    const base64 = typeof content === "string" ? encodeTextToBase64(content) : encodeBufferToBase64(content);
    const res = await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`, token, {
        method: "PUT",
        body: JSON.stringify({ message, content: base64, branch: GITHUB_BRANCH, sha }),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? `Falha ao gravar "${path}" no GitHub.`);
    }
    const data = await res.json();
    return { sha: data.content.sha, downloadUrl: data.content.download_url ?? null };
}

export async function deleteFile(token: string, path: string, message: string, sha: string): Promise<void> {
    const res = await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`, token, {
        method: "DELETE",
        body: JSON.stringify({ message, sha, branch: GITHUB_BRANCH }),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? `Falha ao remover "${path}" no GitHub.`);
    }
}

function decodeBase64ToText(base64: string): string {
    const binary = atob(base64.replace(/\n/g, ""));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
}

function encodeTextToBase64(text: string): string {
    return encodeBufferToBase64(new TextEncoder().encode(text).buffer);
}

function encodeBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
}
