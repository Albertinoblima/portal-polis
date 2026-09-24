// Script de migração ÚNICA (roda manualmente, uma vez, na máquina do
// desenvolvedor — não faz parte do pipeline de CI/build): baixa todos os
// arquivos hoje catalogados na tabela `media` do Supabase (Storage bucket
// "media") e os importa para a nova Biblioteca de Mídia baseada em GitHub
// (public/biblioteca-midias/ + src/content/media.json), no mesmo formato
// gravado por src/lib/github/mediaLibrary.ts.
//
// Por quê: com o login por e-mail/senha do Supabase Auth substituído por
// GitHub OAuth (ver src/components/admin/AuthProvider.tsx), o caminho de
// escrita antigo baseado em Supabase ficou inutilizável no painel — mas as
// imagens já enviadas antes continuam só no Supabase Storage. Este script
// faz a ponte uma única vez; depois de rodado (e do commit gerado ser
// enviado), a Biblioteca de Mídia em /admin/midia/ passa a listar também
// essas imagens migradas, e o Supabase Storage pode ser desligado sem perda.
//
// Uso:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... GITHUB_TOKEN=... \
//     node scripts/export-supabase-media.mjs
//
// Requer a service_role key (não a anon key) porque a tabela `media` só
// permite leitura para usuários "staff" via RLS (supabase/migrations/
// 0001_init.sql) — não há sessão autenticada rodando este script fora do
// navegador. NUNCA reutilize essa chave no navegador nem a commite.
//
// Requer também um GITHUB_TOKEN com permissão de escrita no repositório
// (mesmo token de acesso pessoal usado para testar a API do painel), pois
// os arquivos e o manifesto são gravados via commit direto (mesmo client de
// src/lib/github/client.ts), consistente com o restante da Biblioteca de
// Mídia — não escreve direto no disco do checkout local.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.NEXT_PUBLIC_GH_OWNER;
const GITHUB_REPO = process.env.NEXT_PUBLIC_GH_REPO;
const GITHUB_BRANCH = process.env.NEXT_PUBLIC_GH_BRANCH || "main";
const GITHUB_API = "https://api.github.com";

const MEDIA_DIR = "public/biblioteca-midias";
const MANIFEST_PATH = "src/content/media.json";

function sanitizeFilename(name) {
    return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

function githubHeaders(extra = {}) {
    return {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...extra,
    };
}

async function getFile(path) {
    const url = `${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`;
    const response = await fetch(url, { headers: githubHeaders() });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`GitHub getFile falhou (${response.status}): ${path}`);
    const data = await response.json();
    return { sha: data.sha, text: Buffer.from(data.content, "base64").toString("utf-8") };
}

async function putFile(path, content, message, sha) {
    const url = `${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
    const body = {
        message,
        branch: GITHUB_BRANCH,
        content: typeof content === "string" ? Buffer.from(content, "utf-8").toString("base64") : Buffer.from(content).toString("base64"),
        ...(sha ? { sha } : {}),
    };
    const response = await fetch(url, {
        method: "PUT",
        headers: githubHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`GitHub putFile falhou (${response.status}) em ${path}: ${text}`);
    }
    const data = await response.json();
    return { sha: data.content.sha };
}

async function main() {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        console.error("✗ SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.");
        process.exit(1);
    }
    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
        console.error("✗ GITHUB_TOKEN, NEXT_PUBLIC_GH_OWNER e NEXT_PUBLIC_GH_REPO são obrigatórios.");
        process.exit(1);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: rows, error } = await supabase
        .from("media")
        .select("id, filename, url, mime_type, size, alt_text, created_at, profiles(name)")
        .order("created_at", { ascending: true });
    if (error) throw error;

    if (!rows || rows.length === 0) {
        console.log("Nenhum registro encontrado na tabela `media` — nada para exportar.");
        return;
    }

    const manifestFile = await getFile(MANIFEST_PATH);
    const existingItems = manifestFile ? JSON.parse(manifestFile.text) : [];
    const existingIds = new Set(existingItems.map((item) => item.id));

    const newItems = [];
    for (const row of rows) {
        if (existingIds.has(row.id)) {
            console.log(`↷ ${row.filename} já migrado (id ${row.id}) — pulando.`);
            continue;
        }

        let response;
        try {
            response = await fetch(row.url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
        } catch (err) {
            console.error(`✗ Falha ao baixar ${row.filename} (${row.url}): ${err.message}`);
            continue;
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        const filename = `${new Date(row.created_at).getTime()}-${sanitizeFilename(row.filename)}`;

        try {
            await putFile(`${MEDIA_DIR}/${filename}`, buffer, `chore(media): migra ${filename} do Supabase`);
        } catch (err) {
            console.error(`✗ Falha ao commitar ${filename}: ${err.message}`);
            continue;
        }

        newItems.push({
            id: row.id,
            filename: row.filename,
            path: `/biblioteca-midias/${filename}`,
            mimeType: row.mime_type,
            size: row.size,
            altText: row.alt_text ?? "",
            uploadedBy: row.profiles?.name ?? "Supabase (migrado)",
            uploadedAt: row.created_at,
        });
        console.log(`✓ ${row.filename} migrado.`);
    }

    if (newItems.length === 0) {
        console.log("Nenhum arquivo novo migrado.");
        return;
    }

    const merged = [...existingItems, ...newItems];
    await putFile(
        MANIFEST_PATH,
        `${JSON.stringify(merged, null, 2)}\n`,
        `content(media): importa ${newItems.length} arquivo(s) do Supabase`,
        manifestFile?.sha
    );

    console.log(`✓ ${newItems.length} arquivo(s) migrado(s) para a Biblioteca de Mídia.`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
