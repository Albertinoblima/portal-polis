// Editorias do painel administrativo, gravadas 100% via GitHub Contents API
// — sem Supabase. Mesmo padrão de src/lib/github/articles.ts: cada
// criação/edição é um commit direto na branch de produção, que já dispara o
// workflow de deploy existente (.github/workflows/deploy.yml).
//
// O site público lê a mesma src/content/editorias.json via
// src/lib/content.ts (getEditorias, filtra só isActive) — este módulo é
// usado apenas pelo painel admin, que precisa ver TODAS as editorias
// (inclusive inativas) para poder reativá-las.
import type { Editoria } from "@/types";
import { getFile, putFile } from "./client";

const MANIFEST_PATH = "src/content/editorias.json";

export interface EditoriaInput {
    name: string;
    slug: string;
    color: string;
    description: string;
}

async function readManifest(token: string): Promise<{ items: Editoria[]; sha: string | null }> {
    const file = await getFile(token, MANIFEST_PATH);
    if (!file) return { items: [], sha: null };
    try {
        return { items: JSON.parse(file.text) as Editoria[], sha: file.sha };
    } catch {
        return { items: [], sha: file.sha };
    }
}

async function writeManifest(
    token: string,
    items: Editoria[],
    sha: string | null,
    message: string
): Promise<void> {
    const text = `${JSON.stringify(items, null, 2)}\n`;
    await putFile(token, MANIFEST_PATH, text, message, sha ?? undefined);
}

export async function listEditorias(token: string): Promise<Editoria[]> {
    const { items } = await readManifest(token);
    return [...items].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export async function createEditoria(token: string, input: EditoriaInput): Promise<Editoria> {
    const { items, sha } = await readManifest(token);
    const editoria: Editoria = {
        id: crypto.randomUUID(),
        name: input.name,
        slug: input.slug,
        color: input.color,
        description: input.description,
        isActive: true,
    };
    await writeManifest(token, [...items, editoria], sha, `content(editoria): cria "${input.name}"`);
    return editoria;
}

export async function setEditoriaActive(token: string, id: string, isActive: boolean): Promise<void> {
    const { items, sha } = await readManifest(token);
    const next = items.map((editoria) => (editoria.id === id ? { ...editoria, isActive } : editoria));
    await writeManifest(
        token,
        next,
        sha,
        `content(editoria): ${isActive ? "ativa" : "desativa"} editoria`
    );
}
