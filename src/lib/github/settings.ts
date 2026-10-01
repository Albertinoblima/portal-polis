// Configurações do site (nome, SEO padrão, aparência) gravadas 100% via
// GitHub Contents API — sem Supabase. Mesmo padrão de
// src/lib/github/articles.ts, mas o manifesto guarda um objeto único (não
// uma lista).
import type { SiteSettings } from "@/types";
import { getFile, putFile } from "./client";

const MANIFEST_PATH = "src/content/settings.json";

async function readManifest(token: string): Promise<{ settings: SiteSettings; sha: string | null }> {
    const file = await getFile(token, MANIFEST_PATH);
    if (!file) {
        throw new Error("src/content/settings.json não encontrado no repositório.");
    }
    return { settings: JSON.parse(file.text) as SiteSettings, sha: file.sha };
}

export async function getSettings(token: string): Promise<SiteSettings> {
    const { settings } = await readManifest(token);
    return settings;
}

export async function updateSettings(
    token: string,
    patch: Partial<SiteSettings>
): Promise<SiteSettings> {
    const { settings, sha } = await readManifest(token);
    const updated: SiteSettings = { ...settings, ...patch };
    const text = `${JSON.stringify(updated, null, 2)}\n`;
    await putFile(token, MANIFEST_PATH, text, "content(settings): atualiza configurações do site", sha ?? undefined);
    return updated;
}
